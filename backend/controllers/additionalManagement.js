// controllers/additionalManagement.js
const ProductCategory = require("../models/ProductCategories");
const ProductType = require("../models/ProductTypes");
const Brand = require("../models/Brands");
const Attribute = require("../models/Attributes");
const { getAuth } = require('@clerk/express')
const { redis } = require('../config/redis')

exports.verifyAdminStatus = async (req, res) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ 
        isAdmin: false, 
        message: 'Not authenticated' });
    }
    //Set it in the cache
    await redis.sAdd("adminlist", userId)
    return res.status(200).json({ 
      isAdmin: true, 
      userId: user.id,
      });
  } catch (err) {
    console.error('verifyAdminStatus error:', err.stack || err);
    return res.status(500).json({ isAdmin: false, error: String(err.message || err) });
  }
};


// CATEGORY CONTROLLERS

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find().sort("category_name");

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

// ============================================
// PRODUCT TYPE CONTROLLERS
// ============================================

// Get all product types (optionally filter by category)
exports.getAllProductTypes = async (req, res) => {
  try {
    const { category_id } = req.query;

    const filter = category_id ? { category_id } : {};

    const productTypes = await ProductType.find(filter)
      .populate("category_id", "category_name")
      .sort("name");

    res.status(200).json({
      success: true,
      data: productTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product types",
      error: error.message,
    });
  }
};

// Get single product type
exports.getProductTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    const productType = await ProductType.findById(id).populate(
      "category_id",
      "category_name description"
    );

    if (!productType) {
      return res.status(404).json({
        success: false,
        message: "Product type not found",
      });
    }

    res.status(200).json({
      success: true,
      data: productType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching product type",
      error: error.message,
    });
  }
};

// ============================================
// BRAND CONTROLLERS
// ============================================

// Get all brands
exports.getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort("name");

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching brands",
      error: error.message,
    });
  }
};

// Get single brand
exports.getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      data: brand,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching brand",
      error: error.message,
    });
  }
};

// Create brand
exports.createBrand = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const brand = new Brand({ name });
    await brand.save();

    res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Brand name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating brand",
      error: error.message,
    });
  }
};

// Update brand
exports.updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const brand = await Brand.findByIdAndUpdate(
      id,
      { name },
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Brand name already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating brand",
      error: error.message,
    });
  }
};

// Delete brand
exports.deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await Brand.findByIdAndDelete(id);

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting brand",
      error: error.message,
    });
  }
};

// ============================================
// ATTRIBUTE CONTROLLERS
// ============================================

// Get all attributes
exports.getAllAttributes = async (req, res) => {
  try {
    const attributes = await Attribute.find().sort("description");

    res.status(200).json({
      success: true,
      data: attributes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attributes",
      error: error.message,
    });
  }
};

// Get single attribute
exports.getAttributeById = async (req, res) => {
  try {
    const { id } = req.params;

    const attribute = await Attribute.findById(id);

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: "Attribute not found",
      });
    }

    res.status(200).json({
      success: true,
      data: attribute,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching attribute",
      error: error.message,
    });
  }
};
