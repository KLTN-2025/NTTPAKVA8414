const express = require('express')
const router = express.Router()
const productController = require('../../controllers/productController')
const reviewController = require('../../controllers/reviews');
const { checkMemberStatus } = require('../../middleware/checkMember')
const {
  getRecommendations,
} = require('../../controllers/recommendation');

const { WINDOW_LENGTH, rateLimiter } = require("../../middleware/rateLimiter")

const productListingConfig = {
  window: 15 * WINDOW_LENGTH.MINUTE, 
  max: 300,                       
  group: "product_listing",
  errorMessage: "Too many inquries sent! Please wait"
}
const productDetailConfig = {
  window: 1 * WINDOW_LENGTH.MINUTE, 
  max: 40,                       
  group: "product_details",
  errorMessage: "Too many inquries sent! Please wait"
}
const reviewConfig = {
  window: 1 * WINDOW_LENGTH.HOUR, 
  max: 10,                       
  group: "review",
  errorMessage: "Too many inquries sent! Please wait"
}

/**
 * GET /api/products/search
 * Search and filter products
 */
router.get('/search', 
  rateLimiter(productListingConfig),
  productController.searchAndFilterProducts
)

/**
 * GET /api/products/all
 * Get all products
 */
router.get('/all', 
  rateLimiter(productListingConfig),
  productController.getAllProducts
)

/**
 * GET /api/products/bulk-fetch
 * Batch fetch products based on supplied product IDs
 * Used for frontend cart
 */
router.post('/bulk-fetch', 
  productController.bulkFetchProducts
)

/**
 * GET /api/products/:productId/reviews
 * Get all reviews for a product
 */
router.get('/:productId/reviews', 
    reviewController.getProductReviews);

/**
 * POST /api/products/:productId/reviews
 * Create a new review
 */
router.post('/:productId/reviews', 
    checkMemberStatus, 
    rateLimiter(reviewConfig),
    reviewController.createReview);

/**
 * PUT /api/products/:productId/reviews/:reviewId
 * Update an existing review
 */
router.put('/:productId/reviews/:reviewId', 
    checkMemberStatus, 
    rateLimiter(reviewConfig),
    reviewController.updateReview);

/**
 * DELETE /api/products/:productId/reviews/:reviewId
 * Delete a review
 */
router.delete('/products/:productId/reviews/:reviewId', 
    checkMemberStatus, 
    reviewController.deleteReview);

    
/**
 * GET api/products/:id
 * Get single product details
 */
router.get('/:id', 
  rateLimiter(productDetailConfig),
  productController.getSingleProductDetails
);

/**
 * GET api/products/:productId/recommendation
 * Get single product recommendation
 */
router.get('/:productId/recommendation', 
  getRecommendations
)

module.exports = router