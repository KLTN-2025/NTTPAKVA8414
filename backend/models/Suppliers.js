// models/Suppliers.js
const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    is_deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Index for filtering and searching
SupplierSchema.index({ name: 'text', email: 'text' });
SupplierSchema.index({ is_deleted: 1 });

module.exports = mongoose.model('Supplier', SupplierSchema);