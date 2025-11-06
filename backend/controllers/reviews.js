const mongoose = require("mongoose");
const Product = require("../models/Products");
const Customer = require("../models/Customers");
const Review = require("../models/Reviews");

exports.fetchSingleProductReviews = async (req, res) => {
  try {
    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 5);
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product id" });
    }
    const pid = new mongoose.Types.ObjectId(id);

    const agg = await Review.aggregate([
      { $match: { product_id: pid } },

      {
        $facet: {
          // overall stats (avg rating and total count)
          stats: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 },
              },
            },
          ],

          // breakdown by rating value (1..5)
          breakdown: [
            {
              $group: {
                _id: "$rating",
                count: { $sum: 1 },
              },
            },
            { $project: { _id: 0, rating: "$_id", count: 1 } },
            { $sort: { rating: -1 } },
          ],

          // paginated recent reviews
          reviews: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },

            {
              $lookup: {
                from: "Customer",
                localField: "customer_id",
                foreignField: "_id",
                as: "customer",
              },
            },
            {
              $unwind: { path: "$customer", preserveNullAndEmptyArrays: true },
            },

            {
              $project: {
                _id: 1,
                rating: 1,
                comment: 1,
                createdAt: 1,
                "customer._id": 1,
                "customer.name": 1,
              },
            },
          ],
        },
      },

      {
        $project: {
          stats: { $arrayElemAt: ["$stats", 0] },
          breakdown: 1,
          reviews: 1,
        },
      },
    ]);

    const doc = (agg && agg[0]) || {};
    const stats = doc.stats || { avgRating: null, totalReviews: 0 };
    const breakdownArray = doc.breakdown || [];
    const reviews = doc.reviews || [];

    const breakdown = {
      '5': 0,
      '4': 0,
      '3': 0,
      '2': 0,
      '1': 0,
    };
    breakdownArray.forEach((item) => {
      const key = String(item.rating);
      if (breakdown.hasOwnProperty(key)) breakdown[key] = item.count;
    });

    const totalReviews = stats.totalReviews || 0;
    const totalPages = Math.max(1, Math.ceil(totalReviews / limit));

    return res.status(200).json({
      success: true,
      productId: id,
      avgRating:
        stats.avgRating === null ? 0 : Math.round(stats.avgRating * 10) / 10,
      totalReviews,
      breakdown,
      page,
      limit,
      totalPages,
      reviews,
    });
  } catch (err) {
    console.error("GET reviews error", err);
    return res.status(500).json({ message: "Server error" });
  }
};