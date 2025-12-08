const express = require('express')
const router = express.Router()

router.use('/metadata', require('./metadata.js'))
router.use('/orders', require('./orders'))
router.use('/products', require('./products'))
router.use('/customers', require('./customers'))
router.use('/suppliers', require('./suppliers'))
router.use('/inventory', require('./inventory'))
router.use('/supply-orders', require('./supply-orders'))
router.use('/recommendations', require('./recommendations'))
router.use('/transactions', require('./transactions'))
router.use('/support', require('./support'))
router.use('/', require('./additional'))

module.exports = router;