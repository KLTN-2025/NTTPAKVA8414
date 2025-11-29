// models/CustomerOrders.js
const mongoose = require('mongoose')
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
    enum: ['cod', 'transfer'],
    default: 'cod',
    required: true
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
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
  }
}, { timestamps: true });

customerOrderSchema.index({ customer_id: 1, order_date: -1 });
customerOrderSchema.index({ customer_id: 1, order_status: 1 });

module.exports = mongoose.model('CustomerOrder', customerOrderSchema);