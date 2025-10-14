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
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupplyOrder', SupplyOrderSchema);
