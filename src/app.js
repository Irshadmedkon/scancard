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
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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

// Request logging
app.use(requestLogger);
app.use(requestTimer);

// Health check endpoint
app.get('/health', (req, res) => {
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