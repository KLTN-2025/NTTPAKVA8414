// routes/admin/dashboard.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboardController');
const { checkAdminRole } = require("../../middleware/checkAdmin");

router.use(checkAdminRole)

/**
 * GET /api/admin/dashboard/all
 * Get all dashboard data in a single request
 * Query params: chartPeriod (7days | 4weeks | 12months)
 */
router.get('/all',
  dashboardController.getAllDashboardData
);

/**
 * GET /api/admin/dashboard/summary
 * Get summary cards data only
 */
router.get('/summary',
  dashboardController.getSummaryCards
);

/**
 * GET /api/admin/dashboard/chart
 * Get sales chart data
 * Query params: period (7days | 4weeks | 12months)
 */
router.get('/chart',
  dashboardController.getSalesChart
);

/**
 * GET /api/admin/dashboard/best-sellers
 * Get best selling products this month
 * Query params: limit (default: 5)
 */
router.get('/best-sellers',
  dashboardController.getBestSellers
);

module.exports = router;