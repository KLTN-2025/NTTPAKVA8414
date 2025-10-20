const express = require('express')
const router = express.Router()

router.use('/auth', require('./auth'))
router.use('/customerProfile', require('./customerProfile'))
router.use('/products', require('./products'))
router.use('/recommendations', require('./recommendations'))

module.exports = router;