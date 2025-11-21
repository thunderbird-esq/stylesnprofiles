# NASA System 6 Portal - Middleware Architecture Guide

*Last Updated: November 12, 2025*

## Overview

The NASA System 6 Portal implements a comprehensive middleware architecture that provides security, authentication, caching, validation, and performance optimization. This guide documents the middleware components, their configuration, and best practices for implementation and maintenance.

## Middleware Stack Architecture

```
Request → Security Headers → Input Sanitization → Rate Limiting → Authentication → Validation → Caching → Route Handler → Response → Caching → Compression
```

## Core Middleware Components

### 1. Security Middleware (`helmet.js`)

#### Purpose
Provides essential security headers to protect against common web vulnerabilities.

#### Configuration
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://api.nasa.gov', 'https://images-assets.nasa.gov'],
      connectSrc: ["'self'", 'https://api.nasa.gov'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### Security Headers Applied
- **Content Security Policy (CSP)**: Prevents XSS and injection attacks
- **HTTP Strict Transport Security (HSTS)**: Enforces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking attacks
- **X-Content-Type-Options**: Prevents MIME-sniffing attacks
- **Referrer Policy**: Controls referrer information leakage

### 2. Input Sanitization Middleware

#### Purpose
Prevents XSS attacks by sanitizing all incoming request data.

#### Implementation
```javascript
const sanitize = (input) => {
  if (typeof input === 'string') {
    return xss(input, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  }
  if (Array.isArray(input)) {
    return input.map(sanitize);
  }
  if (input && typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }
  return input;
};
```

#### Sanitization Scope
- **Request Body**: All JSON payloads
- **Query Parameters**: URL parameters and query strings
- **Route Parameters**: Dynamic route parameters
- **Headers**: Custom headers (excluding standard HTTP headers)

### 3. Rate Limiting Middleware (`express-rate-limit`)

#### Purpose
Protects against abuse and DoS attacks with tiered rate limiting based on user roles.

#### Configuration by Role
```javascript
const getRateLimitConfig = (user) => {
  if (!user) {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 30, // 30 requests per window
      message: 'Guest limit: 30 requests/15min'
    };
  }

  switch (user.role) {
    case ROLES.PREMIUM:
      return {
        windowMs: 15 * 60 * 1000,
        max: 500,
        message: 'Premium limit: 500 requests/15min'
      };
    case ROLES.ADMIN:
    case ROLES.MODERATOR:
      return {
        windowMs: 15 * 60 * 1000,
        max: 1000,
        message: 'Admin limit: 1000 requests/15min'
      };
    default: // USER
      return {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'User limit: 100 requests/15min'
      };
  }
};
```

#### Rate Limiting Strategy
- **Guest Users**: 30 requests per 15 minutes
- **Authenticated Users**: 100 requests per 15 minutes
- **Premium Users**: 500 requests per 15 minutes
- **Admin/Moderator**: 1000 requests per 15 minutes

#### Response Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### 4. Authentication Middleware

#### Purpose
Handles JWT token verification and user authentication for protected routes.

#### JWT Implementation
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required'
      }
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid or expired token'
        }
      });
    }
    req.user = user;
    next();
  });
};
```

#### Role-Based Authorization
```javascript
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions'
        }
      });
    }

    next();
  };
};
```

#### User Roles
- **GUEST**: Read-only access to public data
- **USER**: Full access to user features
- **PREMIUM**: Enhanced features and higher limits
- **MODERATOR**: Content moderation capabilities
- **ADMIN**: Full administrative access

### 5. Validation Middleware (`express-validator`)

#### Purpose
Ensures data integrity and prevents malformed requests from reaching business logic.

#### Validation Chains
```javascript
const userRegistrationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 chars, alphanumeric, underscore, or hyphen'),
  handleValidationErrors
];
```

#### Validation Rules by Endpoint
- **Authentication**: Email format, password complexity, username validation
- **NASA API**: Date formats, pagination limits, camera/rover validation
- **User Resources**: Title length, URL validation, description limits
- **Search**: Query length, source validation, date range validation

#### Error Response Format
```javascript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "value": "invalid-email"
      }
    ]
  }
}
```

### 6. Caching Middleware (Redis)

#### Purpose
Improves performance by caching frequently accessed data and reducing API calls.

#### Cache Strategy
```javascript
const cache = (duration = 300, keyPrefix = 'cache') => {
  return async (req, res, next) => {
    const key = generateCacheKey(req, keyPrefix);

    try {
      const cached = await client.get(key);
      if (cached) {
        const data = JSON.parse(cached);
        res.set('X-Cache', 'HIT');
        res.set('X-Cache-Key', key);
        return res.json(data);
      }

      const originalJson = res.json;
      res.json = function(data) {
        if (res.statusCode === 200 || res.statusCode === 201) {
          client.setex(key, duration, JSON.stringify(data))
            .catch(err => console.log('Cache set error:', err));
        }
        res.set('X-Cache', 'MISS');
        res.set('X-Cache-Key', key);
        return originalJson.call(this, data);
      };

      next();
    } catch (err) {
      console.log('Cache middleware error:', err);
      next();
    }
  };
};
```

#### Cache TTLs by Data Type
- **APOD Data**: 1 hour (3600 seconds)
- **Search Results**: 30 minutes (1800 seconds)
- **User Data**: 10 minutes (600 seconds)
- **System Status**: 5 minutes (300 seconds)

#### Cache Key Generation
```javascript
const generateCacheKey = (req, prefix = 'cache') => {
  const userId = req.user?.id || 'anonymous';
  const path = req.originalUrl || req.path;
  const query = JSON.stringify(req.query);
  return `${prefix}:${path}:${query}:${userId}`;
};
```

#### Cache Invalidation
```javascript
const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
        console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
      }
    } catch (err) {
      console.log('Cache invalidation error:', err);
    }
    next();
  };
};
```

## Middleware Configuration and Best Practices

### 1. Middleware Order

The order of middleware is critical for security and performance:

```javascript
// 1. Security headers (first line of defense)
app.use(helmet(securityConfig));

