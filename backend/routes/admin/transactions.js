// routes/admin/transactions.js
const express = require('express');
const router = express.Router();
const transactionController = require('../../controllers/transactionController');
const { checkAdminRole } = require("../../middleware/checkAdmin");


/**
 * GET /api/admin/transactions/summary
 * Get summary cards and chart data
 * Query: chartPeriod (today, week, month, year)
 */
router.get('/summary', 
  /*checkAdminRole*/
  transactionController.getSummaryAndChart
);

router.post('/summary/refresh', 
  /*checkAdminRole*/
  transactionController.refreshSummary
);

/**
 * GET /api/admin/transactions/categories
 * Get available categories for manual transaction
 * Query: type (inflow, outflow, or empty for all)
 */
router.get('/categories',
  /*checkAdminRole*/
  transactionController.getManualCategories
);

/**
 * GET /api/admin/transactions/methods
 * Get available payment methods
 */
router.get('/methods',
  /*checkAdminRole*/
  transactionController.getPaymentMethods
);

/**
 * GET /api/admin/transactions/preview/order/:id
 * Get customer order preview for modal
 */
router.get('/preview/order/:id',
  /*checkAdminRole*/
  transactionController.getOrderPreview
);

/**
 * GET /api/admin/transactions/preview/supply-order/:id
 * Get supply order preview for modal
 */
router.get('/preview/supply-order/:id',
  /*checkAdminRole*/
  transactionController.getSupplyOrderPreview
);

/**
 * GET /api/admin/transactions
 * Get paginated list of transactions
 * Query: page, limit, type, dateFrom, dateTo
 */
router.get('/',
  /*checkAdminRole*/
  transactionController.getTransactions
);

/**
 * POST /api/admin/transactions
 * Create a manual transaction
 * Body: { date, type, category, amount, method, description }
 */
router.post('/',
  /*checkAdminRole*/
  transactionController.createTransaction
);

/**
 * DELETE /api/admin/transactions/:id
 * Soft delete a transaction (manual only)
 */
router.delete('/:id',
  /*checkAdminRole*/
  transactionController.deleteTransaction
);

module.exports = router;