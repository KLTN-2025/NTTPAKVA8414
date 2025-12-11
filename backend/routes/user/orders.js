const express = require("express");
const { checkMemberStatus } = require("../../middleware/checkMember");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const orderController = require("../../controllers/orders");

const orderCreateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 10,
  keyGenerator: (req) => req.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many requests. Wait before retrying again",
    }),
});

const orderViewLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 15,
  keyGenerator: (req) => req.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res.status(429).json({
      success: false,
      message: "Too many requests. Wait before retrying again",
    }),
});

/**
 * POST /api/orders
 * Create new orders
 * Optional auth
 */
router.post("/", orderCreateLimiter, orderController.placeOrder);

/**
 * GET /api/orders
 *
 * Get all orders made by a specific user
 * Supports filtering by order status, payment status, date range;
 * Supports pagination;
 * Requires auth.
 * */
router.get("/", checkMemberStatus, orderViewLimiter, orderController.getOrders);

/**
 * GET /api/orders/:id
 * Get the item list in a specific order;
 * Requires auth.
 */
router.get(
  "/:id",
  checkMemberStatus,
  orderViewLimiter,
  orderController.getOrderDetails
);

/**
 * Cancel an order;
 * Only allows cancellation if order status is 'pending' or 'confirmed';
 * Requires auth.
 */
router.put(
  "/:id/cancel",
  checkMemberStatus,
  orderCreateLimiter,
  orderController.cancelOrder
);

module.exports = router;
