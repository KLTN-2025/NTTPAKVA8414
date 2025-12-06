// models/SupplyOrders.js
const mongoose = require('mongoose');

const SupplyOrderSchema = new mongoose.Schema(
  {
    supplier_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    status: {
      type: String,
      enum: ['Draft', 'Ordered', 'Received', 'Cancelled'],
      default: 'Draft',
      required: true
    },
    expected_arrival: {
      type: Date,
      required: true
    },
    total_cost_ordered: {
      type: Number,
      default: 0,
      min: [0, 'Total cost ordered cannot be negative']
    },
    total_cost_received: {
      type: Number,
      default: null,
      min: [0, 'Total cost received cannot be negative']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: ''
    },
    ordered_at: {
      type: Date,
      default: null
    },
    received_at: {
      type: Date,
      default: null
    },
    cancelled_at: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

SupplyOrderSchema.index({ supplier_id: 1, status: 1 });
SupplyOrderSchema.index({ supplier_id: 1, createdAt: -1 });
SupplyOrderSchema.index({ status: 1 });

module.exports = mongoose.model('SupplyOrder', SupplyOrderSchema);