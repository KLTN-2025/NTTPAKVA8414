// controllers/admin/orderManagement.js
const mongoose = require("mongoose");
const CustomerOrder = require("../models/CustomerOrders");
const CustomerOrderItem = require("../models/CustomerOrderItems");
const Product = require("../models/Products");
const Customer = require("../models/Customers");
const transactionService = require('../services/transactionService');

/**
 * GET /api/admin/orders
 * Get all orders with filtering, search, sorting, and pagination
 */
exports.getAllOrders = async (req, res) => {
  try {
    const {
      search,
      order_status,
      payment_status,
      dateBegin,
      dateEnd,
      priceMin,
      priceMax,
      sortBy = 'order_date',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    // Build filters
    const filters = {};

    // Search by Order ID or recipient name
    if (search) {
      filters.$or = [
        { recipient_name: { $regex: search, $options: 'i' } }
      ];
      
      if (mongoose.Types.ObjectId.isValid(search)) {
        filters.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    }

    // Filter by order status
    const validOrderStatus = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (order_status && validOrderStatus.includes(order_status)) {
      filters.order_status = order_status;
    }

    // Filter by payment status
    const validPaymentStatus = ['pending', 'paid', 'refunded', 'failed'];
    if (payment_status && validPaymentStatus.includes(payment_status)) {
      filters.payment_status = payment_status;
    }

    // Filter by date range
    if (dateBegin || dateEnd) {
      filters.order_date = {};
      if (dateBegin && !isNaN(Date.parse(dateBegin))) {
        filters.order_date.$gte = new Date(dateBegin);
      }
      if (dateEnd && !isNaN(Date.parse(dateEnd))) {
        filters.order_date.$lte = new Date(dateEnd);
      }
    }

    // Filter by price range
    if (priceMin || priceMax) {
      filters.total_amount = {};
      if (priceMin && !isNaN(priceMin)) {
        filters.total_amount.$gte = parseFloat(priceMin);
      }
      if (priceMax && !isNaN(priceMax)) {
        filters.total_amount.$lte = parseFloat(priceMax);
      }
    }

    // Build sort object
    const sortOptions = {};
    const validSortFields = ['order_date', 'total_amount', 'recipient_name'];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.order_date = -1;
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 100); 
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const orders = await CustomerOrder.find(filters)
      .select('_id customer_id order_status order_date payment_status payment_method total_amount recipient_name recipient_email recipient_phone shipping_address item_count previewProduct')
      .populate('customer_id', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get item count and first product for each order
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await CustomerOrderItem.find({ order_id: order._id })
          .populate('product_id', 'name image_urls')
          .lean();

        const firstProduct = orderItems.length > 0 ? orderItems[0].product_id : null;

        return {
          ...order,
          itemCount: orderItems.length,
          previewProduct: firstProduct ? {
            name: firstProduct.name,
            image: firstProduct.image_urls && firstProduct.image_urls.length > 0
              ? firstProduct.image_urls[0]
              : null
          } : null
        };
      })
    );

    // Get total count for pagination
    const totalItems = await CustomerOrder.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limitNum);

    return res.status(200).json({
      success: true,
      data: ordersWithDetails,
      pagination: {
        currentPage: pageNum,
        perPage: limitNum,
        totalItems,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });

  } catch (err) {
    console.error('getAllOrders error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/orders/:id
 * Get complete order details for admin view
 */
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await CustomerOrder.findById(orderId)
      .populate('customer_id', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const items = await CustomerOrderItem.find({ order_id: orderId })
      .populate('product_id', 'name image_urls SKU')
      .lean();

    const itemsWithSubtotal = items.map(item => ({
      ...item,
      subtotal: item.price * item.quantity * (1 - item.discount / 100)
    }));

    return res.status(200).json({
      success: true,
      order,
      items: itemsWithSubtotal
    });

  } catch (err) {
    console.error('getOrderById error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * PUT /api/admin/orders/:id
 * Update order - allows editing contact info, shipping address, and statuses
 */
exports.updateOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const {
      recipient_name,
      recipient_email,
      recipient_phone,
      shipping_address,
      shipping_note,
      order_status,
      payment_status
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await CustomerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const previousPaymentStatus = order.payment_status;

    const updates = {};

    if (recipient_name !== undefined) updates.recipient_name = recipient_name;
    if (recipient_email !== undefined) updates.recipient_email = recipient_email;
    if (recipient_phone !== undefined) updates.recipient_phone = recipient_phone;
    if (shipping_address !== undefined) updates.shipping_address = shipping_address;
    if (shipping_note !== undefined) updates.shipping_note = shipping_note;

    const validOrderStatus = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (order_status && validOrderStatus.includes(order_status)) {
      updates.order_status = order_status;
    }

    const validPaymentStatus = ['pending', 'paid', 'refunded', 'failed'];
    if (payment_status && validPaymentStatus.includes(payment_status)) {
      if (payment_status === 'refunded' && previousPaymentStatus !== 'paid') {
        return res.status(400).json({
          success: false,
          message: "Cannot set payment status to 'refunded' - order was not paid"
        });
      }
      
      updates.payment_status = payment_status;
    }

    Object.assign(order, updates);
    await order.save();

    const newPaymentStatus = order.payment_status;
    if (newPaymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
      const txResult = await transactionService.createCustomerPaymentTransaction(
        order,
        order.payment_method
      );
      if (!txResult.success) {
        console.error('Failed to create payment transaction:', txResult.error);
      }
    }

    if (newPaymentStatus === 'refunded' && previousPaymentStatus === 'paid') {
      const txResult = await transactionService.createRefundTransaction(order);
      if (!txResult.success) {
        console.error('Failed to create refund transaction:', txResult.error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
    });

  } catch (err) {
    console.error('updateOrder error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/admin/orders/:id
 * Soft delete order - only for pending/confirmed orders
 * Restores stock and updates statuses
 */
exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await CustomerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (!['pending', 'confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete order with status '${order.order_status}'. Only pending or confirmed orders can be deleted.`
      });
    }

    const previousPaymentStatus = order.payment_status;

    const orderItems = await CustomerOrderItem.find({ order_id: orderId })
      .select('product_id quantity');

    for (const item of orderItems) {
      const updateResult = await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { current_stock: item.quantity } },
        { new: true }
      );

      if (!updateResult) {
        console.warn(`Product not found for restocking: ${item.product_id}`);
      }
    }

    let newPaymentStatus = order.payment_status;
    if (order.payment_status === 'paid') {
      newPaymentStatus = 'refunded';
    } else if (order.payment_status === 'pending') {
      newPaymentStatus = 'failed';
    }

    order.order_status = 'cancelled';
    order.payment_status = newPaymentStatus;
    await order.save();

    if (previousPaymentStatus === 'paid' && newPaymentStatus === 'refunded') {
      const txResult = await transactionService.createRefundTransaction(order);
      if (!txResult.success) {
        console.error('Failed to create refund transaction:', txResult.error);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
      order: {
        _id: order._id,
        order_status: order.order_status,
        payment_status: order.payment_status
      }
    });

  } catch (err) {
    console.error('deleteOrder error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};