// routes/user/support.js
const express = require("express");
const router = express.Router();
const customerSupportController = require("../../controllers/customerSupport");
const rateLimit = require('express-rate-limit')

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) =>
    res
      .status(429)
      .json({ success: false, message: "Too many inquiries. Wait before retrying again" }),
});

/**
 * POST /api/support/inquiries
 * Create a new customer inquiry (guests allowed)
 */
router.post(
  "/inquiries",
  inquiryLimiter,
  customerSupportController.createInquiry
);

/**
 * GET /api/support/problem-types
 * Get list of valid problem types (for dropdown)
 */
router.get("/problem-types", customerSupportController.getProblemTypes);

module.exports = router;
