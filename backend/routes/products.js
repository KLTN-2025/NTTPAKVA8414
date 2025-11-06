const express = require('express')
const router = express.Router()
const productController = require('../controllers/products')
const reviewController = require('../controllers/reviews')

/**
 * Search and filter products
 */
router.get('/search', 
  productController.searchAndFilterProducts
)

/**
 * Get single product details
 */
router.get('/:id', 
  productController.getSingleProductDetails
);

/**
 * Get single product reviews
 */
router.get('/:id/reviews', 
  reviewController.fetchSingleProductReviews
);

module.exports = router