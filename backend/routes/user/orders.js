const express = require("express");
const { checkMemberStatus } = require("../../middleware/checkMember");
const router = express.Router();
const orderController = require("../../controllers/orders");

const { WINDOW_LENGTH, rateLimiter } = require("../../middleware/rateLimiter");

const createConfig = {
  window: 10 * WINDOW_LENGTH.MINUTE,
  max: 10,
  group: "order_create",
  errorMessage: "Too many inquries sent! Please wait",
};
const viewConfig = {
  window: 1 * WINDOW_LENGTH.MINUTE,
  max: 30,
  group: "order_view",
  errorMessage: "Too many inquries sent! Please wait",
};

/**
 * POST /api/orders
 * Create new orders
 * Optional auth
 */
router.post("/", rateLimiter(createConfig), orderController.placeOrder);

/**
 * GET /api/orders
 * Get all orders made by a specific user
 * Supports filtering by order status, payment status, date range;
 * Supports pagination;
 * Requires auth.
 * */
router.get(
  "/",
  checkMemberStatus,
  rateLimiter(viewConfig),
  orderController.getOrders
);

/**
 * GET /api/orders/:id
 * Get the item list in a specific order;
 * Requires auth.
 */
router.get(
  "/:id",
  checkMemberStatus,
  rateLimiter(viewConfig),
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
  rateLimiter(createConfig),
  orderController.cancelOrder
);

module.exports = router;
