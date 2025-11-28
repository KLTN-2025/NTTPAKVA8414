// routes/admin/suppliers.js
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/supplyManagement');
const { checkAdminRole } = require("../../middleware/checkAdmin");

/**
 * GET /api/admin/suppliers
 * Get all suppliers with optional filtering
 * Query: name, email, phone, includeDeleted, page, limit
 */
router.get(
  '/',
  checkAdminRole,
  controller.getSuppliers
);

/**
 * GET /api/admin/suppliers/:id
 * Get a single supplier by ID
 */
router.get(
  '/:id',
  checkAdminRole,
  controller.getSupplier
);

/**
 * POST /api/admin/suppliers
 * Create a new supplier
 * Body: { name, email, phone }
 */
router.post(
  '/',
  checkAdminRole,
  controller.createSupplier
);

/**
 * PUT /api/admin/suppliers/:id
 * Update a supplier
 * Body: { name, email, phone }
 */
router.put(
  '/:id',
  checkAdminRole,
  controller.updateSupplier
);

/**
 * DELETE /api/admin/suppliers/:id
 * Soft-delete a supplier
 * Validates that no active supply orders exist
 */
router.delete(
  '/:id',
  checkAdminRole,
  controller.deleteSupplier
);


/**
 * GET /api/admin/suppliers/:id/supply-orders
 * Get supply orders for a specific supplier
 * Query: limit (default 5), page, status
 */
router.get(
  '/:id/supply-orders',
  checkAdminRole,
  controller.getSupplierOrders
);

module.exports = router;