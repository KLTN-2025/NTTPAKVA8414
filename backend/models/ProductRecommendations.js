const mongoose = require('mongoose');

const productRecommendationSchema = new mongoose.Schema({
  source_product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  target_product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  score: {
    type: Number,
    required: true,
    min: 0
  },
  last_calculated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
productRecommendationSchema.index({ 
  source_product_id: 1, 
  score: -1 
});

// Unique constraint to prevent duplicate pairs
productRecommendationSchema.index(
  { source_product_id: 1, target_product_id: 1 },
  { unique: true }
);

module.exports = mongoose.model('ProductRecommendation', productRecommendationSchema);

