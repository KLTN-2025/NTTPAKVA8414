// models/CustomerOrders.js
import mongoose from 'mongoose';

const customerOrderSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
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
    enum: ['COD', 'Card', 'Transfer'],
    default: 'COD',
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

export default mongoose.model('CustomerOrder', customerOrderSchema);
