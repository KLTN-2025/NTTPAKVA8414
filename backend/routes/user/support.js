// routes/user/support.js
const express = require("express");
const router = express.Router();
const customerSupportController = require("../../controllers/customerSupport");
const { WINDOW_LENGTH, rateLimiter } = require("../../middleware/rateLimiter")

const config = {
  window: 30 * WINDOW_LENGTH.MINUTE, 
  max: 5,                       
  group: "support",
  errorMessage: "Too many inquries sent! Please wait"
}

/**
 * POST /api/support/inquiries
 * Create a new customer inquiry (guests allowed)
 */
router.post(
  "/inquiries",
  rateLimiter(config),
  customerSupportController.createInquiry
);

/**
 * GET /api/support/problem-types
 * Get list of valid problem types (for dropdown)
 */
router.get("/problem-types", customerSupportController.getProblemTypes);

module.exports = router;
