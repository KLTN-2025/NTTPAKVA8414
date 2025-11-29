const express = require('express')
const router = express.Router()
const productController = require('../../controllers/products')
const reviewController = require('../../controllers/reviews');
const { checkMemberStatus } = require('../../middleware/checkMember')
const {
  getRecommendations,
} = require('../../controllers/recommendation');

/**
 * Search and filter products
 */
router.get('/search', 
  productController.searchAndFilterProducts
)

/**
 * Batch fetch products based on supplied product IDs
 * Used for frontend cart
 */
router.post('/bulk-fetch', 
  productController.bulkFetchProducts
)

/**
 * GET /api/products/:productId/reviews
 * Get all reviews for a product (public - no auth required)
 */
router.get('/:productId/reviews', 
    reviewController.getProductReviews);

/**
 * POST /api/products/:productId/reviews
 * Create a new review (requires authentication)
 */
router.post('/:productId/reviews', 
    checkMemberStatus, 
    reviewController.createReview);

/**
 * PUT /api/products/:productId/reviews/:reviewId
 * Update an existing review (requires authentication)
 */
router.put('/:productId/reviews/:reviewId', 
    checkMemberStatus, 
    reviewController.updateReview);

/**
 * DELETE /api/products/:productId/reviews/:reviewId
 * Delete a review (requires authentication)
 */
router.delete('/products/:productId/reviews/:reviewId', 
    checkMemberStatus, 
    reviewController.deleteReview);

    
/**
 * Get single product details
 */
router.get('/:id', 
  productController.getSingleProductDetails
);

router.get('/:productId/recommendation', 
  getRecommendations
)

module.exports = router