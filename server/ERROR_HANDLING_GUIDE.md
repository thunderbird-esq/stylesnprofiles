# Comprehensive Error Handling Implementation

This guide describes the comprehensive error handling system implemented in the NASA System 6 Portal server to ensure graceful degradation, prevent crashes, and provide excellent debugging information.

## Overview

The error handling system includes:

1. **Global Error Handler Middleware** - Catches all unhandled errors
2. **Custom Error Classes** - Specific error types for different scenarios
3. **Circuit Breaker Pattern** - Prevents cascading failures
4. **Service Health Monitoring** - Real-time service status tracking
5. **Graceful Degradation** - Fallback responses when services fail
6. **Comprehensive Logging** - Structured logging with context
7. **Timeout and Retry Logic** - Automatic recovery from transient failures

## Architecture

### Error Classes

```javascript
// Base application error
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

// Specific error types
class DatabaseError extends AppError     // Database connection/query failures
class CacheError extends AppError        // Redis connection/operation failures
class ExternalServiceError extends AppError // Third-party API failures
class ValidationError extends AppError   // Input validation failures
class AuthenticationError extends AppError // Authentication failures
class AuthorizationError extends AppError // Authorization failures
class RateLimitError extends AppError   // Rate limit exceeded
```

### Circuit Breaker

The circuit breaker pattern prevents cascading failures by:

- **Monitoring** failure rates for external services
- **Opening** the circuit when failure threshold is exceeded
- **Failing fast** when circuit is open
- **Attempting recovery** with half-open state

```javascript
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,    // Open after 5 failures
  resetTimeout: 60000,    // Try recovery after 1 minute
  monitoringPeriod: 30000 // Check every 30 seconds
});
```

### Service Health Monitor

Continuously monitors service health:

```javascript
serviceMonitor.registerService('database', dbHealthCheck);
serviceMonitor.registerService('redis', redisHealthCheck);
serviceMonitor.registerService('nasa_api', nasaApiHealthCheck);
```

## Error Handling Features

### 1. Database Error Handling

**Connection Management:**
- Automatic connection retry with exponential backoff
- Connection pooling with health checks
- Graceful degradation to mock data when database is unavailable

**Query Protection:**
- Query timeouts (10 seconds default)
- Retry logic for transient failures
- Transaction support with automatic rollback
- Detailed error mapping for PostgreSQL error codes

**Example:**
```javascript
// Automatic retry and timeout
const result = await withRetry(async () => {
  return await withTimeout(
    db.query('SELECT * FROM items'),
    10000,
    'Query timeout'
  );
}, 3, 500);
```

### 2. Cache Error Handling

**Redis Resilience:**
- Connection monitoring with automatic reconnection
- Circuit breaker for Redis operations
- Graceful bypass when Redis is unavailable
- Safe operation wrappers that don't throw

**Example:**
```javascript
// Safe Redis operation with fallback
const cached = await safeRedisOperation(
  () => client.get(key),
  null // Fallback value
);
```

### 3. External API Error Handling

**NASA API Protection:**
- Circuit breaker to prevent API overload
- Request/response validation
- Timeout protection (15 seconds)
- Retry logic for transient failures
- Rate limiting compliance

**Error Mapping:**
- 401 → 503 (Authentication failure → Service unavailable)
- 403 → 429 (Forbidden → Rate limit exceeded)
- 404 → 404 (Not found → Pass through)
- 5xx → 503 (Server errors → Service unavailable)

### 4. Input Validation

**Comprehensive Validation:**
- Request body validation using express-validator
- Path and query parameter sanitization
- Size limits and type checking
- XSS protection and HTML escaping

**Example:**
```javascript
const validateResource = [
  body('id').isString().isLength({ min: 1, max: 100 }).trim().escape(),
  body('type').isIn(['APOD', 'NEO', 'MARS', 'IMAGES']),
  body('url').optional().isURL({ protocols: ['http', 'https'] })
];
```

## Graceful Degradation Strategies

### Database Degradation
When database is unavailable:
- Return mock data for saved items
- Respond with 503 + cached data if available
- Continue serving read-only requests

### Cache Degradation
When Redis is unavailable:
- Bypass caching entirely
- Add `X-Cache: BYPASSED` header
- Continue normal operation without performance benefits

### External Service Degradation
When NASA API is down:
- Return cached responses if available
- Respond with 503 + helpful error message
- Continue serving other functionality

## Logging and Monitoring

### Structured Logging
All errors include:
- Request ID for correlation
- Error details and stack traces
- Service status and circuit breaker state
- Performance metrics (duration, response time)

