# PHASE 6: PERFORMANCE OPTIMIZATION - Commands & Agents Integration

**Phase Overview**: Optimize for production scale and performance
**Original Estimated Time**: 32-44 hours
**With Automation**: 20-28 hours
**Time Savings**: 12-16 hours (35-40% reduction)
**Automation Level**: Very High

---

## 🎯 Phase 6 Objectives

Phase 6 optimizes application performance:
1. **Frontend Optimization** - Bundle size, lazy loading, code splitting
2. **Backend Optimization** - Redis caching, query optimization
3. **Database Optimization** - Indexes, query tuning, N+1 elimination
4. **Load Testing** - Stress testing with Artillery/k6
5. **Security Hardening** - OWASP audit, rate limiting

**Performance Targets**: <2s page load, <200ms API response, 90+ PageSpeed score

**Automation Strategy**: Use performance-engineer for optimization strategies, database-optimizer for query tuning, and load-testing-specialist for stress testing.

---

## 🤖 Primary Agents

### Agent 1: performance-engineer (Time Savings: 4-5 hours)
**Purpose**: Identify and fix performance bottlenecks
**Usage**:
```
"Analyze and optimize application performance:

Frontend Analysis:
1. Bundle size analysis (identify large dependencies)
2. Code splitting opportunities
3. Lazy loading for routes/components
4. Image optimization strategy
5. Browser caching strategy

Backend Analysis:
1. API response time profiling
2. Database query optimization
3. Redis caching strategy
4. Connection pooling tuning
5. Compression configuration

Provide specific optimizations with expected improvements."
```

### Agent 2: react-performance-optimizer (Time Savings: 3-4 hours)
**Purpose**: Optimize React application performance
**Usage**:
```
"Optimize React application for production:

1. Component Optimization:
   - Identify unnecessary re-renders
   - Implement React.memo where beneficial
   - Use useMemo/useCallback appropriately
   - Virtualization for long lists

2. Code Splitting:
   - Route-based lazy loading
   - Component lazy loading
   - Dynamic imports for heavy libraries

3. Bundle Optimization:
   - Tree shaking opportunities
   - Reduce duplicate code
   - Optimize dependencies

4. Runtime Optimization:
   - Debouncing/throttling
   - Optimize useState/useEffect
   - Avoid prop drilling

Provide code examples and measurements."
```

### Agent 3: database-optimizer (Time Savings: 3-4 hours)
**Purpose**: Optimize database queries and indexes
**Usage**:
```
"Optimize PostgreSQL database for production:

1. Query Analysis:
   - Identify slow queries (>50ms)
   - Eliminate N+1 queries
   - Optimize JOIN operations
   - Use EXPLAIN ANALYZE

2. Index Strategy:
   - Add missing indexes
   - Remove unused indexes
   - Composite indexes for common queries
   - Partial indexes where appropriate

3. Query Optimization:
   - Replace subqueries with JOINs
   - Use CTEs for complex queries
   - Optimize pagination
   - Use json_agg for nested data

Provide before/after query performance."
```

### Agent 4: load-testing-specialist (Time Savings: 2-3 hours)
**Purpose**: Design and execute load testing scenarios
**Usage**:
```
"Create comprehensive load testing strategy:

1. Artillery Configuration:
   - User journey scenarios
   - Ramp-up strategy
   - Sustained load test
   - Spike testing
   - Stress testing

2. Metrics to Track:
   - Response time (p50, p95, p99)
   - Throughput (requests/second)
   - Error rate
   - Database connections
   - Memory usage

3. Success Criteria:
   - Handle 100+ concurrent users
   - 95th percentile < 500ms
   - Error rate < 1%
   - No memory leaks

Provide complete Artillery config."
```

---

## ⚡ Slash Commands

### /optimize-api-performance (Time Savings: 3-4 hours)
```bash
# Comprehensive API optimization
/optimize-api-performance --rest \
  --caching \
  --query-optimization \
  --compression
```
**Output**: Optimized API code, caching strategy, query improvements

### /optimize-database-performance (Time Savings: 3-4 hours)
```bash
# Database optimization with index recommendations
/optimize-database-performance \
  --tables favorites,collections,users \
  --focus indexes,queries
```
**Output**: Index recommendations, optimized queries, performance analysis

