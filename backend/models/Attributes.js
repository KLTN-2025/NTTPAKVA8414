//models/Attributes.js
const mongoose = require('mongoose');
const slugify = require('slugify');

const AttributeSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50
    },
    slug: {
      type: String,
    }
  },
  { timestamps: true }
);

AttributeSchema.pre('insertMany', async (next, docs) => {
  try {
    docs.forEach(doc => {
      doc.slug = slugify(`${doc.description}`, {
        remove: /[*+~.()'"!:@]/g,
        lower: true
      });
    })
    next();
  } catch (err){
    console.error(err);
  }
})
module.exports = mongoose.model('Attribute', AttributeSchema);
