# Price Service

The Price Service fetches real-time cryptocurrency prices from external APIs and publishes them to Kafka topics. It also provides endpoints to query current prices.

## Features

- **Price Fetching**: Periodically fetches cryptocurrency prices from external APIs (e.g., CoinGecko).
- **Event Publishing**: Publishes price updates to Kafka for other services to consume.
- **Price API**: Provides REST endpoints to fetch current prices.
- **Service Discovery**: Registers with Consul.
- **Health Check**: Provides health status endpoint.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Messaging**: Kafka (KafkaJS)
- **HTTP Client**: Axios
- **Service Discovery**: Consul

## API Routes

Base URL: `/prices` (Accessed via Gateway at `/api/price-service/prices`)

- `GET /`: Get current prices for supported cryptocurrencies.
- `GET /:coinId`: Get price for a specific coin.
- `GET /health`: Health check endpoint.

## Configuration

Environment variables:

- `PORT`: Service port (default: 3002)
- `KAFKA_BROKERS`: Kafka broker addresses
- `CONSUL_HOST`: Consul agent host
- `COINGECKO_API_URL`: URL for CoinGecko API (optional)

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
