# NASA SYSTEM 6 PORTAL - SKILLS IMPLEMENTATION PLAN

**Created**: November 14, 2025
**Status**: Ready for Execution
**Purpose**: Roadmap for creating Claude Code Skills to accelerate project completion

---

## EXECUTIVE SUMMARY

This plan synthesizes **SKILLS_STRATEGY.md** recommendations with all **PHASE_0 through PHASE_7** documentation to create an actionable roadmap for implementing 15 hyper-specific Claude Code Skills.

### Key Metrics

| Metric | Value |
|--------|-------|
| **Total Phases** | 8 (Phase 0-7) |
| **Manual Project Time** | 183-252 hours |
| **With Generic Agents** | 128-197 hours (25-35% savings) |
| **With Hyper-Specific Skills** | 91-122 hours (40-60% savings) |
| **Additional Savings from Skills** | 37-75 hours |
| **Skills to Create** | 15 total (5 Tier 1, 3 Tier 2, 7 Tier 3) |
| **Total Skill Creation Time** | 9-13 hours |
| **ROI (This Project)** | 2.8-8.3x |
| **Lifetime ROI** | 11.5-33x |

---

## PHASE-BY-PHASE BREAKDOWN

### Phase 0: Critical Fixes (2-3 hours → 1.5-2 hours)

**Current Status**: IN PROGRESS ✅
**Objectives**:
- Fix Jest configuration conflict ✅
- Fix server authentication imports ✅
- Fix NeoWsApp runtime error ⏳
- Validate full test suite ⏳

**Recommended Skills**:
1. **nasa-portal-test-generator** (Critical)
   - Used for: Test validation suite
   - Saves: 20-30 minutes

**Agent Usage** (Without Skills):
- debugger: Fix NeoWsApp error (15 min)
- error-detective: Server auth analysis (10 min)
- test-automator: Create validation tests (15 min)

**Commands**:
- `/debug-error` - NeoWsApp runtime error
- `/fix-issue` - Server authentication
- `/write-tests` - Validation suite

**Phase 0 Status**: 80% complete, minor cleanup remaining

---

### Phase 1: Foundation & Truth (10-14 hours → 7-10 hours)

**Current Status**: PLANNED
**Objectives**:
1. Documentation accuracy (CLAUDE.md, README.md, PROJECT_STATUS.md)
2. Server architecture consolidation
3. Environment configuration (.env.example)
4. Database setup (3 SQL migrations)

**Recommended Skills** (Create Before Phase 1):
1. **nasa-portal-database-designer** (CRITICAL - Create First!)
   - Used for: All 3 SQL migrations
   - Saves: 3-5 hours
   - Embeds: Complete schema, indexes, JSONB patterns

2. **nasa-portal-doc-writer** (HIGH)
   - Used for: CLAUDE.md, README.md updates
   - Saves: 1-2 hours
   - Embeds: Project structure, npm scripts

**Agent Usage**:
- documentation-expert: Update CLAUDE.md (1-1.5 hours)
- sql-pro: Create migrations (1.5-2 hours)
- database-admin: Database setup (1 hour)

**Commands**:
- `/update-docs` - Documentation updates
- `/migrate-database` - Run migrations

**Phase 1 Priority Skills**:
```bash
# MUST CREATE BEFORE PHASE 1:
1. nasa-portal-database-designer (60 min investment)
   → Saves 3-5 hours in Phase 1 alone
   → Used again in Phase 3 and 6

# RECOMMENDED:
2. nasa-portal-doc-writer (45 min investment)
   → Saves 1-2 hours per documentation update
```

---

### Phase 2: Authentication Implementation (20-28 hours → 14-18 hours)

**Current Status**: PLANNED
**Objectives**:
1. authService.js implementation
2. REST API endpoints (register, login, refresh, logout, me)
3. Client AuthContext integration
4. Security features (JWT, bcrypt, rate limiting)
5. Comprehensive testing

