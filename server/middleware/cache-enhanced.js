/**
 * Enhanced Caching Middleware for NASA System 6 Portal
 * Comprehensive error handling, circuit breaker, and graceful degradation
 *
 * @fileoverview Enhanced Redis caching with circuit breaker, comprehensive error handling, and service monitoring
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module middleware/cache-enhanced
 * @requires redis
 * @requires ./errorHandler
 */

const redis = require('redis');
const { logger, withTimeout, CircuitBreaker, serviceMonitor } = require('./errorHandler');

// Circuit breaker for Redis operations
const redisCircuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  monitoringPeriod: 10000, // 10 seconds
});

// Connection state management with enhanced tracking
let isRedisAvailable = false;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 5;

// Initialize Redis client with modern v4+ configuration
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.warn('Redis max reconnection attempts reached, giving up', { retries });
        return false; // Stop reconnection
      }
      const delay = Math.min(retries * 100, 3000);
      logger.debug('Redis reconnecting', { retry: retries, delay });
      return delay;
    },
    connectTimeout: 5000,
    lazyConnect: true, // Don't connect immediately
  },
  // Disable offline queue to prevent command accumulation when disconnected
  disableOfflineQueue: true,
});

/**
 * Helper Function to Check if Redis is Ready
 * Verifies both availability flag and client connection state
 *
 * @function isRedisReady
 * @returns {boolean} True if Redis is ready to accept commands
 * @example
 * if (isRedisReady()) {
 *   await client.set('key', 'value');
 * }
 */
const isRedisReady = () => {
  return isRedisAvailable && client.isOpen;
};

// Enhanced Redis event handlers with proper logging
client.on('connect', () => {
  logger.info('Redis connected successfully');
  isRedisAvailable = true;
});

client.on('ready', () => {
  logger.info('Redis ready to accept commands');
});

client.on('error', (err) => {
  logger.error('Redis client error', {
    error: err.message,
    code: err.code,
    stack: err.stack,
  });
  isRedisAvailable = false;
  // Continue gracefully without Redis
});

client.on('end', () => {
  logger.warn('Redis connection ended');
  isRedisAvailable = false;
});

client.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

/**
 * Initialize Redis Connection with Retry Logic
 * Establishes connection to Redis server with automatic retry on failure
 *
 * @function initializeRedis
 * @async
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 * @throws {Error} Does not throw - errors are logged and handled gracefully
 * @example
 * const connected = await initializeRedis();
 * if (connected) {
 *   console.log('Redis is ready');
 * }
 */
