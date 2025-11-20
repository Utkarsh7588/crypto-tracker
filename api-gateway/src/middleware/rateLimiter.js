// src/middleware/rateLimiter.js
const redisConfig = require('../config/redis');

class RateLimiter {
  constructor() {
    // Redis client will be retrieved when needed
  }

  limit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests, please try again later.',
      skip = () => false
    } = options;

    return async (req, res, next) => {
      if (skip(req)) return next();

      const key = `rate_limit:${req.ip}:${req.path}`;

      try {
        const redis = redisConfig.getClient();
        const current = await redis.incr(key);

        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }

        const remaining = Math.max(0, max - current);

        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': remaining,
          'X-RateLimit-Reset': Math.ceil(Date.now() / 1000) + Math.ceil(windowMs / 1000)
        });

        if (current > max) {
          return res.status(429).json({
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        // If Redis fails, allow the request
        next();
      }
    };
  }

  // Per-user rate limiting
  userLimit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000,
      max = 50,
      message = 'Too many requests, please try again later.'
    } = options;

    return async (req, res, next) => {
      if (!req.user) {
        return next();
      }

      const key = `rate_limit:user:${req.user.id}:${req.path}`;

      try {
        const redis = redisConfig.getClient();
        const current = await redis.incr(key);

        if (current === 1) {
          await redis.expire(key, Math.ceil(windowMs / 1000));
        }

        const remaining = Math.max(0, max - current);

        res.set({
          'X-RateLimit-Limit': max,
          'X-RateLimit-Remaining': remaining
        });

        if (current > max) {
          return res.status(429).json({
            error: message,
            retryAfter: Math.ceil(windowMs / 1000)
          });
        }

        next();
      } catch (error) {
        console.error('User rate limiting error:', error);
        next();
      }
    };
  }
}

module.exports = new RateLimiter();