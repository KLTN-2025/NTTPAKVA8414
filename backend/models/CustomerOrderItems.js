// models/CustomerOrderItems.js
import mongoose from 'mongoose';

const customerOrderItemSchema = new mongoose.Schema({
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerOrder',
    required: true
  },
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Ensure each product appears only once per order
customerOrderItemSchema.index({ order_id: 1, product_id: 1 }, { unique: true });

export default mongoose.model('CustomerOrderItem', customerOrderItemSchema);
