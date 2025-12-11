// routes/chatbot.js
const express = require("express");
const router = express.Router();
const chatbotController = require("../../controllers/chatbot");
const { WINDOW_LENGTH, rateLimiter } = require("../../middleware/rateLimiter");

const config = {
  window: 1 * WINDOW_LENGTH.MINUTE,
  max: 10,
  group: "chatbot",
  errorMessage: "Too many messages sent! Please wait",
};

/**
 * GET /api/chatbot/greeting
 * Get initial greeting message
 */
router.get("/greeting", chatbotController.getGreeting);

/**
 * POST /api/chatbot/message
 * Handle incoming chat message
 *
 * Request body:
 * {
 *   message: string,
 *   conversationHistory: Array<{role: string, content: string}>,
 *   currentFlow: 'nutrition' | 'recipe' | null,
 *   flowState: Object
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   reply: string,
 *   currentFlow: 'nutrition' | 'recipe' | null,
 *   flowState: Object,
 *   suggestions: Array<string> | null,
 *   action: Object | null
 * }
 */
router.post("/message", rateLimiter(config), chatbotController.handleMessage);

module.exports = router;