// 2. CORS configuration
app.use(cors(corsConfig));

// 3. Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Input sanitization
app.use(sanitizeInput);

// 5. Request ID tracking
app.use(requestIdMiddleware);

// 6. Rate limiting
app.use('/api/', rateLimiter);

// 7. Authentication (for protected routes)
app.use('/api/v1', optionalAuth); // Optional auth for some endpoints
app.use('/api/v1/users', authenticateToken); // Required auth for user endpoints

// 8. Route-specific validation and caching
app.get('/api/v1/nasa/apod', optionalAuth, apodValidation, cacheNasaApi, apodController);
```

### 2. Error Handling

#### Global Error Handler
```javascript
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Error:`, err.stack);

  res.status(err.status || 500).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'Something went wrong!',
      requestId: req.requestId
    }
  });
});
```

#### 404 Handler
```javascript
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.requestId
    }
  });
});
```

### 3. Performance Monitoring

#### Request Tracking
```javascript
app.use((req, res, next) => {
  req.requestId = require('crypto').randomUUID();
  res.set('X-Request-ID', req.requestId);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});
```

#### Cache Monitoring
```javascript
const getCacheStats = async () => {
  try {
    const info = await client.info('memory');
    const keyspace = await client.info('keyspace');
    const dbSize = await client.dbSize();

    return {
      connected: client.isOpen,
      dbSize,
      memory: info,
      keyspace
    };
  } catch (err) {
    console.log('Error getting cache stats:', err);
    return null;
  }
};
```

## Security Considerations

### 1. Token Security

#### JWT Configuration
```javascript
const tokenConfig = {
  accessToken: {
    expiresIn: '15m',
    secret: process.env.JWT_SECRET
  },
  refreshToken: {
    expiresIn: '7d',
    secret: process.env.JWT_REFRESH_SECRET
  }
};
```

#### Token Refresh Logic
```javascript
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const newAccessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        expiresIn: 900
      }
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token'
      }
    });
  }
};
```

### 2. Input Validation Security

#### XSS Prevention
- Use `xss` library for HTML sanitization
- Allow no HTML tags in user inputs
- Strip dangerous attributes and content

#### SQL Injection Prevention
- Use parameterized queries only
- Never concatenate SQL strings with user input
- Validate all database inputs

#### Rate Limiting Bypass Prevention
- Use user-based rate limiting when authenticated
- Implement IP-based rate limiting for anonymous users
- Monitor for rate limit bypass attempts

