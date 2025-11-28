# Crypto Tracker Frontend

The frontend application for the Crypto Tracker microservices project. It provides a user interface for viewing cryptocurrency prices, managing portfolios, and receiving real-time updates.

## Features

- **Real-time Dashboard**: Displays live cryptocurrency prices updated via WebSockets.
- **Portfolio Management**: View holdings, transaction history, and portfolio performance.
- **User Authentication**: Login and registration functionality.
- **Responsive Design**: Built with Tailwind CSS for a modern, responsive UI.

## Tech Stack

- **Framework**: React (with Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State/API**: Axios, Socket.io-client
- **Icons**: Lucide React

## Configuration

The application connects to the backend API Gateway.
Update `.env` (or create `.env.local`) to configure the API URL:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3005
```

## Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```
