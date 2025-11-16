// controllers/admin/orders.js
const mongoose = require("mongoose");
const CustomerOrder = require("../models/CustomerOrders");
const CustomerOrderItem = require("../models/CustomerOrderItems");
const Product = require("../models/Products");
const Customer = require("../models/Customers");

/**
 * GET /api/admin/orders
 * Get all orders with filtering, search, sorting, and pagination
 * Query params: {
 *   search, order_status, payment_status, 
 *   dateBegin, dateEnd, priceMin, priceMax,
 *   sortBy, sortOrder, page, limit
 * }
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
      sortOptions.order_date = -1; // Default sort
    }

    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = Math.min(parseInt(limit) || 10, 10); 
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const orders = await CustomerOrder.find(filters)
      .select('_id customer_id, order_status order_date payment_status payment_method total_amount recipient_name item_count previewProduct')
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
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Get order with customer details
    const order = await CustomerOrder.findById(orderId)
      .populate('customer_id', 'name email phone')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get order items with product details
    const items = await CustomerOrderItem.find({ order_id: orderId })
      .populate('product_id', 'name image_urls SKU')
      .lean();

    // Calculate subtotals
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
 * Body: {
 *   recipient_name, recipient_email, recipient_phone,
 *   shipping_address, shipping_note,
 *   order_status, payment_status
 * }
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Find order
    const order = await CustomerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update object
    const updates = {};

    // Update contact info if provided
    if (recipient_name !== undefined) updates.recipient_name = recipient_name;
    if (recipient_email !== undefined) updates.recipient_email = recipient_email;
    if (recipient_phone !== undefined) updates.recipient_phone = recipient_phone;

    // Update shipping info if provided
    if (shipping_address !== undefined) updates.shipping_address = shipping_address;
    if (shipping_note !== undefined) updates.shipping_note = shipping_note;

    // Validate and update order status
    const validOrderStatus = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (order_status && validOrderStatus.includes(order_status)) {
      updates.order_status = order_status;
    }

    // Validate and update payment status
    const validPaymentStatus = ['pending', 'paid', 'refunded', 'failed'];
    if (payment_status && validPaymentStatus.includes(payment_status)) {
      updates.payment_status = payment_status;
    }

    // Apply updates
    Object.assign(order, updates);
    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      order
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    // Find order
    const order = await CustomerOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if order can be deleted (only pending or confirmed)
    if (!['pending', 'confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete order with status '${order.order_status}'. Only pending or confirmed orders can be deleted.`
      });
    }

    // Get order items to restore stock
    const orderItems = await CustomerOrderItem.find({ order_id: orderId })
      .select('product_id quantity');

    // Restore stock for each product
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

    // Update payment status based on current status
    let newPaymentStatus = order.payment_status;
    if (order.payment_status === 'paid') {
      newPaymentStatus = 'refunded';
    } else if (order.payment_status === 'pending') {
      newPaymentStatus = 'failed';
    }

    // Update order to cancelled (soft delete)
    order.order_status = 'cancelled';
    order.payment_status = newPaymentStatus;
    await order.save();

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

/**
 * GET /api/admin/orders/export
 * Export orders to CSV
 */
exports.exportOrders = async (req, res) => {
  try {
    const {
      search,
      order_status,
      payment_status,
      dateBegin,
      dateEnd,
      priceMin,
      priceMax
    } = req.query;

    // Build filters
    const filters = {};

    if (search) {
      filters.$or = [
        { recipient_name: { $regex: search, $options: 'i' } }
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        filters.$or.push({ _id: new mongoose.Types.ObjectId(search) });
      }
    }

    const validOrderStatus = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    if (order_status && validOrderStatus.includes(order_status)) {
      filters.order_status = order_status;
    }

    const validPaymentStatus = ['pending', 'paid', 'refunded', 'failed'];
    if (payment_status && validPaymentStatus.includes(payment_status)) {
      filters.payment_status = payment_status;
    }

    if (dateBegin || dateEnd) {
      filters.order_date = {};
      if (dateBegin && !isNaN(Date.parse(dateBegin))) {
        filters.order_date.$gte = new Date(dateBegin);
      }
      if (dateEnd && !isNaN(Date.parse(dateEnd))) {
        filters.order_date.$lte = new Date(dateEnd);
      }
    }

    if (priceMin || priceMax) {
      filters.total_amount = {};
      if (priceMin && !isNaN(priceMin)) {
        filters.total_amount.$gte = parseFloat(priceMin);
      }
      if (priceMax && !isNaN(priceMax)) {
        filters.total_amount.$lte = parseFloat(priceMax);
      }
    }

    // Get all matching orders (no pagination for export)
    const orders = await CustomerOrder.find(filters)
      .populate('customer_id', 'name email')
      .sort({ order_date: -1 })
      .lean();

    // Build CSV
    const csvRows = [];
    
    // Header row
    csvRows.push([
      'Order ID',
      'Customer Name',
      'Email',
      'Phone',
      'Shipping Address',
      'Total Amount',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Order Date'
    ].join(','));

    // Data rows
    for (const order of orders) {
      const row = [
        order._id.toString(),
        escapeCsvField(order.recipient_name || ''),
        escapeCsvField(order.recipient_email || ''),
        escapeCsvField(order.recipient_phone || ''),
        escapeCsvField(order.shipping_address || ''),
        order.total_amount || 0,
        order.payment_method || '',
        order.payment_status || '',
        order.order_status || '',
        new Date(order.order_date).toLocaleString('en-GB')
      ];
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders-export-${Date.now()}.csv`);
    
    return res.status(200).send(csvContent);

  } catch (err) {
    console.error('exportOrders error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Helper function to escape CSV fields
function escapeCsvField(field) {
  if (field == null) return '';
  const str = String(field);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}