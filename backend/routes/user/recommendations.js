const express = require('express');
const router = express.Router();
const recommendationController = require('../../controllers/productRecommendation');

router.post('/recompute', 
  recommendationController.triggerRecomputation
);

router.get('/stats', 
  recommendationController.getRecommendationStats
);

router.get('/:productId', 
  recommendationController.getProductRecommendations
);

module.exports = router;