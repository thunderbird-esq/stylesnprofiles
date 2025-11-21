# ADR-002: NASA API Proxy Architecture

- **Status**: Accepted
- **Date**: 2024-01-20
- **Decision makers**: Development Team, Security Lead
- **Superseded by**: None

## Context

The NASA System 6 Portal integrates with multiple NASA APIs including APOD (Astronomy Picture of the Day), NeoWS (Near Earth Object Web Service), and potentially others. Several critical requirements must be addressed:

### Security Requirements
1. **API Key Protection**: NASA API keys must never be exposed to client-side code
2. **Rate Limiting**: NASA APIs have strict rate limits (50 requests/15 minutes for APOD)
3. **Input Validation**: All user inputs must be validated before API calls
4. **CORS Compliance**: Proper cross-origin resource sharing configuration

### Performance Requirements
1. **Response Caching**: Cache NASA API responses to improve performance
2. **Request Aggregation**: Combine multiple requests when possible
3. **Error Handling**: Graceful handling of NASA API failures
4. **Connection Pooling**: Efficient use of HTTP connections

### Scalability Requirements
1. **Load Distribution**: Distribute requests across multiple servers
2. **Monitoring**: Track API usage and performance metrics
3. **Configuration Management**: Easy API key rotation and configuration
4. **Fallback Handling**: Alternative data sources when NASA APIs are unavailable

### Problem Statement

How do we securely and efficiently integrate with NASA APIs while protecting API keys and ensuring reliable performance?

## Decision

Implement a server-side API proxy architecture using Node.js with Express.js to handle all NASA API interactions.

### Architecture Overview
```
React Client → Express Proxy Server → NASA APIs
     (3000)           (3001)           (External)
                +----------------+
                | API Key Store  |
                +----------------+
                +----------------+
                | Response Cache |
                +----------------+
                +----------------+
                | Rate Limiter   |
                +----------------+
```

## Options Considered

### Option 1: Server-Side Proxy (Selected)
**Implementation**: Express.js server that proxies all NASA API requests

**Pros**:
- Complete API key security
- Centralized rate limiting
- Response caching capability
- Input validation and sanitization
- Error handling and retry logic
- Request/response monitoring
- Easy API key rotation
- No client-side exposure of internal APIs

**Cons**:
- Additional infrastructure component
- Single point of failure for NASA data
- Increased latency for API calls
- Additional maintenance overhead
- Complex deployment architecture

### Option 2: Client-Side with API Key Service
**Implementation**: Client calls NASA APIs directly, API key provided by authentication service

**Pros**:
- Lower latency (direct calls)
- Simpler architecture
- Better caching in browser
- No server-side bottleneck

**Cons**:
- API key exposure risk
- Difficult rate limiting enforcement
- No centralized caching
- Client complexity for retry logic
- Harder to rotate API keys
- Potential for abuse

### Option 3: Third-Party API Gateway
**Implementation**: Use commercial API gateway service (AWS API Gateway, Cloudflare Workers)

**Pros**:
- Managed infrastructure
- Built-in rate limiting and caching
- High availability and scalability
- Professional monitoring and logging
- No server maintenance

**Cons**:
- Additional cost
- Vendor lock-in
- Configuration complexity
- Less control over implementation
- Integration complexity with existing stack

### Option 4: Hybrid Approach
**Implementation**: Proxy for sensitive operations, direct client calls for public data

**Pros**:
- Balances security and performance
- Optimized for different use cases
- Flexible architecture

**Cons**:
- Increased complexity
- Inconsistent patterns
- Difficult to maintain
- Confusing for developers

## Rationale

The server-side proxy approach provides the best balance of security, performance, and maintainability for this project:

1. **Security First**: API keys never leave the server environment
2. **Rate Limiting**: Centralized enforcement of NASA API limits
3. **Caching**: Server-side caching reduces API calls and improves performance
4. **Monitoring**: Comprehensive visibility into API usage and performance
5. **Flexibility**: Easy to add new NASA endpoints or modify existing ones
6. **Reliability**: Centralized error handling and retry logic
7. **Compliance**: Easier to meet security and audit requirements

## Consequences

### Positive

1. **Security**: Complete protection of NASA API keys
2. **Compliance**: Easier to meet security and audit requirements
3. **Performance**: Server-side caching reduces API latency
4. **Monitoring**: Comprehensive logging and metrics collection
5. **Reliability**: Centralized error handling and retry logic
6. **Scalability**: Can be horizontally scaled behind load balancer
7. **Flexibility**: Easy to add new NASA services or modify endpoints

### Negative

