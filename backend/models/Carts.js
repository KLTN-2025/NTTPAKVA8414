const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const CartSchema = new mongoose.Schema(
  {
    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
      unique: true,
      index: true
    },
    items: [CartItemSchema],
    total_amount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  { timestamps: true }
);

CartSchema.methods.calculateTotal = function() {
  this.total_amount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  return this.total_amount;
};

module.exports = mongoose.model('Cart', CartSchema);