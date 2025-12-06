// controllers/vnpayController.js

const mongoose = require("mongoose");
const CustomerOrder = require("../models/CustomerOrders");
const CustomerOrderItem = require("../models/CustomerOrderItems");
const Product = require("../models/Products");
const Customer = require("../models/Customers");
const transactionService = require("../services/transactionService");
const { getAuth } = require("@clerk/express");
require("dotenv").config();

const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
  IpnFailChecksum,
  IpnOrderNotFound,
  IpnInvalidAmount,
  InpOrderAlreadyConfirmed,
  IpnUnknownError,
  IpnSuccess,
} = require("vnpay");
const { create_VNpay, getResponseMessage } = require("../config/payment");
const vnpay = create_VNpay();

const MAX_CART_SIZE = 10;

/**
 * POST /api/vnpay/create-payment-url
 * Creates a new order and generates VNPay payment URL
 *
 * Body: {
 *   items: [{ product_id, quantity }],
 *   shippingDetails: {
 *     recipient_name, recipient_email, recipient_phone,
 *     shipping_address, shipping_note
 *   },
 *   bankCode: (optional) - for direct bank selection
 *   locale: (optional) - 'vn' or 'en'
 * }
 *
 * Returns: {
 *   success: true,
 *   paymentUrl: string,
 *   orderId: string,
 *   txnRef: string,
 *   expiresAt: Date
 * }
 */
exports.createPaymentUrl = async (req, res) => {
  try {
    let customer_id = null;
    const { userId } = getAuth(req);
    if (userId) {
      const customer = await Customer.findOne({ clerkId: userId })
        .select("_id")
        .lean();

      if (customer) {
        customer_id = new mongoose.Types.ObjectId(customer._id);
      }
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
        message: `Cart cannot have more than ${MAX_CART_SIZE} items`,
      });
    }

    // Validate shipping details
    if (!shippingDetails?.recipient_name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Recipient name is required",
      });
    }

    if (!shippingDetails?.recipient_phone?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    if (!shippingDetails?.shipping_address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    const productIds = items.map((i) => i.product_id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name current_stock selling_price")
      .lean();

    let totalAmount = 0;

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

      if (item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: `Invalid quantity for ${product.name}`,
        });
      }

      totalAmount += product.selling_price * item.quantity;
    }

    if (totalAmount < 10000) {
      return res.status(400).json({
        success: false,
        message: "Minimum order amount is 10,000 VND for online payment",
      });
    }

    const newOrder = await CustomerOrder.create({
      customer_id: customer_id,
      recipient_name: shippingDetails.recipient_name.trim(),
      recipient_email: shippingDetails.recipient_email?.trim() || "",
      recipient_phone: shippingDetails.recipient_phone.trim(),
      shipping_address: shippingDetails.shipping_address.trim(),
      shipping_note: shippingDetails.shipping_note?.trim() || "",
      payment_method: "vnpay",
      payment_status: "pending",
      order_status: "pending",
      total_amount: totalAmount,
      stock_deducted: false,
      payment_attempts: 1,
    });

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

    const orderId = newOrder._id.toString();

    const paymentUrl = vnpay.buildPaymentUrl({
      vnp_Amount: totalAmount,
      vnp_IpAddr:
        req.headers["x-forwarded-for"] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.ip,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: ProductCode.Other,
      vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
      vnp_Locale: VnpLocale.VN,
    });

    createdAtTime = new Date()
    expireTime = createdAtTime
    expireTime.setMinutes(expireTime.getMinutes() + 15)

    newOrder.vnpay_txn_ref = orderId;
    newOrder.payment_url_created_at = createdAtTime;
    newOrder.payment_expires_at = expireTime;
    await newOrder.save();

    return res.status(200).json({
      success: true,
      message: "Payment URL created successfully",
      paymentUrl: paymentUrl,
      orderId: newOrder._id,
    });
  } catch (error) {
    console.error("createPaymentUrl error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create payment URL",
      error: error.message,
    });
  }
};

/**
 * GET /api/vnpay/vnpay-ipn
 * VNPay Instant Payment Notification (IPN) Handler
 */
