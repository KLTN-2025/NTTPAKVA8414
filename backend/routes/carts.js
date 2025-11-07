const express = require('express')
const router = express.Router()
const { requireAuth } = require('@clerk/express')
const cartController = require('../controllers/carts.js')


router.post('/validate', 
  cartController.validateCart
);

router.get('/get', requireAuth(),
  cartController.getCart
)

router.post('/sync', requireAuth(),
  cartController.syncCart
)

module.exports = router