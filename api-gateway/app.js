// app.js
require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Config and utils
const redisConfig = require('./src/config/redis');
const consulClient = require('./src/utils/consulClient');
const loadBalancer = require('./src/utils/loadBalancer');

// Middleware
const securityMiddleware = require('./src/middleware/security');
const authMiddleware = require('./src/middleware/auth');
const rateLimiter = require('./src/middleware/rateLimiter');

// Routes
const healthRoutes = require('./src/routes/health');

class APIGateway {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Security middleware
    securityMiddleware(this.app);
    
    // Global rate limiting - more lenient for auth endpoints
    this.app.use(rateLimiter.limit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      skip: (req) => req.path === '/health' || req.path.startsWith('/api/auth/')
    }));

    // Stricter rate limiting for auth endpoints
    this.app.use('/api/auth/*', rateLimiter.limit({
      windowMs: 15 * 60 * 1000,
      max: 10,
      message: 'Too many authentication attempts, please try again later.'
    }));

    // Skip authentication for auth endpoints and health checks
    this.app.use((req, res, next) => {
      if (req.path.startsWith('/api/auth/') || req.path === '/health') {
        return next();
      }
      authMiddleware.authenticate(req, res, next);
    });
    
    // User-specific rate limiting for non-auth endpoints
    this.app.use(rateLimiter.userLimit({
      windowMs: 15 * 60 * 1000,
      max: 50
    }));
  }

  setupRoutes() {
    // Health route
    this.app.use(healthRoutes);

    // Auth service routing
    this.app.use('/api/auth/*', this.routeToAuthService.bind(this));
    
    // Dynamic service routing for other services
    this.app.use('/api/:service/*', this.routeToService.bind(this));
    
    // Fallback route
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Service not found' });
    });
  }

  async routeToAuthService(req, res, next) {
    try {
      // Discover auth service from Consul
      const authServiceUrl = await loadBalancer.getServerWithFallback('auth-service');
      console.log(`🔍 Routing auth request to: ${authServiceUrl}`);
      
      const proxy = createProxyMiddleware({
        target: authServiceUrl,
        changeOrigin: true,
        pathRewrite: {
          '^/api/auth': '/api/auth' // Keep the path as is for your auth server
        },
        onProxyReq: (proxyReq, req) => {
          console.log(`➡️  Proxying ${req.method} ${req.originalUrl} to auth service`);
          // Add additional headers if needed
          proxyReq.setHeader('x-gateway-source', 'api-gateway');
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(`⬅️  Response from auth service: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
          console.error('❌ Auth service proxy error:', err);
          res.status(502).json({ 
            error: 'Authentication service unavailable',
            message: 'Please try again later'
          });
        }
      });

      proxy(req, res, next);
    } catch (error) {
      console.error('❌ Auth service routing error:', error);
      res.status(503).json({ 
        error: 'Authentication service temporarily unavailable',
        message: error.message
      });
    }
  }

  async routeToService(req, res, next) {
    try {
      const serviceName = req.params.service;
      const servicePath = req.params[0] || '';
      
      console.log(`🔍 Discovering service: ${serviceName}`);
      
      // Get service URL using load balancer
      const serviceUrl = await loadBalancer.getServerWithFallback(serviceName);
      console.log(`🔄 Routing to ${serviceName} at: ${serviceUrl}`);
      
      const proxy = createProxyMiddleware({
        target: serviceUrl,
        changeOrigin: true,
        pathRewrite: {
          [`^/api/${serviceName}`]: ''
        },
        onProxyReq: (proxyReq, req) => {
          // Pass user info to downstream services
          if (req.user) {
            proxyReq.setHeader('x-user-id', req.user.id);
            proxyReq.setHeader('x-user-roles', req.user.roles?.join(',') || 'user');
          }
          proxyReq.setHeader('x-gateway-source', 'api-gateway');
          console.log(`➡️  Proxying ${req.method} ${req.originalUrl} to ${serviceName}`);
        },
        onProxyRes: (proxyRes, req, res) => {
          console.log(`⬅️  Response from ${serviceName}: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
          console.error(`❌ ${serviceName} proxy error:`, err);
          res.status(502).json({ error: 'Service unavailable' });
        }
      });

      proxy(req, res, next);
    } catch (error) {
      console.error(`❌ Service routing error for ${req.params.service}:`, error);
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        message: error.message
      });
    }
  }

  async start(port = 3000) {
    // Connect to Redis first
    await redisConfig.connect();
    
    this.server = this.app.listen(port, () => {
      console.log(`🚀 API Gateway running on port ${port}`);
      console.log(`🔍 Service discovery: ENABLED`);
      console.log(`🔒 Authentication: ENABLED`);
      console.log(`📊 Rate limiting: ENABLED`);
      console.log(`⚖️  Load balancing: ENABLED`);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.stop();
    });
  }

  async stop() {
    if (this.server) {
      this.server.close();
      console.log('🛑 API Gateway stopped');
    }
  }
}

// Start the application
async function main() {
  try {
    const gateway = new APIGateway();
    await gateway.start(3000);
    
  } catch (error) {
    console.error('❌ Failed to start API Gateway:', error);
    process.exit(1);
  }
}

// Only start if this is the main module
if (require.main === module) {
  main();
}

module.exports = APIGateway;