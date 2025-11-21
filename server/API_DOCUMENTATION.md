# NASA System 6 Portal API Documentation

## Overview

This document provides comprehensive information about the NASA System 6 Portal API, including endpoint specifications, authentication, error handling, and usage examples.

## Quick Start

### 1. Access the API Documentation

- **Swagger UI**: http://localhost:3001/api-docs
- **Health Check**: http://localhost:3001/health
- **Base URL**: http://localhost:3001/api/v1

### 2. Test the API

```bash
# Start the server
cd server
npm start

# Run API validation tests
node test-api-spec.js

# Test specific endpoint
curl http://localhost:3001/health
```

## API Architecture

### Versioning

The API supports versioning through URL paths:

- **v1 API**: `/api/v1/*` - Latest stable version
- **Legacy API**: `/api/*` - Backward compatibility

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true|false,
  "data": { ... },  // Present on success
  "error": {        // Present on failure
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "requestId": "unique-request-id",
    "details": [...] // Validation errors only
  }
}
```

### Request Headers

- `Content-Type: application/json` - Required for POST/PUT requests
- `Authorization: Bearer <token>` - Optional JWT token (coming soon)
- `X-Request-ID` - Auto-generated for request tracking

## Authentication

**Current Status**: Authentication is planned but not yet implemented. All endpoints currently allow anonymous access with rate limiting.

**Future Implementation**:
- JWT-based authentication
- Role-based access control (Guest, User, Premium, Admin, Moderator)
- Rate limits based on user role

## Rate Limiting

The API implements tiered rate limiting:

- **Anonymous/Guest**: 30 requests per 15 minutes
- **Authenticated Users**: 100 requests per 15 minutes
- **Premium Users**: 500 requests per 15 minutes
- **Admin**: Unlimited

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit for current window
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when rate limit resets

## Endpoints

### NASA Data Endpoints

#### Astronomy Picture of the Day (APOD)

```http
GET /api/v1/nasa/apod
GET /api/nasa/planetary/apod
```

**Parameters**:
- `date` (optional): Date in YYYY-MM-DD format
- `thumbs` (optional): Return thumbnail (boolean)

**Example**:
```bash
# Get today's APOD
curl "http://localhost:3001/api/v1/nasa/apod"

# Get APOD for specific date
curl "http://localhost:3001/api/v1/nasa/apod?date=2024-01-01"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "date": "2024-01-01",
    "title": "Andromeda Galaxy",
    "explanation": "...",
    "url": "https://apod.nasa.gov/apod/image/2401/ngc1234.jpg",
    "hdurl": "https://apod.nasa.gov/apod/image/2401/ngc1234_hd.jpg",
    "media_type": "image",
    "copyright": "NASA"
  }
}
```

#### Near Earth Objects (NEO)

```http
GET /api/v1/nasa/neo/browse?page=0&size=20
GET /api/nasa/neo/rest/v1/neo/browse?page=0&size=20
```

**Parameters**:
- `page` (optional): Page number (default: 0)
- `size` (optional): Items per page (max: 20, default: 20)

#### Mars Rover Photos

```http
GET /api/v1/nasa/mars/photos/{rover}
GET /api/nasa/mars-photos/api/v1/rovers/{rover}/photos
```

**Parameters**:
- `rover` (required): Rover name (curiosity, opportunity, spirit)
- `sol` (optional): Martian solar day
- `camera` (optional): Camera name
- `page` (optional): Page number (default: 1)

#### Generic NASA API Proxy

```http
GET /api/nasa/{endpoint}
```

The proxy supports any NASA API endpoint by automatically adding the API key.

**Common endpoints**:
- `/planetary/apod` - APOD
- `/neo/rest/v1/feed` - NEO feed
- `/neo/rest/v1/neo/browse` - Browse NEOs
- `/mars-photos/api/v1/rovers/{rover}/photos` - Mars photos
- `/EPIC/archive/natural/{date}/png/{image}.png` - EPIC images

### Resource Navigator Endpoints

#### Saved Items

```http
GET /api/resources/saved
POST /api/resources/saved
```

**GET Parameters**:
- `limit` (optional): Items per page (default: 20, max: 100)
- `offset` (optional): Number of items to skip (default: 0)
- `type` (optional): Filter by type (APOD, NEO, MARS, IMAGES)
- `category` (optional): Filter by category

**POST Body**:
```json
{
  "id": "unique-item-id",
  "type": "APOD",
  "title": "Item title",
  "url": "https://example.com/image.jpg",
  "category": "astronomy",
  "description": "Item description"
}
```

**Example**:
```bash
# Get saved items
curl "http://localhost:3001/api/resources/saved?type=APOD&limit=10"

# Save an item
curl -X POST "http://localhost:3001/api/resources/saved" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "apod-2024-01-01",
    "type": "APOD",
    "title": "Andromeda Galaxy",
    "url": "https://apod.nasa.gov/apod/image/2401/ngc1234.jpg",
    "category": "astronomy",
    "description": "Beautiful spiral galaxy"
  }'
```

#### Search Queries

```http
POST /api/resources/search
```

**POST Body**:
```json
{
  "query_string": "mars rover photos"
}
```

**Example**:
```bash
curl -X POST "http://localhost:3001/api/resources/search" \
  -H "Content-Type: application/json" \
  -d '{"query_string": "nebula images"}'
