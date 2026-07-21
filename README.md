# GoPool

GoPool is a full-stack corporate carpooling platform for employees, fleet coordinators, and administrators. It combines ride discovery, ride publishing, trip tracking, wallet-based payments, and support workflows in one system built around a Node.js/Express backend and a React/Vite frontend.

## Overview

The application is organized as a monorepo with separate frontend and backend packages. The backend exposes the REST API, authentication, trip, ride request, wallet, reporting, and support flows. The frontend provides the employee and admin dashboards, map-based ride flows, and real-time experience powered by Socket.io.

## Key Capabilities

- Employee commute matching with pickup and destination selection.
- Ride publishing for drivers with vehicle registration and seat management.
- Live trip tracking with map updates and real-time telemetry.
- Wallet-based fare handling and transaction history.
- Support messaging and operational notifications.
- Admin tools for employee access, fleet settings, reporting, and organization controls.

## Architecture

### Frontend

- React.js with Vite for fast local development and production builds.
- Tailwind CSS for styling and responsive layouts.
- Framer Motion for animated interactions.
- Leaflet for route and location rendering.
- Zustand for client state management.
- Socket.io client for live updates.

### Backend

- Node.js and Express.js for the API layer.
- MongoDB and Mongoose for persistence and data modeling.
- Socket.io for real-time communication.
- JWT and bcrypt for authentication and password security.
- Zod for request validation.
- Razorpay integration for wallet and payment flows.

## Project Structure

- `backend/` contains the API server, controllers, models, repositories, services, middleware, validators, and seed script.
- `frontend/` contains the Vite application, UI code, and client-side assets.
- `README.md` documents setup, runtime configuration, and project usage.

## Requirements

- Node.js 18 or newer.
- npm.
- MongoDB instance, local or hosted.
- Optional API keys for services such as GraphHopper and Razorpay, depending on the flow you want to use.

## Setup

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure the backend environment

Create a `.env` file in `backend/` with values similar to the following:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/carpool_db
JWT_ACCESS_SECRET=your_jwt_access_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
GRAPHHOPPER_API_KEY=your_graphhopper_api_key
CLIENT_URL=http://localhost:5173
```

### 3. Seed sample data

The backend includes a seed script for local development data.

```bash
cd backend
npm run seed
```

### 4. Run the application

Start the backend and frontend in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

## Available Scripts

### Backend

- `npm start` starts the API server with Node.js.
- `npm run dev` starts the API server with nodemon.
- `npm run seed` loads development data into MongoDB.

### Frontend

- `npm run dev` starts the Vite dev server.
- `npm run build` creates a production build.
- `npm run preview` serves the production build locally.

## Demo Credentials

The repository includes development credentials for local testing.

- Admin account: `admin@odooksv.com` / `password123`
- Employee account: `aarav.sharma@odooksv.com` / `password123`

## Notes

- The frontend expects the backend API to be available at the configured `CLIENT_URL`.
- Real-time features depend on the backend Socket.io server being active.
- Payment and mapping integrations may require valid external service keys before the related flows work end to end.

## Contributing

If you are a contributor on the project, keep changes focused, test the affected flow locally, and avoid committing secrets. For a cleanup like this README update, prefer documenting the actual scripts and runtime assumptions so future contributors can start the app quickly.
