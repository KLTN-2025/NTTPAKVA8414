// services/transactionService.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transactions');
const { redis } = require('../config/redis');

const VN_TIMEZONE_OFFSET = 7 * 60 * 60 * 1000;

function getVietnamDate() {
  const now = new Date();
  return new Date(now.getTime() + VN_TIMEZONE_OFFSET);
}


async function invalidateSummaryCache() {
  try {
    const keys = await redis.keys('transaction:summary:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('Failed to invalidate transaction cache:', err);
  }
}


async function createCustomerPaymentTransaction(order, paymentMethod = 'other') {
  try {
    const existingTransaction = await Transaction.findOne({
      ref_type: 'CustomerOrder',
      ref_id: order._id,
      category: 'customer_payment',
      is_deleted: false
    });

    if (existingTransaction) {
      return { success: true, transaction: existingTransaction, duplicate: true };
    }

    const methodMap = {
      'cod': 'cash',
      'transfer': 'bank_transfer'
    };
    const method = methodMap[paymentMethod] || 'other';

    const transaction = await Transaction.create({
      date: new Date(),
      type: 'inflow',
      category: 'customer_payment',
      amount: order.total_amount,
      method: method,
      ref_type: 'CustomerOrder',
      ref_id: order._id,
      description: `Payment for Order #${order._id.toString().slice(-6).toUpperCase()}`,
      is_auto_generated: true,
      created_by: null
    });

    await invalidateSummaryCache();

    return { success: true, transaction, duplicate: false };
  } catch (err) {
    console.error('Failed to create customer payment transaction:', err);
    return { success: false, error: err.message };
  }
}

async function createRefundTransaction(order) {
  try {
    const existingTransaction = await Transaction.findOne({
      ref_type: 'CustomerOrder',
      ref_id: order._id,
      category: 'refund',
      is_deleted: false
    });

    if (existingTransaction) {
      return { success: true, transaction: existingTransaction, duplicate: true };
    }

    const transaction = await Transaction.create({
      date: new Date(),
      type: 'outflow',
      category: 'refund',
      amount: order.total_amount,
      method: 'bank_transfer', 
      ref_type: 'CustomerOrder',
      ref_id: order._id,
      description: `Refund for Order #${order._id.toString().slice(-6).toUpperCase()}`,
      is_auto_generated: true,
      created_by: null
    });

    await invalidateSummaryCache();

    return { success: true, transaction, duplicate: false };
  } catch (err) {
    console.error('Failed to create refund transaction:', err);
    return { success: false, error: err.message };
  }
}

async function createSupplierPaymentTransaction(supplyOrder) {
  try {
    const existingTransaction = await Transaction.findOne({
      ref_type: 'SupplyOrder',
      ref_id: supplyOrder._id,
      category: 'supplier_payment',
      is_deleted: false
    });

    if (existingTransaction) {
      return { success: true, transaction: existingTransaction, duplicate: true };
    }

    const amount = supplyOrder.total_cost_received ?? supplyOrder.total_cost_ordered ?? 0;

    if (amount <= 0) {
      return { success: true, transaction: null, skipped: true };
    }

    const transaction = await Transaction.create({
      date: new Date(),
      type: 'outflow',
      category: 'supplier_payment',
      amount: amount,
      method: 'bank_transfer',
      ref_type: 'SupplyOrder',
      ref_id: supplyOrder._id,
      description: `Payment for PO #${supplyOrder._id.toString().slice(-6).toUpperCase()}`,
      is_auto_generated: true,
      created_by: null
    });

    await invalidateSummaryCache();

    return { success: true, transaction, duplicate: false };
  } catch (err) {
    console.error('Failed to create supplier payment transaction:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Create a manual transaction
 * 
 * @param {Object} data - Transaction data
 * @param {String} data.date - Transaction date
 * @param {String} data.type - 'inflow' or 'outflow'
 * @param {String} data.category - Category (must be manual-only)
 * @param {Number} data.amount - Transaction amount
 * @param {String} data.method - Payment method
 * @param {String} data.description - Optional description
 * @param {ObjectId} adminId - ID of the admin creating the transaction
 * @returns {Object} Created transaction or error
 */
async function createManualTransaction(data, adminId) {
  try {
    const { date, type, category, amount, method, description } = data;

    if (!date || !type || !category || amount === undefined || !method) {
      return { success: false, error: 'Missing required fields' };
    }

    if (!['inflow', 'outflow'].includes(type)) {
      return { success: false, error: 'Type must be inflow or outflow' };
    }

    const validMethods = ['cash', 'credit_card', 'bank_transfer', 'other'];
    if (!validMethods.includes(method)) {
      return { success: false, error: 'Invalid payment method' };
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return { success: false, error: 'Amount must be a positive number' };
    }

    if (Transaction.isAutoOnlyCategory(category)) {
      return { 
        success: false, 
        error: `Category '${category}' can only be created automatically by the system` 
      };
    }

    const categoryValidation = Transaction.validateCategoryType(category, type);
    if (!categoryValidation.valid) {
      return { success: false, error: categoryValidation.message };
    }

    const transactionDate = new Date(date);
    if (isNaN(transactionDate.getTime())) {
      return { success: false, error: 'Invalid date format' };
    }

    const transaction = await Transaction.create({
      date: transactionDate,
      type,
      category,
      amount,
      method,
      ref_type: 'None',
      ref_id: null,
      description: description?.trim() || '',
      is_auto_generated: false,
      created_by: adminId || null
    });

    await invalidateSummaryCache();

    return { success: true, transaction };
  } catch (err) {
    console.error('Failed to create manual transaction:', err);
    
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return { success: false, error: messages.join(', ') };
    }
    
    return { success: false, error: err.message };
  }
}

/**
 * Soft delete a transaction (manual only)
 * 
 * @param {String} transactionId - ID of the transaction to delete
 * @param {ObjectId} adminId - ID of the admin performing the deletion
 * @returns {Object} Result of the operation
 */
async function softDeleteTransaction(transactionId, adminId) {
  try {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      return { success: false, error: 'Invalid transaction ID format' };
    }

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return { success: false, error: 'Transaction not found' };
    }

    if (transaction.is_deleted) {
      return { success: false, error: 'Transaction is already deleted' };
    }

    if (transaction.is_auto_generated) {
      return { 
        success: false, 
        error: 'Auto-generated transactions cannot be deleted. They are linked to orders.' 
      };
    }

    transaction.is_deleted = true;
    transaction.deleted_at = new Date();
    transaction.deleted_by = adminId || null;
    await transaction.save();

    await invalidateSummaryCache();

    return { success: true, transaction };
  } catch (err) {
    console.error('Failed to delete transaction:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get paginated transactions with filters
 * 
 * @param {Object} filters - Query filters
 * @param {String} filters.type - Filter by type
 * @param {Date} filters.dateFrom - Start date
 * @param {Date} filters.dateTo - End date
 * @param {Number} page - Page number
 * @param {Number} limit - Items per page
 * @returns {Object} Transactions and pagination info
 */
async function getTransactions(filters = {}, page = 1, limit = 10) {
  try {
    const query = { is_deleted: false };

    if (filters.type && ['inflow', 'outflow'].includes(filters.type)) {
      query.type = filters.type;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.date = {};
      if (filters.dateFrom) {
        query.date.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        query.date.$lte = endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [transactions, totalItems] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Transaction.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      success: true,
      data: transactions,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  } catch (err) {
    console.error('Failed to get transactions:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Format reference ID for display
 * 
 * @param {String} refType - Reference type
 * @param {ObjectId} refId - Reference ID
 * @returns {String} Formatted reference string
 */
function formatReferenceId(refType, refId) {
  if (!refId || refType === 'None') {
    return null;
  }
  
  const suffix = refId.toString().slice(-6).toUpperCase();
  
  if (refType === 'CustomerOrder') {
    return `ORD-${suffix}`;
  }
  if (refType === 'SupplyOrder') {
    return `PO-${suffix}`;
  }
  return null;
}

module.exports = {
  createCustomerPaymentTransaction,
  createRefundTransaction,
  createSupplierPaymentTransaction,
  createManualTransaction,
  softDeleteTransaction,
  getTransactions,
  formatReferenceId,
  invalidateSummaryCache
};