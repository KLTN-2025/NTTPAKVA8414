import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customers",
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
    default: null 
  },
}, { timestamps: true }
);


reviewSchema.index({ product_id: 1, customer_id: 1 }, { unique: true });
export default mongoose.model("Review", reviewSchema);
