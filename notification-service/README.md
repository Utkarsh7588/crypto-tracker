# Notification Service

The Notification Service is responsible for sending email notifications to users based on events from other services, such as portfolio updates.

## Features

- **Event Driven**: Consumes messages from Kafka topics (e.g., portfolio updates).
- **Email Notifications**: Sends emails using Nodemailer.
- **Service Discovery**: Registers with Consul.
- **Health Check**: Provides a health status endpoint.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Messaging**: Kafka (KafkaJS)
- **Email**: Nodemailer
- **Service Discovery**: Consul

## API Routes

- `GET /health`: Health check endpoint.

## Configuration

Environment variables:

- `PORT`: Service port (default: 3004)
- `KAFKA_BROKERS`: Kafka broker addresses
- `CONSUL_HOST`: Consul agent host
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password

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
