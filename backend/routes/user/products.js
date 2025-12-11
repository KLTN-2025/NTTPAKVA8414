const express = require('express')
const router = express.Router()
const productController = require('../../controllers/productController')
const reviewController = require('../../controllers/reviews');
const { checkMemberStatus } = require('../../middleware/checkMember') //Already implemented
const {
  getRecommendations,
} = require('../../controllers/recommendation');

const rateLimit = require('express-rate-limit')

const productViewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests. Wait before retrying again' })
  });

const reviewLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1h
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests. Wait before retrying again' })
  });

/**
 * GET /api/products/search
 * Search and filter products
 */
router.get('/search', 
  productViewLimiter,
  productController.searchAndFilterProducts
)

/**
 * GET /api/products/all
 * Get all products
 */
router.get('/all', 
  productViewLimiter,
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
    reviewLimiter,
    reviewController.createReview);

/**
 * PUT /api/products/:productId/reviews/:reviewId
 * Update an existing review
 */
router.put('/:productId/reviews/:reviewId', 
    checkMemberStatus, 
    reviewLimiter,
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
  productViewLimiter,
  productController.getSingleProductDetails
);

/**
 * GET api/products/:productId/recommendation
 * Get single product details
 */
router.get('/:productId/recommendation', 
  getRecommendations
)

module.exports = router