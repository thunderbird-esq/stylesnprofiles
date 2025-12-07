# PHASE 5: PRODUCTION DEPLOYMENT - Commands & Agents Integration

**Phase Overview**: Deploy to production with monitoring and observability
**Original Estimated Time**: 26-36 hours
**With Automation**: 16-24 hours
**Time Savings**: 10-12 hours (35-40% reduction)
**Automation Level**: Very High

---

## 🎯 Phase 5 Objectives

Phase 5 launches the application to production:
1. **Vercel Deployment** - Frontend + serverless backend
2. **PostgreSQL Production** - Neon database setup
3. **Redis Production** - Upstash Redis cache
4. **Monitoring** - Sentry error tracking, health checks
5. **Documentation** - Deployment guides and runbooks

**Automation Strategy**: Use devops-engineer for infrastructure setup, vercel-deployment-specialist for Vercel configuration, and monitoring-specialist for observability.

---

## 🤖 Primary Agents

### Agent 1: devops-engineer (Time Savings: 3-4 hours)
**Purpose**: Complete infrastructure setup and configuration
**Usage**:
```
"Setup production infrastructure for NASA System 6 Portal:

1. Vercel Configuration:
   - vercel.json for monorepo
   - Build configuration for client/server
   - Environment variables setup
   - Custom domain configuration

2. Database (Neon PostgreSQL):
   - Connection pooling for serverless
   - Migration strategy for production
   - Backup configuration
   - Read replicas if needed

3. Redis (Upstash):
   - Connection configuration for Vercel
   - Cache TTL strategy
   - Eviction policies

4. Secrets Management:
   - Environment variable checklist
   - Secret rotation strategy
   - Access control

Provide complete deployment checklist."
```

### Agent 2: vercel-deployment-specialist (Time Savings: 2-3 hours)
**Purpose**: Optimize Vercel deployment configuration
**Usage**:
```
"Configure Vercel deployment for React + Node.js monorepo:
1. vercel.json with proper routing
2. Build optimizations
3. Edge function setup if needed
4. Caching strategy
5. Preview deployment configuration
6. Production deployment workflow
Include troubleshooting guide."
```

### Agent 3: monitoring-specialist (Time Savings: 3-4 hours)
**Purpose**: Setup comprehensive monitoring and alerting
**Usage**:
```
"Implement production monitoring:

1. Sentry Integration:
   - Error tracking for client + server
   - Performance monitoring
   - Release tracking
   - User feedback

2. Health Checks:
   - /health endpoint implementation
   - Database connectivity check
   - Redis connectivity check
   - API availability monitoring

3. Alerting:
   - Critical error alerts
   - Performance degradation alerts
   - Uptime monitoring
   - Database connection alerts

4. Logging:
   - Structured logging setup
   - Log aggregation strategy
   - Log retention policy

Provide complete monitoring implementation."
```

### Agent 4: database-admin (Time Savings: 2-3 hours)
**Purpose**: Production database setup and migrations
**Usage**:
```
"Setup Neon PostgreSQL for production:
1. Database creation and configuration
2. Connection string format for serverless
3. Run all migrations safely
4. Create production admin user
5. Backup strategy
6. Performance tuning for serverless
Provide migration execution plan."
```

---

## ⚡ Slash Commands

### /vercel-env-sync (Time Savings: 1-2 hours)
**Most Valuable Command for This Phase**
```bash
# Sync environment variables to Vercel
/vercel-env-sync --push --validate

# Pull production config locally
/vercel-env-sync --pull --environment production
```
**Output**: All environment variables synchronized between local and Vercel

### /deployment-monitoring (Time Savings: 2-3 hours)
```bash
# Setup comprehensive monitoring
/deployment-monitoring setup \
  --sentry \
  --health-checks \
  --alerts \
  --metrics
```
**Output**:
- Sentry configuration
- Health check endpoints
- Alert rules
- Monitoring dashboard

### /secrets-scanner (Time Savings: 30 min)
```bash
# Validate no secrets exposed before deployment
/secrets-scanner --scope all --fix
```

### /migrate-database (Time Savings: 1 hour)
```bash
# Run production migrations safely
/migrate-database --dry-run
/migrate-database --execute --backup
```

---

## 🎯 Task Breakdown

### Task 5.1: Vercel Setup (Manual: 6-8h → Automated: 3-4h)