### 3. Monitoring and Logging

#### Security Event Logging
```javascript
const securityLogger = (req, res, next) => {
  const originalSend = res.send;

  res.send = function(data) {
    if (res.statusCode >= 400) {
      console.log(`[SECURITY] [${req.requestId}] ${req.ip} ${req.method} ${req.path} - ${res.statusCode}`);
    }
    originalSend.call(this, data);
  };

  next();
};
```

#### Anomaly Detection
- Monitor for unusual request patterns
- Track failed authentication attempts
- Alert on rate limit violations
- Monitor for IP-based attack patterns

## Testing Middleware

### 1. Unit Testing

#### Authentication Middleware Tests
```javascript
describe('Authentication Middleware', () => {
  test('should allow access with valid token', async () => {
    const token = jwt.sign({ userId: 'test-user' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = {};
    const next = jest.fn();

    await authenticateToken(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.user.userId).toBe('test-user');
  });

  test('should reject access without token', async () => {
    const req = { headers: {} };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await authenticateToken(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
```

### 2. Integration Testing

#### End-to-End Middleware Testing
```javascript
describe('Middleware Integration', () => {
  test('should protect protected routes', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .expect(401);

    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  test('should allow authenticated access to protected routes', async () => {
    const token = await getValidToken();
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Deployment Considerations

### 1. Environment Configuration

#### Development Environment
```javascript
const devConfig = {
  redis: {
    url: 'redis://localhost:6379'
  },
  jwt: {
    secret: 'dev-secret-key',
    refreshSecret: 'dev-refresh-secret'
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000,
    max: 1000 // Higher limits for development
  }
};
```

#### Production Environment
```javascript
const prodConfig = {
  redis: {
    url: process.env.REDIS_URL,
    retryDelayOnFailover: 100,
    enableReadyCheck: false
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET
  },
  rateLimiting: {
    windowMs: 15 * 60 * 1000,
    max: 100 // Production limits
  }
};
```

### 2. Monitoring and Observability

#### Health Checks
```javascript
app.get('/health/middleware', async (req, res) => {
  const health = {
    redis: await checkRedisConnection(),
    jwtSecret: !!process.env.JWT_SECRET,
    rateLimiter: rateLimiterActive
  };

  const isHealthy = Object.values(health).every(status => status);

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks: health
  });
});
```

#### Performance Metrics
- Request processing time
- Cache hit/miss ratios
- Rate limit enforcement
- Authentication success/failure rates
- Validation error rates

## Troubleshooting

### Common Issues

#### 1. Cache Connection Issues
**Symptoms**: Cache misses, performance degradation
**Solutions**: Check Redis connection, verify credentials, monitor memory usage

#### 2. Rate Limiting Too Aggressive
**Symptoms**: Legitimate users being blocked
**Solutions**: Adjust rate limits, implement token bucket algorithm, add whitelisting

#### 3. JWT Token Issues
**Symptoms**: Authentication failures, token expiration errors
**Solutions**: Check token secrets, verify expiration settings, implement proper refresh logic

#### 4. Validation Errors
**Symptoms**: Legitimate requests being rejected
**Solutions**: Review validation rules, check error messages, adjust validation criteria

### Debugging Tools

#### Request ID Tracking
- Use unique request IDs for tracing
- Log request IDs across all middleware
- Include request IDs in error responses

#### Middleware Performance Profiling
```javascript
const profileMiddleware = (middlewareName) => {
  return (req, res, next) => {
    const start = process.hrtime();

    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const milliseconds = seconds * 1000 + nanoseconds / 1e6;

      console.log(`[PROFILE] ${middlewareName}: ${milliseconds.toFixed(2)}ms`);
    });

    next();
  };
};
```

## Conclusion

The middleware architecture of the NASA System 6 Portal provides a robust foundation for security, performance, and scalability. By implementing comprehensive authentication, caching, validation, and security measures, the system ensures a reliable and secure experience for users while maintaining optimal performance.

Regular monitoring, testing, and updates to the middleware components are essential for maintaining security and performance standards as the application evolves and scales.

---

*This guide covers the complete middleware architecture as of November 12, 2025. For the most current implementation details, refer to the source code in the `server/middleware/` directory.*