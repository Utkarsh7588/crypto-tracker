// src/services/userService.js
const express = require('express');
const consulClient = require('../utils/consulClient');

class UserService {
  constructor(port = 3001) {
    this.app = express();
    this.port = port;
    this.serviceId = `user-service-${port}`;
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(express.json());
    
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        service: 'user-service',
        port: this.port 
      });
    });

    this.app.get('/users/me', (req, res) => {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      
      res.json({ 
        id: userId, 
        name: 'John Doe', 
        email: 'john@example.com',
        service: `user-service-${this.port}`
      });
    });

    this.app.get('/users', (req, res) => {
      const roles = req.headers['x-user-roles']?.split(',') || [];
      if (!roles.includes('admin')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      res.json([
        { id: 1, name: 'John Doe', service: `user-service-${this.port}` },
        { id: 2, name: 'Jane Smith', service: `user-service-${this.port}` }
      ]);
    });
  }

  async start() {
    this.server = this.app.listen(this.port, async () => {
      console.log(`User service running on port ${this.port}`);
      
      // Register with Consul
      await consulClient.registerService({
        id: this.serviceId,
        name: 'user-service',
        port: this.port,
        address: 'localhost',
        tags: ['api', `port-${this.port}`]
      });
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.stop();
    });
  }

  async stop() {
    if (this.server) {
      await consulClient.deregisterService(this.serviceId);
      this.server.close();
      console.log(`User service on port ${this.port} stopped`);
    }
  }
}

module.exports = UserService;