**Example Log Entry:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "error",
  "message": "Database query failed",
  "requestId": "req-123-abc-456",
  "error": {
    "message": "Connection timeout",
    "code": "ECONNRESET",
    "queryId": "q-789-def"
  },
  "service": "database",
  "duration": 10000
}
```

### Health Endpoints

#### `/health`
- Basic health check
- Service status overview
- Overall system health

#### `/api/v1/status`
- Detailed system status
- Connection pool status
- Service metrics
- Memory and CPU usage

#### `/api/v1/metrics`
- Performance metrics
- Service-specific data
- Error rates and response times

## Error Response Format

All error responses follow consistent format:

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",          // Machine-readable error code
    "message": "Human readable message",
    "requestId": "req-123-abc-456", // Request correlation ID
    "details": { ... }            // Additional error details (dev only)
  }
}
```

### Standard Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `UNAUTHORIZED` | Authentication required | 401 |
| `FORBIDDEN` | Access denied | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `TIMEOUT` | Operation timed out | 504 |
| `DATABASE_ERROR` | Database operation failed | 503 |
| `CACHE_ERROR` | Cache operation failed | 503 |
| `EXTERNAL_SERVICE_ERROR` | Third-party service failed | 502 |
| `CIRCUIT_BREAKER_OPEN` | Service temporarily unavailable | 503 |

## Configuration

### Environment Variables
```bash
# Database connection
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=nasa_system6_portal
DB_USER=postgres
DB_PASSWORD=password

# Redis connection
REDIS_URL=redis://localhost:6379

# NASA API
NASA_API_KEY=your_api_key

# Error handling
LOG_LEVEL=info
NODE_ENV=development
```

### Circuit Breaker Settings
```javascript
const circuitBreakerOptions = {
  failureThreshold: 5,     // Failures before opening
  resetTimeout: 60000,     // Time before retry (ms)
  monitoringPeriod: 30000  // Health check interval (ms)
};
```

## Testing

### Error Scenarios Tested
- Database connection failures
- Redis disconnection
- NASA API timeouts and errors
- Invalid input data
- Rate limit exceeded
- Malformed requests
- Service cascading failures

### Test Commands
```bash
# Run error handling tests
npm test -- test-error-handling

# Run with coverage
npm run test:coverage -- test-error-handling

# Test specific scenarios
npm test -- --grep "should handle database unavailability"
```

## Monitoring and Alerting

### Key Metrics to Monitor
- Error rates by service
- Circuit breaker state changes
- Response time percentiles
- Database connection pool usage
- Redis connection status

### Alert Conditions
- Error rate > 5% for 5 minutes
- Circuit breaker open for > 1 minute
- Database connection failures > 10/minute
- Redis disconnected > 5 minutes

## Best Practices

### For Developers
1. Always use `asyncHandler` for async route handlers
2. Wrap external service calls in circuit breakers
3. Include request IDs in all log entries
4. Use specific error classes for different error types
5. Implement graceful degradation for all external dependencies

### Error Handling Pattern
```javascript
router.get('/endpoint', asyncHandler(async (req, res) => {
  try {
    // Use circuit breaker for external calls
    const result = await circuitBreaker.execute(async () => {
      return await externalServiceCall();
    });

    // Validate response
    if (!result) {
      throw new ExternalServiceError('Service', 'Invalid response');
    }

    res.json({ success: true, data: result });

  } catch (error) {
    logger.error('Operation failed', {
      requestId: req.requestId,
      error: error.message
    });

    // Let global error handler format response
    throw error;
  }
}));
```

### Production Deployment
1. Set `NODE_ENV=production` to hide error details
2. Configure external monitoring and alerting
3. Set appropriate log levels
4. Monitor circuit breaker states
5. Test failure scenarios regularly

## Troubleshooting

### Common Issues

**Service Not Starting:**
- Check database connection string
- Verify Redis is running
- Check port availability

**High Error Rates:**
- Check service health endpoints
- Review circuit breaker status
- Monitor external service availability

**Performance Issues:**
- Check query performance
- Monitor connection pool usage
- Review cache hit rates

### Debug Mode
Set `NODE_ENV=development` to see:
- Detailed error stacks
- Internal service errors
- Full error details in responses

## Future Enhancements

1. **Distributed Tracing** - Add OpenTelemetry support
2. **Advanced Metrics** - Prometheus integration
3. **Auto-scaling** - Dynamic resource allocation
4. **ML-based Anomaly Detection** - Predictive failure detection
5. **Chaos Engineering** - Automated failure testing