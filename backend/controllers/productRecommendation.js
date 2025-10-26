const recommendationService = require('../services/productRecommendation');
const RecommendationComputer = require('../scripts/computeRecommendation');

exports.getProductRecommendations = async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 5 } = req.query;

    
    const recommendations = await recommendationService.getRecommendations(
      productId,
      parseInt(limit)
    );

    res.status(200).json({
      success: true,
      product_id: productId,
      recommendations: recommendations
    });
  } catch (error) {
    console.error('Error in getProductRecommendations:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get recommendations'
    });
  }
};

exports.triggerRecomputation = async (req, res) => {
  try {
    const computer = new RecommendationComputer();
    const result = await computer.computeAllRecommendations();

    res.status(200).json({
      success: true,
      message: 'Recommendations recomputed successfully',
      stats: result.stats
    });
  } catch (error) {
    console.error('Error in triggerRecomputation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to recompute recommendations'
    });
  }
};

exports.getRecommendationStats = async (req, res) => {
  try {
    const computer = new RecommendationComputer();
    const stats = await computer.getStats();

    res.status(200).json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error in getRecommendationStats:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get stats'
    });
  }
};