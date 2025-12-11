// routes/admin/inventory.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../../controllers/inventoryManagement');
const { checkAdminRole } = require("../../middleware/checkAdmin");

router.use(checkAdminRole)

/**
 * GET /api/admin/inventory
 * Get inventory list with search, filter, sort and pagination
 */
router.get('/', inventoryController.getInventoryList);

/**
 * GET /api/admin/inventory/summary
 * Get inventory summary statistics
 */
router.get('/summary', inventoryController.getInventorySummary);

module.exports = router;