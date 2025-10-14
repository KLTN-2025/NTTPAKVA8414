const mongoose = require('mongoose');

const ProductTypeSchema = new mongoose.Schema(
  {
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: true
    },
    name: {
      type: String,
      required: true,
      maxlength: 255,
      trim: true
    },
    description: {
      type: String,
      maxlength: 255,
      default: ''
    }
  },
  { timestamps: true }
);


ProductTypeSchema.index({ category_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('ProductType', ProductTypeSchema);
