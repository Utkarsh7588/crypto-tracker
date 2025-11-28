# WebSocket Service

The WebSocket Service provides real-time updates to the frontend application. It consumes events from Kafka (such as price updates and portfolio changes) and pushes them to connected clients via WebSockets.

## Features

- **Real-time Updates**: Pushes data to clients instantly using Socket.io.
- **Event Driven**: Consumes messages from Kafka topics.
- **Room Support**: Allows users to join specific rooms (e.g., for personal portfolio updates).
- **Service Discovery**: Registers with Consul.
- **Health Check**: Provides health status endpoint.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js (for health check)
- **WebSockets**: Socket.io
- **Messaging**: Kafka (KafkaJS)
- **Service Discovery**: Consul

## API Routes

- `GET /health`: Health check endpoint.

## WebSocket Events

### Client -> Server
- `join`: Join a room (e.g., user ID) to receive personal updates.

### Server -> Client
- `price_update`: Real-time cryptocurrency price updates.
- `portfolio_update`: Updates on portfolio changes (balance, transactions).

## Configuration

Environment variables:

- `PORT`: Service port (default: 3005)
- `KAFKA_BROKERS`: Kafka broker addresses
- `CONSUL_HOST`: Consul agent host

## Running Locally

1. Ensure Kafka is running.
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
