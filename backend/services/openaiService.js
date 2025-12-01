// services/openaiService.js
const OpenAI = require('openai');
require('dotenv').config()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const DEFAULT_MODEL = 'gpt-4o-mini';
const DEFAULT_MAX_TOKENS = 1500;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Send a chat completion request to OpenAI
 */
async function chat({
  systemPrompt,
  messages,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
  temperature = DEFAULT_TEMPERATURE,
  jsonMode = false,
}) {
  try {
    const requestMessages = [];
    
    // Add system prompt
    if (systemPrompt) {
      requestMessages.push({
        role: 'system',
        content: systemPrompt,
      });
    }
    
    // Add conversation messages
    if (messages && messages.length > 0) {
      requestMessages.push(...messages);
    }
    
    const requestOptions = {
      model,
      messages: requestMessages,
      max_tokens: maxTokens,
      temperature,
    };
    
    // Enable JSON mode if requested
    if (jsonMode) {
      requestOptions.response_format = { type: 'json_object' };
    }
    
    const response = await openai.chat.completions.create(requestOptions);
    
    const content = response.choices[0]?.message?.content || '';
    
    return {
      success: true,
      content,
      usage: response.usage,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    
    // Handle specific error types
    if (error.code === 'insufficient_quota') {
      return {
        success: false,
        content: '',
        error: 'API quota exceeded. Please try again later.',
      };
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return {
        success: false,
        content: '',
        error: 'Too many requests. Please wait a moment.',
      };
    }
    
    return {
      success: false,
      content: '',
      error: error.message || 'Failed to get response from AI.',
    };
  }
}

/**
 * Parse JSON from GPT response, handling potential markdown code blocks
 */
function parseJsonResponse(content) {
  if (!content) return null;
  
  try {
    return JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        return null;
      }
    }
    
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        return null;
      }
    }
    
    return null;
  }
}

/**
 * Translate text from one language to English using GPT
 */
async function translateToEnglish(text) {
  const result = await chat({
    systemPrompt: `You are a translator. Translate the following text to English. 
If the text is already in English, return it as-is.
Only return the translated text, nothing else.`,
    messages: [{ role: 'user', content: text }],
    temperature: 0.3,
    maxTokens: 200,
  });
  
  if (!result.success) {
    return { success: false, translation: text, error: result.error };
  }
  
  return { success: true, translation: result.content.trim() };
}

/**
 * Determine user intent from message
 */
async function detectIntent(message, currentFlow) {
  const systemPrompt = `You are an intent classifier for a health food chatbot.
The chatbot has two main features:
1. "nutrition" - Nutrition guidance based on user's health data
2. "recipe" - Recipe building and ingredient shopping

Analyze the user's message and determine their intent.
Possible intents:
- "nutrition": User wants nutrition advice, diet plans, calorie info
- "recipe": User wants to cook something, find recipes, get ingredients
- "restart": User wants to start over or reset the conversation
- "continue": User is answering a question in the current flow
- "out_of_scope": User is asking something unrelated

Current flow: ${currentFlow || 'none'}

Respond in JSON format:
{
  "intent": "nutrition|recipe|restart|continue|out_of_scope",
  "confidence": 0.0-1.0,
  "reason": "brief explanation"
}`;

  const result = await chat({
    systemPrompt,
    messages: [{ role: 'user', content: message }],
    temperature: 0.3,
    maxTokens: 150,
    jsonMode: true,
  });
  
  if (!result.success) {
    return { intent: 'continue', confidence: 0.5 };
  }
  
  const parsed = parseJsonResponse(result.content);
  return parsed || { intent: 'continue', confidence: 0.5 };
}

module.exports = {
  chat,
  parseJsonResponse,
  translateToEnglish,
  detectIntent,
  DEFAULT_MODEL,
};