// middleware/rateLimiter.js
const { redis } = require("../config/redis");

exports.WINDOW_LENGTH = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 1000 * 60,
  HOUR: 1000 * 60 * 60,
  DAY: 1000 * 60 * 60 * 24,
};

/**
 * Customizable Redis-based sliding window rate limiter
 * @param {Number} window - window in ms, default 60'000ms (1 min)
 * @param {Number} max - max number of requests allowed within the window, default 100
 * @param {String} group - name of API group
 * @param {Function} keyGenerator - function to get IP/ID
 * @param {String} errorMessage - customizable error message
 */
exports.rateLimiter = (config) => {
  return async function (req, res, next) {
    const {
      window = 60000,
      max = 100,
      group = "default",
      keyGenerator = (req) => req.userId || req.ip,
      errorMessage = "Rate limit exceeded",
    } = config;

    const userKey = keyGenerator(req);
    const redisKey = `ratelimiter:${group}:${userKey}`;

    const now = Date.now();
    const windowStart = now - window;

    try {
      await redis.zRemRangeByScore(redisKey, 0, windowStart);

      const requestCount = await redis.zCard(redisKey);

      if (requestCount >= max) {
        return res.status(429).json({
          success: false,
          message: errorMessage,
        });
      }

      // Add the new request with timestamp as score
      await redis.zAdd(redisKey, [
        {
          score: now,
          value: `${now}-${Math.random()}`,
        },
      ]);

      // Ensure the key expires
      await redis.expire(redisKey, Math.ceil(window / 1000) * 2);

      return next();
    } catch (err) {
      return next();
    }
  };
}
