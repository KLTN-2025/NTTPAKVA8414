const express = require('express')
const { requireAuth } = require('@clerk/express')
const router = express.Router()

const orderController = require('../controllers/orders')

// Create new order
router.post('/', 
  orderController.placeOrder
);

module.exports = router