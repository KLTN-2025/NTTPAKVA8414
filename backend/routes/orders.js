const express = require('express')
const { checkMemberStatus } = require('../middleware/checkMember')
const router = express.Router()

const orderController = require('../controllers/orders')

// Create new order
router.post('/', 
  orderController.placeOrder
);

/**
 * Get all orders made by a specific user;
 * Requires auth.
 * */ 
router.get('/', checkMemberStatus,
  orderController.getOrders
)

/**
 * Get the product list in a specific order;
 * Requires auth.
 */
router.get('/:id', checkMemberStatus,
  orderController.getOrderDetails
)

/**
 * Cancel an order;
 * Requires auth.
 */
router.put('/:id/cancel', checkMemberStatus,
  orderController.cancelOrder
)

module.exports = router