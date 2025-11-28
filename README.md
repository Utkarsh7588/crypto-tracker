# Crypto Tracker Microservices

A comprehensive cryptocurrency tracking application built with a microservices architecture. This system allows users to track real-time crypto prices, manage their portfolios, and receive notifications.

## Architecture

The project is composed of several microservices communicating via Kafka and REST APIs, orchestrated by Docker Compose.

### Services

- **API Gateway** (`api-gateway`): Entry point for all client requests. Handles routing, authentication verification, and rate limiting.
  - Port: `3000`
- **Auth Service** (`auth-service`): Manages user authentication (signup, login) and JWT issuance.
  - Port: `3001` (Internal, scalable)
- **Portfolio Service** (`portfolio-service`): Manages user portfolios, transactions, and holdings.
  - Port: `3003` (Internal)
- **Price Service** (`price-service`): Fetches and streams real-time cryptocurrency prices.
  - Port: `3002` (Internal)
- **Notification Service** (`notification-service`): Handles email notifications for user events.
  - Port: `3004` (Internal)
- **WebSocket Service** (`websocket-service`): Provides real-time updates to the frontend via WebSockets.
  - Port: `3005`
- **Frontend** (`frontend`): React/Vite application for the user interface.

### Infrastructure

- **Consul**: Service discovery.
- **Kafka**: Event streaming and inter-service communication.
- **Redis**: Caching and session management (used by API Gateway).
- **MongoDB**: Primary database for Auth and Portfolio services.
- **Zookeeper**: Manages Kafka brokers.

## Prerequisites

- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18+ recommended for local development)

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd node-microservices
```

### 2. Environment Setup

The services are configured to work out-of-the-box with Docker Compose. However, for production, you should update the `JWT_SECRET` in `docker-compose.yml`.

### 3. Run with Docker Compose

Start all backend services and infrastructure:

```bash
docker-compose up --build
```

This command will:
- Start all databases (MongoDB, Redis).
- Start the message broker (Kafka, Zookeeper).
- Register services with Consul.
- Start all microservices.

Wait for the `kafka-setup` container to complete topic creation.

### 4. Run the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port).

## API Documentation

The API Gateway is exposed at `http://localhost:3000`.

### Common Endpoints

- **Auth**:
  - `POST /api/auth/signup`
  - `POST /api/auth/login`
- **Portfolio**:
  - `GET /api/portfolio`
  - `POST /api/portfolio/transaction`
- **Prices**:
  - `GET /api/prices`

## Monitoring

- **Consul UI**: `http://localhost:8500` - View registered services and their health.
- **Kafka UI**: `http://localhost:8080` - Monitor Kafka topics and messages.

## Development

To add a new service:
1. Create the service directory.
2. Add a `Dockerfile`.
3. Register the service in `docker-compose.yml`.
4. Ensure it registers with Consul on startup.
