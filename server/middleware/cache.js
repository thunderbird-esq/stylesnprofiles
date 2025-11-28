/**
 * Caching Middleware for NASA System 6 Portal
 * Enhanced with comprehensive error handling and graceful degradation
 *
 * @fileoverview Redis-based caching middleware with graceful degradation and connection management
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module middleware/cache
 * @requires redis
 * @requires ./errorHandler
 */

const redis = require('redis');
// const { logger, CacheError, withTimeout, CircuitBreaker, serviceMonitor } = require('./errorHandler');

// Initialize Redis client with modern v4+ configuration
const client = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.log('Redis max reconnection attempts reached, giving up');
        return false; // Stop reconnection
      }
      const delay = Math.min(retries * 100, 3000);
      console.log(`Redis reconnection attempt ${retries}, retrying in ${delay}ms`);
      return delay;
    },
    connectTimeout: 10000,
    lazyConnect: true, // Don't connect immediately
  },
  // Disable offline queue to prevent command accumulation when disconnected
  disableOfflineQueue: true,
});

// Connection state management
let isRedisAvailable = false;

/**
 * Helper function to check if Redis is ready
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

// Modern Redis v4+ event handlers
client.on('connect', () => {
  console.log('✅ Redis connected successfully');
  isRedisAvailable = true;
});

client.on('ready', () => {
  console.log('🚀 Redis ready to accept commands');
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  isRedisAvailable = false;
  // Continue gracefully without Redis
});

client.on('end', () => {
  console.log('🔌 Redis connection ended');
  isRedisAvailable = false;
});

client.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

/**
 * Initialize Redis Connection
 * Establishes connection to Redis server with error handling
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
    if (!client.isOpen) {
      await client.connect();
      isRedisAvailable = true;
      console.log('✅ Redis client initialized and connected');
    }
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize Redis:', err.message);
    isRedisAvailable = false;
    // Don't throw - allow graceful degradation
    return false;
  }
};

// Initialize connection in background
initializeRedis().catch(err => {
  console.log('Redis initialization failed, running without cache:', err.message);
  isRedisAvailable = false;
});

/**
 * Generate Cache Key Based on Request
 * Creates a unique cache key from request parameters, path, and user ID
 *
 * @function generateCacheKey
 * @param {express.Request} req - Express request object
 * @param {Object} [req.user] - User object from authentication
 * @param {string} [req.user.id] - User ID for personalized caching
 * @param {string} req.originalUrl - Full request URL
 * @param {Object} req.query - Query parameters
 * @param {string} [prefix='cache'] - Key prefix for categorization
 * @returns {string} Formatted cache key
 * @example
 * const key = generateCacheKey(req, 'nasa');
 * // Returns: "nasa:/api/apod:{}:user123"
 */
const generateCacheKey = (req, prefix = 'cache') => {
  const userId = req.user?.id || 'anonymous';
  const path = req.originalUrl || req.path;
  const query = JSON.stringify(req.query);
  return `${prefix}:${path}:${query}:${userId}`;
};

/**
 * Caching Middleware Factory
 * Creates Express middleware for caching responses in Redis
 * Implements graceful degradation when Redis is unavailable
 *
 * @function cache
 * @param {number} [duration=300] - Cache duration in seconds (default: 5 minutes)
 * @param {string} [keyPrefix='cache'] - Key prefix for categorizing cache entries
 * @returns {Function} Express middleware function
 * @example
 * // Cache NASA API responses for 1 hour
 * router.get('/apod', cache(3600, 'nasa'), async (req, res) => {
 *   // Handler code
 * });
 *
 * @example
 * // Cache with default 5 minute duration
 * router.get('/data', cache(), handler);
 */
const cache = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    // Skip caching entirely if Redis is not available
    if (!isRedisReady()) {
      console.log('⚠️ Redis unavailable, bypassing cache');
      res.set('X-Cache', 'BYPASSED');
      return next();
    }

    const key = generateCacheKey(req, keyPrefix);

    try {
      // Check if data is cached
      const cached = await client.get(key);
      if (cached) {
        console.log(`🎯 Cache hit for ${key}`);
        const data = JSON.parse(cached);

        // Add cache headers
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);

        return res.json(data);
      }

      console.log(`❌ Cache miss for ${key}`);

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        // Cache successful responses only if Redis is still available
        if (isRedisReady() && (res.statusCode === 200 || res.statusCode === 201)) {
          client.setEx(key, duration, JSON.stringify(data))
            .catch(err => console.log('Cache set error:', err));
        }

        // Add cache headers
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', key);

        return originalJson.call(this, data);
      };

      next();
    } catch (err) {
      console.error('Cache middleware error:', err);
      // Continue without caching if Redis fails
      res.set('X-Cache', 'ERROR');
      next();
    }
  };
};

