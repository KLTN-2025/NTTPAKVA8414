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
      required: true,
      trim: true,
      maxlength: 100,
    },
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
    },
    last_login: {
      type: Date,
      default: Date.now
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
