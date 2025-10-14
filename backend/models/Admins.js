const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate: [validator.isEmail, 'Invalid email address']
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["owner", "manager", "staff"],
      default: "owner",
    },
    account_status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    image_url: { type: String, trim: true, maxlength: 255 },
  },
  { timestamps: true }
);


adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model('Admin', adminSchema);
