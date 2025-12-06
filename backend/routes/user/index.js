const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth'))
router.use('/customerProfile', require('./customerProfile'))
router.use('/products', require('./products'))
router.use('/attributes', require('./attributes'))
router.use('/categories', require('./categories'))
router.use('/carts', require('./carts'))
router.use('/orders', require('./orders'))
router.use('/chatbot', require('./chatbot'))
router.use('/vnpay', require('./vnpay'))

module.exports = router;