**Recommended Skills** (Create Before Phase 2):
1. **nasa-portal-backend-architect** (CRITICAL)
   - Used for: authService.js, API design
   - Saves: 4-8 hours
   - Embeds: PostgreSQL patterns, error handling, JWT flows

2. **nasa-portal-auth-specialist** (CRITICAL)
   - Used for: JWT implementation, password security
   - Saves: 2-4 hours
   - Embeds: Exact JWT config (15m/7d), bcrypt rounds (10), lockout logic

3. **nasa-portal-frontend-architect** (CRITICAL)
   - Used for: AuthContext, authentication service
   - Saves: 2-3 hours
   - Embeds: React patterns, System 6 styling

4. **nasa-portal-test-generator** (Already created)
   - Used for: Auth test suite
   - Saves: 2-3 hours

**Agent Usage** (Without Skills):
- backend-architect: API design (2-3 hours)
- security-engineer: JWT implementation (1.5-2 hours)
- frontend-developer: Client integration (2-3 hours)
- test-automator: Test suite (2-3 hours)

**Commands**:
- `/add-authentication-system jwt` - Generate auth system
- `/write-tests server/services/authService.js --unit`
- `/security-hardening --auth`

**Phase 2 Priority Skills**:
```bash
# MUST CREATE BEFORE PHASE 2:
1. nasa-portal-backend-architect (90 min investment)
   → Saves 4-8 hours across Phases 2, 3
   → Most reusable skill

2. nasa-portal-auth-specialist (60 min investment)
   → Saves 2-4 hours in Phase 2
   → Used again in Phase 6 security hardening

3. nasa-portal-frontend-architect (60 min investment)
   → Saves 2-3 hours in Phase 2
   → Used again in Phases 3, 7

# Order of creation:
Day 1: nasa-portal-backend-architect
Day 2: nasa-portal-auth-specialist + nasa-portal-frontend-architect
```

---

### Phase 3: User Resources (36-48 hours → 25-35 hours)

**Current Status**: PLANNED
**Objectives**:
1. Favorites service implementation
2. Collections service implementation
3. REST API endpoints (8 endpoints)
4. Client UI components
5. Integration testing

**Recommended Skills**:
1. **nasa-portal-backend-architect** (Already created)
   - Used for: favoritesService, collectionsService
   - Saves: 4-6 hours

2. **nasa-portal-database-designer** (Already created)
   - Used for: Query optimization, N+1 elimination
   - Saves: 2-3 hours

3. **nasa-portal-frontend-architect** (Already created)
   - Used for: React components (FavoritesPanel, CollectionsPanel)
   - Saves: 3-4 hours

4. **nasa-portal-test-generator** (Already created)
   - Used for: Service tests, integration tests
   - Saves: 3-4 hours

5. **nasa-portal-integration-tester** (Create if time allows)
   - Used for: End-to-end testing
   - Saves: 2-3 hours

**Agent Usage**:
- backend-architect: Service design (3-4 hours)
- database-optimizer: Query optimization (2-3 hours)
- fullstack-developer: UI components (4-5 hours)
- test-automator: Test suite (3-4 hours)

**Commands**:
- `/design-rest-api favorites` - API design
- `/optimize-database-performance --query-optimization`
- `/write-tests server/services/favoritesService.js`

**Phase 3 Status**: All critical Skills already created in Phases 1-2!

---

### Phase 4: Testing & Quality (16-22 hours → 10-16 hours)

**Current Status**: PLANNED
**Objectives**:
1. Integration test suite completion
2. E2E test setup (Playwright)
3. Coverage improvement (target 85%)
4. Load testing implementation
5. CI/CD pipeline optimization

**Recommended Skills**:
1. **nasa-portal-test-generator** (Already created)
   - Used for: All test generation
   - Saves: 4-7 hours

2. **nasa-portal-integration-tester** (RECOMMENDED)
   - Used for: Integration test suite
   - Saves: 2-3 hours

3. **nasa-portal-e2e-tester** (Create if needed)
   - Used for: E2E test suite
   - Saves: 2-3 hours

