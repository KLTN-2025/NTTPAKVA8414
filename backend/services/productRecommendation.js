const mongoose = require('mongoose');
const Product = require('../models/Products');
const ProductRecommendation = require('../models/ProductRecommendations');
const ProductType = require('../models/ProductTypes');

class RecommendationService {
  /**
   * Get recommendations for a product from pre-computed table
   * @param {String} productId - The product ID to get recommendations for
   * @param {Number} limit - Number of recommendations to return (default: 5)
   * @returns {Array} Array of recommended product objects with scores
   */
  async getRecommendations(productId, limit = 5) {
    try {
      if (!mongoose.Types.ObjectId(productId)){
        throw new Error('Invalid product id')
      }
      
      // Get the source product details
      const sourceProduct = await Product.findById(productId)
        .populate('type_id')
        .lean();

      if (!sourceProduct) {
        throw new Error('Product not found');
      }

      // Get the category of the source product
      const sourceType = await ProductType.findById(sourceProduct.type_id)
        .lean();
      const sourceCategoryId = sourceType?.category_id;

      // Query pre-computed recommendations
      const precomputedRecs = await ProductRecommendation.find({
        source_product_id: productId
      })
        .sort({ score: -1 })
        .limit(limit)
        .populate('target_product_id')
        .lean();

      // Format the recommendations
      const recommendations = precomputedRecs.map(rec => ({
        product_id: rec.target_product_id._id.toString(),
        product: rec.target_product_id,
        score: rec.score,
        isFallback: false
      }));

      // Fill remaining slots with same-category products if needed
      if (recommendations.length < limit) {
        const existingIds = [
          productId,
          ...recommendations.map(r => r.product_id)
        ];
        
        const fillCount = limit - recommendations.length;
        const fallbackProducts = await this.getFallbackRecommendations(
          productId,
          sourceCategoryId,
          fillCount,
          existingIds
        );

        recommendations.push(...fallbackProducts);
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Get fallback recommendations from the same category
   * @param {String} productId - The source product ID to exclude
   * @param {String} categoryId - The category ID to filter by
   * @param {Number} limit - Number of products to return
   * @param {Array} excludeIds - Additional product IDs to exclude
   * @returns {Array} Array of product objects
   */
  async getFallbackRecommendations(
    productId,
    categoryId,
    limit = 5,
    excludeIds = []
  ) {
    const excludeList = [productId, ...excludeIds].map(id => 
      mongoose.Types.ObjectId(id)
    );

    // Get product types in the same category
    const productTypes = await ProductType.find({
      category_id: categoryId
    }).distinct('_id');

    // Find products from the same category
    const products = await Product.find({
      _id: { $nin: excludeList },
      type_id: { $in: productTypes }
    })
      .limit(limit)
      .lean();

    return products.map(product => ({
      product_id: product._id.toString(),
      product: product,
      score: 0,
      isFallback: true
    }));
  }

  /**
   * Get statistics about recommendations for a product
   */
  async getRecommendationStats(productId) {
    const count = await ProductRecommendation.countDocuments({
      source_product_id: productId
    });

    const topRec = await ProductRecommendation.findOne({
      source_product_id: productId
    }).sort({ score: -1 });

    return {
      total_recommendations: count,
      top_score: topRec?.score || 0
    };
  }
}

module.exports = new RecommendationService();