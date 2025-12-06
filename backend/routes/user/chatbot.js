// routes/chatbot.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/chatbot');

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
router.post('/message', chatbotController.handleMessage);

module.exports = router;