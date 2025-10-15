const mongoose = require('mongoose');
const validator = require('validator');

const CustomerSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true  
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Invalid email address'],
      index: true
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Customer A'
    }
    phone: {
      type: String,
      required: false,
      trim: true,
      maxlength: 50
    },
    account_status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active'
    },
    image_url: {
      type: String,
      trim: true,
      maxlength: 255
    },
    is_deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

CustomerSchema.index({ clerkId: 1, account_status: 1 });

module.exports = mongoose.model('Customer', CustomerSchema);
