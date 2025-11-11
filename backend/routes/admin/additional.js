// routes/admin/additionalManagement.js
const express = require('express')
const router = express.Router()
const pController = require('../../controllers/additionalManagement')
const { checkAdminRole } = require('../../middleware/checkAdmin')

//router.use(checkAdminRole)

// CATEGORY ROUTES
router.get('/categories', pController.getAllCategories)

// PRODUCT TYPE ROUTES
router.get('/product-types', pController.getAllProductTypes)

router.get('/product-types/:id', pController.getProductTypeById)

// BRAND ROUTES
router.get('/brands', pController.getAllBrands)

router.get('/brands/:id', pController.getBrandById)

router.post('/brands', pController.createBrand)

router.put('/brands/:id', pController.updateBrand)

router.delete('/brands/:id', pController.deleteBrand)

// ATTRIBUTE ROUTES

router.get('/attributes', pController.getAllAttributes)

router.get('/attributes/:id', pController.getAttributeById)

module.exports = router