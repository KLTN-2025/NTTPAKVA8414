// models/Suppliers.js
const mongoose = require('mongoose');
const validator = require('validator');
const { isValidPhoneNumber } = require('libphonenumber-js');

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
      validate: [validator.isEmail, 'Invalid email address'],
      maxlength: 100
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
      validate: {
        validator: (v) => isValidPhoneNumber(v, 'VN') || isValidPhoneNumber(v),
        message: 'Invalid phone number format'
      },
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