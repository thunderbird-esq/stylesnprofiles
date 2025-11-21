# NASA System 6 Portal - API Testing & Deployment Guide

*Last Updated: November 12, 2025*

## Overview

This guide provides comprehensive testing strategies and deployment procedures for the NASA System 6 Portal REST API. It covers unit testing, integration testing, performance testing, security testing, and production deployment best practices.

## Testing Architecture

### Testing Pyramid

```
    /\
   /  \  E2E Tests (5%)
  /____\
 /      \
/        \ Integration Tests (25%)
\________/
\        /
 \______/ Unit Tests (70%)
```

### Test Categories

1. **Unit Tests**: Individual function and component testing
2. **Integration Tests**: API endpoint testing with database integration
3. **End-to-End Tests**: Complete user workflow testing
4. **Performance Tests**: Load testing and response time validation
5. **Security Tests**: Authentication, authorization, and vulnerability testing

## Unit Testing

### Test Framework Setup

#### Jest Configuration
```javascript
// server/jest.config.js
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/node_modules/**',
    '!server/coverage/**',
    '!server/jest.config.js'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/server/jest.setup.js'],
  testMatch: [
    '<rootDir>/server/**/*.test.js',
    '<rootDir>/server/__tests__/**/*.js'
  ],
  verbose: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

#### Test Setup
```javascript
// server/jest.setup.js
const { Pool } = require('pg');
const Redis = require('redis');

// Mock database connection
jest.mock('pg', () => ({
  Pool: jest.fn(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn()
  }))
}));

// Mock Redis
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
    quit: jest.fn(),
    isOpen: true
  }))
}));

