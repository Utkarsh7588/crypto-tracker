const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const os = require('os');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const { verifyTransporter } = require('./src/utils/emailutils');
const { producer } = require('./src/config/kafka');
const { startEmailConsumer } = require('./src/consumers/emailConsumer');
const serviceRegistry = require('./src/utils/serviceRegistry');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware with Instance ID
app.use((req, res, next) => {
  const instanceId = os.hostname();
  console.log(`[${instanceId}] 📥 Handling request: ${req.method} ${req.url}`);
  res.on('finish', () => {
    console.log(`[${instanceId}] 📤 Completed request: ${req.method} ${req.url} - ${res.statusCode}`);
  });
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_auth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Verify email transporter
verifyTransporter();

// Initialize Kafka Producer
const initializeKafka = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connected successfully');
  } catch (error) {
    console.error('❌ Kafka producer connection error:', error);
  }
};

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint - Enhanced for Consul
app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    service: 'Auth Service',
    instanceId: os.hostname(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    kafka: producer ? 'connected' : 'disconnected'
  };

  const statusCode = healthStatus.database === 'connected' ? 200 : 503;

  res.status(statusCode).json(healthStatus);
});

// Enhanced health check for Consul (more detailed)
app.get('/health/detailed', (req, res) => {
  const healthCheck = {
    status: 'OK',
    service: 'Auth Service',
    instanceId: os.hostname(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      readyState: mongoose.connection.readyState
    },
    memory: process.memoryUsage(),
    kafka: producer ? 'connected' : 'disconnected'
  };

  const isHealthy = healthCheck.database.status === 'connected';
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json(healthCheck);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3001;
const SERVICE_NAME = 'auth-service';
const SERVICE_ID = `${SERVICE_NAME}-${os.hostname()}`;

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\n🛑 Received shutdown signal, shutting down gracefully...');

  try {
    // Deregister from Consul
    await serviceRegistry.deregisterService(SERVICE_ID);
    console.log('✅ Service deregistered from Consul');

    // Disconnect Kafka producer
    if (producer) {
      await producer.disconnect();
      console.log('✅ Kafka producer disconnected');
    }

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');

    console.log('✅ Auth Service shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Start server and services
const startServer = async () => {
  try {
    // Initialize Kafka
    await initializeKafka();

    // Start email consumer
    await startEmailConsumer();

    // Start HTTP server
    const server = app.listen(PORT, async () => {
      console.log(`🚀 Auth Service running on port ${PORT}`);
      console.log(`📧 Email consumer running and listening to Kafka topics`);

      // Register with Consul after server starts
      try {
        await serviceRegistry.registerService({
          id: SERVICE_ID,
          name: SERVICE_NAME,
          port: PORT,
          address: process.env.SERVICE_ADDRESS || 'localhost', // Use environment variable for Docker
          tags: ['authentication', 'user-management', 'kafka']
        });
      } catch (error) {
        console.error('❌ Consul registration failed, but server is running:', error);
      }
    });

    // Handle graceful shutdown
    process.on('SIGINT', gracefulShutdown);
    process.on('SIGTERM', gracefulShutdown);

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();