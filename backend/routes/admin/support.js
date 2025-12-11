// routes/admin/support.js
const express = require('express');
const router = express.Router();
const customerSupportController = require('../../controllers/customerSupport');
const { checkAdminRole } = require("../../middleware/checkAdmin");

router.use(checkAdminRole)

/**
 * GET /api/admin/support/inquiries
 * Get all inquiries with filtering and pagination
 */
router.get('/inquiries', customerSupportController.getAllInquiries);

/**
 * GET /api/admin/support/inquiries/:id
 * Get single inquiry details
 */
router.get('/inquiries/:id', customerSupportController.getInquiryById);

/**
 * PUT /api/admin/support/inquiries/:id/status
 * Update inquiry status
 */
router.put('/inquiries/:id/status', customerSupportController.updateInquiryStatus);

/**
 * DELETE /api/admin/support/inquiries/:id
 * Delete an inquiry
 */
router.delete('/inquiries/:id', customerSupportController.deleteInquiry);

/**
 * GET /api/admin/support/problem-types
 * Get list of valid problem types (for filter dropdown)
 */
router.get('/problem-types', customerSupportController.getProblemTypes);

module.exports = router