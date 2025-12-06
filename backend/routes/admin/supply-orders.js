// routes/admin/supplyOrders.js
const express = require('express');
const router = express.Router();
const controller = require('../../controllers/supplyManagement');
const { checkAdminRole } = require("../../middleware/checkAdmin");

/**
 * GET /api/admin/supply-orders
 * Get all supply orders with optional filtering
 * Query: status, supplierId, dateBegin, dateEnd, page, limit
 */
router.get(
  '/',
  checkAdminRole,
  controller.getAllSupplyOrders
);

/**
 * GET /api/admin/supply-orders/:id
 * Get a single supply order with its items
 */
router.get(
  '/:id',
  checkAdminRole,
  controller.getSupplyOrder
);

/**
 * POST /api/admin/supply-orders
 * Create a new supply order with items
 * Body: {
 *   supplier_id,
 *   expected_arrival,
 *   notes,
 *   items: [{ product_id, quantity_ordered, unit_cost }]
 * }
 */
router.post(
  '/',
  checkAdminRole,
  controller.createSupplyOrder
);

/**
 * PUT /api/admin/supply-orders/:id
 * Update a supply order
 * Body: {
 *   expected_arrival,
 *   notes,
 *   items: [{ product_id, quantity_ordered, unit_cost }] // Only if Draft
 * }
 */
router.put(
  '/:id',
  checkAdminRole,
  controller.updateSupplyOrder
);

/**
 * PATCH /api/admin/supply-orders/:id/status
 * Update supply order status
 * Body: {
 *   status: 'Ordered' | 'Received' | 'Cancelled',
 *   receivedItems: [{ product_id, quantity_received }] // Required for 'Received'
 * }
 */
router.patch(
  '/:id/status',
  checkAdminRole,
  controller.updateSupplyOrderStatus
);

module.exports = router;