4. **nasa-portal-performance-optimizer** (RECOMMENDED)
   - Used for: Load testing setup
   - Saves: 1-2 hours

**Agent Usage**:
- test-automator: Comprehensive testing (4-5 hours)
- performance-engineer: Load testing (2-3 hours)
- ci-cd-specialist: Pipeline optimization (1-2 hours)

**Commands**:
- `/e2e-setup playwright`
- `/setup-load-testing --capacity`
- `/test-coverage --threshold 85`

**Phase 4 Priority Skills**:
```bash
# RECOMMENDED (if time available):
1. nasa-portal-integration-tester (45 min investment)
   → Saves 2-3 hours in Phase 4

2. nasa-portal-e2e-tester (45 min investment)
   → Saves 2-3 hours in Phase 4
```

---

### Phase 5: Production Deployment (26-36 hours → 16-24 hours)

**Current Status**: PLANNED
**Objectives**:
1. Vercel deployment setup
2. Neon PostgreSQL production
3. Upstash Redis production
4. Sentry monitoring integration
5. Production testing

**Recommended Skills**:
1. **nasa-portal-deployment-specialist** (HIGH PRIORITY)
   - Used for: Vercel configuration
   - Saves: 2-4 hours
   - Embeds: vercel.json patterns, env sync

2. **nasa-portal-monitoring-setup** (RECOMMENDED)
   - Used for: Sentry setup, health checks
   - Saves: 2-3 hours

3. **nasa-portal-migration-runner** (RECOMMENDED)
   - Used for: Production migrations
   - Saves: 1-2 hours

**Agent Usage**:
- devops-engineer: Infrastructure setup (3-4 hours)
- vercel-deployment-specialist: Vercel config (2-3 hours)
- monitoring-specialist: Sentry integration (4-5 hours)
- database-admin: Neon setup (3-4 hours)

**Commands**:
- `/vercel-env-sync --push`
- `/deployment-monitoring setup --sentry`
- `/migrate-database --production --backup`

**Phase 5 Priority Skills**:
```bash
# HIGH PRIORITY:
1. nasa-portal-deployment-specialist (60 min investment)
   → Saves 2-4 hours in Phase 5
   → Critical for production deployment

# RECOMMENDED:
2. nasa-portal-monitoring-setup (45 min investment)
   → Saves 2-3 hours in Phase 5
```

---

### Phase 6: Performance Optimization (20-28 hours → 14-20 hours)

**Current Status**: PLANNED
**Objectives**:
1. Bundle size optimization
2. Database query optimization
3. Redis caching strategy
4. API response time optimization
5. Security hardening

**Recommended Skills**:
1. **nasa-portal-performance-optimizer** (HIGH PRIORITY)
   - Used for: All optimization tasks
   - Saves: 2-4 hours
   - Embeds: Bundle optimization, caching strategies

2. **nasa-portal-database-designer** (Already created)
   - Used for: Query optimization
   - Saves: 2-3 hours

3. **nasa-portal-security-auditor** (RECOMMENDED)
   - Used for: Security review
   - Saves: 2-3 hours

**Agent Usage**:
- performance-engineer: Bundle optimization (2-3 hours)
- database-optimizer: Query tuning (2-3 hours)
- security-engineer: Security hardening (2-3 hours)

**Commands**:
- `/optimize-bundle-size`
- `/optimize-database-performance --indexes`
- `/security-hardening --headers --auth --encryption`

**Phase 6 Priority Skills**:
```bash
# HIGH PRIORITY:
1. nasa-portal-performance-optimizer (60 min investment)
   → Saves 2-4 hours in Phase 6

# RECOMMENDED:
2. nasa-portal-security-auditor (45 min investment)
   → Saves 2-3 hours in Phase 6
```

---

### Phase 7: Polish & Launch (10-14 hours → 7-10 hours)

**Current Status**: PLANNED
**Objectives**:
1. UI polish and animations
2. Error handling improvements
3. Documentation completion
4. Final testing
5. Launch preparation

