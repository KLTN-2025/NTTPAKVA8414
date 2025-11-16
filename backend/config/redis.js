// src/config/redis.js
const { createClient } = require('redis');

const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

redis.on('connect', () => {
  console.log('Redis connected');
});

const connectRedis = async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
      console.log('Redis successfully connected');
    }
  } catch (err) {
    console.warn('Redis is not available:', err.message);
  }
};

module.exports = { redis, connectRedis };