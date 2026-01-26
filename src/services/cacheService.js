const redisClient = require('../config/redis');
const logger = require('../utils/logger');

class CacheService {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (!redisClient.isOpen) {
        return null;
      }

      const data = await redisClient.get(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with expiry
   */
  async set(key, value, expirySeconds = 3600) {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key) {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      
      return true;
    } catch (error) {
      logger.error('Cache delete pattern error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Increment value
   */
  async incr(key) {
    try {
      if (!redisClient.isOpen) {
        return 0;
      }

      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Cache increment error:', error);
      return 0;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key, seconds) {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  }

  /**
   * Get with fallback to database
   */
  async getOrSet(key, fetchFunction, expirySeconds = 3600) {
    try {
      // Try to get from cache
      const cached = await this.get(key);
      
      if (cached !== null) {
        return cached;
      }

      // Fetch from database
      const data = await fetchFunction();

      // Store in cache
      await this.set(key, data, expirySeconds);

      return data;
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      // Fallback to direct fetch
      return await fetchFunction();
    }
  }

  /**
   * Flush all cache
   */
  async flushAll() {
    try {
      if (!redisClient.isOpen) {
        return false;
      }

      await redisClient.flushAll();
      logger.info('Cache flushed successfully');
      return true;
    } catch (error) {
      logger.error('Cache flush error:', error);
      return false;
    }
  }
}

module.exports = { cacheService: new CacheService(), redisClient };
