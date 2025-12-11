// routes/user/vnpay.js
// VNPay API Routes

const express = require("express");
const router = express.Router();
const vnpayController = require("../../controllers/vnpayController");
const { WINDOW_LENGTH, rateLimiter } = require("../../middleware/rateLimiter")

const config = {
  window: 10 * WINDOW_LENGTH.MINUTE,
  max: 10,
  group: "order_create",
  errorMessage: "Too many request sent! Please wait"
}

/**
 * POST /api/vnpay/create-payment-url
 * Create VNPay payment URL
 * Auth: Optional (supports guest checkout)
 */
router.post(
  "/create-payment-url",
  rateLimiter(config),
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
