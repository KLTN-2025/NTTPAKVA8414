// middleware/chatbotRateLimiter.js

const rateLimit = require('express-rate-limit');

const chatbotRateLimiter = rateLimit({
  windowMs: parseInt(process.env.CHATBOT_RATE_WINDOW_MS) || 60 * 1000, // 1 minute
  max: parseInt(process.env.CHATBOT_RATE_LIMIT) || 20, // 20 requests per window
  
  // Use IP address as key
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
  
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'rate_limit',
      message: "Rate limit exceeded",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
  
  standardHeaders: true,
  legacyHeaders: false,
  
  skip: (req) => {
    return false;
  },
});

/**
 * Simple in-memory rate limiter 
 */
class SimpleRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000;
    this.maxRequests = options.max || 20;
    this.requests = new Map();
    
    setInterval(() => this.cleanup(), this.windowMs);
  }
  
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now - data.windowStart > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }
  
  isRateLimited(key) {
    const now = Date.now();
    const data = this.requests.get(key);
    
    if (!data || now - data.windowStart > this.windowMs) {
      this.requests.set(key, { windowStart: now, count: 1 });
      return { limited: false, remaining: this.maxRequests - 1 };
    }
    
    if (data.count >= this.maxRequests) {
      const resetIn = this.windowMs - (now - data.windowStart);
      return { limited: true, remaining: 0, resetIn };
    }
    
    data.count++;
    return { limited: false, remaining: this.maxRequests - data.count };
  }
  
  middleware() {
    return (req, res, next) => {
      const key = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const result = this.isRateLimited(key);
      
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      
      if (result.limited) {
        res.setHeader('Retry-After', Math.ceil(result.resetIn / 1000));
        return res.status(429).json({
          success: false,
          error: 'rate_limit',
          message: "Rate limited exceeded",
          retryAfter: Math.ceil(result.resetIn / 1000),
        });
      }
      
      next();
    };
  }
}

// Export both options
module.exports = {
  chatbotRateLimiter,
  SimpleRateLimiter,
};