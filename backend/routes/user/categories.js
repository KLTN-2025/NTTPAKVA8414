const express = require('express');
const router = express.Router();
const ProductCategory = require('../../models/ProductCategories');
/**
 * GET /api/categories
 * Retrieve all product categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await ProductCategory.find()
      .select('_id category_name')
      .sort({ category_name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

module.exports = router;