// src/routes/health.js
const express = require('express');
const router = express.Router();
const consulClient = require('../utils/consulClient');

// Basic health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Detailed health check with service discovery status
router.get('/health/detailed', async (req, res) => {
  try {
    // Check registered services
    const services = await consulClient.getAllServiceInstances('auth-service');
    
    const healthStatus = {
      status: 'OK',
      service: 'api-gateway',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        'auth-service': {
          instances: services.length,
          healthy: services.length > 0 ? 'YES' : 'NO'
        }
      }
    };

    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      service: 'api-gateway',
      error: error.message
    });
  }
});

// Service discovery status
router.get('/services', async (req, res) => {
  try {
    const services = await consulClient.getAllServiceInstances('auth-service');
    
    res.json({
      discovered_services: {
        'auth-service': services
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to discover services',
      message: error.message
    });
  }
});

module.exports = router;