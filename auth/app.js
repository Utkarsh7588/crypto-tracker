const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');
const { verifyTransporter } = require('./src/utils/emailutils');
const { producer } = require('./src/config/kafka');
const { startEmailConsumer } = require('./src/consumers/emailConsumer');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'Auth Service',
    timestamp: new Date().toISOString()
  });
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

// Start server and services
const startServer = async () => {
  try {
    // Initialize Kafka
    await initializeKafka();
    
    // Start email consumer
    await startEmailConsumer();
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Auth Service running on port ${PORT}`);
      console.log(`📧 Email consumer running and listening to Kafka topics`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();