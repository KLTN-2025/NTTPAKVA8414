//models/Customers.js
const mongoose = require('mongoose');
const validator = require('validator');
const { isValidPhoneNumber } = require('libphonenumber-js');

const CustomerSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true  
    },
    username: {
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
      index: true,
      maxlength: 100
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      maxlength: 50,
      validate: {
        validator: (v) => isValidPhoneNumber(v, 'VN') || isValidPhoneNumber(v),
        message: 'Invalid phone number format'
      },
    },
    account_status: {
      type: String,
      enum: ['active', 'inactive', 'locked'],
      default: 'active'
    },
    image_url: {
      type: String,
      trim: true,
      maxlength: 500
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    last_login: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['admin', 'customer'],
      default: 'customer'
    }
  },
  { timestamps: true }
);

CustomerSchema.methods.isActive = function() {
  return this.account_status === 'active';
};
CustomerSchema.statics.findByClerkId = function(clerkId) {
  return this.findOne({ clerkId });
};

module.exports = mongoose.model('Customer', CustomerSchema);
