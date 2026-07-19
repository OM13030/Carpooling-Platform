require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { initSocket } = require('./sockets/socketManager');
const rideService = require('./services/ride.service');
const { resolvePort } = require('./utils/portResolver');

// Import routes
const authRoutes = require('./routes/auth.routes');
const organizationRoutes = require('./routes/organization.routes');
const employeeRoutes = require('./routes/employee.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const mapRoutes = require('./routes/map.routes');
const rideRoutes = require('./routes/ride.routes');
const rideRequestRoutes = require('./routes/rideRequest.routes');
const tripRoutes = require('./routes/trip.routes');
const walletRoutes = require('./routes/wallet.routes');
const miscRoutes = require('./routes/misc.routes');
const settingsRoutes = require('./routes/settings.routes');
const supportMessageRoutes = require('./routes/supportMessage.routes');
const vehicleExpenseRoutes = require('./routes/vehicleExpense.routes');
const reportRoutes = require('./routes/report.routes');
const fallbackRoutes = require('./routes/fallback.routes');

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// CORS Configuration
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));

// Capture Raw Body for Webhooks and parse JSON
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Lightweight Custom Cookie Parser middleware
app.use((req, res, next) => {
  req.cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      req.cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/org', organizationRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maps', mapRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/requests', rideRequestRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/misc', miscRoutes);
app.use('/api/messages', supportMessageRoutes);
app.use('/api/vehicle-expenses', vehicleExpenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', fallbackRoutes);
app.use('/api', settingsRoutes);

// Error Middlewares
app.use(notFound);
app.use(errorHandler);

// Initialize Sockets
initSocket(server);

// Start Recurring Rides Cron Job
rideService.setupRecurringJob();

// Start Server
async function startServer() {
  const preferredPort = Number(process.env.PORT || 5000);
  const PORT = await resolvePort(preferredPort);
  const HOST = process.env.HOST || '0.0.0.0';

  server.listen(PORT, HOST, () => {
    logger.info(`Server listening on port ${PORT} at ${HOST} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  server.on('error', (error) => {
    logger.error(`Server error: ${error.message}`);
    process.exit(1);
  });
}

startServer().catch((error) => {
  logger.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});
