// routes/user/support.js
const express = require('express');
const router = express.Router();
const customerSupportController = require('../../controllers/customerSupport');

/**
 * POST /api/support/inquiries
 * Create a new customer inquiry (guests allowed)
 */
router.post('/inquiries', customerSupportController.createInquiry);

/**
 * GET /api/support/problem-types
 * Get list of valid problem types (for dropdown)
 */
router.get('/problem-types', customerSupportController.getProblemTypes);

module.exports = router