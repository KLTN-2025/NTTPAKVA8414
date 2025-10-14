const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const CustomerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Invalid email address']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    password: {
      type: String,
      required: true,
      minlength: 6
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
    }
  },
  { timestamps: true }
);

// Hash password
CustomerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next(); 
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Helper method to compare passwords
CustomerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Customer', CustomerSchema);
