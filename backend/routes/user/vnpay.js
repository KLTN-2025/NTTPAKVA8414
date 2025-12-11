// routes/user/vnpay.js
// VNPay API Routes

const express = require("express");
const router = express.Router();
const vnpayController = require("../../controllers/vnpayController");
const rateLimit = require("express-rate-limit");

const orderCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,
  keyGenerator: (req) => req.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res
      .status(429)
      .json({
        success: false,
        message: "Too many requests. Wait before retrying again",
      }),
});

/**
 * POST /api/vnpay/create-payment-url
 * Create VNPay payment URL
 * Auth: Optional (supports guest checkout)
 */
router.post(
  "/create-payment-url",
  orderCreateLimiter,
  vnpayController.createPaymentUrl
);

/**
 * GET /api/vnpay/vnpay-ipn
 * VNPay IPN callback (server-to-server)
 * Auth: None (called by VNPay's server)
 */
router.get("/vnpay-ipn", vnpayController.handleIPN);

/**
 * GET /api/vnpay/vnpay-return
 * Handle user redirect from VNPay
 * Auth: None
 */
router.get("/vnpay-return", vnpayController.handleReturn);

/**
 * POST /api/vnpay/retry-payment/:orderId
 * Retry failed payment
 * Auth: Optional
 */
router.post("/retry-payment/:orderId", vnpayController.retryPayment);

/**
 * GET /api/vnpay/check-status/:orderId
 * Check payment status
 * Auth: Optional
 */
router.get("/check-status/:orderId", vnpayController.checkPaymentStatus);

module.exports = router;
