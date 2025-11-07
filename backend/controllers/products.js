const mongoose = require('mongoose')
const Product = require('../models/Products')
const ProductType = require('../models/ProductTypes')
const ProductCategory = require('../models/ProductCategories')
const Brand = require('../models/Brands')
const Attribute = require('../models/Attributes')

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
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 20, 50)
    const skip = (page - 1) * limit
    
    const filter = {}

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
          message: `0 products found for brand: ${req.query.brand}`,
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

    if (req.query.price_min || req.query.price_max) {
      filter.selling_price = {}
      if (req.query.price_min) {
        filter.selling_price.$gte = parseFloat(req.query.price_min)
      }
      if (req.query.price_max) {
        filter.selling_price.$lte = parseFloat(req.query.price_max)
      }
    }

    if (req.query.stock === 'available') {
      filter.current_stock = { $gt: 0 }
    }

    if (req.query.q) {
      const searchTerm = req.query.q.trim()
      filter.$or = [
        { slug: { $regex: searchTerm, $options: 'i' } },
      ]
    }

    if (req.query.attributes) {
      const attributeSlugs = req.query.attributes.split(',').map(a => a.trim().toLowerCase())
      const attributes = await Attribute.find({
        slug: {
          $in: attributeSlugs
        }
      }).select('_id')
      
      const attributeIds = attributes.map(a => a._id)
      
      if (attributeIds.length > 0) {
        filter.attributes = { $all: attributeIds }
      } else {
        return res.status(200).json({
          success: true,
          message: `0 products with attributes: ${req.query.attributes}`,
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
        images: product.image_urls || null,
        category: product.type_id?.category_id ? {
          _id: product.type_id.category_id._id,
          name: product.type_id.category_id.category_name,
          slug: product.type_id.category_id.category_name.toLowerCase().replace(/\s+/g, '-').replace(/&/g, 'and')
        } : null,
        type: product.type_id ? {
          _id: product.type_id._id,
          name: product.type_id.name,
          slug: product.type_id.name.toLowerCase().replace(/\s+/g, '-')
        } : null,
        brand: product.brand_id ? {
          _id: product.brand_id._id,
          name: product.brand_id.name,
          slug: product.brand_id.name.toLowerCase().replace(/\s+/g, '-')
        } : null,
        attributes: product.attributes ? product.attributes.map(attr => ({
          _id: attr._id,
          name: attr.description,
          slug: attr.description.toLowerCase().replace(/\s+/g, '-')
        })) : [],
      }
    })

    const totalItems = await Product.countDocuments(filter)
    const totalPages = Math.ceil(totalItems / limit)

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
}


exports.getSingleProductDetails = async (req, res) => {
  try {
    const id = req.params.id
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid product id' })
    }
    const productId = new mongoose.Types.ObjectId(id)

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

    const size = product.size ? parseFloat(product.size.toString()) : null

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

    res.status(200).json({
      success: true,
      data: productDetails
    })

  } catch (error) {
    console.error('Error fetching product detail:', error);
    res.status(500).json({
      message: 'Error fetching product detail',
      error: error.message
    })
  }
}