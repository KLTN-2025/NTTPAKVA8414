// routes/chatbot.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/chatbot');
const rateLimit = require('express-rate-limit')

const chatbotLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 min
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ success: false, message: 'You are posting questions too fast. Wait a while before posting again' })
  });

/**
 * GET /api/chatbot/greeting
 * Get initial greeting message
 */
router.get('/greeting', chatbotController.getGreeting);

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
router.post('/message', chatbotLimiter, chatbotController.handleMessage);

module.exports = router;