// Global test timeout
jest.setTimeout(10000);
```

### Middleware Unit Testing

#### Authentication Middleware Tests
```javascript
// server/__tests__/middleware/auth.test.js
const { authenticateToken, authorize, ROLES } = require('../../middleware/auth');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    test('should authenticate with valid token', async () => {
      const user = { id: 'user-123', email: 'test@example.com', role: ROLES.USER };
      const token = jwt.sign(user, process.env.JWT_SECRET);

      const req = {
        headers: { authorization: `Bearer ${token}` }
      };
      const res = {};
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(req.user).toEqual(user);
      expect(next).toHaveBeenCalled();
    });

    test('should reject without token', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Access token required'
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      const req = {
        headers: { authorization: 'Bearer invalid-token' }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    test('should authorize with correct role', () => {
      const req = { user: { role: ROLES.USER } };
      const res = {};
      const next = jest.fn();
      const authMiddleware = authorize([ROLES.USER, ROLES.ADMIN]);

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should reject with insufficient role', () => {
      const req = { user: { role: ROLES.GUEST } };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      const authMiddleware = authorize([ROLES.USER]);

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
```

#### Caching Middleware Tests
```javascript
// server/__tests__/middleware/cache.test.js
const { cache, generateCacheKey, getCacheStats } = require('../../middleware/cache');
const Redis = require('redis');

describe('Caching Middleware', () => {
  let mockRedisClient;
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockRedisClient = {
      get: jest.fn(),
      setex: jest.fn(),
      isOpen: true
    };

    jest.mock('redis', () => ({
      createClient: jest.fn(() => mockRedisClient)
    }));

    mockReq = {
      originalUrl: '/api/v1/nasa/apod',
      query: {},
      user: { id: 'user-123' }
    };

    mockRes = {
      json: jest.fn(),
      set: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('cache middleware', () => {
    test('should return cached data on cache hit', async () => {
      const cachedData = { success: true, data: { title: 'Test APOD' } };
      mockRedisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const cacheMiddleware = cache(300, 'test');
      await cacheMiddleware(mockReq, mockRes, mockNext);

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockRes.set).toHaveBeenCalledWith('X-Cache', 'HIT');
      expect(mockRes.json).toHaveBeenCalledWith(cachedData);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should proceed to next middleware on cache miss', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const originalJson = mockRes.json;
      const cacheMiddleware = cache(300, 'test');
      await cacheMiddleware(mockReq, mockRes, mockNext);

      expect(mockRedisClient.get).toHaveBeenCalled();
      expect(mockRes.set).toHaveBeenCalledWith('X-Cache', 'MISS');
      expect(mockNext).toHaveBeenCalled();
      expect(typeof mockRes.json).toBe('function');
    });

    test('should cache successful responses', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const responseData = { success: true, data: { title: 'Test APOD' } };
      const cacheMiddleware = cache(300, 'test');

      await cacheMiddleware(mockReq, mockRes, mockNext);

      // Mock a successful response
      mockRes.json(responseData);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        expect.any(String),
        300,
        JSON.stringify(responseData)
      );
    });
  });

  describe('generateCacheKey', () => {
    test('should generate cache key with user', () => {
      const req = {
        originalUrl: '/api/v1/nasa/apod',
        query: { date: '2024-01-01' },
        user: { id: 'user-123' }
      };

      const key = generateCacheKey(req, 'nasa');

      expect(key).toBe('nasa:/api/v1/nasa/apod:{"date":"2024-01-01"}:user-123');
    });

    test('should generate cache key without user', () => {
      const req = {
        originalUrl: '/api/v1/nasa/apod',
        query: {},
        user: null
      };

      const key = generateCacheKey(req, 'nasa');

      expect(key).toBe('nasa:/api/v1/nasa/apod:{}:anonymous');
    });
  });
});
```

#### Validation Middleware Tests
```javascript
// server/__tests__/middleware/validation.test.js
const {
  sanitizeInput,
  handleValidationErrors,
  nasaApiValidation,
  userRegistrationValidation
} = require('../../middleware/validation');
const { validationResult } = require('express-validator');

describe('Validation Middleware', () => {
  describe('sanitizeInput', () => {
    test('should sanitize string input', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(input);

      expect(sanitized).toBe('alert("xss")Hello World');
    });

    test('should sanitize nested objects', () => {
      const input = {
        name: '<b>Bold</b>',
        nested: {
          malicious: '<script>alert("xss")</script>'
        },
        array: ['<i>italic</i>', 'normal']
      };

      const sanitized = sanitizeInput(input);

      expect(sanitized.name).toBe('Bold');
      expect(sanitized.nested.malicious).toBe('alert("xss")');
      expect(sanitized.array).toEqual(['italic', 'normal']);
    });
  });

  describe('handleValidationErrors', () => {
    test('should call next when no validation errors', () => {
      const req = {
        body: { email: 'test@example.com' }
      };

      validationResult.mockReturnValue({
        isEmpty: () => true
      });

      const res = {};
      const next = jest.fn();

      handleValidationErrors(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    test('should return validation errors when present', () => {
      const errors = [
        { path: 'email', msg: 'Invalid email', value: 'invalid-email' }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => errors
      });

      const req = { body: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      handleValidationErrors(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: [{
            field: 'email',
            message: 'Invalid email'
          }]
        }
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
```

### Service Layer Testing

#### NASA API Service Tests
```javascript
// server/__tests__/services/nasaApi.test.js
const nasaApiService = require('../../services/nasaApi');
const axios = require('axios');

jest.mock('axios');

describe('NASA API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getApod', () => {
    test('should fetch APOD successfully', async () => {
      const mockApodData = {
        date: '2024-01-01',
        title: 'Test APOD',
        url: 'https://apod.nasa.gov/image.jpg',
        explanation: 'Test explanation'
      };

      axios.get.mockResolvedValue({
        data: mockApodData
      });

      const result = await nasaApiService.getApod();

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/planetary/apod',
        {
          params: {
            api_key: process.env.NASA_API_KEY
          }
        }
      );
      expect(result.data).toEqual(mockApodData);
    });

    test('should handle API errors', async () => {
      const errorMessage = 'NASA API Error';
      axios.get.mockRejectedValue(new Error(errorMessage));

      await expect(nasaApiService.getApod()).rejects.toThrow(errorMessage);
    });

    test('should fetch APOD for specific date', async () => {
      const date = '2024-01-01';
      const mockApodData = { date, title: 'Test APOD' };

      axios.get.mockResolvedValue({ data: mockApodData });

      await nasaApiService.getApod({ date });

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.nasa.gov/planetary/apod',
        {
          params: {
            api_key: process.env.NASA_API_KEY,
            date
          }
        }
      );
    });
  });
});
```

## Integration Testing

### Test Database Setup

#### Test Database Configuration
```javascript
// server/__tests__/setup/testDb.js
const { Pool } = require('pg');

const testDbConfig = {
  host: process.env.TEST_DB_HOST || 'localhost',
  port: process.env.TEST_DB_PORT || 5432,
  database: process.env.TEST_DB_NAME || 'nasa_system6_test',
  user: process.env.TEST_DB_USER || 'postgres',
  password: process.env.TEST_DB_PASSWORD || 'password'
};

const testPool = new Pool(testDbConfig);

const setupTestDb = async () => {
  try {
    // Clean up test data
    await testPool.query('TRUNCATE TABLE saved_items, saved_searches RESTART IDENTITY');
    console.log('Test database cleaned up');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
};

const cleanupTestDb = async () => {
  try {
    await testPool.query('TRUNCATE TABLE saved_items, saved_searches RESTART IDENTITY');
    await testPool.end();
    console.log('Test database cleaned up and connection closed');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
  }
};

module.exports = {
  testPool,
  setupTestDb,
  cleanupTestDb
};
```

### API Endpoint Integration Tests

#### Authentication Endpoints
```javascript
// server/__tests__/integration/auth.test.js
const request = require('supertest');
const app = require('../../enhanced-server');
const { testPool, setupTestDb, cleanupTestDb } = require('../setup/testDb');

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('POST /api/v1/auth/register', () => {
    test('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        username: 'testuser',
        displayName: 'Test User'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
    });

    test('should reject duplicate email', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        username: 'testuser2',
        displayName: 'Test User 2'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    test('should validate password requirements', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'weak', // Too weak
        username: 'testuser2',
        displayName: 'Test User 2'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    test('should login valid user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tokens.accessToken).toBeDefined();
    });

    test('should reject invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
```

#### NASA API Endpoints
```javascript
// server/__tests__/integration/nasa.test.js
const request = require('supertest');
const app = require('../../enhanced-server');
const { setupTestDb, cleanupTestDb } = require('../setup/testDb');

describe('NASA API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    await setupTestDb();

    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'nasa-test@example.com',
        password: 'SecurePass123!',
        username: 'nasatest',
        displayName: 'NASA Test User'
      });

    authToken = registerResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('GET /api/v1/nasa/apod', () => {
    test('should get APOD without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/nasa/apod')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.date).toBeDefined();
      expect(response.body.data.title).toBeDefined();
      expect(response.body.data.url).toBeDefined();
    });

    test('should get APOD for specific date', async () => {
      const response = await request(app)
        .get('/api/v1/nasa/apod?date=2024-01-01')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.date).toBe('2024-01-01');
    });

    test('should include cache headers', async () => {
      const response = await request(app)
        .get('/api/v1/nasa/apod')
        .expect(200);

      expect(response.headers['x-cache']).toBeDefined();
      expect(response.headers['x-cache-key']).toBeDefined();
    });
  });

  describe('GET /api/v1/nasa/neo/browse', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/v1/nasa/neo/browse')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should get NEO data with authentication', async () => {
      const response = await request(app)
        .get('/api/v1/nasa/neo/browse')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.page).toBeDefined();
      expect(response.body.data.near_earth_objects).toBeDefined();
    });

    test('should validate pagination parameters', async () => {
      const response = await request(app)
        .get('/api/v1/nasa/neo/browse?page=invalid&size=invalid')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

#### User Resources Endpoints
```javascript
// server/__tests__/integration/user-resources.test.js
const request = require('supertest');
const app = require('../../enhanced-server');
const { setupTestDb, cleanupTestDb } = require('../setup/testDb');

describe('User Resources Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    await setupTestDb();

    // Create test user and get auth token
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'user-test@example.com',
        password: 'SecurePass123!',
        username: 'usertest',
        displayName: 'User Test User'
      });

    authToken = registerResponse.body.data.tokens.accessToken;
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('POST /api/v1/users/favorites', () => {
    test('should add item to favorites', async () => {
      const favoriteData = {
        type: 'APOD',
        itemId: 'apod-2024-01-01',
        title: 'Test APOD',
        url: 'https://apod.nasa.gov/test.jpg',
        description: 'Test APOD description'
      };

      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(favoriteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe(favoriteData.type);
      expect(response.body.data.itemId).toBe(favoriteData.itemId);
    });

    test('should validate favorite data', async () => {
      const invalidData = {
        type: 'INVALID_TYPE',
        itemId: '', // Empty
        title: '', // Empty
        url: 'invalid-url'
      };

      const response = await request(app)
        .post('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/users/favorites', () => {
    test('should get user favorites', async () => {
      const response = await request(app)
        .get('/api/v1/users/favorites')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.favorites).toBeDefined();
      expect(response.body.data.pagination).toBeDefined();
    });

    test('should filter favorites by type', async () => {
      const response = await request(app)
        .get('/api/v1/users/favorites?type=APOD')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Verify filtering logic
    });
  });

  describe('POST /api/v1/users/collections', () => {
    test('should create new collection', async () => {
      const collectionData = {
        name: 'Test Collection',
        description: 'A test collection for NASA images',
        isPublic: false,
        tags: ['test', 'nasa', 'space']
      };

      const response = await request(app)
        .post('/api/v1/users/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send(collectionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(collectionData.name);
      expect(response.body.data.tags).toEqual(collectionData.tags);
    });
  });
});
```

## Performance Testing

### Load Testing with Artillery

#### Artillery Configuration
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "NASA API Load Test"
    weight: 70
    flow:
      - get:
          url: "/api/v1/nasa/apod"
          headers:
            Content-Type: "application/json"
      - think: 1 # 1 second pause

  - name: "Authentication Load Test"
    weight: 20
    flow:
      - post:
          url: "/api/v1/auth/login"
          headers:
            Content-Type: "application/json"
          json:
            email: "test@example.com"
            password: "SecurePass123!"
      - think: 2

  - name: "Search Load Test"
    weight: 10
    flow:
      - get:
          url: "/api/v1/search?q=galaxy&limit=20"
          headers:
            Content-Type: "application/json"
      - think: 1
```

#### Running Load Tests
```bash
# Install Artillery
npm install -g artillery

# Run load tests
artillery run artillery-config.yml

# Run with specific environment
artillery run --environment production artillery-config.yml

# Generate HTML report
artillery run --output report.json artillery-config.yml
artillery report report.json
```

#### Performance Metrics
```javascript
// server/__tests__/performance/api-performance.test.js
describe('API Performance Tests', () => {
  test('APOD endpoint should respond within 200ms', async () => {
    const start = Date.now();

    await request(app)
      .get('/api/v1/nasa/apod')
      .expect(200);

    const responseTime = Date.now() - start;
    expect(responseTime).toBeLessThan(200);
  });

  test('Cached responses should be faster than uncached', async () => {
    // First request (uncached)
    const start1 = Date.now();
    await request(app).get('/api/v1/nasa/apod').expect(200);
    const time1 = Date.now() - start1;

    // Second request (cached)
    const start2 = Date.now();
    await request(app).get('/api/v1/nasa/apod').expect(200);
    const time2 = Date.now() - start2;

    expect(time2).toBeLessThan(time1 * 0.5); // Cached should be at least 50% faster
  });
});
```

## Security Testing

### Authentication Security Tests
```javascript
// server/__tests__/security/auth-security.test.js
describe('Authentication Security Tests', () => {
  test('should reject requests with malformed JWT', async () => {
    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer malformed.jwt.token')
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  test('should reject requests with expired JWT', async () => {
    const expiredToken = jwt.sign(
      { userId: 'test-user', exp: Math.floor(Date.now() / 1000) - 3600 },
      process.env.JWT_SECRET
    );

    const response = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
  });

  test('should implement rate limiting on auth endpoints', async () => {
    const loginData = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    // Make multiple rapid requests
    const requests = Array(35).fill().map(() =>
      request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
    );

    const responses = await Promise.allSettled(requests);
    const rateLimitedResponses = responses.filter(
      response => response.status === 429 || response.value?.status === 429
    );

    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});
```

### Input Validation Security Tests
```javascript
// server/__tests__/security/input-security.test.js
describe('Input Security Tests', () => {
  test('should sanitize XSS attempts in user input', async () => {
    const maliciousData = {
      type: 'APOD',
      itemId: 'apod-2024-01-01',
      title: '<script>alert("xss")</script>Malicious Title',
      url: 'https://apod.nasa.gov/test.jpg',
      description: '<img src=x onerror=alert("xss")>Malicious description'
    };

    const response = await request(app)
      .post('/api/v1/users/favorites')
      .set('Authorization', `Bearer ${authToken}`)
      .send(maliciousData)
      .expect(201);

    expect(response.body.data.title).not.toContain('<script>');
    expect(response.body.data.description).not.toContain('<img');
  });

  test('should prevent SQL injection attempts', async () => {
    const maliciousQuery = "'; DROP TABLE users; --";

    const response = await request(app)
      .get(`/api/v1/search?q=${encodeURIComponent(maliciousQuery)}`)
      .expect(400);

    expect(response.body.success).toBe(false);
  });
});
```

## End-to-End Testing

### Cypress E2E Tests
```javascript
// cypress/e2e/api-workflows.cy.js
describe('NASA API E2E Workflows', () => {
  beforeEach(() => {
    // Start the server for E2E tests
    cy.task('startServer');
  });

  afterEach(() => {
    cy.task('stopServer');
  });

  it('should complete user registration and APOD viewing workflow', () => {
    // Register user
    cy.request('POST', '/api/v1/auth/register', {
      email: 'e2e-test@example.com',
      password: 'SecurePass123!',
      username: 'e2euser',
      displayName: 'E2E Test User'
    }).then((response) => {
      expect(response.body.success).toBe(true);
      const { accessToken } = response.body.data.tokens;

      // View APOD
      cy.request({
        method: 'GET',
        url: '/api/v1/nasa/apod',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }).then((apodResponse) => {
        expect(apodResponse.body.success).toBe(true);
        expect(apodResponse.body.data.title).to.exist;

        // Add APOD to favorites
        cy.request({
          method: 'POST',
          url: '/api/v1/users/favorites',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: {
            type: 'APOD',
            itemId: apodResponse.body.data.date,
            title: apodResponse.body.data.title,
            url: apodResponse.body.data.url,
            description: apodResponse.body.data.explanation
          }
        }).then((favResponse) => {
          expect(favResponse.body.success).toBe(true);

          // Verify favorite was added
          cy.request({
            method: 'GET',
            url: '/api/v1/users/favorites',
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }).then((favoritesResponse) => {
            expect(favoritesResponse.body.success).toBe(true);
            expect(favoritesResponse.body.data.favorites).to.have.length(1);
          });
        });
      });
    });
  });
});
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
# .github/workflows/api-testing.yml
name: API Testing and Deployment

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: nasa_system6_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd server && npm ci
        cd ../client && npm ci

    - name: Run unit tests
      run: |
        cd server && npm run test:unit
      env:
        NODE_ENV: test
        JWT_SECRET: test-secret
        NASA_API_KEY: test-api-key
        TEST_DB_HOST: localhost
        TEST_DB_NAME: nasa_system6_test
        TEST_DB_USER: postgres
        TEST_DB_PASSWORD: postgres

    - name: Run integration tests
      run: |
        cd server && npm run test:integration
      env:
        NODE_ENV: test
        JWT_SECRET: test-secret
        NASA_API_KEY: test-api-key
        TEST_DB_HOST: localhost
        TEST_DB_NAME: nasa_system6_test
        TEST_DB_USER: postgres
        TEST_DB_PASSWORD: postgres

    - name: Run security audit
      run: |
        cd server && npm audit --audit-level moderate

    - name: Run E2E tests
      run: |
        cd client && npm run test:e2e
      env:
        CYPRESS_baseUrl: http://localhost:3001

  performance:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        npm ci -g artillery
        cd server && npm ci

    - name: Start server
      run: |
        cd server && npm start &
        sleep 10

    - name: Run performance tests
      run: |
        artillery run artillery-config.yml

    - name: Upload performance report
      uses: actions/upload-artifact@v3
      with:
        name: performance-report
        path: artillery-report.html
```

## Deployment

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY server/ ./server/
COPY client/build ./client/build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/server/node_modules ./server/node_modules

# Copy application code
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/build ./client/build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership of the app directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["node", "server/server.js"]
```

### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_DATABASE=nasa_system6
      - DB_USER=postgres
      - DB_PASSWORD=securepassword
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - NASA_API_KEY=${NASA_API_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    image: postgres:13-alpine
    environment:
      - POSTGRES_DB=nasa_system6
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=securepassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./server/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:6-alpine
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

### Nginx Configuration
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream app {
        server app:3001;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name api.nasa-system6-portal.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name api.nasa-system6-portal.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check (no rate limiting)
        location /health {
            proxy_pass http://app;
            access_log off;
        }
    }
}
```

### Environment Configuration
```bash
# .env.production
NODE_ENV=production
PORT=3001

# Database Configuration
DB_HOST=your-production-db-host
DB_PORT=5432
DB_DATABASE=nasa_system6
DB_USER=postgres
DB_PASSWORD=your-secure-db-password

# Redis Configuration
REDIS_URL=redis://your-redis-host:6379

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key

# NASA API Configuration
NASA_API_KEY=your-nasa-api-key

# Security Configuration
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Starting deployment of NASA System 6 Portal API"

# Load environment variables
source .env.production

# Build Docker images
echo "📦 Building Docker images..."
docker-compose build --no-cache

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose run --rm app npm run db:migrate

# Start services
echo "🔄 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run health checks
echo "🏥 Running health checks..."
if curl -f http://localhost:3001/health; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
    exit 1
fi

# Run smoke tests
echo "💨 Running smoke tests..."
npm run test:smoke

echo "🎉 Deployment completed successfully!"
echo "📊 API is available at: https://api.nasa-system6-portal.com"
echo "📚 Documentation at: https://api.nasa-system6-portal.com/api-docs"
```

## Monitoring and Observability

### Application Metrics
```javascript
// server/middleware/metrics.js
const prometheus = require('prom-client');

// Create metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const cacheHitRate = new prometheus.Gauge({
  name: 'cache_hit_rate',
  help: 'Cache hit rate percentage'
});

const activeUsers = new prometheus.Gauge({
  name: 'active_users_total',
  help: 'Number of active users'
});

// Metrics middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });

  next();
};

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(await prometheus.register.metrics());
});

module.exports = {
  metricsMiddleware,
  httpRequestDuration,
  httpRequestTotal,
  cacheHitRate,
  activeUsers
};
```

This comprehensive testing and deployment guide ensures that the NASA System 6 Portal API is thoroughly tested, secure, performant, and ready for production deployment. The guide covers all aspects from unit testing to production monitoring, providing a solid foundation for maintaining API quality and reliability.

---

*This guide covers the complete testing and deployment procedures as of November 12, 2025. For the most current implementation details, refer to the source code and CI/CD configurations.*