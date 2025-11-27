// src/utils/serviceRegistry.js
const Consul = require('consul');

const consul = new Consul({
  host: process.env.CONSUL_HOST || 'localhost',
  port: 8500
});

class ServiceRegistry {
  constructor() {
    this.consul = consul;
  }

  async registerService(serviceConfig) {
    const { name, port, address = 'localhost', tags = [] } = serviceConfig;

    const service = {
      name,
      address,
      port: parseInt(port, 10),
      tags: ['http', 'auth', 'microservice', ...tags],
      check: {
        http: `http://${address}:${port}/health`,
        interval: '10s',
        timeout: '5s',
        notes: 'Health check for auth service'
      }
    };

    try {
      await this.consul.agent.service.register(service);
      console.log(`✅ Auth Service registered with Consul on port ${port}`);
    } catch (error) {
      console.error('❌ Failed to register with Consul:', error);
      throw error;
    }
  }

  async deregisterService(serviceId) {
    try {
      await this.consul.agent.service.deregister(serviceId);
      console.log(`✅ Auth Service deregistered from Consul: ${serviceId}`);
    } catch (error) {
      console.error('❌ Failed to deregister from Consul:', error);
    }
  }
}

module.exports = new ServiceRegistry();