const express = require('express')
const { checkMemberStatus } = require('../../middleware/checkMember')
const router = express.Router()

const orderController = require('../../controllers/orders')


/**
 * POST /api/orders
 * Create new orders
 * Optional auth
 */
router.post('/', 
  orderController.placeOrder
);

/**
 * GET /api/orders
 * 
 * Get all orders made by a specific user
 * Supports filtering by order status, payment status, date range;
 * Supports pagination;
 * Requires auth.
 * */ 
router.get('/', checkMemberStatus,
  orderController.getOrders
)

/**
 * GET /api/orders/:id
 * Get the item list in a specific order;
 * Requires auth.
 */
router.get('/:id', checkMemberStatus,
  orderController.getOrderDetails
)

/**
 * Cancel an order;
 * Only allows cancellation if order status is 'pending' or 'confirmed';
 * Requires auth.
 */
router.put('/:id/cancel', checkMemberStatus,
  orderController.cancelOrder
)

module.exports = router