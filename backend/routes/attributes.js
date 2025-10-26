const express = require('express');
const router = express.Router();
const Attribute = require('../models/Attributes');

/**
 * GET /api/attributes
 * Retrieve all attributes (tags)
 */
router.get('/', async (req, res) => {
  try {
    console.log('Attributes API called')
    const attributes = await Attribute.find()
      .select('description')
      .sort({ description: 1 })
      .lean();

    res.json({
      success: true,
      data: attributes
    });
  } catch (error) {
    console.error('Error fetching attributes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attributes',
      error: error.message
    });
  }
});

module.exports = router;