**Recommended Skills**:
1. **nasa-portal-doc-writer** (Already created)
   - Used for: Final documentation
   - Saves: 2-3 hours

2. **nasa-portal-frontend-architect** (Already created)
   - Used for: UI polish
   - Saves: 2-3 hours

3. **nasa-portal-ui-polisher** (Create if needed)
   - Used for: Final UI improvements
   - Saves: 2-3 hours

4. **nasa-portal-api-documenter** (RECOMMENDED)
   - Used for: API documentation
   - Saves: 2 hours

**Agent Usage**:
- frontend-developer: UI polish (2-3 hours)
- documentation-expert: Final docs (2-3 hours)
- test-automator: Final testing (2-3 hours)

**Commands**:
- `/generate-api-documentation --swagger-ui`
- `/update-docs --api --architecture`
- `/test-automation-orchestrator --comprehensive`

**Phase 7 Priority Skills**:
```bash
# RECOMMENDED:
1. nasa-portal-api-documenter (30 min investment)
   → Saves 2 hours in Phase 7

2. nasa-portal-ui-polisher (45 min investment)
   → Saves 2-3 hours in Phase 7
```

---

## TIER 1 SKILLS - CREATE FIRST (HIGHEST ROI)

**Total Investment**: 4-6 hours
**Total Savings**: 16-30 hours across all phases
**ROI**: 2.7-7.5x

### Skill 1: nasa-portal-test-generator ⭐⭐⭐⭐⭐
```bash
Priority: 1 (Create IMMEDIATELY)
Investment: 60-90 minutes
Savings: 4-7 hours (Phases 0, 2, 3, 4, 7)
Used: 8-10 times
ROI: 4-7x

When to Create: BEFORE Phase 0 completion
First Use: Phase 0 test validation
```

**Embedded Knowledge**:
- NASA API response structures (APOD, NEO, Resources)
- Complete database schema (users, favorites, collections)
- System 6 component props (Window, Desktop, MenuBar)
- JWT structure and authentication patterns
- Testing philosophy (no mocks, real implementations)
- Jest + React Testing Library best practices

**Usage Command**:
```bash
Use skill-creator Skill:
"Create nasa-portal-test-generator Skill with embedded knowledge of NASA API structures, database schema, System 6 components, authentication patterns, and testing philosophy (no mocks). Should generate production-ready tests with 80%+ coverage."
```

### Skill 2: nasa-portal-backend-architect ⭐⭐⭐⭐⭐
```bash
Priority: 2 (Create Before Phase 1)
Investment: 60-90 minutes
Savings: 4-8 hours (Phases 1, 2, 3)
Used: 6-8 times
ROI: 4-8x

When to Create: After Phase 0, before Phase 1
First Use: Phase 1 server architecture
```

**Embedded Knowledge**:
- NASA API proxy patterns (rate limits, caching, error handling)
- User resource architecture (favorites, collections services)
- PostgreSQL connection patterns (serverless optimization)
- Express.js service organization
- Authentication integration patterns
- Error handling patterns (custom error classes)

**Usage Command**:
```bash
Use skill-creator Skill:
"Create nasa-portal-backend-architect Skill with embedded knowledge of NASA API proxy patterns, PostgreSQL serverless optimization, Express.js service organization, and authentication integration."
```

### Skill 3: nasa-portal-database-designer ⭐⭐⭐⭐⭐
```bash
Priority: 3 (Create Before Phase 1)
Investment: 45-60 minutes
Savings: 3-5 hours (Phases 1, 3, 6)
Used: 5-7 times
ROI: 5-7x

When to Create: After Phase 0, before Phase 1 migrations
First Use: Phase 1 SQL migrations
```

**Embedded Knowledge**:
- Complete database schema (exact enums, constraints)
- JSONB patterns for NASA data
- N+1 query elimination (json_agg patterns)
- Serverless PostgreSQL optimizations
- Index strategy (composite, partial, GIN indexes)
- Migration best practices

