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
      min: [0, 'Giá mua hàng không được âm']
    },
    selling_price: {
      type: Number,
      required: true,
      min: [0, 'Giá bán không được âm']
    },
    current_stock: {
      type: Number,
      required: true,
      min: [0, 'Lượng hàng tồn kho không được âm']
    },
    image_urls: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

ProductSchema.index({ type_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);