```

### System Endpoints

#### Health Check

```http
GET /health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "1.0.0",
    "uptime": 3600,
    "cache": "connected"
  }
}
```

#### System Status (Admin Only)

```http
GET /api/v1/status
Authorization: Bearer <admin-token>
```

### User Management (Coming Soon)

These endpoints are planned but currently return 501 Not Implemented:

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh
- `GET /api/v1/users/profile` - User profile
- `GET /api/v1/users/favorites` - User favorites
- `POST /api/v1/users/favorites` - Add favorite
- `DELETE /api/v1/users/favorites/{id}` - Remove favorite

## Error Handling

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation error)
- `401` - Unauthorized (Authentication required)
- `403` - Forbidden (Insufficient permissions)
- `404` - Not Found
- `409` - Conflict (Resource already exists)
- `429` - Rate Limit Exceeded
- `501` - Not Implemented
- `503` - Service Unavailable
- `504` - Gateway Timeout

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "requestId": "req_123456789",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `EXTERNAL_SERVICE_ERROR` - NASA API unavailable
- `TIMEOUT` - Request timeout
- `DATABASE_UNAVAILABLE` - Database connection error
- `NOT_IMPLEMENTED` - Feature coming soon

## Security Features

### Input Validation

- All user inputs are validated and sanitized
- SQL injection protection
- XSS protection
- Request size limits (10MB max)

### Security Headers

The API implements security headers via Helmet.js:

- `Content-Security-Policy` - Prevent XSS attacks
- `Strict-Transport-Security` - Force HTTPS
- `X-Frame-Options` - Prevent clickjacking
- `X-Content-Type-Options` - Prevent MIME sniffing

### Circuit Breaker

The NASA API proxy includes circuit breaker protection:

- Automatically trips after 5 consecutive failures
- 60-second reset timeout
- Graceful degradation with mock data

## Caching

### Redis Caching

- NASA API responses are cached for performance
- Different TTLs based on data volatility
- Cache invalidation on updates
- Graceful fallback when cache is unavailable

### Cache Headers

- `X-Cache`: HIT/MISS status
- `X-Cache-TTL`: Remaining cache time
- `ETag`: Entity tag for conditional requests

## Testing

### API Validation Script

Run the comprehensive API validation script:

```bash
cd server
node test-api-spec.js
```

This script:
- Tests all documented endpoints
- Validates response formats
- Checks error handling
- Measures response times
- Generates detailed report

### Manual Testing Examples

```bash
# Test health check
curl http://localhost:3001/health

# Test APOD endpoint
curl http://localhost:3001/api/v1/nasa/apod

# Test legacy proxy
curl http://localhost:3001/api/nasa/planetary/apod

# Test resource navigator
curl http://localhost:3001/api/resources/saved

# Test error handling
curl http://localhost:3001/api/invalid/endpoint
```

## Development

### Local Development Setup

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Set up environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Access documentation**:
   - Swagger UI: http://localhost:3001/api-docs
   - OpenAPI Spec: `/server/openapi.yaml`

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NASA_API_KEY` - NASA API key (required)
- `JWT_SECRET` - JWT secret key (for future authentication)
- `REDIS_URL` - Redis connection URL
- `NODE_ENV` - Environment (development/production)

### Database Schema

The API uses PostgreSQL with the following tables:

```sql
-- Saved items table
CREATE TABLE saved_items (
  id VARCHAR(100) PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  url TEXT,
  category VARCHAR(50),
  description TEXT,
  saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search queries table
CREATE TABLE saved_searches (
  id SERIAL PRIMARY KEY,
  query_string VARCHAR(200) NOT NULL,
  search_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Monitoring and Observability

### Request Tracking

Every request receives a unique ID for debugging:

```http
X-Request-ID: req_123456789
```

### Logging

The API implements structured logging with:

- Request/response logging
- Error tracking
- Performance metrics
- Circuit breaker state changes

### Health Monitoring

- Database connectivity checks
- External service (NASA API) health checks
- Cache status monitoring
- Memory and CPU usage tracking

## Contributing

### API Changes

When modifying the API:

1. Update the implementation code
2. Update the OpenAPI specification (`openapi.yaml`)
3. Add/update tests in `test-api-spec.js`
4. Update documentation
5. Run validation tests

### Code Standards

- Use TypeScript for new code
- Follow ESLint configuration
- Add comprehensive error handling
- Include request ID in all error responses
- Maintain backward compatibility

## Support

### Troubleshooting

**Server won't start**:
- Check if port 3001 is available
- Verify environment variables are set
- Check database connection

**NASA API errors**:
- Verify NASA_API_KEY is set and valid
- Check rate limits (apply to all users)
- Monitor circuit breaker status

**Database errors**:
- Check PostgreSQL is running
- Verify connection string
- Check table schemas

### Getting Help

- Check the [GitHub Issues](https://github.com/nasa-system6-portal/issues)
- Review the API documentation at `/api-docs`
- Run the validation script for detailed testing

## License

MIT License - see LICENSE file for details.

## Changelog

### v1.0.0 (Current)
- Basic NASA API proxy functionality
- Resource Navigator for saved items
- Comprehensive error handling
- Rate limiting and security features
- OpenAPI 3.0 documentation
- Redis caching support
- Circuit breaker patterns

### Future Features
- User authentication and authorization
- Advanced search functionality
- Collections and favorites management
- Real-time notifications
- Analytics dashboard
- API versioning strategy