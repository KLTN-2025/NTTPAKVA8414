//routes/recommendations.js
const express = require("express");
const router = express.Router();
const {
  triggerRecalculation,
  getRecommendationStats,
} = require('../../controllers/recommendation');


// POST /api/admin/recommendations/recalculate
// Manually trigger recommendation recalculation
router.post(
  "/recalculate",
  triggerRecalculation
);

// GET /api/admin/recommendations/stats
// Get recommendation system statistics
router.get(
  "/stats",
  getRecommendationStats
);

module.exports = router;