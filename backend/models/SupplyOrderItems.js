const mongoose = require('mongoose');

const SupplyOrderItemSchema = new mongoose.Schema(
  {
    so_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SupplyOrders',
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
      min: [0, 'Quantity ordered cannot be negative']
    },
    quantity_received: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity received cannot be negative']
    },
    unit_cost: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      min: [0, 'Unit cost cannot be negative']
    }
  },
  { timestamps: true }
);

// Prevent duplicate product entries in the same supply order
SupplyOrderItemsSchema.index({ so_id: 1, product_id: 1 }, { unique: true });

module.exports = mongoose.model('SupplyOrderItem', SupplyOrderItemSchema);