exports.handleIPN = async (req, res) => {
  try {
    const vnpParams = req.query;
    const verify = vnpay.verifyIpnCall(vnpParams);

    if (!verify.isVerified) {
      return res.json(IpnFailChecksum);
    }

    if (!verify.isSuccess) {
      return res.json(IpnUnknownError);
    }

    const txnRef = vnpParams.vnp_TxnRef;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;

    const order = await CustomerOrder.findByTxnRef(txnRef);
    if (!order) {
      return res.status(200).json(IpnOrderNotFound);
    }

    if (order.payment_status === "paid") {
      return res.status(200).json(InpOrderAlreadyConfirmed);
    }

    if (amount !== order.total_amount) {
      return res.status(200).json(IpnInvalidAmount);
    }

    order.markPaymentCompleted(vnpParams);

    if (!order.stock_deducted) {
      const orderItems = await CustomerOrderItem.find({
        order_id: order._id,
      });

      const stockUpdates = orderItems.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: { $inc: { current_stock: -item.quantity } },
        },
      }));

      await Product.bulkWrite(stockUpdates);
      order.stock_deducted = true;
    }

    await transactionService.createCustomerPaymentTransaction(
      order,
      "transfer"
    );
    await order.save();

    return res.status(200).json(IpnSuccess);
  } catch (error) {
    console.error("handleIPN error:", error);
    return res.status(200).json(IpnUnknownError);
  }
};

/**
 * GET /api/vnpay/vnpay-return
 * Handle user redirect back from VNPay
 * This verifies the payment and returns status for frontend
 */
exports.handleReturn = async (req, res) => {
  try {
    const vnpParams = req.query;
    const verify = vnpay.verifyReturnUrl(vnpParams);

    if (!verify.isVerified) {
      return res.status(200).send("Verification failed");
    }
    if (!verify.isSuccess) {
      return res.send("Order payment failed");
    }

    const txnRef = vnpParams.vnp_TxnRef;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = parseInt(vnpParams.vnp_Amount) / 100;
    const bankCode = vnpParams.vnp_BankCode;
    const payDate = vnpParams.vnp_PayDate;

    // 3. FIND ORDER
    const orderId = txnRef;
    const order = await CustomerOrder.findById(orderId)
      .select("_id payment_status order_status total_amount")
      .lean();

    

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        code: "01",
      });
    }

    // 4. RETURN RESULT
    const isSuccess = responseCode === '00';

    return res.status(200).json({
      success: isSuccess,
      message: getResponseMessage(responseCode),
      code: responseCode,
      data: {
        orderId: order._id,
        txnRef: txnRef,
        transactionNo: transactionNo,
        amount: amount,
        bankCode: bankCode,
        payDate: payDate,
        orderStatus: order.order_status,
        paymentStatus: order.payment_status,
      },
    });
  } catch (error) {
    console.error("handleReturn error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to verify payment",
      error: error.message,
    });
  }
};

/**
 * POST /api/vnpay/retry-payment/:orderId
 * Generate new payment URL for an existing unpaid order
 */
exports.retryPayment = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Find order
    const order = await CustomerOrder.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Check if retry is allowed
    if (order.payment_method !== "vnpay") {
      return res.status(400).json({
        success: false,
        message: "This order does not use VNPay payment",
      });
    }

    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    if (order.order_status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Cannot retry payment for cancelled order",
      });
    }

    // Check stock availability before retry
    const orderItems = await CustomerOrderItem.find({
      order_id: orderId,
    }).populate("product_id", "name current_stock");

    for (const item of orderItems) {
      if (item.quantity > item.product_id.current_stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product_id.name}. Available: ${item.product_id.current_stock}`,
        });
      }
    }

    // Generate new payment URL
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.connection?.remoteAddress ||
      "127.0.0.1";

    const { paymentUrl, txnRef, expireDate } = buildPaymentUrl({
      orderId: order._id.toString(),
      amount: order.total_amount,
      orderInfo: `Thanh toan don hang #${order._id}`,
      ipAddr: clientIp,
      locale: "vn",
    });

    // Update order
    order.vnpay_txn_ref = txnRef;
    order.payment_url_created_at = new Date();
    order.payment_expires_at = expireDate;
    order.payment_status = "pending";
    order.payment_attempts += 1;
    await order.save();

    return res.status(200).json({
      success: true,
      message: "New payment URL generated",
      paymentUrl: paymentUrl,
      orderId: order._id,
      txnRef: txnRef,
      expiresAt: expireDate,
    });
  } catch (error) {
    console.error("retryPayment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate payment URL",
      error: error.message,
    });
  }
};

/**
 * GET /api/vnpay/check-status/:orderId
 * Check payment status of an order
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    const order = await CustomerOrder.findById(orderId)
      .select(
        "payment_status order_status payment_method vnpay_response_code payment_completed_at"
      )
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: orderId,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        responseCode: order.vnpay_response_code,
        completedAt: order.payment_completed_at,
      },
    });
  } catch (error) {
    console.error("checkPaymentStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check payment status",
    });
  }
};
