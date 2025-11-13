const express = require('express')
const router = express.Router()
const cartController = require('../controllers/carts.js')
const { checkMemberStatus } = require('../middleware/checkMember.js')

router.post('/validate', checkMemberStatus,
  cartController.validateCart
);

router.get('/get', checkMemberStatus,
  cartController.getCart
)

router.post('/sync', checkMemberStatus,
  cartController.syncCart
)

module.exports = router