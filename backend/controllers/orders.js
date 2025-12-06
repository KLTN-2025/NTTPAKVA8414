//controllers/orders.js
const mongoose = require("mongoose");
const CustomerOrder = require("../models/CustomerOrders");
const CustomerOrderItem = require("../models/CustomerOrderItems");
const Product = require("../models/Products");
const Customer = require("../models/Customers");
const { getAuth } = require('@clerk/express')
const { redis } = require('../config/redis');
const transactionService = require('../services/transactionService');

const MAX_CART_SIZE = 10;

/**
 * POST /api/orders
 * Body:
 *  { items: [{ product_id, quantity }],
 *  shippingDetails: { 
 *    recipient_name, recipient_email, recipient_phone,
 *    shipping_address, shipping_note, payment_method } 
 *  }
 * }
 */
exports.placeOrder = async (req, res) => {
  try {
    /* Optional auth */
    let customer_id = null;
    const { userId } = getAuth(req)
    if (userId) {
      const customer = await Customer.findOne({ clerkId: userId })
        .select("_id")
        .lean();
      if (customer) 
        customer_id = new mongoose.Types.ObjectId(customer._id);
      else
        return res.status(404).json({
          success: false,
          message: "Invalid user",
        });
    }

    const { items, shippingDetails } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty or invalid",
      });
    }
    if (items.length > MAX_CART_SIZE) {
      return res.status(400).json({
        success: false,
        message: `Cart can\'t have more than ${MAX_CART_SIZE} items`,
      });
    }

    //Fetch products from DB for validation
    const productIds = items.map((i) => i.product_id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name current_stock selling_price")
      .lean();

    // Validation: check stock and calculate total
    let total = 0;
    const updates = [];

    for (const item of items) {
      const product = products.find(
        (p) => p._id.toString() === item.product_id
      );

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.product_id}`,
        });
      }

      if (item.quantity > product.current_stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.current_stock}`,
        });
      }

      total += product.selling_price * item.quantity;

      // Prepare stock update
      updates.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { current_stock: -item.quantity } },
        },
      });
    }

    // Create order
    const newOrder = await CustomerOrder.create({
      customer_id: customer_id,
      recipient_name: shippingDetails.recipient_name,
      recipient_email: shippingDetails.recipient_email || '',
      recipient_phone: shippingDetails.recipient_phone,
      payment_method:
        shippingDetails.payment_method === "vnpay" ? "vnpay" : "cod",
      shipping_address: shippingDetails.shipping_address,
      shipping_note: shippingDetails.shipping_note || "",
      stock_deducted: true,
      total_amount: total
    });

    // Create order items
    const orderItems = items.map((item) => {
      const product = products.find(
        (p) => p._id.toString() === item.product_id
      );
      return {
        order_id: newOrder._id,
        product_id: product._id,
        quantity: item.quantity,
        price: product.selling_price,
        discount: 0,
      };
    });

    await CustomerOrderItem.insertMany(orderItems);

    // Update stock
    await Product.bulkWrite(updates);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order_id: newOrder._id,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * - GET /api/orders
 * - Get all orders made by a specific user with product preview
 * - Query params: { order_status, payment_status, dateBegin, dateEnd, page, limit }
 * - Requires auth
 * - Returns: {
 *   success: true | false,
 *   data: list of Orders with first product info and item count,
 *   pagination: { currentPage, perPage, totalItems, totalPages, hasNextPage, hasPrevPage }
 * }
 */
