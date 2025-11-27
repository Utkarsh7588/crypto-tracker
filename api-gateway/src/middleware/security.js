// src/middleware/security.js
const helmet = require('helmet');
const cors = require('cors');

const securityMiddleware = (app) => {
  // Basic security headers
  app.use(helmet());

  // CORS configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://192.168.1.36:5173', 'http://192.168.1.35:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
};

module.exports = securityMiddleware;