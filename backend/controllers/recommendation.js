//controllers/recommendations.js
const mongoose = require("mongoose")
const CustomerOrder = require("../models/CustomerOrders")
const CustomerOrderItem = require("../models/CustomerOrderItems")
const Product = require("../models/Products")
const ProductRecommendation = require("../models/ProductRecommendations")


function getRecencyRatio(orderDate) {
  const now = new Date()
  const diffTime = Math.abs(now - orderDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays <= 30) return 1.0
  if (diffDays <= 90) return 0.8
  if (diffDays <= 120) return 0.5
  return 0.3
}

function generateProductPairs(productIds) {
  const pairs = []
  for (let i = 0; i < productIds.length; i++) {
    for (let j = i + 1; j < productIds.length; j++) {
      pairs.push([productIds[i], productIds[j]])
    }
  }
  return pairs
}

/**
 * Recalculate all product recommendations
 */
async function recalculateRecommendations() {
  const startTime = Date.now()
  console.log("[Recommendations] Starting recalculation...")

  try {
    //1. Fetch all orders from the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const orders = await CustomerOrder.find({
      order_date: { $gte: sixMonthsAgo },
      order_status: { $ne: "cancelled" },
    })
      .select("_id order_date")
      .lean()


    if (orders.length === 0) {
      return { 
        success: true, 
        message: "No orders to process", 
        pairsGenerated: 0 
      }
    }

    const orderIds = orders.map((o) => o._id)
    const orderItems = await CustomerOrderItem.find({
      order_id: { $in: orderIds },
    })
      .select("order_id product_id")
      .lean()

    // Group items by order_id
    const orderProductsMap = new Map()
    for (const item of orderItems) {
      const orderId = item.order_id.toString()
      if (!orderProductsMap.has(orderId)) {
        orderProductsMap.set(orderId, [])
      }
      orderProductsMap.get(orderId).push(item.product_id)
    }

    // Create a map of order_id -> order_date for quick lookup
    const orderDateMap = new Map()
    for (const order of orders) {
      orderDateMap.set(order._id.toString(), order.order_date)
    }

    // Step 3: Generate pairs and calculate scores
    const pairScores = new Map()

    for (const [orderId, productIds] of orderProductsMap) {
      // Skip orders with less than 2 products (no pairs possible)
      if (productIds.length < 2) continue

      const orderDate = orderDateMap.get(orderId)
      const recencyRatio = getRecencyRatio(orderDate)

      // Generate all pairs for this order
      const pairs = generateProductPairs(productIds)

      for (const [productA, productB] of pairs) {
        // Normalize pair order (smaller ID first)
        const idA = productA.toString()
        const idB = productB.toString()
        const key = idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`

        // Add score
        const currentScore = pairScores.get(key) || 0
        pairScores.set(key, currentScore + recencyRatio)
      }
    }

    // Step 4: Prepare bulk write operations (symmetrical entries)
    const bulkOps = []
    const now = new Date()

    for (const [key, score] of pairScores) {
      const [idA, idB] = key.split("_")

      bulkOps.push({
        updateOne: {
          filter: {
            source_product_id: new mongoose.Types.ObjectId(idA),
            target_product_id: new mongoose.Types.ObjectId(idB),
          },
          update: {
            $set: {
              score: score,
              last_calculated: now,
            },
          },
          upsert: true,
        },
      })

      bulkOps.push({
        updateOne: {
          filter: {
            source_product_id: new mongoose.Types.ObjectId(idB),
            target_product_id: new mongoose.Types.ObjectId(idA),
          },
          update: {
            $set: {
              score: score,
              last_calculated: now,
            },
          },
          upsert: true,
        },
      })
    }

    // Step 5: Clear stale recommendations (older than current calculation)
    // and insert/update new ones
    if (bulkOps.length > 0) {
      // Execute bulk upsert
      await ProductRecommendation.bulkWrite(bulkOps)

      // Remove stale entries (not updated in this run)
      await ProductRecommendation.deleteMany({
        last_calculated: { $lt: now },
      })
    }
    const duration = Date.now() - startTime

    return {
      success: true,
      message: "Recommendations recalculated successfully",
      stats: {
        ordersProcessed: orders.length,
        pairsGenerated: pairScores.size,
        entriesWritten: bulkOps.length,
        duration: `${duration}ms`,
      },
    }
  } catch (error) {
    throw error
  }
}

/**
 * GET /api/products/:productId/recommendations
 * Get product recommendations for a specific product
 * Returns top 5 recommended products based on co-purchase score
 * Falls back to same-category products if not enough recommendations
 */
async function getRecommendations(req, res) {
  try {
    const { productId } = req.params

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      })
    }

    // Verify product exists and get its category info
    const product = await Product.findById(productId)
      .select("type_id name")
      .populate("type_id", "category_id")
      .lean()

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      })
    }

    // Fetch top recommendations from co-purchase data
    const recommendations = await ProductRecommendation.find({
      source_product_id: productId,
    })
      .sort({ score: -1 })
      .limit(5)
      .populate({
        path: "target_product_id",
        select: "name slug selling_price image_urls current_stock type_id",
        populate: {
          path: "type_id",
          select: "name category_id",
        },
      })
      .lean()

    // Extract valid recommended products
    let recommendedProducts = recommendations
      .filter((r) => r.target_product_id) // Filter out any null references
      .map((r) => ({
        _id: r.target_product_id._id,
        name: r.target_product_id.name,
        selling_price: r.target_product_id.selling_price,
        image_url: r.target_product_id.image_urls?.[0] || null,
        in_stock: r.target_product_id.current_stock > 0,
        type: r.target_product_id.type_id?.name || null,
        score: r.score,
        source: "co-purchase",
      }))

    // If less than 5, fill with same-category products
    if (recommendedProducts.length < 5) {
      const existingIds = [
        productId,
        ...recommendedProducts.map((p) => p._id.toString()),
      ]

      const neededCount = 5 - recommendedProducts.length
      const categoryId = product.type_id?.category_id

      if (categoryId) {
        const sameCategoryProducts = await Product.aggregate([
          {
            $lookup: {
              from: "producttypes",
              localField: "type_id",
              foreignField: "_id",
              as: "productType",
            },
          },
          { $unwind: "$productType" },
          {
            $match: {
              "productType.category_id": categoryId,
              _id: { $nin: existingIds.map((id) => new mongoose.Types.ObjectId(id)) },
              current_stock: { $gt: 0 }, 
            },
          },
          {
            $sample: { size: neededCount }, 
          },
          {
            $project: {
              name: 1,
              selling_price: 1,
              image_url: { $arrayElemAt: ["$image_urls", 0] },
              in_stock: { $gt: ["$current_stock", 0] },
              type: "$productType.name",
            },
          },
        ])

        // Add category-based recommendations
        const categoryRecommendations = sameCategoryProducts.map((p) => ({
          ...p,
          score: null,
          source: "same-category",
        }))

        recommendedProducts = [...recommendedProducts, ...categoryRecommendations]
      }
    }

    return res.status(200).json({
      success: true,
      data: recommendedProducts.slice(0, 5),
      meta: {
        productId: productId,
        totalRecommendations: recommendedProducts.length,
        coPurchaseCount: recommendedProducts.filter((p) => p.source === "co-purchase").length,
        categoryFillCount: recommendedProducts.filter((p) => p.source === "same-category").length,
      },
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error occurred",
    })
  }
}

/**
 * POST /api/recommendations/recalculate
 * Manual trigger for recalculation 
 */
async function triggerRecalculation(req, res) {
  try {
    const result = await recalculateRecommendations()
    return res.status(200).json(result)
  } catch (error) {
    console.error("triggerRecalculation error:", error)
    return res.status(500).json({
      success: false,
      message: "Recalculation failed",
      error: error.message,
    })
  }
}

/**
 * GET /api/recommendations/stats
 * Get statistics about current recommendations
 */
async function getRecommendationStats(req, res) {
  try {
    const totalEntries = await ProductRecommendation.countDocuments()
    
    const scoreStats = await ProductRecommendation.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: "$score" },
          maxScore: { $max: "$score" },
          minScore: { $min: "$score" },
        },
      },
    ])

    const lastCalculated = await ProductRecommendation.findOne()
      .sort({ last_calculated: -1 })
      .select("last_calculated")
      .lean()

    // Count products with recommendations
    const productsWithRecs = await ProductRecommendation.distinct("source_product_id")

    return res.status(200).json({
      success: true,
      data: {
        totalEntries: totalEntries,
        uniqueProductsWithRecommendations: productsWithRecs.length,
        scoreStats: scoreStats[0] || { avgScore: 0, maxScore: 0, minScore: 0 },
        lastCalculated: lastCalculated?.last_calculated || null,
      },
    })
  } catch (error) {
    console.error("getRecommendationStats error:", error)
    return res.status(500).json({
      success: false,
      message: "Server error occurred",
    })
  }
}

module.exports = {
  recalculateRecommendations,
  getRecommendations,
  triggerRecalculation,
  getRecommendationStats,
}