exports.getOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { order_status, payment_status, dateBegin, dateEnd } = req.query;

    // Match clerkId with DB user
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean();
    if (!customer)
      return res.status(404).json({ success: false, message: "Invalid user" });

    // Valid statuses to test against
    const validOrderStatus = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const validPaymentStatus = ["pending", "paid", "refunded", "failed"];

    // Building filters
    const filters = {};
    filters.customer_id = customer._id;

    if (order_status && validOrderStatus.includes(order_status)) {
      filters.order_status = order_status;
    }

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

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const skip = (page - 1) * limit;

    // Perform query
    const foundOrders = await CustomerOrder.find(filters)
      .populate("customer_id", "name")
      .sort({ order_date: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .lean();

    // For each order, get item count and first product info
    const ordersWithProducts = await Promise.all(
      foundOrders.map(async (order) => {
        // Get all items for this order
        const orderItems = await CustomerOrderItem.find({ order_id: order._id })
          .populate("product_id", "name image_urls")
          .lean();

        // Get first product for preview
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

    // For frontend pagination purposes
    const totalItems = await CustomerOrder.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: ordersWithProducts,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (err) {
    console.error('getOrders error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/orders/:id
 * - Get the complete order details including all order fields and item list
 * - Returns: {
 * - success: true | false,
 * - order: { full order object with all fields },
 * - items: [{
 *    order_id, product_id, price, quantity, discount, subtotal
 *  }]
 * }
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean();
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    // Validate order id format
    const reqOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reqOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }
    /*
    const cachedKey = `orders:${reqOrderId}`
    const cachedItemsKey = `orders:${reqOrderId}:items`
    
    // Find order in cache first
    const cachedOrder = await redis.get(cachedKey)
    const cachedOrderItems = await redis.get(cachedItemsKey)

    if (cachedOrder && cachedOrderItems) {
      return res.status(200).json({
        success: true,
        order: JSON.parse(cachedOrder),
        items: JSON.parse(cachedOrderItems)
      })
    }*/

    const order = await CustomerOrder.findOne({
      _id: reqOrderId,
      customer_id: customer._id
    })
    .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    // Get order items with full product details
    const itemList = await CustomerOrderItem.find({ order_id: reqOrderId })
      .select('-createdAt -updatedAt -__v')
      .populate('product_id', 'name image_urls SKU')
      .lean();

    // Add subtotal field to each item
    const formattedResult = itemList.map(item => ({
      ...item,
      subtotal: item.price * item.quantity * (1 - item.discount / 100)
    }));

    //Set cache
    /*
    await redis.set(cachedKey, JSON.stringify(order), {EX: 3600})
    await redis.set(cachedItemsKey, JSON.stringify(formattedResult), {EX: 3600})
    */
    return res.status(200).json({
      success: true,
      order: order, 
      items: formattedResult
    });

  } catch (err) {
    console.error('getOrderDetails error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error occurred" 
    });
  }
};


/**
 * PUT /api/orders/:id/cancel
 * Cancel an order;
 * Requires auth;
 * Only allows cancellation if order status is 'pending' or 'confirmed';
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean();
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    const reqOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reqOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await CustomerOrder.findOne({
      _id: reqOrderId,
      customer_id: customer._id,
      stock_deducted: { $ne: false }
    })
    .select('order_status payment_status total_amount payment_method');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    if (!['pending', 'confirmed'].includes(order.order_status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.order_status}'`
      });
    }

    const previousPaymentStatus = order.payment_status;

    const orderItems = await CustomerOrderItem.find({ order_id: reqOrderId })
      .select('product_id quantity');

    for (const item of orderItems) {
      const updateResult = await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { current_stock: item.quantity } },
        { new: true }
      );

      if (!updateResult) {
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product_id}`
        });
      }
    }

    // Update payment status
    let newPaymentStatus = order.payment_status;
    if (order.payment_status === 'paid') {
      newPaymentStatus = 'refunded';
    } else if (order.payment_status === 'pending') {
      newPaymentStatus = 'failed'; 
    }

    // Update order status
    order.order_status = 'cancelled';
    order.stock_deducted = false
    order.payment_status = newPaymentStatus;
    await order.save();

    if (previousPaymentStatus === 'paid' && newPaymentStatus === 'refunded') {
      const txResult = await transactionService.createRefundTransaction(order);
      if (!txResult.success) {
        console.error('Failed to create refund transaction:', txResult.error);
      }
    }
    
    // Invalidate cache
    const cachedKey = `orders:${reqOrderId}`;
    const cachedItemsKey = `orders:${reqOrderId}:items`;
    await redis.del(cachedKey, cachedItemsKey);

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order: {
        _id: order._id,
        order_status: order.order_status,
        payment_status: order.payment_status
      }
    });

  } catch (err) {
    console.error('cancelOrder error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error occurred" 
    });
  }
};