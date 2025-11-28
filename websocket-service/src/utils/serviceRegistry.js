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
            tags: [...tags],
            check: {
                http: `http://${address}:${port}/health`,
                interval: '10s',
                timeout: '5s',
                notes: `Health check for ${name}`
            }
        };

        try {
            await this.consul.agent.service.register(service);
            console.log(`✅ ${name} registered with Consul on port ${port}`);
        } catch (error) {
            console.error('❌ Failed to register with Consul:', error);
            throw error;
        }
    }

    async deregisterService(serviceId) {
        try {
            await this.consul.agent.service.deregister(serviceId);
            console.log(`✅ Service deregistered from Consul: ${serviceId}`);
        } catch (error) {
            console.error('❌ Failed to deregister from Consul:', error);
        }
    }
}

module.exports = new ServiceRegistry();
