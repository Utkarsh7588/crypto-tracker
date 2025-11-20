// src/utils/loadBalancer.js
const redisConfig = require('../config/redis');
const consulClient = require('./consulClient');

class LoadBalancer {
  constructor() {
    // Redis client will be retrieved when needed
  }

  async getNextServer(serviceName) {
    try {
      // Get healthy services from Consul
      const instances = await consulClient.getHealthyServices(serviceName);

      if (instances.length === 0) {
        throw new Error(`No healthy instances available for service: ${serviceName}`);
      }

      console.log(`⚖️  Load balancing ${serviceName} across ${instances.length} instances`);

      // Get last used server from Redis
      const redis = redisConfig.getClient();
      const lastUsedKey = `lb:${serviceName}:last`;
      const lastUsedId = await redis.get(lastUsedKey);

      let nextInstance;

      if (lastUsedId) {
        // Find the next instance in round-robin fashion
        const currentIndex = instances.findIndex(inst => inst.id === lastUsedId);
        const nextIndex = (currentIndex + 1) % instances.length;
        nextInstance = instances[nextIndex];
        console.log(`🔄 Round-robin: ${lastUsedId} -> ${nextInstance.id}`);
      } else {
        // First request, use first instance
        nextInstance = instances[0];
        console.log(`🎯 First request, using: ${nextInstance.id}`);
      }

      // Update last used server in Redis
      await redis.set(lastUsedKey, nextInstance.id, {
        EX: 300 // 5 minutes expiration
      });

      const serviceUrl = `http://${nextInstance.address}:${nextInstance.port}`;
      console.log(`📍 Selected instance: ${nextInstance.id} at ${serviceUrl}`);

      return serviceUrl;
    } catch (error) {
      console.error('❌ Load balancing error:', error);
      throw error;
    }
  }

  async getServerWithFallback(serviceName) {
    try {
      return await this.getNextServer(serviceName);
    } catch (error) {
      console.log(`🔄 Fallback: Trying to get any available instance of ${serviceName}`);

      // Fallback: try to get any available instance (even unhealthy)
      const instances = await consulClient.getAllServiceInstances(serviceName);
      if (instances.length > 0) {
        const instance = instances[0];
        const serviceUrl = `http://${instance.address}:${instance.port}`;
        console.log(`🆘 Fallback to: ${instance.id} at ${serviceUrl}`);
        return serviceUrl;
      }

      throw new Error(`No instances available for service: ${serviceName}`);
    }
  }

  // Clear load balancing state for a service
  async clearLoadBalancingState(serviceName) {
    const redis = redisConfig.getClient();
    const key = `lb:${serviceName}:last`;
    await redis.del(key);
    console.log(`🧹 Cleared load balancing state for ${serviceName}`);
  }
}

module.exports = new LoadBalancer();