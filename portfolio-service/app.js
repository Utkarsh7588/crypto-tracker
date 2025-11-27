const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const portfolioRoutes = require('./src/routes/portfolio');
const { startPriceConsumer } = require('./src/consumers/priceConsumer');
const { connectKafka } = require('./src/config/kafka');
const serviceRegistry = require('./src/utils/serviceRegistry');

const app = express();
const PORT = process.env.PORT || 3003;
const SERVICE_NAME = 'portfolio-service';
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

// Database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_portfolio', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/portfolio', portfolioRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: SERVICE_NAME,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Start Server
const startServer = async () => {
    // Connect Kafka
    await connectKafka();
    // Start Consumer
    await startPriceConsumer();

    const server = app.listen(PORT, async () => {
        console.log(`🚀 Portfolio Service running on port ${PORT}`);

        try {
            await serviceRegistry.registerService({
                name: SERVICE_NAME,
                port: PORT,
                address: process.env.SERVICE_ADDRESS || 'localhost',
                tags: ['portfolio', 'crypto']
            });
        } catch (error) {
            console.error('❌ Consul registration failed:', error);
        }
    });

    // Graceful Shutdown
    const shutdown = async () => {
        console.log('🛑 Shutting down...');
        await serviceRegistry.deregisterService(SERVICE_ID);
        await mongoose.connection.close();
        server.close();
        process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
};

startServer();
