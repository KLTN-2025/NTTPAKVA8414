// controllers/transactionController.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transactions');
const CustomerOrder = require('../models/CustomerOrders');
const CustomerOrderItem = require('../models/CustomerOrderItems');
const SupplyOrder = require('../models/SupplyOrders');
const Supplier = require('../models/Suppliers');
const Customer = require('../models/Customers');

const transactionService = require('../services/transactionService');
const transactionSummaryService = require('../services/transactionSummaryService');

/**
 * GET /api/admin/transactions
 * Get paginated list of transactions with optional filters
 * Query params: page, limit, type, dateFrom, dateTo
 */
exports.getTransactions = async (req, res) => {
  try {
    const { type, dateFrom, dateTo } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const filters = {};
    
    if (type) {
      filters.type = type;
    }
    if (dateFrom) {
      filters.dateFrom = dateFrom;
    }
    if (dateTo) {
      filters.dateTo = dateTo;
    }

    const result = await transactionService.getTransactions(filters, page, limit);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    // Format transactions for frontend
    const formattedData = result.data.map(tx => ({
      _id: tx._id,
      date: tx.date,
      type: tx.type,
      category: tx.category,
      categoryDisplay: Transaction.getCategoryDisplayName(tx.category),
      amount: tx.amount,
      method: tx.method,
      description: tx.description,
      ref_type: tx.ref_type,
      ref_id: tx.ref_id,
      reference: transactionService.formatReferenceId(tx.ref_type, tx.ref_id),
      is_auto_generated: tx.is_auto_generated,
      createdAt: tx.createdAt
    }));

    return res.status(200).json({
      success: true,
      data: formattedData,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/transactions/summary
 * Get summary cards data and chart data
 * Query params: chartPeriod (today, week, month, year)
 */
exports.getSummaryAndChart = async (req, res) => {
  try {
    const chartPeriod = req.query.chartPeriod || 'today';
    
    // Validate period
    const validPeriods = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(chartPeriod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chart period. Must be today, week, month, or year'
      });
    }

    const result = await transactionSummaryService.getSummaryWithChart(chartPeriod);

    return res.status(200).json({
      success: true,
      summary: result.summary,
      chart: result.chart,
      lastUpdated: result.lastUpdated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * POST /api/admin/transactions/summary/refresh
 * Force refresh summary data - invalidates cache and recalculates
 * Query params: chartPeriod (today, week, month, year)
 */
exports.refreshSummary = async (req, res) => {
  try {
    const chartPeriod = req.query.chartPeriod || 'today';
    
    // Validate period
    const validPeriods = ['today', 'week', 'month', 'year'];
    if (!validPeriods.includes(chartPeriod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid chart period. Must be today, week, month, or year'
      });
    }

    const result = await transactionSummaryService.forceRefresh(chartPeriod);

    return res.status(200).json({
      success: true,
      message: 'Summary data refreshed successfully',
      summary: result.summary,
      chart: result.chart,
      lastUpdated: result.lastUpdated
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * POST /api/admin/transactions
 * Create a manual transaction
 * Body: { date, type, category, amount, method, description }
 */
exports.createTransaction = async (req, res) => {
  try {
    const { date, type, category, amount, method, description } = req.body;

    // Get admin ID from auth (assuming Clerk auth)
    let adminId = null;
    if (req.userId) {
      const admin = await Customer.findOne({ clerkId: req.userId }).select('_id').lean();
      if (admin) {
        adminId = admin._id;
      }
    }

    const result = await transactionService.createManualTransaction(
      { date, type, category, amount, method, description },
      adminId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction: {
        _id: result.transaction._id,
        date: result.transaction.date,
        type: result.transaction.type,
        category: result.transaction.category,
        amount: result.transaction.amount
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * DELETE /api/admin/transactions/:id
 * Soft delete a transaction (manual only)
 */
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    // Get admin ID from auth
    let adminId = null;
    if (req.userId) {
      const admin = await Customer.findOne({ clerkId: req.userId }).select('_id').lean();
      if (admin) {
        adminId = admin._id;
      }
    }

    const result = await transactionService.softDeleteTransaction(id, adminId);

    if (!result.success) {
      const statusCode = result.error.includes('not found') ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        message: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/transactions/preview/order/:id
 * Get customer order preview for modal display
 */
exports.getOrderPreview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID format'
      });
    }

    const order = await CustomerOrder.findById(id)
      .select('recipient_name order_date order_status payment_status total_amount')
      .lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Get item count
    const itemCount = await CustomerOrderItem.countDocuments({ order_id: id });

    return res.status(200).json({
      success: true,
      data: {
        _id: order._id,
        orderId: `ORD-${order._id.toString().slice(-4).toUpperCase()}`,
        recipient_name: order.recipient_name,
        order_date: order.order_date,
        order_status: order.order_status,
        payment_status: order.payment_status,
        total_amount: order.total_amount,
        item_count: itemCount
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/transactions/preview/supply-order/:id
 * Get supply order preview for modal display
 */
exports.getSupplyOrderPreview = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supply order ID format'
      });
    }

    const supplyOrder = await SupplyOrder.findById(id)
      .populate('supplier_id', 'name')
      .select('supplier_id status expected_arrival received_at total_cost_received total_cost_ordered')
      .lean();

    if (!supplyOrder) {
      return res.status(404).json({
        success: false,
        message: 'Supply order not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: supplyOrder._id,
        poNumber: `PO-${supplyOrder._id.toString().slice(-4).toUpperCase()}`,
        supplier_name: supplyOrder.supplier_id?.name || 'Unknown Supplier',
        status: supplyOrder.status,
        expected_arrival: supplyOrder.expected_arrival,
        received_at: supplyOrder.received_at,
        total_cost: supplyOrder.total_cost_received ?? supplyOrder.total_cost_ordered
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/transactions/categories
 * Get available categories for manual transaction creation
 */
exports.getManualCategories = async (req, res) => {
  try {
    const { type } = req.query;

    let categories = [];

    if (type === 'inflow') {
      // Only return manual inflow categories
      categories = [
        { value: 'other_income', label: 'Other Income' }
      ];
    } else if (type === 'outflow') {
      // Return all manual outflow categories
      categories = [
        { value: 'shipping_cost', label: 'Shipping Cost' },
        { value: 'packaging', label: 'Packaging' },
        { value: 'utilities', label: 'Utilities' },
        { value: 'rent', label: 'Rent' },
        { value: 'other_expense', label: 'Other Expense' }
      ];
    } else {
      // Return all manual categories grouped by type
      categories = {
        inflow: [
          { value: 'other_income', label: 'Other Income' }
        ],
        outflow: [
          { value: 'shipping_cost', label: 'Shipping Cost' },
          { value: 'packaging', label: 'Packaging' },
          { value: 'utilities', label: 'Utilities' },
          { value: 'rent', label: 'Rent' },
          { value: 'other_expense', label: 'Other Expense' }
        ]
      };
    }

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * GET /api/admin/transactions/methods
 * Get available payment methods
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const methods = [
      { value: 'cash', label: 'Cash' },
      { value: 'credit_card', label: 'Credit Card' },
      { value: 'bank_transfer', label: 'Bank Transfer' },
      { value: 'other', label: 'Other' }
    ];

    return res.status(200).json({
      success: true,
      data: methods
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};