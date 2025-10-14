const mongoose = require('mongoose');

const AttributeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attribute', AttributeSchema);
