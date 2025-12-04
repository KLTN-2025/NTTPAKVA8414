// models/Transactions.js
const mongoose = require('mongoose');

// Category definitions with type mapping
const INFLOW_CATEGORIES = ['customer_payment', 'other_income'];
const OUTFLOW_CATEGORIES = [
  'refund',
  'supplier_payment', 
  'shipping_cost',
  'packaging',
  'utilities',
  'rent',
  'other_expense'
];

const AUTO_ONLY_CATEGORIES = ['customer_payment', 'refund', 'supplier_payment'];
const MANUAL_ONLY_CATEGORIES = [
  'other_income',
  'shipping_cost',
  'packaging',
  'utilities',
  'rent',
  'other_expense'
];

const ALL_CATEGORIES = [...INFLOW_CATEGORIES, ...OUTFLOW_CATEGORIES];

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['inflow', 'outflow'],
    required: true
  },
  category: {
    type: String,
    enum: ALL_CATEGORIES,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  method: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'other'],
    default: 'other'
  },
  ref_type: {
    type: String,
    enum: ['CustomerOrder', 'SupplyOrder', 'None'],
    default: 'None'
  },
  ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null 
  },
  is_auto_generated: {
    type: Boolean,
    default: false
  },
  is_deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deleted_at: {
    type: Date,
    default: null
  },
  deleted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  }
}, { timestamps: true });

transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1, date: -1 });
transactionSchema.index({ ref_type: 1, ref_id: 1 }); 
transactionSchema.index({ is_deleted: 1, date: -1 });
transactionSchema.index({ category: 1, date: -1 });

transactionSchema.statics.validateCategoryType = function(category, type) {
  if (type === 'inflow' && !INFLOW_CATEGORIES.includes(category)) {
    return { valid: false, message: `Category '${category}' is not valid for inflow transactions` };
  }
  if (type === 'outflow' && !OUTFLOW_CATEGORIES.includes(category)) {
    return { valid: false, message: `Category '${category}' is not valid for outflow transactions` };
  }
  return { valid: true };
};

transactionSchema.statics.isAutoOnlyCategory = function(category) {
  return AUTO_ONLY_CATEGORIES.includes(category);
};

transactionSchema.statics.isManualOnlyCategory = function(category) {
  return MANUAL_ONLY_CATEGORIES.includes(category);
};

transactionSchema.statics.getCategoryDisplayName = function(category) {
  const displayNames = {
    'customer_payment': 'Customer Payment',
    'other_income': 'Other Income',
    'refund': 'Refund',
    'supplier_payment': 'Supplier Payment',
    'shipping_cost': 'Shipping Cost',
    'packaging': 'Packaging',
    'utilities': 'Utilities',
    'rent': 'Rent',
    'other_expense': 'Other Expense'
  };
  return displayNames[category] || category;
};

// Export constants for use in other files
module.exports = mongoose.model('Transaction', transactionSchema);
module.exports.INFLOW_CATEGORIES = INFLOW_CATEGORIES;
module.exports.OUTFLOW_CATEGORIES = OUTFLOW_CATEGORIES;
module.exports.AUTO_ONLY_CATEGORIES = AUTO_ONLY_CATEGORIES;
module.exports.MANUAL_ONLY_CATEGORIES = MANUAL_ONLY_CATEGORIES;
module.exports.ALL_CATEGORIES = ALL_CATEGORIES;