const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductType',
      required: true
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    description: {
      type: String,
      required: true
    },
    size: {
      type: mongoose.Schema.Types.Decimal128,
      default: null
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    cost_price: {
      type: Number,
      required: true,
      min: [0, 'Price can\'t be negative']
    },
    selling_price: {
      type: Number,
      required: true,
      min: [0, 'Price can\'t be negative']
    },
    current_stock: {
      type: Number,
      required: true,
      min: [0, 'Stock can\'t be negative']
    },
    image_urls: {
      type: [String],
      default: []
    },
    attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' }],
  },
  { timestamps: true }
);

ProductSchema.index({ type_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);