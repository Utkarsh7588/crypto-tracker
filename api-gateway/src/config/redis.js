// src/config/redis.js
const redis = require('redis');

class RedisConfig {
  constructor() {
    this.client = null;
  }

  async connect() {
    this.client = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
      },
      password: process.env.REDIS_PASSWORD || null
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      console.log('Connected to Redis');
    });

    await this.client.connect();
    return this.client;
  }

  getClient() {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }
}

module.exports = new RedisConfig();