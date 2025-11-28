// models/SupplyOrderItems.js
const mongoose = require('mongoose');

const SupplyOrderItemSchema = new mongoose.Schema(
  {
    so_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplyOrder',
      required: true
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity_ordered: {
      type: Number,
      required: true,
      min: [1, 'Quantity ordered must be at least 1']
    },
    quantity_received: {
      type: Number,
      default: 0,
      min: [0, 'Quantity received cannot be negative']
    },
    unit_cost: {
      type: Number,
      required: true,
      min: [0, 'Unit cost cannot be negative']
    }
  },
  { timestamps: true }
);

SupplyOrderItemSchema.index({ so_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('SupplyOrderItem', SupplyOrderItemSchema);