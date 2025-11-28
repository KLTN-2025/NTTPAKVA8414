const mongoose = require("mongoose");
const Product = require("../models/Products");
const ProductType = require("../models/ProductTypes");
const ProductCategory = require("../models/ProductCategories");
const Brand = require("../models/Brands");
const Attribute = require("../models/Attributes");
const { redis } = require('../config/redis');

const getAllProducts = async () => {
  try {
    const cachedKey = 'products:all'
    const products = await Product.find(filter)
    .populate({
      path: "type_id",
      select: "name category_id",
      populate: {
        path: "category_id",
        select: "category_name",
      },
    })
    .populate("brand_id", "name")
    .populate("attributes", "description")
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean()

    const formattedProducts = products.map((product) => {
      const formattedSize = product.size
        ? parseFloat(product.size.toString())
        : null;

      return {
        _id: product._id,
        sku: product.SKU,
        name: product.name,
        slug: product.slug,
        size: formattedSize,
        unit: product.unit,
        price: product.selling_price,
        stock: product.current_stock,
        in_stock: product.current_stock > 0,
        images: product.image_urls[0] || null,
        category: product.type_id?.category_id
          ? {
              _id: product.type_id.category_id._id,
              name: product.type_id.category_id.category_name,
            }
          : null,
        type: product.type_id
          ? {
              _id: product.type_id._id,
              name: product.type_id.name,
            }
          : null,
        brand: product.brand_id
          ? {
              _id: product.brand_id._id,
              name: product.brand_id.name,
            }
          : null,
        attributes: product.attributes
          ? product.attributes.map((attr) => ({
              _id: attr._id,
              name: attr.description,
            }))
          : [],
      };
    });

    await redis.set(cachedKey, JSON.stringify(formattedProducts), 'EX', 3600)
    return formattedProducts

  } catch (err) {

  }
}

/**
 * Query Parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 50)
 * - category: Filter by category name (e.g., "oils-fats", "vegetables")
 * - type: Filter by product type name (e.g., "olive-oil", "berries")
 * - brand: Filter by brand name (e.g., "nutrilife", "purehealth")
 * - attributes: Filter by attribute names (comma-separated, e.g., "organic,keto-friendly")
 * - price_min: Minimum selling price
 * - price_max: Maximum selling price
 * - q: Search query (product name or SKU)
 * - stock: Filter by stock status ("available" or "all")
 * - sortBy: Sort criterion
 * - sortOrder: 'asc' or 'desc', default to 'asc'
 */