### /implement-caching-strategy (Time Savings: 2-3 hours)
```bash
# Redis caching implementation
/implement-caching-strategy --application \
  --ttl 3600 \
  --invalidation smart
```
**Output**: Complete caching middleware, invalidation logic

### /setup-load-testing (Time Savings: 2-3 hours)
```bash
# Setup Artillery load testing
/setup-load-testing --tool artillery \
  --scenarios user-journeys \
  --target production
```
**Output**: Artillery configuration, test scenarios, reporting

---

## 🎯 Task Breakdown

### Task 6.1: Frontend Optimization (Manual: 8-10h → Automated: 4-6h)

**Automated Approach**:
```bash
# 1. Launch react-performance-optimizer agent
# Agent analyzes bundle and provides optimization plan

# 2. Analyze bundle size
npm run build
npx source-map-explorer 'build/static/js/*.js'

# 3. Implement code splitting
# Agent provides lazy loading implementation

# 4. Optimize images
# Agent provides image optimization strategy

# 5. Verify improvements
# Run Lighthouse audit
```

**Generated Optimizations**:
```javascript
// Code Splitting (React.lazy)
import React, { lazy, Suspense } from 'react';
import LoadingSpinner from './LoadingSpinner';

const ApodApp = lazy(() => import('./components/apps/ApodApp'));
const NeoWsApp = lazy(() => import('./components/apps/NeoWsApp'));
const ResourceNavigatorApp = lazy(() => import('./components/apps/ResourceNavigatorApp'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Router>
        <Routes>
          <Route path="/apod" element={<ApodApp />} />
          <Route path="/neo" element={<NeoWsApp />} />
          <Route path="/resources" element={<ResourceNavigatorApp />} />
        </Routes>
      </Router>
    </Suspense>
  );
}

// Component Optimization (React.memo)
const FavoriteCard = React.memo(({ favorite, onUpdate }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.favorite.id === nextProps.favorite.id &&
         prevProps.favorite.updated_at === nextProps.favorite.updated_at;
});

// useMemo for expensive calculations
function CollectionStats({ items }) {
  const stats = useMemo(() => {
    return {
      total: items.length,
      byType: items.reduce((acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {})
    };
  }, [items]);

  return <div>{JSON.stringify(stats)}</div>;
}
```

**Performance Targets**:
- Bundle size < 250KB gzipped
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90

---

### Task 6.2: Backend Optimization (Manual: 6-8h → Automated: 3-4h)

**Automated Approach**:
```bash
# 1. Use /optimize-api-performance command
/optimize-api-performance --rest --caching --compression

# 2. Implement Redis caching
/implement-caching-strategy --application

# 3. Launch performance-engineer for additional optimizations

# 4. Test improvements
npm run test:performance
```

**Generated Redis Caching**:
```javascript
// server/middleware/cache.js
const redis = require('redis');
const client = redis.createClient({ url: process.env.REDIS_URL });

client.connect();

function cacheMiddleware(ttl = 3600) {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cached = await client.get(key);
      if (cached) {
        console.log(`Cache HIT: ${key}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`Cache MISS: ${key}`);

      const originalJson = res.json.bind(res);
      res.json = function(data) {
        client.setEx(key, ttl, JSON.stringify(data));
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache error:', error);
      next();
    }
  };
}

// Apply to routes
router.get('/api/v1/nasa/apod', cacheMiddleware(3600), getApodHandler);
router.get('/api/v1/users/favorites', authenticateToken, cacheMiddleware(300), getFavoritesHandler);
```

**Compression Middleware**:
```javascript
const compression = require('compression');

app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6
}));
```

**Performance Targets**:
- API response < 200ms (cached)
- API response < 500ms (uncached)
- Cache hit rate > 70%

---

### Task 6.3: Database Optimization (Manual: 4-6h → Automated: 2-3h)

**Automated Approach**:
```bash
# 1. Use /optimize-database-performance command
/optimize-database-performance \
  --tables favorites,collections,users \
  --focus indexes,queries

# 2. Launch database-optimizer agent for query analysis

# 3. Apply recommended indexes

# 4. Test query performance
```

**Generated Index Recommendations**:
```sql
-- Favorites table indexes
CREATE INDEX CONCURRENTLY idx_favorites_user_type_date
  ON favorites(user_id, item_type, item_date)
  WHERE is_archived = FALSE;

