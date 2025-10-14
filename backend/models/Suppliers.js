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
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', SupplierSchema);