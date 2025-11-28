const express = require('express');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const { startPortfolioConsumer } = require('./src/consumers/portfolioConsumer');
const { connectKafka } = require('./src/config/kafka');
const serviceRegistry = require('./src/utils/serviceRegistry');

const app = express();
const PORT = process.env.PORT || 3004;
const SERVICE_NAME = 'notification-service';
const SERVICE_ID = `${SERVICE_NAME}-${os.hostname()}`;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const instanceId = os.hostname();
    console.log(`[${instanceId}] 📥 ${req.method} ${req.url}`);
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: SERVICE_NAME });
});

// Start Server
const startServer = async () => {
    // Connect Kafka
    await connectKafka();
    // Start Consumer
    await startPortfolioConsumer();

    const server = app.listen(PORT, async () => {
        console.log(`🚀 Notification Service running on port ${PORT}`);

        try {
            await serviceRegistry.registerService({
                name: SERVICE_NAME,
                port: PORT,
                address: process.env.SERVICE_ADDRESS || 'localhost',
                tags: ['notification', 'crypto']
            });
        } catch (error) {
            console.error('❌ Consul registration failed:', error);
        }
    });

    // Graceful Shutdown
    const shutdown = async () => {
        console.log('🛑 Shutting down...');
        await serviceRegistry.deregisterService(SERVICE_ID);
        server.close();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

startServer();
