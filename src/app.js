require('dotenv').config();
require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const { requestLogger, requestTimer } = require('./middleware/requestLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const logger = require('./utils/logger');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman, or file://)
    if (!origin) return callback(null, true);
    
    // Allow all origins if * is specified
    if (allowedOrigins.includes('*')) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(null, true); // Allow all for development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Compression
app.use(compression());

// Serve uploaded files statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve frontend files
app.use('/frontend', express.static(path.join(__dirname, '../frontend')));

// Request logging
app.use(requestLogger);
app.use(requestTimer);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes with rate limiting
app.use('/api', apiLimiter);
app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/profiles', require('./modules/profile/profile.routes'));
app.use('/api/v1/leads', require('./modules/lead/lead.routes'));
app.use('/api/v1/analytics', require('./modules/analytics/analytics.routes'));
app.use('/api/v1/nfc', require('./modules/nfc/nfc.routes'));
app.use('/api/v1/upload', require('./modules/upload/upload.routes'));
app.use('/api/v1/teams', require('./modules/team/team.routes'));
app.use('/api/v1/notifications', require('./modules/notification/notification.routes'));
app.use('/api/v1/webhooks', require('./modules/webhook/webhook.routes'));
app.use('/api/v1/api-keys', require('./modules/apikey/apikey.routes'));
app.use('/api/v1/search', require('./modules/search/search.routes'));
app.use('/api/v1/export', require('./modules/export/export.routes'));
app.use('/api/v1/payment', require('./modules/payment/payment.routes'));
app.use('/api/v1/subscription', require('./modules/subscription/subscription.routes'));
app.use('/api/v1/menu', require('./modules/menu/menu.routes'));
app.use('/api/v1/catalog', require('./modules/catalog/catalog.routes'));
app.use('/api/v1/booking', require('./modules/booking/booking.routes'));
app.use('/api/v1/batch', require('./modules/batch/batch.routes'));
app.use('/api/v1/stats', require('./modules/stats/stats.routes'));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

module.exports = app;