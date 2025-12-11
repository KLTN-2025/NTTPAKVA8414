// controllers/metadata.js
const mongoose = require('mongoose');
const ProductCategory = require('../models/ProductCategories');
const ProductType = require('../models/ProductTypes');
const Attribute = require('../models/Attributes');
const Product = require('../models/Products');
const slugify = require('slugify');

/* =========================================
   PRODUCT CATEGORIES
   ========================================= */

/**
 * GET /api/admin/metadata/categories
 * List all categories with product type count
 * Query params: page, limit, search (by category_name)
 */
exports.getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    // Build filter
    const filter = {};
    if (search) {
      filter.category_name = { $regex: search, $options: 'i' };
    }

    // Aggregation to get categories with type count
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'producttypes',
          localField: '_id',
          foreignField: 'category_id',
          as: 'types'
        }
      },
      {
        $project: {
          _id: 1,
          category_name: 1,
          description: 1,
          typeCount: { $size: '$types' },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { category_name: 1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const categories = await ProductCategory.aggregate(pipeline);

    // Get total count for pagination
    const totalItems = await ProductCategory.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: categories,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/metadata/categories/:id
 * Get single category details
 */
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const category = await ProductCategory.findById(id).lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get type count
    const typeCount = await ProductType.countDocuments({ category_id: id });

    return res.status(200).json({
      success: true,
      data: {
        ...category,
        typeCount
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/metadata/categories
 * Create a new category
 * Body: { category_name, description }
 */
exports.createCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body;

    if (!category_name || !category_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check for duplicate
    const existing = await ProductCategory.findOne({
      category_name: { $regex: `^${category_name.trim()}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    const newCategory = await ProductCategory.create({
      category_name: category_name.trim(),
      description: description?.trim() || ''
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating category',
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/metadata/categories/:id
 * Update a category
 * Body: { category_name, description }
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    if (!category_name || !category_name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check for duplicate (exclude current)
    const existing = await ProductCategory.findOne({
      _id: { $ne: id },
      category_name: { $regex: `^${category_name.trim()}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    const updated = await ProductCategory.findByIdAndUpdate(
      id,
      {
        category_name: category_name.trim(),
        description: description?.trim() || ''
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating category',
      error: error.message
    });
  }
};

/**
 * DELETE /api/admin/metadata/categories/:id
 * Delete a category (only if typeCount = 0)
 */
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    // Check if category exists
    const category = await ProductCategory.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for associated types
    const typeCount = await ProductType.countDocuments({ category_id: id });
    if (typeCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${typeCount} associated product type(s). Remove or reassign them first.`
      });
    }

    await ProductCategory.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting category',
      error: error.message
    });
  }
};


/* =========================================
   PRODUCT TYPES
   ========================================= */

/**
 * GET /api/admin/metadata/types
 * List all product types with product count
 * Query params: page, limit, search (by name), category (category_id)
 */
exports.getTypes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';
    const categoryFilter = req.query.category || '';

    // Build filter
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (categoryFilter && mongoose.Types.ObjectId.isValid(categoryFilter)) {
      filter.category_id = new mongoose.Types.ObjectId(categoryFilter);
    }

    // Aggregation to get types with product count (is_deleted !== false)
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'productcategories',
          localField: 'category_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'products',
          let: { typeId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$type_id', '$$typeId'] },
                    { $ne: ['$is_deleted', false] }
                  ]
                }
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          category: {
            _id: '$category._id',
            category_name: '$category.category_name'
          },
          productCount: { $size: '$products' },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { 'category.category_name': 1, name: 1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const types = await ProductType.aggregate(pipeline);

    // Get total count for pagination
    const totalItems = await ProductType.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: types,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching types:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching product types',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/metadata/types/:id
 * Get single product type details
 */
exports.getTypeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type ID format'
      });
    }

    const type = await ProductType.findById(id)
      .populate('category_id', 'category_name')
      .lean();

    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Product type not found'
      });
    }

    // Get product count (is_deleted !== false)
    const productCount = await Product.countDocuments({
      type_id: id,
      is_deleted: { $ne: false }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...type,
        category: type.category_id,
        productCount
      }
    });
  } catch (error) {
    console.error('Error fetching type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching product type',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/metadata/types
 * Create a new product type
 * Body: { category_id, name, description }
 */
exports.createType = async (req, res) => {
  try {
    const { category_id, name, description } = req.body;

    if (!category_id || !mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid category ID is required'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Type name is required'
      });
    }

    // Check if category exists
    const category = await ProductCategory.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate within same category
    const existing = await ProductType.findOne({
      category_id,
      name: { $regex: `^${name.trim()}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A type with this name already exists in this category'
      });
    }

    const newType = await ProductType.create({
      category_id,
      name: name.trim(),
      description: description?.trim() || ''
    });

    return res.status(201).json({
      success: true,
      message: 'Product type created successfully',
      data: newType
    });
  } catch (error) {
    console.error('Error creating type:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A type with this name already exists in this category'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating product type',
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/metadata/types/:id
 * Update a product type
 * Body: { category_id, name, description }
 */
exports.updateType = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_id, name, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type ID format'
      });
    }

    if (!category_id || !mongoose.Types.ObjectId.isValid(category_id)) {
      return res.status(400).json({
        success: false,
        message: 'Valid category ID is required'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Type name is required'
      });
    }

    // Check if category exists
    const category = await ProductCategory.findById(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate (exclude current)
    const existing = await ProductType.findOne({
      _id: { $ne: id },
      category_id,
      name: { $regex: `^${name.trim()}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A type with this name already exists in this category'
      });
    }

    const updated = await ProductType.findByIdAndUpdate(
      id,
      {
        category_id,
        name: name.trim(),
        description: description?.trim() || ''
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Product type not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product type updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating type:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'A type with this name already exists in this category'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating product type',
      error: error.message
    });
  }
};

/**
 * DELETE /api/admin/metadata/types/:id
 * Delete a product type (only if productCount = 0)
 */
exports.deleteType = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid type ID format'
      });
    }

    // Check if type exists
    const type = await ProductType.findById(id);
    if (!type) {
      return res.status(404).json({
        success: false,
        message: 'Product type not found'
      });
    }

    // Check for associated products (is_deleted !== false)
    const productCount = await Product.countDocuments({
      type_id: id,
      is_deleted: { $ne: false }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete type with ${productCount} associated product(s). Delete or reassign them first.`
      });
    }

    await ProductType.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Product type deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting product type',
      error: error.message
    });
  }
};


/* =========================================
   ATTRIBUTES
   ========================================= */

/**
 * GET /api/admin/metadata/attributes
 * List all attributes with product count
 * Query params: page, limit, search (by description)
 */
exports.getAttributes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const search = req.query.search?.trim() || '';

    // Build filter
    const filter = {};
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Aggregation to get attributes with product count (is_deleted !== false)
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'products',
          let: { attrId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$attrId', '$attributes'] },
                    { $ne: ['$is_deleted', false] }
                  ]
                }
              }
            }
          ],
          as: 'products'
        }
      },
      {
        $project: {
          _id: 1,
          description: 1,
          slug: 1,
          productCount: { $size: '$products' },
          createdAt: 1,
          updatedAt: 1
        }
      },
      { $sort: { description: 1 } },
      { $skip: skip },
      { $limit: limit }
    ];

    const attributes = await Attribute.aggregate(pipeline);

    // Get total count for pagination
    const totalItems = await Attribute.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    return res.status(200).json({
      success: true,
      data: attributes,
      pagination: {
        current_page: page,
        per_page: limit,
        total_items: totalItems,
        total_pages: totalPages,
        has_next_page: page < totalPages,
        has_prev_page: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching attributes',
      error: error.message
    });
  }
};

