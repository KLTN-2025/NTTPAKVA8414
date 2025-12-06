// routes/admin/transactions.js
const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transactionController');
const { checkAdminRole } = require("../../middleware/checkAdmin");

router.use(checkAdminRole)

/**
 * GET /api/admin/transactions/summary
 * Get summary cards and chart data
 * Query: chartPeriod (today, week, month, year)
 */
router.get('/summary', 
  transactionController.getSummaryAndChart
);

router.post('/summary/refresh', 
  transactionController.refreshSummary
);

/**
 * GET /api/admin/transactions/categories
 * Get available categories for manual transaction
 * Query: type (inflow, outflow, or empty for all)
 */
router.get('/categories',
  transactionController.getManualCategories
);

/**
 * GET /api/admin/transactions/methods
 * Get available payment methods
 */
router.get('/methods',
  transactionController.getPaymentMethods
);

/**
 * GET /api/admin/transactions/preview/order/:id
 * Get customer order preview for modal
 */
router.get('/preview/order/:id',
  transactionController.getOrderPreview
);

/**
 * GET /api/admin/transactions/preview/supply-order/:id
 * Get supply order preview for modal
 */
router.get('/preview/supply-order/:id',
  transactionController.getSupplyOrderPreview
);

/**
 * GET /api/admin/transactions
 * Get paginated list of transactions
 * Query: page, limit, type, dateFrom, dateTo
 */
router.get('/',
  transactionController.getTransactions
);

/**
 * POST /api/admin/transactions
 * Create a manual transaction
 * Body: { date, type, category, amount, method, description }
 */
router.post('/',
  transactionController.createTransaction
);

/**
 * DELETE /api/admin/transactions/:id
 * Soft delete a transaction (manual only)
 */
router.delete('/:id',
  transactionController.deleteTransaction
);

module.exports = router;