**Usage Command**:
```bash
Use skill-creator Skill:
"Create nasa-portal-database-designer Skill with embedded knowledge of complete database schema, JSONB patterns, N+1 elimination with json_agg, serverless optimization, and comprehensive index strategy."
```

### Skill 4: nasa-portal-auth-specialist ⭐⭐⭐⭐
```bash
Priority: 4 (Create Before Phase 2)
Investment: 45-60 minutes
Savings: 2-4 hours (Phases 2, 6)
Used: 3-5 times
ROI: 3-5x

When to Create: After Phase 1, before Phase 2
First Use: Phase 2 authentication implementation
```

**Embedded Knowledge**:
- JWT configuration (15min access, 7day refresh)
- Password rules (8+ chars, complexity requirements)
- Bcrypt rounds (10)
- Account lockout logic (5 attempts = 30 min)
- Rate limiting by role
- Token refresh flow

**Usage Command**:
```bash
Use skill-creator Skill:
"Create nasa-portal-auth-specialist Skill with embedded knowledge of JWT config (15m/7d), bcrypt (10 rounds), account lockout (5/30min), password validation, and role-based rate limiting."
```

### Skill 5: nasa-portal-frontend-architect ⭐⭐⭐⭐
```bash
Priority: 5 (Create Before Phase 2)
Investment: 45-60 minutes
Savings: 3-6 hours (Phases 2, 3, 7)
Used: 5-7 times
ROI: 4-8x

When to Create: After Phase 1, before Phase 2
First Use: Phase 2 AuthContext integration
```

**Embedded Knowledge**:
- System.css classes and patterns
- NASA component structures (ApodApp, NeoWsApp)
- AuthContext patterns
- React hooks optimization
- Error boundary patterns
- Framer Motion animations

**Usage Command**:
```bash
Use skill-creator Skill:
"Create nasa-portal-frontend-architect Skill with embedded knowledge of System.css styling, NASA component structures, AuthContext patterns, React hooks optimization, and System 6 design patterns."
```

---

## TIER 2 SKILLS - CREATE NEXT (HIGH VALUE)

**Total Investment**: 2-3 hours
**Total Savings**: 7-14 hours
**ROI**: 2.3-7x

### Skill 6: nasa-portal-performance-optimizer
```bash
Investment: 45-60 minutes
Savings: 2-4 hours (Phase 6)
When: Create before Phase 6
```

### Skill 7: nasa-portal-deployment-specialist
```bash
Investment: 45-60 minutes
Savings: 2-4 hours (Phase 5)
When: Create before Phase 5
```

### Skill 8: nasa-portal-doc-writer
```bash
Investment: 45-60 minutes
Savings: 3-6 hours (Phases 1, 7)
When: Create before Phase 1
```

---

## TIER 3 SKILLS - CREATE AS NEEDED (NICE TO HAVE)

**Total Investment**: 3-4 hours
**Total Savings**: 8-14 hours
**ROI**: 2-4.7x

### Skills:
1. nasa-portal-security-auditor (30-45 min) → 2-3 hours saved
2. nasa-portal-integration-tester (30-45 min) → 2-3 hours saved
3. nasa-portal-api-documenter (30-45 min) → 2 hours saved
4. nasa-portal-ui-polisher (30-45 min) → 2-3 hours saved
5. nasa-portal-migration-runner (20-30 min) → 1-2 hours saved
6. nasa-portal-monitoring-setup (30-45 min) → 2-3 hours saved
7. nasa-portal-e2e-tester (30-45 min) → 2-3 hours saved

---

## IMPLEMENTATION TIMELINE

### Week 1: Foundation Skills (Day 1-3)

**Day 1** (2 hours):
```bash
# Morning: Create test generator (CRITICAL for Phase 0)
Use skill-creator Skill:
"Create nasa-portal-test-generator..."

# Afternoon: Use it immediately
Use nasa-portal-test-generator Skill:
"Generate tests for NeoWsApp.js"
```