const initializeRedis = async () => {
  try {
    if (client.isOpen) {
      isRedisAvailable = true;
      return true;
    }

    connectionAttempts++;
    logger.info('Attempting to connect to Redis', {
      attempt: connectionAttempts,
      maxAttempts: MAX_CONNECTION_ATTEMPTS,
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    await withTimeout(client.connect(), 5000, 'Redis connection timeout');

    isRedisAvailable = true;
    connectionAttempts = 0;

    logger.info('Redis client initialized and connected');
    return true;

  } catch (err) {
    isRedisAvailable = false;
    logger.error('Failed to initialize Redis', {
      error: err.message,
      attempt: connectionAttempts,
      maxAttempts: MAX_CONNECTION_ATTEMPTS,
    });

    if (connectionAttempts >= MAX_CONNECTION_ATTEMPTS) {
      logger.error('Maximum Redis connection attempts reached - operating without cache');
      return false; // Continue without Redis
    }

    // Exponential backoff for retry
    const delayMs = Math.min(1000 * Math.pow(2, connectionAttempts - 1), 10000);
    logger.info(`Retrying Redis connection in ${delayMs}ms`);
    setTimeout(initializeRedis, delayMs);

    return false;
  }
};

/**
 * Redis Health Check Function
 * Monitors Redis availability and response time for service health monitoring
 *
 * @function redisHealthCheck
 * @async
 * @returns {Promise<Object>} Health check result
 * @returns {string} return.status - Health status (healthy/unhealthy)
 * @returns {number} [return.responseTime] - Response time in milliseconds
 * @returns {string} [return.timestamp] - ISO timestamp of the check
 * @returns {string} [return.error] - Error message if unhealthy
 * @example
 * const health = await redisHealthCheck();
 * // Returns: { status: 'healthy', responseTime: 1234, timestamp: '2024-01-01T00:00:00.000Z' }
 */
const redisHealthCheck = async () => {
  try {
    if (!isRedisReady()) {
      return { status: 'unhealthy', error: 'Redis not connected' };
    }

    const result = await withTimeout(
      client.ping(),
      3000,
    );

    if (result === 'PONG') {
      return {
        status: 'healthy',
        responseTime: Date.now(),
        timestamp: new Date().toISOString(),
      };
    } else {
      return {
        status: 'unhealthy',
        error: 'Invalid ping response',
        response: result,
      };
    }

  } catch (error) {
    isRedisAvailable = false;
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

// Register Redis health check with service monitor
serviceMonitor.registerService('redis', redisHealthCheck);

// Initialize connection in background
initializeRedis().catch(err => {
  logger.error('Redis initialization failed, running without cache', {
    error: err.message,
  });
  isRedisAvailable = false;
});

/**
 * Safe Redis Operation Wrapper with Circuit Breaker
 * Wraps Redis operations with circuit breaker protection and graceful fallback
 *
 * @function safeRedisOperation
 * @async
 * @param {Function} operation - Async Redis operation to execute
 * @param {*} [fallbackValue=null] - Fallback value if operation fails
 * @returns {Promise<*>} Result of operation or fallback value
 * @example
 * const value = await safeRedisOperation(
 *   () => client.get('key'),
 *   null
 * );
 */
const safeRedisOperation = async (operation, fallbackValue = null) => {
  if (!isRedisReady()) {
    return fallbackValue;
  }

  try {
    return await redisCircuitBreaker.execute(operation);
  } catch (error) {
    logger.error('Redis operation failed', {
      operation: operation.name || 'unknown',
      error: error.message,
    });
    return fallbackValue;
  }
};

/**
 * Generate cache key based on request
 * @param {express.Request} req - Express request object
 * @param {string} prefix - Key prefix
 * @returns {string} Cache key
 */
const generateCacheKey = (req, prefix = 'cache') => {
  const userId = req.user?.id || 'anonymous';
  const path = req.originalUrl || req.path;
  const query = JSON.stringify(req.query);
  return `${prefix}:${path}:${query}:${userId}`;
};

/**
 * Enhanced caching middleware with comprehensive error handling
 * @param {number} duration - Cache duration in seconds
 * @param {string} keyPrefix - Key prefix for caching
 * @returns {Function} Express middleware
 */
const cache = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    const key = generateCacheKey(req, keyPrefix);

    try {
      // Check if data is cached with circuit breaker protection
      const cached = await safeRedisOperation(
        () => client.get(key),
        null,
      );

      if (cached) {
        logger.debug(`Cache hit for ${key}`, {
          key,
          keyPrefix,
          userId: req.user?.id || 'anonymous',
        });

        try {
          const data = JSON.parse(cached);

          // Add cache headers
          res.set('X-Cache', 'HIT');
          res.set('X-Cache-Key', key);

          return res.json(data);
        } catch (parseError) {
          logger.error('Cache data parse error', {
            key,
            error: parseError.message,
          });
          // Continue without cache if data is corrupted
        }
      }

      logger.debug(`Cache miss for ${key}`, {
        key,
        keyPrefix,
        userId: req.user?.id || 'anonymous',
      });

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function (data) {
        // Cache successful responses only if Redis is still available
        if (isRedisReady() && (res.statusCode === 200 || res.statusCode === 201)) {
          safeRedisOperation(
            () => client.setEx(key, duration, JSON.stringify(data)),
            null,
          ).catch(err => {
            logger.debug('Cache set error', { key, error: err.message });
          });
        }

        // Add cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', key);

        return originalJson.call(this, data);
      };

      next();

    } catch (err) {
      logger.error('Cache middleware error', {
        error: err.message,
        stack: err.stack,
        key,
        keyPrefix,
      });

      // Continue without caching if Redis fails
      res.set('X-Cache', 'ERROR');
      res.set('X-Cache-Key', key);
      next();
    }
  };
};

/**
 * Enhanced cache invalidation middleware with error handling
 * @param {string} pattern - Cache key pattern to invalidate
 * @returns {Function} Express middleware
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const keys = await safeRedisOperation(
        () => client.keys(pattern),
        [],
      );

      if (keys.length > 0) {
        await safeRedisOperation(
          () => client.del(keys),
          0,
        );

        logger.debug('Cache invalidation completed', {
          pattern,
          keysInvalidated: keys.length,
        });
      }

    } catch (err) {
      logger.error('Cache invalidation error', {
        error: err.message,
        pattern,
      });
    }

    next();
  };
};

/**
 * NASA API specific cache middleware
 */
const cacheNasaApi = (duration = 3600) => {
  return cache(duration, 'nasa');
};

/**
 * User-specific cache middleware
 */
const cacheUser = (duration = 600) => {
  return cache(duration, 'user');
};

/**
 * Search cache middleware with shorter duration
 */
const cacheSearch = (duration = 1800) => {
  return cache(duration, 'search');
};

/**
 * Enhanced clear all cache for a specific user
 * @param {string} userId - User ID
 */
const clearUserCache = async (userId) => {
  try {
    const pattern = `*:*:*${userId}:*`;
    const keys = await safeRedisOperation(
      () => client.keys(pattern),
      [],
    );

    if (keys.length > 0) {
      await safeRedisOperation(
        () => client.del(keys),
        0,
      );

      logger.debug('User cache cleared', {
        userId,
        keysCleared: keys.length,
      });
    }

  } catch (err) {
    logger.error('Error clearing user cache', {
      error: err.message,
      userId,
    });
  }
};

/**
 * Enhanced cache statistics with error handling
 */
const getCacheStats = async () => {
  try {
    if (!isRedisReady()) {
      return {
        connected: false,
        dbSize: 0,
        memory: 'Redis unavailable',
        keyspace: 'Redis unavailable',
        circuitBreakerState: redisCircuitBreaker.getState(),
      };
    }

    const [info, keyspace, dbSize] = await Promise.all([
      safeRedisOperation(() => client.info('memory'), ''),
      safeRedisOperation(() => client.info('keyspace'), ''),
      safeRedisOperation(() => client.dbSize(), 0),
    ]);

    return {
      connected: client.isOpen,
      dbSize,
      memory: info,
      keyspace,
      circuitBreakerState: redisCircuitBreaker.getState(),
    };

  } catch (err) {
    logger.error('Error getting cache stats', {
      error: err.message,
    });

    return {
      connected: false,
      dbSize: 0,
      memory: 'Error',
      keyspace: 'Error',
      circuitBreakerState: redisCircuitBreaker.getState(),
    };
  }
};

/**
 * Enhanced warm up cache with popular content
 */
const warmUpCache = async () => {
  if (!isRedisReady()) {
    logger.warn('Redis unavailable, skipping cache warming');
    return;
  }

  try {
    logger.info('Warming up cache...');

    const warmUpOperations = [
      // Cache today's APOD
      client.setEx('nasa:/apod/today::anonymous', 3600, JSON.stringify({
        success: true,
        data: { warming: true, message: 'Cache warming in progress' },
      })),
    ];

    // Cache popular searches
    const popularSearches = ['mars', 'nebula', 'galaxy', 'apollo', 'hubble'];
    for (const search of popularSearches) {
      const key = `search:/q=${search}&sources=all::anonymous`;
      warmUpOperations.push(
        client.setEx(key, 1800, JSON.stringify({
          success: true,
          data: { warming: true, query: search },
        })),
      );
    }

    await Promise.all(warmUpOperations.map(op =>
      safeRedisOperation(() => op, null),
    ));

    logger.info('Cache warm-up completed');

  } catch (err) {
    logger.error('Cache warm-up error', {
      error: err.message,
    });
  }
};

/**
 * Graceful shutdown for Redis
 */
const closeRedisConnection = async () => {
  try {
    if (client.isOpen) {
      logger.info('Closing Redis connection...');
      await client.quit();
      logger.info('Redis connection closed successfully.');
    }
  } catch (err) {
    logger.error('Error closing Redis connection', {
      error: err.message,
    });
  }
};

// Handle graceful shutdown
process.on('SIGINT', closeRedisConnection);
process.on('SIGTERM', closeRedisConnection);

module.exports = {
  client,
  cache,
  cacheNasaApi,
  cacheUser,
  cacheSearch,
  invalidateCache,
  clearUserCache,
  getCacheStats,
  warmUpCache,
  generateCacheKey,
  isRedisReady,
  redisCircuitBreaker,
  redisHealthCheck,
};