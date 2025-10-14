const mongoose = require('mongoose');

const ProductCategorySchema = new mongoose.Schema(
  {
    category_name: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
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

module.exports = mongoose.model('ProductCategory', ProductCategorySchema);