/**
 * GET /api/admin/metadata/attributes/:id
 * Get single attribute details
 */
exports.getAttributeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attribute ID format'
      });
    }

    const attribute = await Attribute.findById(id).lean();

    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found'
      });
    }

    // Get product count (is_deleted !== false)
    const productCount = await Product.countDocuments({
      attributes: id,
      is_deleted: { $ne: false }
    });

    return res.status(200).json({
      success: true,
      data: {
        ...attribute,
        productCount
      }
    });
  } catch (error) {
    console.error('Error fetching attribute:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching attribute',
      error: error.message
    });
  }
};

/**
 * POST /api/admin/metadata/attributes
 * Create a new attribute
 * Body: { description }
 */
exports.createAttribute = async (req, res) => {
  try {
    const { description } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute description is required'
      });
    }

    // Check for duplicate
    const existing = await Attribute.findOne({
      description: { $regex: `^${description.trim()}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An attribute with this description already exists'
      });
    }

    // Generate slug
    const slug = slugify(description.trim(), {
      remove: /[*+~.()'"!:@]/g,
      lower: true
    });

    const newAttribute = await Attribute.create({
      description: description.trim(),
      slug
    });

    return res.status(201).json({
      success: true,
      message: 'Attribute created successfully',
      data: newAttribute
    });
  } catch (error) {
    console.error('Error creating attribute:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An attribute with this description already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error creating attribute',
      error: error.message
    });
  }
};

/**
 * PUT /api/admin/metadata/attributes/:id
 * Update an attribute
 * Body: { description }
 */
exports.updateAttribute = async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attribute ID format'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Attribute description is required'
      });
    }

    // Check for duplicate (exclude current)
    const existing = await Attribute.findOne({
      _id: { $ne: id },
      description: { $regex: `^${description.trim()}$`, $options: 'i' }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An attribute with this description already exists'
      });
    }

    // Generate new slug
    const slug = slugify(description.trim(), {
      remove: /[*+~.()'"!:@]/g,
      lower: true
    });

    const updated = await Attribute.findByIdAndUpdate(
      id,
      {
        description: description.trim(),
        slug
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Attribute updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating attribute:', error);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An attribute with this description already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error updating attribute',
      error: error.message
    });
  }
};

/**
 * DELETE /api/admin/metadata/attributes/:id
 * Delete an attribute (only if productCount = 0)
 */
exports.deleteAttribute = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid attribute ID format'
      });
    }

    // Check if attribute exists
    const attribute = await Attribute.findById(id);
    if (!attribute) {
      return res.status(404).json({
        success: false,
        message: 'Attribute not found'
      });
    }

    // Check for associated products (is_deleted !== false)
    const productCount = await Product.countDocuments({
      attributes: id,
      is_deleted: { $ne: false }
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete attribute with ${productCount} associated product(s). Remove the attribute from those products first.`
      });
    }

    await Attribute.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Attribute deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attribute:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting attribute',
      error: error.message
    });
  }
};


/* =========================================
   UTILITY ENDPOINTS
   ========================================= */

/**
 * GET /api/admin/metadata/categories/list
 * Get all categories for dropdown (no pagination)
 */
exports.getCategoryList = async (req, res) => {
  try {
    const categories = await ProductCategory.find({})
      .select('_id category_name')
      .sort({ category_name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching category list:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching category list',
      error: error.message
    });
  }
};