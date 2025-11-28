# Auth Service

The Auth Service manages user authentication, registration, and email notifications for the crypto-tracker application. It handles user data persistence and communicates with other services via Kafka.

## Features

- **User Management**: User registration and login.
- **Authentication**: Issues and validates JSON Web Tokens (JWT).
- **Email Notifications**: Sends welcome emails and verification codes using Nodemailer.
- **Event Driven**: Consumes email-related events from Kafka topics.
- **Service Discovery**: Automatically registers with Consul for discovery by the API Gateway.
- **Health Checks**: Provides detailed health status for monitoring.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Messaging**: Kafka (KafkaJS)
- **Email**: Nodemailer
- **Service Discovery**: Consul
- **Authentication**: JWT, bcryptjs

## API Routes

Base URL: `/` (Accessed via Gateway at `/api/auth-service/`)

- `POST /register`: Register a new user.
- `POST /login`: Authenticate a user and receive a token.
- `GET /health`: Basic health check.
- `GET /health/detailed`: Detailed health check including database and Kafka status.

## Configuration

Environment variables:

- `PORT`: Service port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `KAFKA_BROKERS`: Kafka broker addresses
- `CONSUL_HOST`: Consul agent host
- `JWT_SECRET`: Secret key for signing tokens
- `EMAIL_USER`: Email service username
- `EMAIL_PASS`: Email service password

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