exports.searchAndFilterProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.category && mongoose.Types.ObjectId.isValid(req.query.category)) {
      const cat = req.query.category
      const category = await ProductCategory.findById(cat).select("_id").lean()

      if (category) {
        const productTypes = await ProductType.find({
          category_id: category._id,
        }).select("_id").lean();

        const typeIds = productTypes.map((pt) => pt._id);
        filter.type_id = { $in: typeIds };
      } else {
        return res.status(200).json({
          success: true,
          message: `No products found for category: ${cat}`,
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_items: 0,
            total_pages: 0,
            has_next_page: false,
            has_prev_page: false,
          },
        });
      }
    }

    if (req.query.type && mongoose.Types.ObjectId.isValid(req.query.type)) {
      const productType = await ProductType.findById(req.query.type)
      .select('_id').lean();

      if (productType) {
        filter.type_id = productType._id;
      } else {
        return res.status(200).json({
          success: true,
          message: `No products found for type: ${req.query.type}`,
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_items: 0,
            total_pages: 0,
            has_next_page: false,
            has_prev_page: false,
          },
        });
      }
    }

    if (req.query.price_min || req.query.price_max) {
      filter.selling_price = {};
      if (req.query.price_min) {
        filter.selling_price.$gte = parseFloat(req.query.price_min);
      }
      if (req.query.price_max) {
        filter.selling_price.$lte = parseFloat(req.query.price_max);
      }
    }

    if (req.query.stock === "available") {
      filter.current_stock = { $gt: 0 };
    }

    if (req.query.q) {
      const searchTerm = req.query.q.trim();
      filter.$or = [{ slug: { $regex: searchTerm, $options: "i" } }];
    }

    if (req.query.attributes) {
      const attrArray = req.query.attributes.split(",")
      const attributes = await Attribute.find({
        _id: { $in: attrArray },
      }).select("_id").lean();

      const attributeIds = attributes.map((a) => a._id);

      if (attributeIds.length > 0) {
        filter.attributes = { $all: attributeIds };
      } else {
        return res.status(200).json({
          success: true,
          message: `0 products with attributes: ${attrArray}`,
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_items: 0,
            total_pages: 0,
            has_next_page: false,
            has_prev_page: false,
          },
        });
      }
    }

    let sort = {};
    const sortOrder = (req.query.sortOrder === "asc" ? 1 : -1) || 1;
    switch (req.query.sortBy) {
      case "price":
        sort.selling_price = sortOrder;
        break;
      case "name":
        sort.name = sortOrder;
        break;
    }

    const products = await Product.find(filter)
      .populate({
        path: "type_id",
        select: "name category_id",
        populate: {
          path: "category_id",
          select: "category_name",
        },
      })
      .populate("brand_id", "name")
      .populate("attributes", "description")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();

    const formattedProducts = products.map((product) => {
      const formattedSize = product.size
        ? parseFloat(product.size.toString())
        : null;

      return {
        _id: product._id,
        sku: product.SKU,
        name: product.name,
        slug: product.slug,
        size: formattedSize,
        unit: product.unit,
        price: product.selling_price,
        stock: product.current_stock,
        in_stock: product.current_stock > 0,
        images: product.image_urls[0] || null,
        category: product.type_id?.category_id
          ? {
              _id: product.type_id.category_id._id,
              name: product.type_id.category_id.category_name,
            }
          : null,
        type: product.type_id
          ? {
              _id: product.type_id._id,
              name: product.type_id.name,
            }
          : null,
        brand: product.brand_id
          ? {
              _id: product.brand_id._id,
              name: product.brand_id.name,
            }
          : null,
        attributes: product.attributes
          ? product.attributes.map((attr) => ({
              _id: attr._id,
              name: attr.description,
            }))
          : [],
        rating: product.reviews_summary.avg_rating
      };
    });

    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching products",
      error: error.message,
    });
  }
};

exports.getSingleProductDetails = async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }

    //Retrieving from MongoDB and set cache
    const productId = new mongoose.Types.ObjectId(id);

    const product = await Product.findById(productId)
      .populate({
        path: "type_id",
        select: "name category_id",
        populate: {
          path: "category_id",
          select: "category_name",
        },
      })
      .populate("brand_id", "name")
      .populate("attributes", "description")
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const size = product.size ? parseFloat(product.size.toString()) : null;

    const productDetails = {
      _id: product._id,
      sku: product.SKU,
      name: product.name,
      description: product.description,
      size: size,
      unit: product.unit,
      price: product.selling_price,
      stock: product.current_stock,
      in_stock: product.current_stock > 0,
      images: product.image_urls,
      category: product.type_id?.category_id
        ? {
            _id: product.type_id.category_id._id,
            name: product.type_id.category_id.category_name,
          }
        : null,

      type: product.type_id
        ? {
            _id: product.type_id._id,
            name: product.type_id.name,
          }
        : null,

      brand: product.brand_id
        ? {
            _id: product.brand_id._id,
            name: product.brand_id.name,
          }
        : null,

      attributes: product.attributes
        ? product.attributes.map((attr) => ({
            _id: attr._id,
            name: attr.description,
          }))
        : [],
      
      
    };


    return res.status(200).json({
      success: true,
      data: productDetails,
    });
  } catch (error) {
    console.error("Error fetching product detail:", error);
    return res.status(500).json({
      message: "Error fetching product detail",
      error: error.message,
    });
  }
};

exports.bulkFetchProducts = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({
        success: false,
        message: "product IDs must be an array",
      });
    }
    if (productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No product to refresh",
      });
    }
    if (productIds.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Cannot request more than 10 products",
      });
    }
    if (!productIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({
        success: false,
        message: "Some product IDs are in invalid format",
      });
    }

    const uniqueIds = [...new Set(productIds)].map(id => new mongoose.Types.ObjectId(id));
    const products = await Product.find({ _id: { $in: uniqueIds } })
      .select("_id name selling_price current_stock image_urls")
      .lean();

    const formattedResponse = products.map((p) => {
      return {
        productId: p._id,
        name: p.name,
        price: p.selling_price,
        stock: p.current_stock,
        image: p.image_urls[0],
      };
    });
    return res.status(200).json({
      success: true,
      products: formattedResponse,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Error bulk fetching requested products",
    });
  }
};