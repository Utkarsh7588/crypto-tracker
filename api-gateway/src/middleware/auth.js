// src/middleware/auth.js
const jwt = require('jsonwebtoken');

class AuthMiddleware {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  }

  authenticate = (req, res, next) => {
    // Skip auth for health checks
    if (req.path === '/health' || req.path === '/auth-service/login' || req.path === '/auth-service/verify/email' || req.path === '/auth-service/signup') {
      return next();
    }

    const token = this.extractToken(req);

    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    try {
      const user = jwt.verify(token, this.JWT_SECRET);
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  extractToken(req) {
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  optionalAuth = (req, res, next) => {
    const token = this.extractToken(req);
    if (token) {
      try {
        req.user = jwt.verify(token, this.JWT_SECRET);
      } catch (error) {
        // Invalid token, but continue without user
      }
    }
    next();
  }
}

module.exports = new AuthMiddleware();