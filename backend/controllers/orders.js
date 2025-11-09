const mongoose = require("mongoose");
const CustomerOrder = require("../models/CustomerOrders");
const CustomerOrderItem = require("../models/CustomerOrderItems");
const Product = require("../models/Products");
const Customer = require("../models/Customers");
const { getAuth } = require("@clerk/express");

const MAX_CART_SIZE = 10;

/**
 * Body:
 *  { items: [{ product_id, quantity }],
 *  shippingDetails: { shipping_address, shipping_note, payment_method } }
 */
exports.placeOrder = async (req, res) => {
  try {
    /* Optional auth */
    let customer_id = null;
    const { userId } = getAuth(req);
    if (userId) {
      const customer = await Customer.findOne({ clerkId: userId })
        .select("_id")
        .lean();
      if (customer) customer_id = new mongoose.Types.ObjectId(customer._id);
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
        message: `Cart is too large (${items.length}/${MAX_CART_SIZE} items)`,
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
      payment_method:
        shippingDetails.payment_method === "bank" ? "transfer" : "cod",
      shipping_address: shippingDetails.shipping_address,
      shipping_note: shippingDetails.shipping_note || "",
      total_amount: total,
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
 * Get all orders made by a specific user;
 * Body: { orderStatus, paymentStatus, dateBegin, dateEnd, page, limit };
 * Requires auth
 * */
exports.getOrders = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { orderStatus, paymentStatus, dateBegin, dateEnd } = req.query;

    //Search for userId from Clerk
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required" });
    }

    //Match clerkId with DB user
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean();
    if (!customer)
      return res.status(404).json({ success: false, message: "Invalid user" });

    //Valid statuses to test against
    const validOrderStatus = [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ];
    const validPaymentStatus = ["pending", "paid", "refunded", "failed"];

    //Building filters
    const filters = {};
    filters.customer_id = customer._id;

    if (orderStatus && validOrderStatus.includes(orderStatus)){
      filters.order_status = orderStatus;
    }

    if (paymentStatus && validPaymentStatus.includes(paymentStatus)){
      filters.payment_status = paymentStatus;
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

    //Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 5, 10);
    const skip = (page - 1) * limit;

    //Perform query
    const foundOrders = await CustomerOrder.find(filters)
      .populate("customer_id", "name")
      .skip(skip)
      .limit(limit)
      .lean();

    //For frontend pagination purposes
    const totalItems = await CustomerOrder.countDocuments(filters);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: foundOrders,
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
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Get the item list in a specific order
 * Requires auth
 * Requires the client's _id to match the order's customer_id, otherwise block access.
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    //Check authentication
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    //Validate order id format
    const reqOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reqOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    //Get customer ID
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean();
    
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    //Find order
    const order = await CustomerOrder.findOne({
      _id: reqOrderId,
      customer_id: customer._id
    })
    .select('total_amount')
    .lean();

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    //Get order items
    const itemList = await CustomerOrderItem.find({ order_id: reqOrderId })
      .select('-createdAt -updatedAt -__v')
      .populate('product_id', 'name')
      .lean();

    //Add a subtotal field to each item in the list
    const formattedResult = itemList.map(item => ({
      ...item,
      subtotal: item.price * item.quantity * (1 - item.discount / 100)
    }));

    return res.status(200).json({
      success: true,
      items: formattedResult,
      total: order.total_amount
    });

  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: "Server error occurred" 
    });
  }
};


/**
 * Cancel an order;
 * Requires auth;
 * Only allows cancellation if order status is 'pending' or 'confirmed';
 * Restores product stock quantities & updates statuses appropriately.
 */
exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { userId } = getAuth(req);

    //Check authentication
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    //Validate ObjectId format
    const reqOrderId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(reqOrderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    //Get customer ID
    const customer = await Customer.findOne({ clerkId: userId })
      .select("_id")
      .lean()
      .session(session);
    
    if (!customer) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    //Find order with authorization and status check
    const order = await CustomerOrder.findOne({
      _id: reqOrderId,
      customer_id: customer._id
    })
    .select('order_status payment_status')
    .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false, 
        message: "Order not found or unauthorized" 
      });
    }

    //Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.order_status)) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status '${order.order_status}'`
      });
    }

    //Get order items 
    const orderItems = await CustomerOrderItem.find({ order_id: reqOrderId })
      .select('product_id quantity')
      .session(session);

    //Restore stock for each product
    for (const item of orderItems) {
      const updateResult = await Product.findByIdAndUpdate(
        item.product_id,
        { $inc: { current_stock: item.quantity } },
        { session, new: true }
      );

      if (!updateResult) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.product_id}`
        });
      }
    }

    //Update payment status
    let newPaymentStatus = order.payment_status;
    if (order.payment_status === 'paid') {
      newPaymentStatus = 'refunded';
    } else if (order.payment_status === 'pending') {
      newPaymentStatus = 'failed'; 
    }

    //Update order status
    order.order_status = 'cancelled';
    order.payment_status = newPaymentStatus;
    await order.save({ session });

    // 10. Commit transaction
    await session.commitTransaction();

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
    await session.abortTransaction();
    console.error('cancelOrder error:', err);
    return res.status(500).json({ 
      success: false, 
      message: "Server error occurred" 
    });
  } finally {
    session.endSession();
  }
};