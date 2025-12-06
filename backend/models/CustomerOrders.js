// models/CustomerOrders.js
// Updated with VNPay integration fields

const mongoose = require('mongoose');
const validator = require('validator');
const { isValidPhoneNumber } = require('libphonenumber-js');

const customerOrderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  },
  order_date: {
    type: Date,
    required: true,
    default: Date.now
  },
  order_status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    required: true
  },
  payment_method: {
    type: String,
    enum: ['cod', 'vnpay'],
    default: 'cod',
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed', 'expired'],
    default: 'pending',
    required: true
  },
  total_amount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  recipient_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  recipient_email: {
    type: String,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, 'Invalid email address'],
    index: true,
    maxlength: 100
  },
  recipient_phone: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
    validate: {
      validator: (v) => isValidPhoneNumber(v, 'VN') || isValidPhoneNumber(v),
      message: 'Invalid phone number format'
    },
  },
  shipping_address: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  shipping_note: {
    type: String,
    trim: true,
    maxlength: 500
  },


  vnpay_txn_ref: {
    type: String,
    sparse: true,
    index: true
  },

  vnpay_transaction_no: {
    type: String,
    sparse: true
  },

  vnpay_bank_code: {
    type: String,
    trim: true
  },

  vnpay_bank_tran_no: {
    type: String,
    trim: true
  },
  
  vnpay_card_type: {
    type: String,
    trim: true
  },

  vnpay_response_code: {
    type: String,
    trim: true
  },
  
  payment_url_created_at: {
    type: Date
  },

  payment_expires_at: {
    type: Date
  },

  payment_completed_at: {
    type: Date
  },

  stock_deducted: {
    type: Boolean,
    default: false
  },

  payment_attempts: {
    type: Number,
    default: 0
  }
  
}, { timestamps: true });


customerOrderSchema.index({ customer_id: 1, order_date: -1 });
customerOrderSchema.index({ customer_id: 1, order_status: 1 });
customerOrderSchema.index({ payment_status: 1, payment_method: 1 });
customerOrderSchema.index({ vnpay_txn_ref: 1 }, { sparse: true });


/**
 * Check if order is awaiting VNPay payment
 */
customerOrderSchema.methods.isAwaitingPayment = function() {
  return (
    this.payment_method === 'vnpay' && 
    this.payment_status === 'pending' &&
    this.order_status === 'pending'
  );
};

/**
 * Check if payment has expired
 */
customerOrderSchema.methods.isPaymentExpired = function() {
  if (!this.payment_expires_at) return false;
  return new Date() > this.payment_expires_at;
};

/**
 * Check if order can be cancelled
 */
customerOrderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.order_status);
};

/**
 * Mark payment as completed
 */
customerOrderSchema.methods.markPaymentCompleted = function(vnpayData) {
  this.payment_status = 'paid';
  this.order_status = 'confirmed';
  this.payment_completed_at = new Date();
  this.vnpay_transaction_no = vnpayData.vnp_TransactionNo;
  this.vnpay_bank_code = vnpayData.vnp_BankCode;
  this.vnpay_bank_tran_no = vnpayData.vnp_BankTranNo;
  this.vnpay_card_type = vnpayData.vnp_CardType;
  this.vnpay_response_code = vnpayData.vnp_ResponseCode;
};

/**
 * Mark payment as failed
 */
customerOrderSchema.methods.markPaymentFailed = function(responseCode) {
  this.payment_status = 'failed';
  this.vnpay_response_code = responseCode;
};

/**
 * Mark payment as expired
 */
customerOrderSchema.methods.markPaymentExpired = function() {
  this.payment_status = 'expired';
  this.order_status = 'cancelled';
};

/**
 * Find order by VNPay transaction reference
 */
customerOrderSchema.statics.findByTxnRef = function(txnRef) {
  return this.findOne({ vnpay_txn_ref: txnRef });
};

/**
 * Find expired pending VNPay orders
 */
customerOrderSchema.statics.findExpiredPendingOrders = function() {
  return this.find({
    payment_method: 'vnpay',
    payment_status: 'pending',
    payment_expires_at: { $lt: new Date() }
  });
};

module.exports = mongoose.model('CustomerOrder', customerOrderSchema);