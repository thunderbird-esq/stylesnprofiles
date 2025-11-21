/**
 * NASA System 6 Portal - Simple Test Server
 * Basic server for testing the core API functionality without swagger dependencies
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Test the middleware imports
const {
  authenticateToken,
  optionalAuth,
  authorize,
  ROLES,
  getRateLimitConfig,
  userRegistrationValidation,
  userLoginValidation,
} = require('./middleware/auth');
const {
  cache,
  cacheNasaApi,
  invalidateCache,
  getCacheStats,
} = require('./middleware/cache');
const {
  sanitizeInput,
  handleValidationErrors,
  nasaApiValidation,
  searchValidation,
} = require('./middleware/validation');

// Mark unused imports as intentionally loaded for testing
void (rateLimit && optionalAuth && authorize && ROLES && getRateLimitConfig
  && userLoginValidation && cacheNasaApi && invalidateCache && nasaApiValidation);

const app = express();
const PORT = process.env.PORT || 3001;

// Test basic middleware setup
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://api.nasa.gov'],
      connectSrc: ["'self'", 'https://api.nasa.gov'],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://your-domain.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Request ID middleware
app.use((req, res, next) => {
  req.requestId = Math.random().toString(36).substr(2, 9);
  res.set('X-Request-ID', req.requestId);
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.requestId}`);
  next();
});

// Test API endpoints
app.get('/health', async (req, res) => {
  try {
    const cacheStats = await getCacheStats();

    res.json({
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime(),
        cache: cacheStats ? 'connected' : 'disconnected',
        middleware: {
          auth: typeof authenticateToken === 'function',
          cache: typeof cache === 'function',
          validation: typeof handleValidationErrors === 'function',
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Health check failed',
      },
    });
  }
});

// Test authentication endpoint
app.post('/api/v1/auth/test',
  userRegistrationValidation,
  async (req, res) => {
    res.status(201).json({
      success: true,
      data: {
        message: 'Authentication endpoint test',
        body: req.body,
        middleware: {
          validation: 'working',
        },
      },
    });
  });

// Test caching endpoint
app.get('/api/v1/test/cache',
  cache(60, 'test'),
  async (req, res) => {
    const testResponse = {
      success: true,
      data: {
        message: 'Cache test endpoint',
        timestamp: new Date().toISOString(),
        cached: true,
      },
    };

    res.json(testResponse);
  });

// Test validation middleware
app.get('/api/v1/test/validation',
  searchValidation,
  async (req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Validation middleware test',
        query: req.query,
      },
    });
  });

// Test error handling
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId,
    },
  });
});

app.use((err, req, res, _next) => {
  console.error(`[${req.requestId}] Error:`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong!',
      requestId: req.requestId,
    },
  });
});

// Test server startup
app.listen(PORT, () => {
  console.log(`🚀 NASA System 6 Test Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log('🧪 Test endpoints:');
  console.log('  - POST /api/v1/auth/test (with validation)');
  console.log('  - GET /api/v1/test/cache (with caching)');
  console.log('  - GET /api/v1/test/validation (with validation)');
  console.log('✅ All middleware loaded successfully!');
});

module.exports = app;