**Automated Approach**:
```bash
# 1. Design Vercel configuration
# Launch vercel-deployment-specialist agent

# 2. Create vercel.json
# Agent generates optimized configuration

# 3. Deploy to Vercel
vercel login
vercel link
vercel --prod

# 4. Configure custom domain (optional)
vercel domains add nasa-system6.yourdomain.com
```

**Generated vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    },
    {
      "src": "server/server.js",
      "use": "@vercel/node",
      "config": {
        "maxDuration": 30
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.js",
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    },
    {
      "src": "/health",
      "dest": "/server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"],
  "github": {
    "enabled": true,
    "autoAlias": true
  }
}
```

---

### Task 5.2: Database Production Setup (Manual: 6-8h → Automated: 3-4h)

**Automated Approach**:
```bash
# 1. Launch database-admin agent for Neon setup
# Agent provides step-by-step guide

# 2. Create Neon database
# Sign up at https://neon.tech
# Create project: nasa-system6-portal

# 3. Get connection string
# Copy from Neon dashboard

# 4. Add to Vercel
/vercel-env-sync --add DATABASE_URL

# 5. Run migrations
export DATABASE_URL="postgresql://..."
npm run db:init

# 6. Verify
psql $DATABASE_URL -c "\dt"
```

**Production Database Configuration** (from agent):
```javascript
// server/db.js (production optimized)
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless optimizations
  max: 1, // Serverless: minimize connections
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  ssl: {
    rejectUnauthorized: true
  }
});

// Connection monitoring
pool.on('error', (err) => {
  console.error('Database pool error', err);
  // Report to Sentry
});

module.exports = { pool, query: (text, params) => pool.query(text, params) };
```

---

### Task 5.3: Redis Setup (Manual: 3-4h → Automated: 1.5-2h)

**Automated Approach**:
```bash
# 1. Launch devops-engineer for Redis setup
# Agent provides Upstash configuration

# 2. Create Upstash Redis
# Sign up at https://upstash.com
# Create database: nasa-redis

# 3. Add to Vercel
/vercel-env-sync --add REDIS_URL

# 4. Test connection
node -e "const redis = require('redis'); const client = redis.createClient({url: process.env.REDIS_URL}); client.connect().then(() => console.log('Connected!')).catch(console.error);"
```

---

### Task 5.4: Monitoring Setup (Manual: 8-10h → Automated: 4-5h)

**Automated Approach**:
```bash
# 1. Setup Sentry
/deployment-monitoring setup --sentry

# 2. Add Sentry to Vercel
/vercel-env-sync --add SENTRY_DSN --add REACT_APP_SENTRY_DSN

# 3. Implement health check
# Launch monitoring-specialist agent for health check implementation

# 4. Setup alerting
/deployment-monitoring setup --alerts
```

**Generated Health Check** (from agent):
```javascript
// server/routes/health.js
router.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString()
  };

  // Check database
  try {
    await db.query('SELECT 1');
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'error';
    checks.databaseError = err.message;
  }

  // Check Redis (if configured)
  if (process.env.REDIS_URL) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch (err) {
      checks.redis = 'error';
      checks.redisError = err.message;
    }
  }

  const isHealthy = checks.database === 'ok';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    checks
  });
});
```

**Generated Sentry Configuration**:
```javascript
// server/server.js
const Sentry = require('@sentry/node');

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app })
    ]
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // Error handler (after all routes)
  app.use(Sentry.Handlers.errorHandler());
}

// client/src/index.js
import * as Sentry from '@sentry/react';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: 'production',
    tracesSampleRate: 0.1
  });
}
```

---

### Task 5.5: Production Testing (Manual: 4-6h → Automated: 2-3h)

**Automated Approach**:
```bash
# 1. Deploy to production
vercel --prod

# 2. Run production smoke tests
# Launch test-engineer agent for smoke test suite

# 3. Test all critical paths
curl https://your-app.vercel.app/health
curl https://your-app.vercel.app/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"Test123!@#"}'

