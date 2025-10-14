const mongoose = require('mongoose');

const ProductAttributesSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    attribute_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attribute',
      required: true
    }
  },
  { timestamps: true }
);

ProductAttributesSchema.index(
  { product_id: 1, attribute_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProductAttribute', ProductAttributesSchema);
