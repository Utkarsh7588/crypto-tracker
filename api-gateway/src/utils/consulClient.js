// src/utils/consulClient.js
const Consul = require('consul');

class ConsulClient {
  constructor() {
    this.consul = new Consul({
      host: process.env.CONSUL_HOST || 'localhost',
      port: 8500
    });
  }

  async registerService(serviceConfig) {
    const { name, port, address = 'localhost', tags = [] } = serviceConfig;

    const service = {
      name,
      address,
      port: parseInt(port, 10),
      tags: ['http', ...tags],
      check: {
        http: `http://${address}:${port}/health`,
        interval: '10s',
        timeout: '5s'
      }
    };

    await this.consul.agent.service.register(service);
    console.log(`✅ Service ${name} registered with Consul on port ${port}`);
  }

  async deregisterService(serviceId) {
    await this.consul.agent.service.deregister(serviceId);
    console.log(`✅ Service ${serviceId} deregistered from Consul`);
  }

  async discoverService(serviceName) {
    try {
      const services = await this.consul.agent.services();
      const service = Object.values(services).find(s => s.Service === serviceName);

      if (!service) {
        throw new Error(`Service ${serviceName} not found in Consul`);
      }

      console.log(`🔍 Discovered ${serviceName} at ${service.Address}:${service.Port}`);
      return {
        address: service.Address,
        port: service.Port,
        id: service.ID
      };
    } catch (error) {
      console.error(`❌ Error discovering service ${serviceName}:`, error);
      throw error;
    }
  }

  async getAllServiceInstances(serviceName) {
    try {
      const services = await this.consul.catalog.service.nodes(serviceName);
      console.log(`🔍 Found ${services.length} instances of ${serviceName}`);

      return services.map(service => ({
        id: service.ServiceID,
        address: service.ServiceAddress,
        port: service.ServicePort,
        name: service.ServiceName
      }));
    } catch (error) {
      console.error(`❌ Error discovering service instances for ${serviceName}:`, error);
      return [];
    }
  }

  // Health check for services
  async getHealthyServices(serviceName) {
    try {
      const services = await this.consul.health.service(serviceName);
      return services
        .filter(service => service.Checks.every(check => check.Status === 'passing'))
        .map(service => ({
          id: service.Service.ID,
          address: service.Service.Address,
          port: service.Service.Port,
          name: service.Service.Service
        }));
    } catch (error) {
      console.error(`❌ Error getting healthy services for ${serviceName}:`, error);
      return [];
    }
  }
}

module.exports = new ConsulClient();