CREATE INDEX CONCURRENTLY idx_favorites_tags
  ON favorites USING GIN(user_tags)
  WHERE user_tags IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_favorites_item_data
  ON favorites USING GIN(item_data);

-- Collections table indexes
CREATE INDEX CONCURRENTLY idx_collections_public_featured
  ON collections(is_public, is_featured)
  WHERE is_archived = FALSE;

CREATE INDEX CONCURRENTLY idx_collection_items_collection_position
  ON collection_items(collection_id, position);

-- Analyze tables
ANALYZE favorites;
ANALYZE collections;
ANALYZE collection_items;
```

**Query Optimization Example**:
```javascript
// Before: N+1 query problem
async function getCollectionsWithItems(userId) {
  const collections = await db.query('SELECT * FROM collections WHERE user_id = $1', [userId]);

  for (const collection of collections.rows) {
    const items = await db.query('SELECT * FROM collection_items WHERE collection_id = $1', [collection.id]);
    collection.items = items.rows;
  }

  return collections.rows;
}

// After: Single optimized query with json_agg
async function getCollectionsWithItems(userId) {
  const result = await db.query(`
    SELECT
      c.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ci.id,
            'favoriteId', ci.favorite_id,
            'position', ci.position,
            'itemData', f.item_data
          ) ORDER BY ci.position
        ) FILTER (WHERE ci.id IS NOT NULL),
        '[]'
      ) as items
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    LEFT JOIN favorites f ON ci.favorite_id = f.id
    WHERE c.user_id = $1
    GROUP BY c.id
  `, [userId]);

  return result.rows;
}
// Performance: ~100 queries → 1 query (100x faster)
```

**Performance Targets**:
- All queries < 50ms
- No N+1 query problems
- Proper indexes on all foreign keys

---

### Task 6.4: Load Testing (Manual: 6-8h → Automated: 3-4h)

**Automated Approach**:
```bash
# 1. Use /setup-load-testing command
/setup-load-testing --tool artillery --target production

# 2. Launch load-testing-specialist for scenario design

# 3. Run load tests
artillery run load-test.yml

# 4. Analyze results
artillery report report.json --output report.html
```

**Generated Artillery Configuration**:
```yaml
# load-test.yml
config:
  target: "https://your-app.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      rampTo: 50
      name: "Ramp up"
    - duration: 300
      arrivalRate: 50
      name: "Sustained load"
    - duration: 60
      arrivalRate: 100
      name: "Spike test"
  plugins:
    expect: {}
  processor: "./custom-functions.js"

scenarios:
  - name: "User journey - Authentication"
    weight: 40
    flow:
      - post:
          url: "/api/v1/auth/register"
          json:
            email: "load-test-{{ $randomNumber() }}@example.com"
            password: "Test123!@#"
          capture:
            - json: "$.data.accessToken"
              as: "token"
          expect:
            - statusCode: 201

      - get:
          url: "/api/v1/auth/me"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200

  - name: "User journey - Favorites"
    weight: 40
    flow:
      - post:
          url: "/api/v1/auth/login"
          json:
            email: "test@example.com"
            password: "Test123!@#"
          capture:
            - json: "$.data.accessToken"
              as: "token"

      - get:
          url: "/api/v1/users/favorites?page=1&limit=20"
          headers:
            Authorization: "Bearer {{ token }}"
          expect:
            - statusCode: 200
            - contentType: json

  - name: "Anonymous browsing"
    weight: 20
    flow:
      - get:
          url: "/"
      - get:
          url: "/api/v1/nasa/apod"
```

**Performance Targets**:
- Handle 100+ concurrent users
- 500 requests/minute sustained
- 95th percentile < 500ms
- Error rate < 1%

---

### Task 6.5: Security Hardening (Manual: 6-8h → Automated: 3-4h)

**Automated Approach**:
```bash
# 1. Use /security-hardening command
/security-hardening --headers --auth --rate-limiting

# 2. Run security audit
/dependency-audit --security
/secrets-scanner --scope all

