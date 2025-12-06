// routes/admin/metadata.js
const express = require('express');
const router = express.Router();
const metadataController = require('../../controllers/metadata');

//const { checkAdminRole } = require("../../middleware/checkAdmin");
//router.use(checkAdminRole)


/**
 * GET /api/admin/metadata/categories/list
 * Get all categories for dropdown (no pagination)
 */
router.get('/categories/list', metadataController.getCategoryList);

/**
 * GET /api/admin/metadata/categories
 * List all categories with product type count
 */
router.get('/categories', metadataController.getCategories);

/**
 * GET /api/admin/metadata/categories/:id
 * Get single category details
 */
router.get('/categories/:id', metadataController.getCategoryById);

/**
 * POST /api/admin/metadata/categories
 * Create a new category
 */
router.post('/categories', metadataController.createCategory);

/**
 * PUT /api/admin/metadata/categories/:id
 * Update a category
 */
router.put('/categories/:id', metadataController.updateCategory);

/**
 * DELETE /api/admin/metadata/categories/:id
 * Delete a category (only if typeCount = 0)
 */
router.delete('/categories/:id', metadataController.deleteCategory);



/**
 * GET /api/admin/metadata/types
 * List all product types with product count
 */
router.get('/types', metadataController.getTypes);

/**
 * GET /api/admin/metadata/types/:id
 * Get single product type details
 */
router.get('/types/:id', metadataController.getTypeById);

/**
 * POST /api/admin/metadata/types
 * Create a new product type
 */
router.post('/types', metadataController.createType);

/**
 * PUT /api/admin/metadata/types/:id
 * Update a product type
 */
router.put('/types/:id', metadataController.updateType);

/**
 * DELETE /api/admin/metadata/types/:id
 * Delete a product type (only if productCount = 0)
 */
router.delete('/types/:id', metadataController.deleteType);



/**
 * GET /api/admin/metadata/attributes
 * List all attributes with product count
 */
router.get('/attributes', metadataController.getAttributes);

/**
 * GET /api/admin/metadata/attributes/:id
 * Get single attribute details
 */
router.get('/attributes/:id', metadataController.getAttributeById);

/**
 * POST /api/admin/metadata/attributes
 * Create a new attribute
 */
router.post('/attributes', metadataController.createAttribute);

/**
 * PUT /api/admin/metadata/attributes/:id
 * Update an attribute
 */
router.put('/attributes/:id', metadataController.updateAttribute);

/**
 * DELETE /api/admin/metadata/attributes/:id
 * Delete an attribute (only if productCount = 0)
 */
router.delete('/attributes/:id', metadataController.deleteAttribute);


module.exports = router;

/*
 * =========================================
 * PLACEHOLDER: Add this to your main app.js or server.js
 * =========================================
 * 
 * const metadataRoutes = require('./routes/admin/metadata');
 * app.use('/api/admin/metadata', metadataRoutes);
 * 
 */