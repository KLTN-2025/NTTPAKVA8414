// models/CustomerOrders.js
const mongoose = require('mongoose')

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
  shipping_address: {
    type: String,
    required: true,
    trim: true
  },
  shipping_note: {
    type: String,
    trim: true
  }
}, { timestamps: true });

customerOrderSchema.index({ customer_id: 1, order_date: -1 });

module.exports = mongoose.model('CustomerOrder', customerOrderSchema);