# 3. OWASP audit (if available)
npm audit
npm audit fix
```

**Generated Security Enhancements**:
```javascript
// Enhanced rate limiting per user
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createRateLimiter = (windowMs, max) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rate-limit:'
    }),
    windowMs,
    max,
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.userId}` : req.ip;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }
  });
};

// Apply tiered rate limiting
app.use('/api/v1/auth/login', createRateLimiter(15 * 60 * 1000, 5));
app.use('/api/v1/auth/register', createRateLimiter(60 * 60 * 1000, 3));
app.use('/api/v1/', createRateLimiter(15 * 60 * 1000, 100));

// Security headers
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'https://apod.nasa.gov', 'https://api.nasa.gov', 'data:'],
      connectSrc: ["'self'", 'https://api.nasa.gov']
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## ✅ Implementation Checklist

### Frontend Optimization (4-6 hours)
- [ ] Launch react-performance-optimizer agent
- [ ] Analyze bundle with source-map-explorer
- [ ] Implement code splitting (React.lazy)
- [ ] Optimize components (React.memo)
- [ ] Add virtualization for long lists
- [ ] Run Lighthouse audit (target: 90+)

### Backend Optimization (3-4 hours)
- [ ] Use /optimize-api-performance command
- [ ] Use /implement-caching-strategy command
- [ ] Add compression middleware
- [ ] Optimize connection pooling
- [ ] Test response times (<200ms cached)

### Database Optimization (2-3 hours)
- [ ] Use /optimize-database-performance command
- [ ] Apply recommended indexes
- [ ] Eliminate N+1 queries
- [ ] Optimize with json_agg
- [ ] Test query performance (<50ms)

### Load Testing (3-4 hours)
- [ ] Use /setup-load-testing command
- [ ] Launch load-testing-specialist for scenarios
- [ ] Run Artillery tests
- [ ] Analyze results (p95 < 500ms)
- [ ] Fix bottlenecks

### Security Hardening (3-4 hours)
- [ ] Use /security-hardening command
- [ ] Run /dependency-audit --security
- [ ] Run /secrets-scanner
- [ ] Apply rate limiting
- [ ] Configure security headers
- [ ] Run npm audit

---

## 📊 Time & Efficiency Comparison

| Task | Manual Time | Automated Time | Savings |
|------|-------------|----------------|---------|
| 6.1: Frontend Optimization | 8-10 hours | 4-6 hours | 4 hours |
| 6.2: Backend Optimization | 6-8 hours | 3-4 hours | 3-4 hours |
| 6.3: Database Optimization | 4-6 hours | 2-3 hours | 2-3 hours |
| 6.4: Load Testing | 6-8 hours | 3-4 hours | 3-4 hours |
| 6.5: Security Hardening | 6-8 hours | 3-4 hours | 3-4 hours |
| **Total Phase 6** | **32-44 hours** | **20-28 hours** | **12-16 hours** |

---

## 🚀 Quick Start Guide

```bash
# 1. Frontend optimization
# Launch react-performance-optimizer agent
npm run build
npx source-map-explorer 'build/static/js/*.js'

# 2. Backend optimization
/optimize-api-performance --rest --caching --compression
/implement-caching-strategy --application

# 3. Database optimization
/optimize-database-performance --tables favorites,collections,users

# 4. Load testing
/setup-load-testing --tool artillery --target production
artillery run load-test.yml

# 5. Security hardening
/security-hardening --headers --auth --rate-limiting
/dependency-audit --security
/secrets-scanner --scope all

# 6. Verify improvements
npm run test:performance
# Check Lighthouse score (target: 90+)
```

---

## 📝 Success Criteria

Phase 6 is complete when:

- [x] Page load < 2 seconds
- [x] API response < 200ms (cached)
- [x] PageSpeed Insights > 90
- [x] Database queries < 50ms
- [x] Handles 100+ concurrent users
- [x] 95th percentile < 500ms
- [x] Error rate < 1%
- [x] No N+1 queries
- [x] Cache hit rate > 70%
- [x] No critical security issues
- [x] Rate limiting active
- [x] Security headers configured
- [x] Git commit created

---

**Document Version**: 1.0
**Automation Level**: Very High (35-40% time savings)
**Most Valuable Commands**: /optimize-api-performance, /optimize-database-performance, /implement-caching-strategy
**Most Valuable Agent**: performance-engineer, react-performance-optimizer
