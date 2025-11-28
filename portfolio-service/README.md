# Portfolio Service

The Portfolio Service manages user cryptocurrency portfolios, tracking holdings and transactions. It listens for price updates to calculate portfolio values.

## Features

- **Portfolio Management**: CRUD operations for user portfolios.
- **Transaction Tracking**: Records buy/sell transactions.
- **Real-time Valuation**: Consumes price updates from Kafka to update portfolio values.
- **Service Discovery**: Registers with Consul.
- **Health Check**: Provides health status including database connection.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Messaging**: Kafka (KafkaJS)
- **Service Discovery**: Consul

## API Routes

Base URL: `/portfolio` (Accessed via Gateway at `/api/portfolio-service/portfolio`)

- `GET /`: Get user's portfolio.
- `POST /transaction`: Add a new transaction (buy/sell).
- `GET /health`: Health check endpoint.

## Configuration

Environment variables:

- `PORT`: Service port (default: 3003)
- `MONGODB_URI`: MongoDB connection string
- `KAFKA_BROKERS`: Kafka broker addresses
- `CONSUL_HOST`: Consul agent host

## Running Locally

1. Ensure MongoDB and Kafka are running.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the service:
   ```bash
   npm start
   ```
   Or for development:
   ```bash
   npm run dev
   ```
