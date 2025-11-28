const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const os = require('os');
require('dotenv').config();

const { startUpdatesConsumer } = require('./src/consumers/updatesConsumer');
const { connectKafka } = require('./src/config/kafka');
const serviceRegistry = require('./src/utils/serviceRegistry');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for demo
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3005;
const SERVICE_NAME = 'websocket-service';
const SERVICE_ID = `${SERVICE_NAME}-${os.hostname()}`;

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // User joins their personal room
    socket.on('join', (userId) => {
        socket.join(userId);
        console.log(`👤 Client ${socket.id} joined room: ${userId}`);
    });

    socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
    });
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
    await startUpdatesConsumer(io);

    server.listen(PORT, async () => {
        console.log(`🚀 WebSocket Service running on port ${PORT}`);

        try {
            await serviceRegistry.registerService({
                name: SERVICE_NAME,
                port: PORT,
                address: process.env.SERVICE_ADDRESS || 'localhost',
                tags: ['websocket', 'crypto']
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
