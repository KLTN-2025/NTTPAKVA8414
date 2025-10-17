const express = require('express')
const router = express.Router()
const Product = require('../models/Products')
const ProductType = require('../models/ProductTypes')
const ProductCategory = require('../models/ProductCategories')
const Brand = require('../models/Brands')
const Attribute = require('../models/Attributes')
const Review = require('../models/Reviews')
const Customer = require('../models/Customers')

/**
 * GET /api/products
 * Retrieve all products with SEO-friendly filtering and pagination
 * 
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
router.get('/search', async (req, res) => {
  try {
    // 1. PAGINATION PARAMETERS
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit

    // 2. BUILD FILTER QUERY
    const filter = {}

    // Filter by category (using friendly name)
    if (req.query.category) {
      const categorySlug = req.query.category.toLowerCase().trim()
      const category = await ProductCategory.findOne({
        category_name: { $regex: new RegExp('^' + categorySlug.replace(/-/g, ' '), 'i') }
      })
      
      if (category) {
        const productTypes = await ProductType.find({ category_id: category._id }).select('_id')
        const typeIds = productTypes.map(pt => pt._id)
        filter.type_id = { $in: typeIds }
      } else {
        // Category not found, return empty result
        return res.status(200).json({
          success: true,
          message: `No products found for category: ${req.query.category}`,
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_items: 0,
            total_pages: 0,
            has_next_page: false,
            has_prev_page: false
          }
        })
      }
    }

    // Filter by product type
    if (req.query.type) {
      const typeSlug = req.query.type.toLowerCase().trim()
      const productType = await ProductType.findOne({
        name: { $regex: new RegExp('^' + typeSlug.replace(/-/g, ' '), 'i') }
      })
      
      if (productType) {
        filter.type_id = productType._id
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
            has_prev_page: false
          }
        })
      }
    }

    // Filter by brand
    if (req.query.brand) {
      const brandSlug = req.query.brand.toLowerCase().trim()
      const brand = await Brand.findOne({
        name: { $regex: new RegExp('^' + brandSlug.replace(/-/g, ' '), 'i') }
      })
      
      if (brand) {
        filter.brand_id = brand._id
      } else {
        return res.status(200).json({
          success: true,
          message: `No products found for brand: ${req.query.brand}`,
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_items: 0,
            total_pages: 0,
            has_next_page: false,
            has_prev_page: false
          }
        })
      }
    }

    // Filter by price range
    if (req.query.price_min || req.query.price_max) {
      filter.selling_price = {}
      if (req.query.price_min) {
        filter.selling_price.$gte = parseFloat(req.query.price_min)
      }
      if (req.query.price_max) {
        filter.selling_price.$lte = parseFloat(req.query.price_max)
      }
    }

    // Filter by stock availability
    if (req.query.stock === 'available') {
      filter.current_stock = { $gt: 0 }
    }

    // Search by slug or SKU
    if (req.query.q) {
      const searchTerm = req.query.q.trim()
      filter.$or = [
        { slug: { $regex: searchTerm, $options: 'i' } },
        { SKU: { $regex: searchTerm, $options: 'i' } },
      ]
    }

    // Filter by attributes (using friendly names)
    if (req.query.attributes) {
      const attributeSlugs = req.query.attributes.split(',').map(a => a.trim().toLowerCase())
      
      // Find attributes by friendly names
      const attributes = await Attribute.find({
        description: {
          $in: attributeSlugs.map(slug => new RegExp('^' + slug.replace(/-/g, ' '), 'i'))
        }
      }).select('_id')
      
      const attributeIds = attributes.map(a => a._id)
      
      if (attributeIds.length > 0) {
        // Products must have all specified attributes
        filter.attributes = { $all: attributeIds }
      } else {
        return res.status(200).json({
          success: true,
          message: `No products found with attributes: ${req.query.attributes}`,
          data: [],
          pagination: {
            current_page: page,
            per_page: limit,
            total_items: 0,
            total_pages: 0,
            has_next_page: false,
            has_prev_page: false
          }
        })
      }
    }

    // 3. SORTING (SEO-FRIENDLY)
    let sort = {}
    const sortOrder = (req.query.sortOrder === 'asc' ? 1 : - 1) || 1
    switch (req.query.sortBy) {
      case 'price':
        sort.selling_price = sortOrder
        break
      case 'name':
        sort.name = sortOrder
        break
    }

    // 4. EXECUTE QUERY
    const products = await Product.find(filter)
      .populate({
        path: 'type_id',
        select: 'name category_id',
        populate: {
          path: 'category_id',
          select: 'category_name'
        }
      })
      .populate('brand_id', 'name')
      .populate('attributes', 'description')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()

    // 5. FORMAT RESPONSE DATA
    const formattedProducts = products.map(product => {
      const formattedSize = product.size ? parseFloat(product.size.toString()) : null
      
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
        category: product.type_id?.category_id ? {
          _id: product.type_id.category_id._id,
          name: product.type_id.category_id.category_name,
        } : null,
        type: product.type_id ? {
          _id: product.type_id._id,
          name: product.type_id.name,
        } : null,
        brand: product.brand_id ? {
          _id: product.brand_id._id,
          name: product.brand_id.name,
        } : null,
        attributes: product.attributes ? product.attributes.map(attr => ({
          _id: attr._id,
          name: attr.description,
        })) : [],
      }
    })

    // 6. GET TOTAL COUNT FOR PAGINATION
    const totalItems = await Product.countDocuments(filter)
    const totalPages = Math.ceil(totalItems / limit)

    // 7. BUILD SEO-FRIENDLY RESPONSE
    res.status(200).json({
      success: true,
      data: formattedProducts,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      },
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    })
  }
})



router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    // 1. FETCH PRODUCT WITH POPULATED FIELDS
    const product = await Product.findById(productId)
      .populate({
        path: 'type_id',
        select: 'name category_id',
        populate: {
          path: 'category_id',
          select: 'category_name'
        }
      })
      .populate('brand_id', 'name')
      .populate('attributes', 'description')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // 2. FETCH AND CALCULATE REVIEWS
    const reviews = await Review.find({ product_id: productId })
      .populate('customer_id', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate average rating and rating breakdown
    const totalReviews = reviews.length;
    let averageRating = 0;
    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    if (totalReviews > 0) {
      const totalRating = reviews.reduce((sum, review) => {
        ratingBreakdown[review.rating]++;
        return sum + review.rating;
      }, 0);
      averageRating = parseFloat((totalRating / totalReviews).toFixed(2));
    }

    // Calculate percentage for each rating
    const ratingBreakdownWithPercentage = Object.keys(ratingBreakdown).map(rating => ({
      stars: parseInt(rating),
      count: ratingBreakdown[rating],
      percentage: totalReviews > 0 
        ? parseFloat(((ratingBreakdown[rating] / totalReviews) * 100).toFixed(1))
        : 0
    })).sort((a, b) => b.stars - a.stars);

    // 3. FORMAT REVIEWS
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      reviewer: {
        _id: review.customer_id?._id || null,
        name: review.customer_id?.name || 'Anonymous',
        //image_url: review.customer_id?.image_url || null
      },
      created_at: review.createdAt,
      updated_at: review.updatedAt
    }));

    // 4. FORMAT PRODUCT RESPONSE
    const size = product.size ? parseFloat(product.size.toString()) : null;

    const productDetail = {
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
      category: product.type_id?.category_id ? {
        _id: product.type_id.category_id._id,
        name: product.type_id.category_id.category_name,
      } : null,
      
      type: product.type_id ? {
        _id: product.type_id._id,
        name: product.type_id.name,
      } : null,
      
      brand: product.brand_id ? {
        _id: product.brand_id._id,
        name: product.brand_id.name,
      } : null,
      
      attributes: product.attributes ? product.attributes.map(attr => ({
        _id: attr._id,
        name: attr.description,
      })) : [],
      
      rating: {
        average: averageRating,
        total_reviews: totalReviews,
        breakdown: ratingBreakdownWithPercentage
      },
      
      reviews: formattedReviews,    
      created_at: product.createdAt,
      updated_at: product.updatedAt
    };

    // 5. SEND RESPONSE
    res.status(200).json({
      data: productDetail
    });

  } catch (error) {
    console.error('Error fetching product detail:', error);
    res.status(500).json({
      message: 'Error fetching product detail',
      error: error.message
    });
  }
});

module.exports = router