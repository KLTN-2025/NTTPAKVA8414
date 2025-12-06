//models/Products.js
const mongoose = require("mongoose");
const slugify = require("slugify");

const ProductSchema = new mongoose.Schema(
  {
    type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductType",
      required: true,
    },
    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      default: null,
    },
    SKU: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 100,
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
      required: true,
    },
    size: {
      type: mongoose.Schema.Types.Decimal128,
      default: null,
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },
    cost_price: {
      type: Number,
      required: true,
      min: 0,
    },
    selling_price: {
      type: Number,
      required: true,
      min: 0,
    },
    current_stock: {
      type: Number,
      required: true,
      min: 0,
    },
    image_urls: {
      type: [String],
      default: [],
    },
    attributes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Attribute" }],
    reviews_summary: {
      type: {
        avg_rating: { type: Number, default: 0, min: 0, max: 5 },
        total_rating_sum: { type: Number, default: 0, min: 0 },
        total_reviews: { type: Number, default: 0, min: 0 },
        breakdown: {
          type: {
            1: { type: Number, default: 0, min: 0 },
            2: { type: Number, default: 0, min: 0 },
            3: { type: Number, default: 0, min: 0 },
            4: { type: Number, default: 0, min: 0 },
            5: { type: Number, default: 0, min: 0 },
          },
          _id: false,
          default: () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }),
        },
      },
      _id: false,
      default: () => ({
        avg_rating: 0,
        total_rating_sum: 0,
        total_reviews: 0,
        breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      }),
    },
    is_deleted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

//Slugify
ProductSchema.pre("insertMany", async (next, docs) => {
  try {
    docs.forEach((doc) => {
      doc.slug = slugify(`${doc.name}`, {
        remove: /[*+~.()'"!:@]/g,
        lower: true,
      });
    });
    next();
  } catch (err) {
    console.error(err);
  }
});

ProductSchema.pre("create", async (next, docs) => {
  try {
    docs.forEach((doc) => {
      doc.slug = slugify(`${doc.name}`, {
        remove: /[*+~.()'"!:@]/g,
        lower: true,
      });
    });
    next();
  } catch (err) {
    console.error(err);
  }
});

ProductSchema.pre("save", async function (next) {
  const doc = this;

  if (!doc.isModified("name")) return next();

  let baseSlug = slugify(doc.name, {
    remove: /[*+~.()'"!:@]/g,
    lower: true,
  });
  let slug = baseSlug;
  const count = await mongoose.models.Product.exists({ slug });

  while (await mongoose.models.Product.exists({ slug })) {
    slug = `${baseSlug}-${count++}`;
  }

  doc.slug = slug;
  next();
});

ProductSchema.set("toJSON", {
  transform(doc, ret) {
    if (ret.size && typeof ret.size.toString === "function") {
      ret.size = ret.size.toString();
    }
    return ret;
  },
});

//Indexing
ProductSchema.index({ type_id: 1, name: 1 }, { unique: true });
ProductSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model("Product", ProductSchema);
