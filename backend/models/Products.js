const mongoose = require('mongoose');
const slugify = require('slugify');

const ProductSchema = new mongoose.Schema(
  {
    type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductType',
      required: true
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100
    },
    slug: {
      type: String,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    size: {
      type: mongoose.Schema.Types.Decimal128,
      default: null
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 50,
      default: ''
    },
    cost_price: {
      type: Number,
      required: true,
      min: 0
    },
    selling_price: {
      type: Number,
      required: true,
      min: 0
    },
    current_stock: {
      type: Number,
      required: true,
      min: 0
    },
    image_urls: {
      type: [String],
      default: []
    },
    attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attribute' }],
  },
  { timestamps: true }
);

//Slugify
ProductSchema.pre('insertMany', async (next, docs) => {
  try {
    docs.forEach(doc => {
      doc.slug = slugify(`${doc.name} ${doc._id}`, {
        remove: /[*+~.()'"!:@]/g,
        lower: true
      });
    })
    next();
  } catch (err){
    console.error(err);
  }
})

ProductSchema.pre('save', async (next, doc) => {
  try {
      doc.slug = slugify(`${doc.name} ${doc._id}`, {
      remove: /[*+~.()'"!:@]/g,
      lower: true
    });
    next();
  } catch (err){
    console.error(err);
  }
})

ProductSchema.index({ type_id: 1, name: 1 }, { unique: true });
ProductSchema.index({ slug: 1 })

module.exports = mongoose.model('Product', ProductSchema);