# API Gateway

The API Gateway is the entry point for all client requests in the crypto-tracker microservices architecture. It handles routing, authentication, rate limiting, and service discovery.

## Features

- **Dynamic Routing**: Routes requests to appropriate microservices based on the URL path (`/api/:service/*`).
- **Service Discovery**: Integrates with Consul to dynamically discover service instances.
- **Load Balancing**: Distributes traffic across available service instances.
- **Authentication**: Validates JWT tokens for protected routes and injects user identity (`x-user-id`) into headers for downstream services.
- **Rate Limiting**:
  - Global rate limits to prevent abuse.
  - Stricter limits for authentication endpoints.
  - User-specific rate limits for authenticated users.
- **Security**: Implements security headers and best practices.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Proxy**: http-proxy-middleware
- **Service Discovery**: Consul
- **Caching/State**: Redis
- **Authentication**: JSON Web Tokens (JWT)

## API Routes

The gateway exposes the following route pattern:

`GET/POST/PUT/DELETE /api/:service_name/:resource`

### Examples:

- **Auth Service**: `/api/auth-service/login` -> Routes to `auth-service` at `/login`
- **Price Service**: `/api/price-service/prices` -> Routes to `price-service` at `/prices`
- **Portfolio Service**: `/api/portfolio-service/holdings` -> Routes to `portfolio-service` at `/holdings`

### Public Routes (No Auth Required)
- `/health`: Health check endpoint.
- `/api/auth-service/*`: Authentication routes (login, register).

## Configuration

The service is configured via environment variables (typically in `.env` or Docker environment):

- `PORT`: Server port (default: 3000)
- `CONSUL_HOST`: Consul agent host
- `REDIS_HOST`: Redis server host
- `JWT_SECRET`: Secret key for token verification

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the service:
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```
