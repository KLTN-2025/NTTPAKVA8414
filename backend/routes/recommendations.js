const express = require('express');
const router = express.Router();
const recommendationController = require('../controllers/productRecommendation');

// Trigger manual recomputation
router.post('/recompute', 
  recommendationController.triggerRecomputation
);

// Query recommendation system statistics
router.get('/stats', 
  recommendationController.getRecommendationStats
);

// Query recommendations for a product
router.get('/:productId', 
  recommendationController.getProductRecommendations
);

module.exports = router;