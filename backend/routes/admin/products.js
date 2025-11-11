// routes/admin/products.js
const express = require('express')
const router = express.Router()
const createUpload = require('../../middleware/upload')
const productController = require('../../controllers/productManagement')
const { checkAdminRole } = require('../../middleware/checkAdmin')

//router.use(checkAdminRole)

const upload = createUpload({
  maxSize: 3 * 1024 * 1024, // 3MB
  allowedMime: ['image/jpeg', 'image/png', 'image/webp']
})

router.post('/', upload.array('images', 4), productController.createProduct)

router.get('/', productController.getAllProducts)

router.delete('/bulk-delete', productController.bulkDeleteProducts)

router.get('/:id', productController.getProductById)

router.get('/slug/:slug', productController.getProductBySlug)

router.put('/:id', upload.array('images', 4), productController.updateProduct)

router.delete('/:id', productController.deleteProduct)

router.patch('/:id/inventory/adjust', productController.adjustInventory)

router.patch('/:id/inventory/set', productController.setInventory)

module.exports = router