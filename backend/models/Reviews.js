const { mongoose } = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    default: null,
    maxlength: 500
  },
}, { timestamps: true }
);


reviewSchema.index({ product_id: 1, customer_id: 1 }, { unique: true });
module.exports =  mongoose.model("Review", reviewSchema);
