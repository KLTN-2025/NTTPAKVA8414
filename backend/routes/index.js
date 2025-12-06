const express = require('express')
const router = express.Router()

router.use('/admin', require('./admin/index'))
router.use('/', require('./user/index'))
module.exports = router;