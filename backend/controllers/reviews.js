// controllers/reviews.js
const mongoose = require('mongoose');
const Review = require('../models/Reviews');
const Product = require('../models/Products');
const Customer = require('../models/Customers');
const CustomerOrder = require('../models/CustomerOrders');
const CustomerOrderItem = require('../models/CustomerOrderItems');
const { getAuth } = require('@clerk/express');
const { redis } = require('../config/redis');

/**Update a product's review summary. Has there possible updateMode:
 * - create: New review created
 * - update: Update review data
 * - delete: Delete an existing review
*/
async function updateProductReviewSummary(productId, updateMode, newRating, oldRating = 0) {
  try {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new Error('Invalid product ID format');
    }

    // Build update operations
    const updates = {};

    if (updateMode === 'create') {
      updates.$inc = {
        'reviews_summary.total_reviews': 1,
        'reviews_summary.total_rating_sum': newRating,
        [`reviews_summary.breakdown.${newRating}`]: 1
      };
    } 
    else if (updateMode === 'update') {
      updates.$inc = {
        'reviews_summary.total_rating_sum': (newRating - oldRating),
        [`reviews_summary.breakdown.${newRating}`]: 1,
        [`reviews_summary.breakdown.${oldRating}`]: -1
      };
    } 
    else if (updateMode === 'delete') {
      updates.$inc = {
        'reviews_summary.total_reviews': -1,
        'reviews_summary.total_rating_sum': -oldRating,
        [`reviews_summary.breakdown.${oldRating}`]: -1
      };
    }
    else {
      throw new Error('Invalid review summary update mode');
    }

    const product = await Product.findByIdAndUpdate(
      productId, 
      updates, 
      { new: true }
    );

    if (!product) {
      throw new Error('Product not found');
    }

    const { total_reviews, total_rating_sum } = product.reviews_summary;
    const avg_rating = total_reviews > 0 
      ? Math.round((total_rating_sum / total_reviews) * 10) / 10 
      : 0;

    await Product.findByIdAndUpdate(
      productId,
      { 'reviews_summary.avg_rating': avg_rating }
    );

    return product.reviews_summary;
  } catch (error) {
    console.error('Error updating product review summary:', error);
    throw error;
  }
}


async function hasCustomerPurchasedProduct(customerId, productId) {
  try {
    const orderItems = await CustomerOrderItem.findOne({
      product_id: productId
    })
    .select('order_id')
    .populate({
        path: 'order_id',
        match: { 
          customer_id: customerId,
          order_status: { $in: ['confirmed', 'shipped', 'delivered'] }
        },
        select: '_id'
      })
      .lean();

    const hasPurchased = orderItems && orderItems.order_id !== null
    return hasPurchased;
  } catch (error) {
    console.error('Error checking purchase history:', error);
    return false;
  }
}

/**
 * GET /api/products/:productId/reviews
 * Get all reviews for a product with pagination
 * Query params: page (default: 1), limit (default: 10)
 * Returns: {
 *   success: true,
 *   avgRating, totalReviews, breakdown,
 *   reviews: [...],
 *   page, limit, total_pages
 * }
 */
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(productId)
      .select('reviews_summary')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50); 
    const skip = (page - 1) * limit;

    // Get paginated reviews
    const reviews = await Review.find({ product_id: productId })
      .populate('customer_id', 'name')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Format reviews for frontend
    const formattedReviews = reviews.map(review => ({
      _id: review._id,
      reviewer: {
        name: review.customer_id?.name || 'Anonymous'
      },
      rating: review.rating,
      comment: review.comment,
      created_at: review.createdAt,
      updated_at: review.updatedAt
    }));

    // Calculate pagination metadata
    const totalReviews = product.reviews_summary.total_reviews;
    const totalPages = Math.ceil(totalReviews / limit);

    return res.status(200).json({
      success: true,
      data: {
        avgRating: product.reviews_summary.avg_rating,
        totalReviews: totalReviews,
        breakdown: product.reviews_summary.breakdown,
        reviews: formattedReviews,
        page,
        limit,
        total_pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * POST /api/products/:productId/reviews
 * Create a new review (requires authentication)
 * Body: { rating: 1-5, comment: string (optional, maxlength: 500) }
 * Purchase verification: Customer must have purchased the product
 */
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment } = req.body;

    // Require authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get customer
    const customer = await Customer.findOne({ clerkId: userId })
      .select('_id')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer account not found'
      });
    }

    // Validate product ID
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Check if product exists
    const product = await Product.findById(productId).select('_id name');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate rating
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Validate comment length
    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    // Purchase verification
    const hasPurchased = await hasCustomerPurchasedProduct(customer._id, productId);
    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased'
      });
    }

    // Create review
    const newReview = await Review.create({
      product_id: productId,
      customer_id: customer._id,
      rating,
      comment: comment || null
    });

    // Update product review summary
    await updateProductReviewSummary(productId, 'create', newReview.rating);

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
    });

  } catch (error) {
    console.error('Error creating review:', error);
    
    // Handle duplicate review error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * PUT /api/products/:productId/reviews/:reviewId
 * Update an existing review (only by the review author)
 * Body: { rating: 1-5, comment: string (optional, maxlength: 500) }
 */
exports.updateReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const { rating, comment } = req.body;

    // Require authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get customer
    const customer = await Customer.findOne({ clerkId: userId })
      .select('_id')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer account not found'
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Validate rating
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5'
      });
    }

    // Validate comment length
    if (comment && comment.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 500 characters'
      });
    }

    // Find review 
    const review = await Review.findOne({
      _id: reviewId,
      product_id: productId,
      customer_id: customer._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }
    const oldRating = review.rating

    // Update review
    review.rating = rating;
    review.comment = comment || null;
    await review.save();

    // Update product review summary
    await updateProductReviewSummary(productId, 'update', rating, oldRating);

    return res.status(200).json({
      success: true,
      message: 'Review updated successfully',
    });

  } catch (error) {
    console.error('Error updating review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};

/**
 * DELETE /api/products/:productId/reviews/:reviewId
 * Delete a review
 */
exports.deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get customer
    const customer = await Customer.findOne({ clerkId: userId })
      .select('_id')
      .lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer account not found'
      });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format'
      });
    }

    // Find review
    const review = await Review.findOne({
      _id: reviewId,
      product_id: productId,
      customer_id: customer._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }
    const oldRating = review.rating

    await Review.findByIdAndDelete(reviewId);

    await updateProductReviewSummary(productId, 'delete', 0, oldRating);

    return res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting review:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
};