# PHASE 5: PRODUCTION DEPLOYMENT - NASA System 6 Portal

**Status**: 📋 READY - Awaiting Phase 4 Completion
**Priority**: P2 - Production Launch
**Estimated Time**: 26-36 hours (Week 8-9)
**Created**: November 14, 2025
**Target Completion**: Week 8-9 of Implementation

---

## 🎯 Executive Summary

Phase 5 deploys application to production with:
1. **Production Environment** - Vercel, PostgreSQL, Redis
2. **Database Migration** - Run migrations on production
3. **Monitoring Setup** - Sentry, health checks, alerts
4. **Production Testing** - Verify all features work
5. **Documentation** - Deployment guides and runbooks

**Prerequisites**: Phase 0-4 complete, all tests passing

**Success Criteria**: Application live → Monitored → All features working

---

## 📊 Phase 5 Master Checklist

### Week 8: Production Setup (13-17 hours)

- [ ] **Task 5.1**: Production Environment (6-8 hours)
- [ ] **Task 5.2**: Deployment Configuration (4-6 hours)
- [ ] **Task 5.3**: Database Migration (3-4 hours)

### Week 9: Monitoring & Testing (13-19 hours)

- [ ] **Task 5.4**: Monitoring Setup (6-8 hours)
- [ ] **Task 5.5**: Production Testing (4-6 hours)
- [ ] **Task 5.6**: Documentation (3-4 hours)

---

## 🚀 Task 5.1: Production Environment Setup

### Vercel Project Setup

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link project
cd /Users/edsaga/stylesnprofiles
vercel link

# Set environment variables
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
```

### PostgreSQL Setup (Neon)

```bash
# Sign up at https://neon.tech
# Create new project: nasa-system6-portal
# Get connection string

# Test connection
psql "postgres://user:pass@host/dbname?sslmode=require"

# Save connection string
vercel env add DATABASE_URL production
# Paste: postgresql://user:pass@host/dbname?sslmode=require
```

### Redis Setup (Upstash)

```bash
# Sign up at https://upstash.com
# Create Redis database: nasa-redis
# Get connection string

# Save to Vercel
vercel env add REDIS_URL production
# Paste: rediss://default:pass@host:port
```

### Estimated Time
⏱️ **6-8 hours**

---

## ⚙️ Task 5.2: Deployment Configuration

### vercel.json

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
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/client/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Deploy to Production

```bash
# Deploy
vercel --prod

# Set custom domain (optional)
vercel domains add nasa-system6.yourdomain.com

# Verify deployment
curl https://nasa-system6-portal.vercel.app/health
```

### Estimated Time
⏱️ **4-6 hours**

---

## 🗄️ Task 5.3: Database Migration

### Run Production Migrations

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://user:pass@host/dbname?sslmode=require"

# Run migrations
cd server
npm run db:init

# Verify tables
psql $DATABASE_URL -c "\dt"

# Create admin user
psql $DATABASE_URL << 'EOF'
INSERT INTO users (email, password_hash, role, email_verified)
VALUES ('admin@yourdomain.com', '$2b$10$hashedpassword', 'admin', true);
EOF
```

### Estimated Time
⏱️ **3-4 hours**

---

## 📡 Task 5.4: Monitoring Setup

### Sentry Integration

```bash
# Install Sentry
npm install @sentry/node @sentry/react

# Configure server (server/server.js)
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

# Configure client (client/src/index.js)
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.REACT_APP_SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

### Health Check Monitoring

```javascript
// server/routes/health.js
router.get('/health', async (req, res) => {
  const checks = {
    server: 'ok',
    database: 'unknown',
    redis: 'unknown'
  };

  // Test database
  try {
    await db.query('SELECT 1');
    checks.database = 'ok';
  } catch (err) {
    checks.database = 'error';
  }

  // Test Redis
  if (redis) {
    try {
      await redis.ping();
      checks.redis = 'ok';
    } catch (err) {
      checks.redis = 'error';
    }
  }

  const isHealthy = Object.values(checks).every(v => v === 'ok');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### Estimated Time
⏱️ **6-8 hours**

---

## 🧪 Task 5.5: Production Testing

### Test All Features

```bash
# 1. Test registration
curl -X POST https://your-app.vercel.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# 2. Test login
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# 3. Test protected endpoint
curl https://your-app.vercel.app/api/v1/auth/me \
  -H "Authorization: Bearer <token>"

# 4. Test favorites
curl -X POST https://your-app.vercel.app/api/v1/users/favorites \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"itemType":"apod","itemId":"2024-01-01","data":{}}'
```

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Create load test
cat > load-test.yml << 'EOF'
config:
  target: "https://your-app.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check"
    flow:
      - get:
          url: "/health"
EOF

# Run test
artillery run load-test.yml
```

### Estimated Time
⏱️ **4-6 hours**

---

## 📝 Task 5.6: Documentation

### Deployment Guide

```markdown
# Deployment Guide

## Prerequisites
- Vercel account
- Neon PostgreSQL database
- Upstash Redis database
- Sentry account

## Steps
1. Clone repository
2. Install Vercel CLI: `npm install -g vercel`
3. Link project: `vercel link`
4. Set environment variables (see .env.example)
5. Deploy: `vercel --prod`
6. Run migrations on production database
7. Create admin user
8. Test deployment

## Rollback
vercel rollback <deployment-url>

## Monitoring
- Sentry: https://sentry.io/your-project
- Vercel Dashboard: https://vercel.com/dashboard
```

### Estimated Time
⏱️ **3-4 hours**

---

## 🎉 Phase 5 Completion

### Success Criteria

- [x] ✅ Application deployed to production
- [x] ✅ Database migrations applied
- [x] ✅ Monitoring active
- [x] ✅ All features tested in production
- [x] ✅ Documentation complete

### Git Commit

```bash
git commit -m "deploy: Production deployment (Phase 5)

INFRASTRUCTURE:
- Vercel project configured
- PostgreSQL (Neon) setup
- Redis (Upstash) configured
- Environment variables secured

MONITORING:
- Sentry error tracking
- Health check endpoint
- Uptime monitoring
- Log aggregation

DEPLOYMENT:
- vercel.json configuration
- Production migrations
- Admin user created
- Load testing completed

DOCUMENTATION:
- Deployment guide
- Rollback procedures
- Monitoring guide
- Troubleshooting docs

Application live at: https://nasa-system6-portal.vercel.app

Ready for Phase 6: Performance Optimization

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Document Version**: 1.0
**Estimated Time**: 26-36 hours
**Status**: Deployment Guide