# 4. Run load test
/setup-load-testing --target https://your-app.vercel.app
```

---

## ✅ Implementation Checklist

### Pre-Deployment (2 hours)
- [ ] All Phase 4 tests passing
- [ ] No secrets in codebase (/secrets-scanner)
- [ ] Environment variables documented
- [ ] Database migrations tested locally
- [ ] Build succeeds locally

### Vercel Setup (3-4 hours)
- [ ] Launch vercel-deployment-specialist
- [ ] Create vercel.json
- [ ] Install Vercel CLI: npm i -g vercel
- [ ] Login: vercel login
- [ ] Link project: vercel link
- [ ] Deploy preview: vercel
- [ ] Test preview deployment
- [ ] Deploy production: vercel --prod

### Database Setup (3-4 hours)
- [ ] Create Neon account
- [ ] Create nasa-system6-portal project
- [ ] Copy connection string
- [ ] Add to Vercel: /vercel-env-sync --add DATABASE_URL
- [ ] Run migrations: npm run db:init
- [ ] Verify tables: psql $DATABASE_URL -c "\dt"
- [ ] Create admin user

### Redis Setup (1.5-2 hours)
- [ ] Create Upstash account
- [ ] Create nasa-redis database
- [ ] Copy connection string
- [ ] Add to Vercel: /vercel-env-sync --add REDIS_URL
- [ ] Test connection

### Monitoring Setup (4-5 hours)
- [ ] Create Sentry account
- [ ] Get DSN
- [ ] Use /deployment-monitoring setup --sentry
- [ ] Add to Vercel: /vercel-env-sync --add SENTRY_DSN
- [ ] Implement health check endpoint
- [ ] Test error reporting
- [ ] Setup alert rules

### Production Testing (2-3 hours)
- [ ] Test /health endpoint
- [ ] Test user registration
- [ ] Test user login
- [ ] Test favorites CRUD
- [ ] Test collections CRUD
- [ ] Check Sentry errors
- [ ] Verify performance

### Documentation (2-3 hours)
- [ ] Create deployment guide
- [ ] Create rollback procedure
- [ ] Document monitoring dashboard
- [ ] Create troubleshooting guide

---

## 📊 Time & Efficiency Comparison

| Task | Manual Time | Automated Time | Savings |
|------|-------------|----------------|---------|
| 5.1: Vercel Setup | 6-8 hours | 3-4 hours | 3-4 hours |
| 5.2: Database Setup | 6-8 hours | 3-4 hours | 3-4 hours |
| 5.3: Redis Setup | 3-4 hours | 1.5-2 hours | 1.5-2 hours |
| 5.4: Monitoring | 8-10 hours | 4-5 hours | 4-5 hours |
| 5.5: Testing | 4-6 hours | 2-3 hours | 2-3 hours |
| **Total Phase 5** | **26-36 hours** | **16-24 hours** | **10-12 hours** |

---

## 🚀 Quick Start Guide

```bash
# 1. Pre-deployment validation
/secrets-scanner --scope all --fix
npm run build
npm test

# 2. Create Vercel configuration
# Launch vercel-deployment-specialist agent

# 3. Setup external services
# - Neon PostgreSQL (https://neon.tech)
# - Upstash Redis (https://upstash.com)
# - Sentry (https://sentry.io)

# 4. Sync environment variables
/vercel-env-sync --add DATABASE_URL
/vercel-env-sync --add REDIS_URL
/vercel-env-sync --add JWT_SECRET
/vercel-env-sync --add JWT_REFRESH_SECRET
/vercel-env-sync --add SENTRY_DSN
/vercel-env-sync --add REACT_APP_SENTRY_DSN

# 5. Run database migrations
export DATABASE_URL="postgresql://..."
npm run db:init

# 6. Deploy to production
vercel --prod

# 7. Setup monitoring
/deployment-monitoring setup --sentry --health-checks --alerts

# 8. Test production
curl https://your-app.vercel.app/health
# Test critical user flows

# 9. Monitor
# Check Sentry dashboard
# Check Vercel logs
# Monitor health endpoint
```

---

## 📝 Success Criteria

Phase 5 is complete when:

- [x] Application deployed to Vercel
- [x] Custom domain configured (optional)
- [x] PostgreSQL production database setup
- [x] Redis production cache setup
- [x] All environment variables synced
- [x] Database migrations run successfully
- [x] Sentry error tracking active
- [x] Health check endpoint working
- [x] All critical paths tested in production
- [x] Monitoring dashboard configured
- [x] Alert rules configured
- [x] Deployment documentation complete
- [x] Rollback procedure documented
- [x] Git commit created

---

**Document Version**: 1.0
**Automation Level**: Very High (35-40% time savings)
**Most Valuable Command**: /vercel-env-sync
**Most Valuable Agent**: devops-engineer, monitoring-specialist
**Recommended**: Use agents for configuration design, commands for execution
