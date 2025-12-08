// models/CustomerInquiries.js
const mongoose = require('mongoose');
const validator = require('validator');
const { isValidPhoneNumber } = require('libphonenumber-js');

const customerInquirySchema = new mongoose.Schema({
  sender_name: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true,
    maxlength: 50
  },
  sender_phone: {
    type: String,
    required: [true, 'Sender phone is required'],
    trim: true,
    maxlength: 50,
    validate: {
      validator: (v) => isValidPhoneNumber(v, 'VN') || isValidPhoneNumber(v),
      message: 'Invalid phone number format'
    }
  },
  sender_email: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || validator.isEmail(v);
      },
      message: 'Invalid email address'
    },
    maxlength: 100
  },
  problem_type: {
    type: String,
    required: [true, 'Problem type is required'],
    enum: {
      values: [
        'Orders',
        'Products',
        'Shipping & Delivery',
        'Payment',
        'Website Bug',
        'Feedback & Suggestion',
        'Other'
      ],
      message: 'Invalid problem type'
    }
  },
  details: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Unresolved', 'Resolving', 'Resolved'],
    default: 'Unresolved',
    required: true
  },
  admin_notes: {
    type: String,
    trim: true,
    maxlength: 500,
    default: ''
  },
  resolved_at: {
    type: Date,
    default: null
  },
  resolved_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    default: null
  }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
customerInquirySchema.index({ status: 1, createdAt: -1 });
customerInquirySchema.index({ problem_type: 1 });
customerInquirySchema.index({ sender_name: 'text' });
customerInquirySchema.index({ createdAt: -1 });

// Virtual for formatted date
customerInquirySchema.virtual('formatted_date').get(function() {
  return this.createdAt.toLocaleDateString('vi-VN');
});

// Method to mark as resolving
customerInquirySchema.methods.markAsResolving = function() {
  this.status = 'Resolving';
  return this.save();
};

// Method to mark as resolved
customerInquirySchema.methods.markAsResolved = function(adminId) {
  this.status = 'Resolved';
  this.resolved_at = new Date();
  this.resolved_by = adminId;
  return this.save();
};

// Static method to get status counts
customerInquirySchema.statics.getStatusCounts = async function() {
  const counts = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    Unresolved: 0,
    Resolving: 0,
    Resolved: 0,
    total: 0
  };
  
  counts.forEach(item => {
    result[item._id] = item.count;
    result.total += item.count;
  });
  
  return result;
};

module.exports = mongoose.model('CustomerInquiry', customerInquirySchema);