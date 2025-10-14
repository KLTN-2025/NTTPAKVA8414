// models/Transactions.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['inflow', 'outflow'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
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
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('Transaction', transactionSchema);
