# COMMUTE.ENT — Enterprise Carpooling & Fleet Management Platform

An enterprise-grade, production-ready carpooling and fleet management system designed for corporate employees and administrators. This platform enables employees to coordinate commute sharing, track active trips in real time, and settle fares securely via tokenized wallet balances, while allowing administrators to manage company parameters, fleet approvals, and employee access.

---

## 🚀 Technology Stack

### Frontend
- **React.js (Vite)** — Single Page Application (SPA) architecture.
- **Tailwind CSS** — Modern, responsive dark/light themed interface with rich micro-animations.
- **Framer Motion** — Premium component entry transitions, slide drawers, and hover effects.
- **Leaflet & OpenStreetMap** — Interactive interactive map routing and live tracking markers.
- **Zustand** — Client state management for authentication, wallet ledger, and trip status.
- **Lucide React** — Consistent icon guidelines.

### Backend
- **Node.js & Express.js** — Modular REST API with MVC pattern.
- **MongoDB Atlas & Mongoose** — Document-oriented data models with optimized indexing.
- **Socket.io** — Real-time bidirectional location telemetry and live support chat.
- **Bcrypt & JSON Web Tokens (JWT)** — Token-based security structure with secure refresh rotation.
- **Zod** — Payload schema validation.

---

## 🛠️ Main Modules & Features

### 1. Employee Dashboard
- **Find a Ride**: Search available commutes, select pickup/destination endpoints with GraphHopper geocoding autocomplete, confirm route on the map, and request seats.
- **Offer a Ride**: Register a vehicle and publish a commute path. Handles recurring rules and seats allocation.
- **Live Trip Tracking**: Real-time Leaflet map showing driver coordinates, path trajectory, and dynamic ETA updates.
- **Wallet Ledger**: Save Razorpay tokenized payment instruments (UPI, Card, Net Banking), top-up funds, and review balance transactions.
- **Chat Support**: Real-time Socket.io support desk featuring a typing indicator, instant delivery, and chat history.

### 2. Admin Dashboard (Decoupled Layout)
- **Fleet Analytics**: Real-time organization statistics, carbon offset rollup calculations ($CO_2$ saved), and fuel savings data.
- **Employee Access Control**: Corporate directory search, filter, sorting, and pagination with options to disable platform access.
- **Rates & Rules (Carpool Config)**: Set fuel cost calculations, operational costs per kilometer, commission ratios, and wallet bounds.

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the `/backend` folder with the following variables:

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

---

## 🚦 Getting Started

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Seed Database
Initialize local MongoDB collections with test organizations, admin profiles, 15 employee accounts, vehicles, and mock history:
```bash
cd ../backend
node seed.js
```

### 3. Run Development Servers
```bash
# In backend directory
npm run dev

# In frontend directory
npm run dev
```

---

## 🔐 Demo Credentials

- **Admin Supervisor Console**:
  - **Email**: `admin@odooksv.com`
  - **Password**: `password123`
- **Employee Commuter Portal**:
  - **Email**: `aarav.sharma@odooksv.com`
  - **Password**: `password123`