**Day 2** (3 hours):
```bash
# Morning: Create database designer (CRITICAL for Phase 1)
Use skill-creator Skill:
"Create nasa-portal-database-designer..."

# Afternoon: Create backend architect
Use skill-creator Skill:
"Create nasa-portal-backend-architect..."
```

**Day 3** (2 hours):
```bash
# Morning: Create auth specialist
Use skill-creator Skill:
"Create nasa-portal-auth-specialist..."

# Afternoon: Create frontend architect
Use skill-creator Skill:
"Create nasa-portal-frontend-architect..."
```

**End of Week 1**: 5 Tier 1 Skills created (7 hours invested)

### Week 2: High-Value Skills (Day 4-5)

**Day 4** (1.5 hours):
```bash
# Create performance optimizer + deployment specialist
```

**Day 5** (1 hour):
```bash
# Create doc writer
```

**End of Week 2**: 8 Skills created (9.5 hours invested)

### Weeks 3-4: As-Needed Skills

Create Tier 3 Skills as you approach relevant phases:
- Before Phase 4: integration-tester, e2e-tester
- Before Phase 5: monitoring-setup
- Before Phase 6: security-auditor
- Before Phase 7: api-documenter, ui-polisher

---

## SUCCESS METRICS

### After Creating Tier 1 Skills (Week 1):
- [ ] 5 Skills created and tested
- [ ] 7 hours invested
- [ ] Ready to use in Phases 0-3
- [ ] Expected savings: 16-30 hours

### After Creating Tier 2 Skills (Week 2):
- [ ] 8 Skills created
- [ ] 9.5 hours invested
- [ ] Ready for all phases
- [ ] Expected savings: 23-44 hours

### Project Completion:
- [ ] 15 Skills created
- [ ] 9-13 hours invested
- [ ] 91-122 hours total project time (vs. 183-252 manual)
- [ ] 37-75 hours saved beyond generic agents
- [ ] 40-60% total time reduction
- [ ] 2.8-8.3x ROI on this project

---

## QUICK REFERENCE: WHICH SKILL FOR WHICH TASK

| Task | Skill | Alternative |
|------|-------|-------------|
| **Write tests** | nasa-portal-test-generator | test-automator agent |
| **Design API** | nasa-portal-backend-architect | backend-architect agent |
| **Create migration** | nasa-portal-database-designer | sql-pro agent |
| **Optimize query** | nasa-portal-database-designer | database-optimizer agent |
| **Implement auth** | nasa-portal-auth-specialist | security-engineer agent |
| **Create React component** | nasa-portal-frontend-architect | frontend-developer agent |
| **Deploy to Vercel** | nasa-portal-deployment-specialist | devops-engineer agent |
| **Setup monitoring** | nasa-portal-monitoring-setup | monitoring-specialist agent |
| **Optimize performance** | nasa-portal-performance-optimizer | performance-engineer agent |
| **Write documentation** | nasa-portal-doc-writer | documentation-expert agent |

---

## NEXT STEPS

1. ✅ Read SKILLS_STRATEGY.md
2. ✅ Read all PHASE_ documents
3. ✅ Read this implementation plan
4. ⏳ **START HERE**: Create nasa-portal-test-generator (60-90 min)
5. ⏳ Use it to complete Phase 0 tests
6. ⏳ Create remaining Tier 1 Skills over 3 days
7. ⏳ Begin Phase 1 with Skills ready
8. ⏳ Track time savings and ROI

**First Command to Run**:
```bash
Use skill-creator Skill:
"Create nasa-portal-test-generator Skill with embedded knowledge of:
1. NASA API response structures (APOD, NEO, Resources)
2. Complete database schema (users, favorites, collections)
3. System 6 component props
4. Authentication patterns
5. Testing philosophy (no mocks, real database)
6. Jest + React Testing Library patterns

This Skill should generate production-ready tests without requiring context."
```

---

**Document Version**: 1.0
**Ready to Execute**: YES ✅
**Expected Impact**: 37-75 hours saved, 40-60% time reduction
