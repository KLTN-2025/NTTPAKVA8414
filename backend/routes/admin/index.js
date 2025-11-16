const express = require('express')
const router = express.Router()

router.use('/orders', require('./orders'))
router.use('/products', require('./products'))
router.use('/', require('./additional'))

module.exports = router;