1. **Infrastructure Complexity**: Additional server component to deploy and maintain
2. **Single Point of Failure**: Proxy server failure affects all NASA data access
3. **Latency**: Additional hop increases response time
4. **Cost**: Additional server resources and monitoring
5. **Maintenance**: Additional component requires updates and patches
6. **Deployment Complexity**: More complex CI/CD pipeline

## Implementation

### Technology Stack
```javascript
// Package Dependencies
{
  "express": "^4.18.2",           // Web framework
  "cors": "^2.8.5",              // CORS handling
  "helmet": "^7.0.0",            // Security headers
  "express-rate-limit": "^6.7.0", // Rate limiting
  "axios": "^1.4.0",             // HTTP client
  "node-cache": "^5.1.2",        // In-memory caching
  "express-validator": "^7.0.1", // Input validation
  "winston": "^3.10.0"           // Logging
}
```

### Core Architecture Components

#### 1. API Proxy Handler
```javascript
// Routes all NASA API requests
app.use('/api/nasa', nasaProxyRouter);

// Endpoint mapping:
// GET /api/nasa/planetary/apod      → NASA APOD API
// GET /api/nasa/neo/rest/v1/feed   → NASA NeoWS API
// GET /api/nasa/mars-photos/api/v1 → NASA Mars Rover API
```

#### 2. Rate Limiting Strategy
```javascript
// Per-IP rate limiting to respect NASA API limits
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: 'Too many requests from this IP'
});

// Apply to all NASA API endpoints
app.use('/api/nasa', rateLimiter);
```

#### 3. Caching Implementation
```javascript
// Cache frequently requested data
const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 600 // Check expired keys every 10 minutes
});

// Cache keys: apod:YYYY-MM-DD, neo:YYYY-MM-DD, etc.
```

#### 4. Error Handling
```javascript
// Graceful fallback for NASA API failures
app.use((err, req, res, next) => {
  if (err.response?.status === 429) {
    // Rate limit exceeded - serve cached data
    return serveCachedResponse(req, res);
  }
  // Handle other errors appropriately
});
```

### Security Measures

1. **API Key Management**: Environment variables with rotation capability
2. **Input Validation**: All parameters validated before NASA API calls
3. **Output Sanitization**: Responses cleaned before client delivery
4. **CORS Configuration**: Strict CORS policy for API endpoints
5. **Rate Limiting**: Per-IP and per-endpoint rate limiting
6. **Request Logging**: Comprehensive audit trail of all API calls

### Monitoring and Observability

1. **API Usage Metrics**: Request counts, response times, error rates
2. **Cache Performance**: Hit rates, miss rates, cache size
3. **NASA API Health**: Status of external NASA services
4. **Security Monitoring**: Suspicious activity, rate limit violations
5. **Performance Monitoring**: Response time distributions, bottlenecks

## Configuration Management

### Environment Variables
```bash
# NASA API Configuration
NASA_API_KEY=your_nasa_api_key_here
NASA_API_BASE_URL=https://api.nasa.gov

# Server Configuration
PORT=3001
NODE_ENV=production

# Cache Configuration
CACHE_TTL_APOD=86400    # 24 hours for APOD
CACHE_TTL_NEWS=3600     # 1 hour for NEO data
CACHE_MAX_SIZE=100      # Maximum cached items

# Rate Limiting
RATE_LIMIT_WINDOW=900000   # 15 minutes in milliseconds
RATE_LIMIT_MAX=50          # Requests per window
```

### API Key Rotation Strategy
1. **Key Storage**: Environment variables with secure access
2. **Rotation Process**: Automated weekly key rotation
3. **Fallback Support**: Multiple keys for redundancy
4. **Monitoring**: Alert on key failures or expiration

## Success Metrics

### Security Metrics
- Zero API key exposure incidents
- Rate limiting effectiveness (> 99% compliance)
- Input validation success rate (> 100% coverage)
- Security scan results (zero vulnerabilities)

### Performance Metrics
- Average API response time (< 200ms for cached, < 2s for fresh)
- Cache hit rate (> 80% for frequently accessed data)
- Server uptime (> 99.9%)
- Error rate (< 1%)

### Operational Metrics
- Monitoring alert effectiveness
- Deployment success rate (> 95%)
- Mean time to recovery (< 5 minutes)
- API key rotation success rate (100%)

## Future Considerations

1. **Multi-Region Deployment**: Deploy proxy servers in multiple regions for reduced latency
2. **Advanced Caching**: Implement Redis for distributed caching
3. **WebSocket Support**: Real-time data updates from NASA services
4. **Additional NASA APIs**: Expand to support more NASA data services
5. **AI/ML Integration**: Intelligent caching and request optimization

---

*This decision establishes the security and performance foundation for NASA API integration.*