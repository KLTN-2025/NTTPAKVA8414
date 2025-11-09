const express = require('express')
const { requireAuth } = require('@clerk/express')
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
router.get('/', requireAuth(),
  orderController.getOrders
)

/**
 * Get the product list in a specific order;
 * Requires auth.
 */
router.get('/:id', requireAuth(),
  orderController.getOrderDetails
)

/**
 * Cancel an order;
 * Requires auth.
 */
router.put('/:id/cancel', requireAuth(),
  orderController.cancelOrder
)

module.exports = router