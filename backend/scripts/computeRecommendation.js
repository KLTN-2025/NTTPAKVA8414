const mongoose = require('mongoose');
const Product = require('../models/Products');
const CustomerOrder = require('../models/CustomerOrders');
const CustomerOrderItem = require('../models/CustomerOrderItems');
const ProductType = require('../models/ProductTypes');
const ProductRecommendation = require('../models/ProductRecommendations');
require('dotenv').config();

class RecommendationComputer {
  constructor() {
    this.DAYS_THRESHOLD = 180;
    this.MIN_SCORE_THRESHOLD = 5.0;
  }

  async computeAllRecommendations() {
    const startTime = Date.now();

    try {
      // Calculate the date threshold (180 days ago)
      const now = new Date();
      const dateThreshold = new Date(now.getTime() - this.DAYS_THRESHOLD * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get all orders within the time window
      const recentOrders = await CustomerOrder.find({
        order_date: { $gte: dateThreshold }
      }).select('_id order_date').lean();

      const orderIds = recentOrders.map(o => o._id);
      const orderDateMap = new Map(
        recentOrders.map(o => [o._id.toString(), o.order_date])
      );

      // Get all order items for these orders with product and category info
      const orderItems = await CustomerOrderItem.aggregate([
        {
          $match: {
            order_id: { $in: orderIds }
          }
        },
        {
          $lookup: {
            from: 'products',
            localField: 'product_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        {
          $lookup: {
            from: 'producttypes',
            localField: 'product.type_id',
            foreignField: '_id',
            as: 'productType'
          }
        },
        { $unwind: '$productType' },
        {
          $project: {
            order_id: 1,
            product_id: 1,
            category_id: '$productType.category_id'
          }
        }
      ]);

      // Group items by order
      const orderItemsMap = new Map();
      orderItems.forEach(item => {
        const orderId = item.order_id.toString();
        if (!orderItemsMap.has(orderId)) {
          orderItemsMap.set(orderId, []);
        }
        orderItemsMap.get(orderId).push({
          product_id: item.product_id.toString(),
          category_id: item.category_id?.toString()
        });
      });

      // Calculate scores for all product pairs
      const pairScores = new Map(); // Key: "sourceId|targetId", Value: score

      let pairsProcessed = 0;
      orderItemsMap.forEach((items, orderId) => {
        if (items.length < 2) return; // Need at least 2 products

        const orderDate = orderDateMap.get(orderId);
        
        // Calculate recency coefficient R
        let R = 1.0;
        if (orderDate < thirtyDaysAgo) {
          const daysOld = (now - orderDate) / (24 * 60 * 60 * 1000);
          // Exponential decay
          R = Math.exp(-0.046 * (daysOld - 30));
        }

        // For each pair of products in the order
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < items.length; j++) {
            if (i === j) continue;

            const sourceProduct = items[i];
            const targetProduct = items[j];

            // Calculate category coefficient cc
            const cc = sourceProduct.category_id !== targetProduct.category_id 
              ? 1.2 
              : 1.0;

            // Calculate h(A, p) for this occurrence
            const h = R * cc;

            // Create bidirectional pairs (A->p and p->A are treated separately)
            const pairKey = `${sourceProduct.product_id}|${targetProduct.product_id}`;
            
            if (pairScores.has(pairKey)) {
              pairScores.set(pairKey, pairScores.get(pairKey) + h);
            } else {
              pairScores.set(pairKey, h);
            }

            pairsProcessed++;
          }
        }
      });

      // Filter pairs with score >= 5.0 and prepare for database insertion
      const recommendationsToInsert = [];
      pairScores.forEach((score, pairKey) => {
        if (score >= this.MIN_SCORE_THRESHOLD) {
          const [sourceId, targetId] = pairKey.split('|');
          recommendationsToInsert.push({
            source_product_id: mongoose.Types.ObjectId(sourceId),
            target_product_id: mongoose.Types.ObjectId(targetId),
            score: score,
            last_calculated: now
          });
        }
      });

      // Clear existing recommendations and insert new ones
      if (recommendationsToInsert.length > 0) {
        await ProductRecommendation.deleteMany({});

        // Insert in batches to avoid memory issues
        const batchSize = 1000;
        for (let i = 0; i < recommendationsToInsert.length; i += batchSize) {
          const batch = recommendationsToInsert.slice(i, i + batchSize);
          await ProductRecommendation.insertMany(batch, { ordered: false });
        }
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      return {
        success: true,
        stats: {
          duration_seconds: parseFloat(duration),
          orders_analyzed: orderIds.length,
          pairs_evaluated: pairScores.size,
          recommendations_stored: recommendationsToInsert.length
        }
      };

    } catch (error) {
      console.error('Error computing recommendations:', error);
      throw error;
    }
  }

  /**
   * Get statistics about the current recommendation data
   */
  async getStats() {
    const totalRecommendations = await ProductRecommendation.countDocuments();
    const uniqueSourceProducts = await ProductRecommendation.distinct('source_product_id');
    const avgScore = await ProductRecommendation.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$score' } } }
    ]);
    const lastCalculated = await ProductRecommendation.findOne()
      .sort({ last_calculated: -1 })
      .select('last_calculated');

    return {
      total_recommendations: totalRecommendations,
      unique_source_products: uniqueSourceProducts.length,
      average_score: avgScore[0]?.avgScore || 0,
      last_calculated: lastCalculated?.last_calculated || null
    };
  }
}

// CLI execution
if (require.main === module) {  
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    const computer = new RecommendationComputer();
    try {
      const result = await computer.computeAllRecommendations();
      const stats = await computer.getStats();
      process.exit(0);
    } catch (error) {
      console.error('Fatal error:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
}

module.exports = RecommendationComputer;