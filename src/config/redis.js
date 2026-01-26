const redis = require('redis');
const logger = require('../utils/logger');

// Create Redis client
const redisClient = redis.createClient({
  socket: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  password: process.env.REDIS_PASSWORD || undefined,
  database: 0,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      logger.error('Redis server refused connection');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      logger.error('Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      return undefined;
    }
    return Math.min(options.attempt * 100, 3000);
  }
});

// Connect to Redis
redisClient.connect()
  .then(() => {
    console.log('\n✅ REDIS CONNECTED SUCCESSFULLY!');
    console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.REDIS_PORT || 6379}\n`);
  })
  .catch((err) => {
    console.log('\n⚠️  REDIS CONNECTION FAILED - Running without cache');
    console.log(`   Error: ${err.message}`);
    console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.REDIS_PORT || 6379}`);
    console.log(`   Note: Application will work without Redis (cache disabled)\n`);
    
    logger.warn('Redis connection failed - running without cache:', err.message);
  });

// Event handlers
redisClient.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  logger.error('❌ Redis error:', err.message);
});

redisClient.on('reconnecting', () => {
  logger.info('Redis reconnecting...');
});

module.exports = redisClient;
