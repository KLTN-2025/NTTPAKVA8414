const express = require('express')
const router = express.Router()
const { requireAuth } = require('@clerk/express')
const cartController = require('../controllers/carts.js')


router.post('/validate-cart', 
  cartController.validateCart
);

router.get('/get-cart', requireAuth(),
  cartController.getCart
)

router.get('/sync-cart', requireAuth(),
  cartController.syncCart
)

module.exports = router