/**
 * Cache Invalidation Middleware Factory
 * Creates middleware to invalidate cache entries matching a pattern
 *
 * @function invalidateCache
 * @param {string} pattern - Redis key pattern to match (supports wildcards)
 * @returns {Function} Express middleware function
 * @example
 * // Invalidate all user cache entries on logout
 * router.post('/logout', invalidateCache('user:*'), logoutHandler);
 *
 * @example
 * // Invalidate NASA API cache when new data is posted
 * router.post('/data', invalidateCache('nasa:*'), postHandler);
 */
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    // Skip invalidation if Redis is not available
    if (!isRedisReady()) {
      console.log('⚠️ Redis unavailable, skipping cache invalidation');
      return next();
    }

    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`🗑️  Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (err) {
      console.error('Cache invalidation error:', err);
    }
    next();
  };
};

/**
 * NASA API Specific Cache Middleware
 * Pre-configured caching for NASA API responses with 1 hour default duration
 *
 * @function cacheNasaApi
 * @param {number} [duration=3600] - Cache duration in seconds (default: 1 hour)
 * @returns {Function} Express middleware function
 * @example
 * router.get('/apod', cacheNasaApi(), apodHandler);
 */
const cacheNasaApi = (duration = 3600) => {
  return cache(duration, 'nasa');
};

/**
 * User-Specific Cache Middleware
 * Pre-configured caching for user data with 10 minute default duration
 *
 * @function cacheUser
 * @param {number} [duration=600] - Cache duration in seconds (default: 10 minutes)
 * @returns {Function} Express middleware function
 * @example
 * router.get('/profile', cacheUser(), profileHandler);
 */
const cacheUser = (duration = 600) => {
  return cache(duration, 'user');
};

/**
 * Search Cache Middleware
 * Pre-configured caching for search results with 30 minute default duration
 *
 * @function cacheSearch
 * @param {number} [duration=1800] - Cache duration in seconds (default: 30 minutes)
 * @returns {Function} Express middleware function
 * @example
 * router.get('/search', cacheSearch(), searchHandler);
 */
const cacheSearch = (duration = 1800) => {
  return cache(duration, 'search');
};

/**
 * Clear All Cache for a Specific User
 * Removes all cached entries associated with a user ID
 *
 * @function clearUserCache
 * @async
 * @param {string} userId - User ID to clear cache for
 * @returns {Promise<void>}
 * @example
 * // Clear user cache on profile update
 * await clearUserCache('user123');
 */
const clearUserCache = async (userId) => {
  // Skip cache clearing if Redis is not available
  if (!isRedisReady()) {
    console.log('⚠️ Redis unavailable, skipping user cache clearing');
    return;
  }

  try {
    const pattern = `*:*:*${userId}:*`;
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`🗑️  Cleared ${keys.length} cache entries for user ${userId}`);
    }
  } catch (err) {
    console.error('Error clearing user cache:', err);
  }
};

/**
 * Get Cache Statistics
 * Retrieves current Redis cache statistics including memory usage and key count
 *
 * @function getCacheStats
 * @async
 * @returns {Promise<Object>} Cache statistics object
 * @returns {boolean} return.connected - Redis connection status
 * @returns {number} return.dbSize - Number of keys in database
 * @returns {string} return.memory - Memory usage information
 * @returns {string} return.keyspace - Keyspace statistics
 * @example
 * const stats = await getCacheStats();
 * console.log(`Cache has ${stats.dbSize} keys`);
 */
const getCacheStats = async () => {
  try {
    const info = await client.info('memory');
    const keyspace = await client.info('keyspace');
    const dbSize = await client.dbSize();

    return {
      connected: client.isOpen,
      dbSize,
      memory: info,
      keyspace,
    };
  } catch (err) {
    console.log('Error getting cache stats:', err);
    return {
      connected: false,
      dbSize: 0,
      memory: 'Error',
      keyspace: 'Error',
    };
  }
};

/**
 * Warm Up Cache with Popular Content
 * Pre-populates cache with frequently accessed data for better performance
 *
 * @function warmUpCache
 * @async
 * @returns {Promise<void>}
 * @example
 * // Warm up cache on server startup
 * await warmUpCache();
 */
const warmUpCache = async () => {
  // Skip cache warming if Redis is not available
  if (!isRedisReady()) {
    console.log('⚠️ Redis unavailable, skipping cache warming');
    return;
  }

  try {
    console.log('🔥 Warming up cache...');

    // Cache today's APOD
    await client.setEx('nasa:/apod/today::anonymous', 3600, JSON.stringify({
      success: true,
      data: { warming: true, message: 'Cache warming in progress' },
    }));

    // Cache popular searches
    const popularSearches = ['mars', 'nebula', 'galaxy', 'apollo', 'hubble'];
    for (const search of popularSearches) {
      const key = `search:/q=${search}&sources=all::anonymous`;
      await client.setEx(key, 1800, JSON.stringify({
        success: true,
        data: { warming: true, query: search },
      }));
    }

    console.log('✅ Cache warm-up completed');
  } catch (err) {
    console.log('Cache warm-up error:', err);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Disconnecting Redis...');
  try {
    await client.quit();
  } catch (err) {
    console.error('Error disconnecting Redis:', err);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Disconnecting Redis...');
  try {
    await client.quit();
  } catch (err) {
    console.error('Error disconnecting Redis:', err);
  }
  process.exit(0);
});

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
  initializeRedis,
};