const app = require('./app');
const logger = require('./utils/logger');
const scheduler = require('./services/scheduler');
const eventEmitter = require('./patterns/eventEmitter');

const PORT = process.env.PORT || 5000;

// Start server
const server = app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 TAPONN BACKEND SERVER STARTED SUCCESSFULLY!');
  console.log('='.repeat(60));
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Port: ${PORT}`);
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   Health Check: http://localhost:${PORT}/health`);
  console.log(`   API Base: http://localhost:${PORT}/api/v1`);
  console.log('='.repeat(60) + '\n');
  
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    timestamp: new Date().toISOString()
  });

  // Initialize scheduler for background tasks
  if (process.env.ENABLE_SCHEDULER !== 'false') {
    scheduler.init();
    console.log('✅ SCHEDULER INITIALIZED - 6 cron jobs running\n');
    logger.info('✅ Scheduler initialized');
  }

  // Event emitter is ready
  console.log('✅ EVENT EMITTER READY - 15+ events configured\n');
  console.log('✅ JOB QUEUE READY - Background jobs enabled\n');
  logger.info('✅ Event emitter ready');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Stop scheduler
  scheduler.stopAll();
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  // Stop scheduler
  scheduler.stopAll();
  
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;