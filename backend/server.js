const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const errorHandler = require('./middleware/errorHandler');
const { startCaptureScheduler, stopCaptureScheduler } = require('./services/cameraCaptureService');

dotenv.config();

// Validate Environment Variables
const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

console.log(`[AgriSync Startup] Node Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`[AgriSync Startup] Database mode: ${process.env.SUPABASE_URL ? 'Supabase Cloud PostgreSQL' : 'Resilient LocalStore Fallback'}`);
console.log(`[AgriSync Startup] data.gov.in API key: ${process.env.DATA_GOV_IN_API_KEY ? 'Configured (Active)' : 'Default Open Key'}`);
console.log(`[AgriSync Startup] ESP32 IP Deterrent: ${process.env.ESP32_IP || 'Software Simulation Mode'}`);

const authRoutes = require('./routes/auth');
const detectionRoutes = require('./routes/detections');
const cameraRoutes = require('./routes/cameras');
const farmRoutes = require('./routes/farms');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const esp32Routes = require('./routes/esp32');
const lotRoutes = require('./routes/lots');
const procurementRoutes = require('./routes/procurement');
const transactionRoutes = require('./routes/transactions');
const matchingRoutes = require('./routes/matching');
const mandiRoutes = require('./routes/mandi');
const saleWindowRoutes = require('./routes/saleWindow');
const incidentRoutes = require('./routes/incidents');
const analyticsRoutes = require('./routes/analytics');
const marketRoutes = require('./routes/market');
const buyerRoutes = require('./routes/buyers');
const logisticsRoutes = require('./routes/logistics');

const app = express();
const server = http.createServer(app);

// Build allowed origins
const defaultDevOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
];

const configuredOrigins = frontendUrl
  ? frontendUrl.split(',').map((u) => u.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = [...new Set([...defaultDevOrigins, ...configuredOrigins])];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, IoT nodes, mobile apps)
    if (!origin) return callback(null, true);
    if (!isProduction || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    // Allow subdomain matching for configured production frontend domain
    const isDomainMatch = configuredOrigins.some((domain) => {
      const cleanDomain = domain.replace(/^https?:\/\//, '');
      return origin.includes(cleanDomain);
    });
    if (isDomainMatch) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// initialize socket.io with matching CORS policy
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[socket] client connected: ${socket.id} (total: ${io.sockets.sockets.size})`);
  socket.on('disconnect', () => {
    console.log(`[socket] client disconnected: ${socket.id} (total: ${io.sockets.sockets.size})`);
  });
});

// middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// static file serving for uploaded camera frames & processed detection snapshots
const uploadsPath = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));
app.use('/api/images', express.static(uploadsPath));

// request logger (non-sensitive)
app.use((req, res, next) => {
  if (req.path !== '/health' && req.path !== '/api/health') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

// health check endpoints (standardized JSON response)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'AgriSync Unified Backend',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
};

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AgriSync Unified Agricultural Intelligence API is running',
    docs: '/api/health',
    version: '1.0.0',
  });
});

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// api routes
app.use('/api', authRoutes);
app.use('/api', detectionRoutes);
app.use('/api', cameraRoutes);
app.use('/api', farmRoutes);
app.use('/api', notificationRoutes);
app.use('/api', settingsRoutes);
app.use('/api', esp32Routes);
app.use('/api', saleWindowRoutes);
app.use('/api', lotRoutes);
app.use('/api', procurementRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', matchingRoutes);
app.use('/api', mandiRoutes);
app.use('/api', incidentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', marketRoutes);
app.use('/api', buyerRoutes);
app.use('/api', logisticsRoutes);

// 404 JSON handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.baseUrl} not found`,
    code: 'NOT_FOUND',
  });
});

// centralized error handling middleware (must be mounted last)
app.use(errorHandler);

server.listen(port, host, () => {
  console.log(`AgriSync Unified server listening on http://${host}:${port}`);
  // Start the 30-Second Field Camera Automatic Scheduler
  startCaptureScheduler(app);
});

// graceful shutdown handling
const shutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  stopCaptureScheduler();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, server };

