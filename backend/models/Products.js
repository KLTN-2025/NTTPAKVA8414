//models/Products.js
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
      doc.slug = slugify(`${doc.name}`, {
        remove: /[*+~.()'"!:@]/g,
        lower: true
      });
    })
    next();
  } catch (err){
    console.error(err);
  }
})

ProductSchema.pre('save', async function(next) {
  const doc = this;

  if (!doc.isModified('name')) return next();

  let baseSlug = slugify(doc.name, { 
    remove: /[*+~.()'"!:@]/g, 
    lower: true });
  let slug = baseSlug;
  let count = 1;

  while (await mongoose.models.Product.exists({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  doc.slug = slug;
  next();
});


ProductSchema.index({ type_id: 1, name: 1 }, { unique: true });
ProductSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Product', ProductSchema);