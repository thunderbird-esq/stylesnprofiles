# SKILL CREATOR GUIDE - NASA SYSTEM 6 PORTAL

**Purpose**: Comprehensive guide for Claude (myself) on how to effectively use the skill-creator Skill to create hyper-specific Skills for the NASA System 6 Portal project.

**Created**: November 14, 2025
**Target Audience**: Claude Code (future instances working on this project)
**Scope**: Creating 15 NASA portal-specific Skills to accelerate development by 40-60%

---

## TABLE OF CONTENTS

1. [Understanding Claude Code Skills](#1-understanding-claude-code-skills)
2. [The skill-creator Skill](#2-the-skill-creator-skill)
3. [NASA Portal Skills Strategy](#3-nasa-portal-skills-strategy)
4. [Step-by-Step Skill Creation Protocol](#4-step-by-step-skill-creation-protocol)
5. [Complete Skill Specifications](#5-complete-skill-specifications)
6. [Quality Assurance](#6-quality-assurance)
7. [Quick Reference](#7-quick-reference)

---

## 1. UNDERSTANDING CLAUDE CODE SKILLS

### What Are Skills?

Claude Code Skills are **modular capabilities that extend Claude's functionality** by packaging:
- **Instructions**: Procedural knowledge, workflows, best practices
- **Metadata**: Name, description, trigger conditions
- **Resources**: Scripts, templates, reference documentation (optional)

Skills transform general-purpose Claude into domain-specific specialists.

### How Skills Work

**Progressive Loading Architecture** (3 levels):

1. **Metadata** (always loaded): ~100 tokens per Skill
   - `name`: Skill identifier (max 64 chars)
   - `description`: When to use this Skill (max 1024 chars)

2. **Instructions** (loaded when triggered): Under 5k tokens
   - From `SKILL.md` main body
   - Workflows, patterns, best practices

3. **Resources** (loaded as needed): No context penalty
   - Supporting files: FORMS.md, REFERENCE.md, scripts
   - Only loaded when Claude explicitly references them

**Key Benefit**: Bundle extensive documentation without consuming tokens until needed.

### Filesystem Structure

```
.claude/
└── skills/
    ├── skill-name-1/
    │   ├── SKILL.md          # Required: Main Skill definition
    │   ├── REFERENCE.md      # Optional: Detailed reference
    │   └── templates/        # Optional: Code templates
    └── skill-name-2/
        └── SKILL.md
```

Skills are **automatically discovered** - no manual registration required.

### When to Use Skills

✅ **Use Skills when**:
- Domain expertise spans multiple conversations
- Workflows are repeated frequently (3+ times)
- Context requirements are large (100+ words per use)
- Patterns should be consistent across the project
- Knowledge is project-specific

❌ **Don't use Skills when**:
- Task is one-time or unique
- Generic agent is sufficient
- Context is minimal (< 50 words)
- Flexibility is more important than consistency

### Skills vs Agents

| Aspect | Skills | Agents |
|--------|--------|--------|
| **Scope** | Domain-specific expertise | Task execution |
| **Reusability** | High (used across conversations) | Medium (per-conversation) |
| **Context** | Pre-loaded (0 words needed) | User-provided (100-500 words) |
| **Consistency** | Very high (same patterns always) | Variable (depends on prompt) |
| **Setup Time** | 30-90 minutes to create | 0 (immediate) |
| **Usage** | Automatic when relevant | Explicitly launched |

**Best Practice**: Skills provide the expertise, agents execute with that expertise.

### Security Considerations

⚠️ **CRITICAL**: Only use Skills from trusted sources.

**Malicious Skills can**:
- Direct Claude to invoke harmful tools
- Execute arbitrary code
- Exfiltrate sensitive data
- Bypass security controls

**Before using any Skill**:
1. Audit SKILL.md thoroughly
2. Review all bundled files
3. Check for suspicious tool invocations
4. Verify source/author

---

## 2. THE SKILL-CREATOR SKILL

### What is skill-creator?

skill-creator is a **meta-Skill** that helps create new Skills. It:
- Guides Skill structure and formatting
- Ensures YAML frontmatter correctness
- Provides best practice templates
- Validates Skill specifications

### How to Invoke skill-creator

```bash
# Basic invocation
Use skill-creator Skill

# Then provide specification
"Create [skill-name] Skill with embedded knowledge of:
1. [Knowledge area 1]
2. [Knowledge area 2]
..."
```

### Required YAML Frontmatter Format

Every SKILL.md must start with:

```yaml
---
name: skill-name-here
description: Clear description of what this Skill does and when Claude should use it. Max 1024 characters.
---
```

**Rules**:
- `name`: lowercase, letters/numbers/hyphens only, max 64 chars
- `description`: Non-empty, max 1024 chars, should include trigger conditions

### Skill Structure Template

```markdown
---
name: nasa-portal-example
description: Example Skill for NASA portal [purpose]. Use when [trigger condition].
---

# [Skill Name]

## Purpose
[What this Skill does]

## When to Use
- [Scenario 1]
- [Scenario 2]
- [Scenario 3]

## Embedded Knowledge

### [Knowledge Area 1]
[Detailed information, exact values, patterns]

### [Knowledge Area 2]
[More information]

## Usage Examples

**Example 1**: [Simple use case]
```
[Expected input]
```
[Expected output]

**Example 2**: [Complex use case]
```
[Expected input]
```
[Expected output]

## Quality Criteria
- [Criterion 1]
- [Criterion 2]

## Common Pitfalls
- ❌ [What to avoid]
- ✅ [What to do instead]
```

### Best Practices for Skill Design

Based on Claude documentation:

1. **Clear Triggers**: Description explicitly states when to use
2. **Progressive Disclosure**: SKILL.md focused, reference additional files for details
3. **Concrete Examples**: Include actual usage scenarios
4. **Bundled Resources**: Include supporting files (templates, references)
5. **Executable Scripts**: For deterministic operations
6. **Consistent Patterns**: Same structure across related Skills

### skill-creator Output

When you invoke skill-creator with a specification, it will:
1. Analyze your requirements
2. Structure the Skill properly
3. Create SKILL.md with correct YAML frontmatter
4. Place it in `.claude/skills/[skill-name]/`
5. Verify it's immediately usable

---

## 3. NASA PORTAL SKILLS STRATEGY

### Project Context

**NASA System 6 Portal**:
- Full-stack React + Node.js application
- PostgreSQL database with Redis caching
- JWT authentication
- NASA API integration (APOD, NeoWS, Resources)
- Retro System 6 styling

**Project Timeline**: 8 Phases (0-7), 183-252 hours manual
**Goal**: Reduce to 91-122 hours with Skills (40-60% time savings)

### Skills to Create (15 Total)

#### Tier 1: CRITICAL - Create First (4-6 hours investment, 16-30 hours savings)

1. **nasa-portal-test-generator** ⭐⭐⭐⭐⭐
   - Investment: 60-90 min
   - Saves: 4-7 hours (used 8-10 times)
   - Priority: 1 (CREATE IMMEDIATELY)
   - Phases: 0, 2, 3, 4, 7

2. **nasa-portal-backend-architect** ⭐⭐⭐⭐⭐
   - Investment: 60-90 min
   - Saves: 4-8 hours (used 6-8 times)
   - Priority: 2 (create before Phase 1)
   - Phases: 1, 2, 3

3. **nasa-portal-database-designer** ⭐⭐⭐⭐⭐
   - Investment: 45-60 min
   - Saves: 3-5 hours (used 5-7 times)
   - Priority: 3 (create before Phase 1)
   - Phases: 1, 3, 6

4. **nasa-portal-auth-specialist** ⭐⭐⭐⭐
   - Investment: 45-60 min
   - Saves: 2-4 hours (used 3-5 times)
   - Priority: 4 (create before Phase 2)
   - Phases: 2, 6

5. **nasa-portal-frontend-architect** ⭐⭐⭐⭐
   - Investment: 45-60 min
   - Saves: 3-6 hours (used 5-7 times)
   - Priority: 5 (create before Phase 2)
   - Phases: 2, 3, 7

#### Tier 2: HIGH VALUE - Create Next (2-3 hours investment, 7-14 hours savings)

6. **nasa-portal-performance-optimizer**
   - Investment: 45-60 min
   - Saves: 2-4 hours
   - Create before: Phase 6

7. **nasa-portal-deployment-specialist**
   - Investment: 45-60 min
   - Saves: 2-4 hours
   - Create before: Phase 5

8. **nasa-portal-doc-writer**
   - Investment: 45-60 min
   - Saves: 3-6 hours
   - Create before: Phase 1

#### Tier 3: NICE TO HAVE - Create As Needed (3-4 hours investment, 8-14 hours savings)

9. **nasa-portal-security-auditor** (30-45 min → 2-3 hours saved)
10. **nasa-portal-integration-tester** (30-45 min → 2-3 hours saved)
11. **nasa-portal-api-documenter** (30-45 min → 2 hours saved)
12. **nasa-portal-ui-polisher** (30-45 min → 2-3 hours saved)
13. **nasa-portal-migration-runner** (20-30 min → 1-2 hours saved)
14. **nasa-portal-monitoring-setup** (30-45 min → 2-3 hours saved)
15. **nasa-portal-e2e-tester** (30-45 min → 2-3 hours saved)

### Skill Dependencies

```
nasa-portal-database-designer (Create FIRST)
    ↓ (schema knowledge needed by)
nasa-portal-backend-architect
    ↓ (service patterns needed by)
nasa-portal-auth-specialist + nasa-portal-frontend-architect
    ↓ (implementation patterns needed by)
nasa-portal-test-generator
```

**Recommended Creation Order**:
1. nasa-portal-database-designer
2. nasa-portal-backend-architect
3. nasa-portal-auth-specialist OR nasa-portal-frontend-architect (parallel)
4. nasa-portal-test-generator
5. Tier 2 and 3 as needed

---

## 4. STEP-BY-STEP SKILL CREATION PROTOCOL

### Pre-Creation Checklist

Before creating any Skill, ensure you have:

- [ ] Read relevant PHASE_ documentation
- [ ] Identified exact knowledge to embed
- [ ] Collected specific values (not "TBD" or "configure later")
- [ ] Reviewed existing code patterns
- [ ] Listed concrete usage scenarios
- [ ] Defined success criteria

### Step 1: Gather Knowledge to Embed

**For NASA Portal Skills, gather**:

#### Database Knowledge (all Skills)
```sql
-- Exact enum values (not approximate)
user_role: 'guest', 'user', 'premium', 'admin', 'moderator'
user_status: 'active', 'suspended', 'deleted'
item_type: 'apod', 'neo', 'resource'

-- Table structures (exact field names)
users: id, email, password_hash, username, display_name, role, status,
       email_verified, failed_login_attempts, account_locked_until,
       created_at, updated_at, deleted_at

favorites: id, user_id, item_type, item_id, item_date, item_data (JSONB),
          user_note, user_tags (array), is_favorite, is_archived

collections: id, user_id, name, description, is_public, is_featured, item_count

collection_items: id, collection_id, favorite_id, position
```

#### NASA API Structures (test-generator, backend-architect)
```javascript
// APOD Response
{
  date: "2024-01-01",
  title: string,
  explanation: string,
  url: string,
  hdurl: string,
  media_type: "image" | "video",
  copyright: string (optional)
}

// NEO Response
{
  element_count: number,
  near_earth_objects: {
    "date": [
      {
        id: string,
        name: string,
        nasa_jpl_url: string,
        absolute_magnitude_h: number,
        estimated_diameter: {...},
        is_potentially_hazardous_asteroid: boolean,
        close_approach_data: [...]
      }
    ]
  }
}
```

#### Authentication Patterns (auth-specialist)
```javascript
// JWT Configuration
ACCESS_TOKEN_EXPIRATION: '15m'
REFRESH_TOKEN_EXPIRATION: '7d'
JWT_ALGORITHM: 'HS256'
BCRYPT_ROUNDS: 10

// Account Lockout
MAX_FAILED_ATTEMPTS: 5
LOCKOUT_DURATION: 30 * 60 * 1000 // 30 minutes

// Password Validation
MIN_LENGTH: 8
REQUIRES: uppercase, lowercase, number, special char
REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
```

#### Testing Philosophy (test-generator)
```javascript
// No Mocks Philosophy
- Use real database connections
- Use real NASA API calls (DEMO_KEY)
- Cleanup in afterEach/afterAll
- Coverage target: 80-85%
- Test structure: Arrange-Act-Assert

// Test User Creation
{
  email: 'test@example.com',
  password: 'Test123!@#', // Must meet validation
  displayName: 'Test User',
  role: 'user'
}
```

### Step 2: Write Skill Specification

Use this template:

```
Create [skill-name] Skill with embedded knowledge of:

1. [Knowledge Area 1]:
   - [Specific detail A with exact values]
   - [Specific detail B with examples]
   - [Specific detail C with patterns]

2. [Knowledge Area 2]:
   - [Specific detail A]
   - [Specific detail B]
   ...

[5-8 knowledge areas total]

Tools: [Read, Write, Edit, Bash, Grep - specify which]

When to use:
- [Scenario 1 - be specific]
- [Scenario 2 - be specific]
- [Scenario 3 - be specific]

This Skill should [clear primary purpose statement].
[Expected output quality statement].
```

### Step 3: Invoke skill-creator

```bash
# 1. Start skill-creator
Use skill-creator Skill

# 2. Provide specification (from Step 2)
[Paste your complete specification]

# 3. Wait for skill-creator to:
#    - Analyze specification
#    - Create SKILL.md
#    - Place in .claude/skills/[skill-name]/
#    - Confirm creation
```

### Step 4: Test the Skill

```bash
# 1. Invoke the new Skill with minimal prompt
Use [skill-name] Skill:
"[Simple task that exercises the Skill]"

# 2. Verify output includes:
#    - NASA-specific details (no generic placeholders)
#    - Exact values from embedded knowledge
#    - Correct patterns and structures
#    - Production-ready quality

# 3. Check that it does NOT require:
#    - Additional context about NASA APIs
#    - Database schema information
#    - Reminders about project patterns
```

### Step 5: Iterate if Needed

If output isn't perfect:

```bash
# Option A: Update existing Skill
Use skill-creator Skill:
"Update [skill-name] to include [specific improvement]"

# Option B: Add missing knowledge
Use skill-creator Skill:
"Add to [skill-name] Skill:
- [Missing knowledge area]
- [Additional examples]"
```

### Step 6: Document Usage

Add to SKILLS_IMPLEMENTATION_PLAN.md:

```markdown
## Skill: [skill-name]

**Status**: ✅ Created
**Created**: [Date]
**Tested**: ✅ Yes
**First Use**: Phase [X], Task [Y]

**Quality Verification**:
- ✅ Produces NASA-specific output
- ✅ Includes exact values (no placeholders)
- ✅ Requires minimal context
- ✅ Consistent patterns

**Usage Example**:
Input: "[Simple prompt]"
Output: "[Expected result]"

**ROI Tracking**:
- Time invested: [X] minutes
- Time saved (so far): [Y] hours
- Uses so far: [Z]
```

---

## 5. COMPLETE SKILL SPECIFICATIONS

### TIER 1 SKILLS - COPY-PASTE READY

#### Skill 1: nasa-portal-test-generator

**When to Create**: IMMEDIATELY (Phase 0)

**skill-creator Specification**:
```
Create nasa-portal-test-generator Skill with embedded knowledge of:

1. NASA API Response Structures:
   - APOD: {date: "YYYY-MM-DD", title: string, explanation: string, url: string, hdurl: string, media_type: "image"|"video", copyright: string (optional), service_version: "v1"}
   - NEO: {element_count: number, near_earth_objects: {[date]: [{id, name, nasa_jpl_url, absolute_magnitude_h, estimated_diameter, is_potentially_hazardous_asteroid, close_approach_data}]}}
   - Resource Navigator: {resources: [{id, title, description, category, url, api_endpoint}]}

2. Complete Database Schema:
   - users table: id, email (unique), password_hash, username, display_name, role (enum: 'guest','user','premium','admin','moderator'), status (enum: 'active','suspended','deleted'), email_verified, failed_login_attempts, account_locked_until, created_at, updated_at, deleted_at
   - favorites table: id, user_id (FK), item_type (enum: 'apod','neo','resource'), item_id, item_date, item_data (JSONB), user_note, user_tags (TEXT[]), is_favorite, is_archived, UNIQUE(user_id, item_type, item_id)
   - collections table: id, user_id (FK), name, description, is_public, is_featured, item_count, is_archived
   - collection_items table: id, collection_id (FK), favorite_id (FK), position, UNIQUE(collection_id, favorite_id)

3. System 6 Component Props:
   - Window: {id: string, title: string, x: number, y: number, width: number, height: number, zIndex: number, onClose: function, children: ReactNode}
   - DesktopIcon: {id: string, iconType: 'apod'|'neo'|'resources'|'favorites'|'collections', label: string, x: number, y: number, onClick: function}
   - MenuBar: {items: Array<{label: string, submenu?: Array<{label: string, action: function}>}>, onMenuClick: function}

4. Authentication Patterns:
   - JWT token structure: {userId: number, email: string, role: 'guest'|'user'|'premium'|'admin'|'moderator'}
   - Account lockout: 5 failed attempts → 30 minute lock (stored in account_locked_until)
   - Password validation: Min 8 chars, must have uppercase, lowercase, number, special char
   - Test user credentials: {email: 'test@example.com', password: 'Test123!@#', displayName: 'Test User', role: 'user'}

5. Testing Philosophy (CRITICAL - NO MOCKS):
   - ALWAYS use real database connections (never jest.mock())
   - ALWAYS use real NASA API calls (use DEMO_KEY or real API)
   - Database cleanup: afterEach(() => { delete test data }), afterAll(() => { pool.end() })
   - Coverage target: 80-85% for all code
   - Test structure: Arrange-Act-Assert pattern
   - Test both happy path AND error cases
   - Use describe/it blocks with clear names
   - beforeAll for setup, afterAll for teardown

6. Jest + React Testing Library + Supertest Best Practices:
   - Unit tests: Isolated function/component testing
   - Integration tests: API endpoint testing with supertest
   - Component tests: React Testing Library (render, screen, waitFor)
   - Database tests: Real PostgreSQL connections
   - Assertions: expect().toBe(), toEqual(), toHaveProperty(), toThrow()
   - Async: await waitFor(() => {...}), async/await patterns

Tools: Read, Write, Bash, Grep

When to use:
- Creating unit tests for any service (authService, favoritesService, collectionsService)
- Creating integration tests for API routes (/api/v1/auth/*, /api/v1/users/favorites/*)
- Creating component tests for React UI (Desktop, Window, MenuBar, ApodApp, NeoWsApp)
- Generating E2E test scenarios
- Checking test coverage gaps and adding missing tests

This Skill should generate production-ready test files that:
- Use real implementations (NEVER mocks)
- Include NASA-specific test cases (video media_type, hazardous asteroids, missing data)
- Follow exact database schema (correct enums, JSONB patterns, array queries)
- Achieve 80%+ coverage
- Include proper setup/teardown
- Test error cases thoroughly
```

**First Usage**:
```bash
Use nasa-portal-test-generator Skill:
"Generate comprehensive test suite for NeoWsApp.js component"
```

---

#### Skill 2: nasa-portal-backend-architect

**When to Create**: Before Phase 1

**skill-creator Specification**:
```
Create nasa-portal-backend-architect Skill with embedded knowledge of:

1. NASA API Proxy Patterns:
   - Rate limits: DEMO_KEY (30/hour, 50/day), API_KEY (1000/hour, 10000/day)
   - Cache TTLs: APOD (24 hours - updates daily), NEO (1 hour - frequently updated), Resources (7 days - rarely changes)
   - Error handling: 404 ("Data not available for date"), 429 ("Rate limit exceeded"), 500 ("Service unavailable"), TIMEOUT (10 seconds)
   - Response transformation: Convert NASA format to internal format {id, itemType, itemDate, data}

2. User Resource Service Architecture:
   - FavoritesService pattern:
     * getFavorites(userId, {page, limit, type, archived}) → {favorites: [...], pagination: {total, page, limit, totalPages}}
     * addFavorite(userId, data) → Prevent duplicates with UNIQUE(user_id, item_type, item_id), store NASA data in JSONB
     * updateFavorite(userId, favoriteId, updates) → Allow: user_note, user_tags, is_favorite. Don't allow: item_type, item_id
     * removeFavorite(userId, favoriteId) → Soft delete: SET is_archived = TRUE (never DELETE)
   - CollectionsService pattern:
     * getCollectionsWithItems(userId) → Use json_agg to fetch in SINGLE query (no N+1): SELECT c.*, json_agg(json_build_object(...)) FROM collections c LEFT JOIN collection_items ci LEFT JOIN favorites f GROUP BY c.id
     * addItemToCollection(collectionId, favoriteId, position) → Junction table, update item_count

3. PostgreSQL Connection Patterns for Serverless:
   - Connection pooling: {max: 1, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000, statement_timeout: 10000, ssl: {rejectUnauthorized: true}}
   - Query helper with logging: async query(text, params) { const start = Date.now(); try { result } catch { log error } }
   - CRITICAL: max: 1 for serverless (Vercel/Neon)

4. Express.js Service Organization:
   - Directory structure:
     * server/services/ - Business logic (authService, favoritesService, collectionsService, nasaApiService)
     * server/routes/ - HTTP handlers (auth.js, favorites.js, collections.js, nasa.js)
     * server/middleware/ - Cross-cutting (auth, validation, rateLimit, errorHandler, cache)
     * server/server.js - App initialization
   - Service method signatures: (userId, data/id, options) → {success, data} or throw error

5. Authentication Integration:
   - Middleware usage: const {authenticateToken, authorizeRole} = require('./middleware/auth')
   - All user routes: router.get('/favorites', authenticateToken, handler)
   - Admin routes: router.get('/admin/users', authenticateToken, authorizeRole(['admin']), handler)
   - User context: After authenticateToken, req.user = {userId, email, role}

6. Error Handling Patterns:
   - Service layer: Throw descriptive errors (ValidationError, NotFoundError, etc.)
   - Custom error classes: class ValidationError extends Error { constructor(message) { super(message); this.name = 'ValidationError'; this.statusCode = 400; } }
   - Route layer: try { service call } catch (error) { next(error) }
   - Global error handler: function errorHandler(err, req, res, next) { res.status(err.statusCode || 500).json({success: false, error: err.message}) }

Tools: Read, Write, Edit, Grep

When to use:
- Designing any backend service (authService, favoritesService, collectionsService, nasaApiService)
- Creating API endpoints (/api/v1/*)
- Structuring service methods and error handling
- Planning database queries and optimizations
- Organizing middleware architecture
- Integrating authentication into routes

This Skill should generate:
- Complete service implementations with proper patterns
- Optimized database queries (no N+1)
- Consistent error handling
- Proper authentication integration
- Production-ready code following Node.js/Express best practices
```

**First Usage**:
```bash
Use nasa-portal-backend-architect Skill:
"Design favoritesService.js with full CRUD operations"
```

---

#### Skill 3: nasa-portal-database-designer

**When to Create**: Before Phase 1 migrations

**skill-creator Specification**:
```
Create nasa-portal-database-designer Skill with embedded knowledge of:

1. Complete Database Schema (PostgreSQL 14+):
   - ENUMs:
     * user_role: 'guest', 'user', 'premium', 'admin', 'moderator'
     * user_status: 'active', 'suspended', 'deleted'
     * item_type_enum: 'apod', 'neo', 'resource'

   - users table:
     * Fields: id (SERIAL PRIMARY KEY), email (VARCHAR(255) UNIQUE NOT NULL), password_hash (VARCHAR(255) NOT NULL), username (VARCHAR(50) UNIQUE), display_name (VARCHAR(100)), role (user_role DEFAULT 'user'), status (user_status DEFAULT 'active'), email_verified (BOOLEAN DEFAULT FALSE), failed_login_attempts (INTEGER DEFAULT 0), account_locked_until (TIMESTAMP), created_at, updated_at, deleted_at
     * Indexes: (email WHERE deleted_at IS NULL), (status WHERE deleted_at IS NULL), (role), (created_at)
     * Constraint: email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'

   - favorites table:
     * Fields: id (SERIAL PRIMARY KEY), user_id (INTEGER REFERENCES users(id) ON DELETE CASCADE), item_type (item_type_enum NOT NULL), item_id (VARCHAR(255) NOT NULL), item_date (DATE), item_data (JSONB NOT NULL), user_note (TEXT), user_tags (TEXT[]), is_favorite (BOOLEAN DEFAULT TRUE), is_archived (BOOLEAN DEFAULT FALSE), created_at, updated_at
     * Unique: (user_id, item_type, item_id)
     * Indexes: (user_id, item_type), (user_id, is_archived WHERE is_archived = FALSE), (item_date), GIN(item_data), GIN(user_tags)

   - collections + collection_items:
     * collections: id, user_id, name, description, is_public, is_featured, item_count, created_at, updated_at, is_archived
     * collection_items: id, collection_id, favorite_id, position, created_at, UNIQUE(collection_id, favorite_id)

2. JSONB Patterns for NASA Data:
   - Query patterns:
     * item_data->>'title' - Extract title
     * item_data->'close_approach_data'->0->>'miss_distance' - Nested access
     * item_data @> '{"media_type": "video"}' - Contains check
     * item_data ? 'copyright' - Key existence
     * user_tags && ARRAY['space', 'astronomy'] - Array overlap

3. N+1 Query Elimination:
   - BAD: Fetch collections, then loop to fetch items (N+1)
   - GOOD: Single query with json_agg:
     SELECT c.*, COALESCE(json_agg(json_build_object('id', ci.id, 'favoriteId', ci.favorite_id, 'position', ci.position, 'itemData', f.item_data) ORDER BY ci.position) FILTER (WHERE ci.id IS NOT NULL), '[]') as items
     FROM collections c LEFT JOIN collection_items ci ON c.id = ci.collection_id LEFT JOIN favorites f ON ci.favorite_id = f.id WHERE c.user_id = $1 GROUP BY c.id

4. Index Strategy:
   - Composite indexes: (user_id, item_type), (user_id, is_archived)
   - Partial indexes: WHERE is_archived = FALSE (only index active records)
   - GIN indexes: For JSONB (item_data) and arrays (user_tags)
   - B-tree indexes: For foreign keys, dates, primary lookups

5. Serverless PostgreSQL Optimization:
   - Connection pooling: max: 1 (critical for serverless)
   - Statement timeout: 10 seconds
   - SSL: required for Neon (rejectUnauthorized: true)
   - Prepared statements for security

6. Migration Best Practices:
   - Naming: 001_create_users_table.sql, 002_create_favorites_table.sql
   - Include rollback: DROP TABLE IF EXISTS [table]
   - CREATE IF NOT EXISTS for idempotency
   - CONCURRENTLY for indexes in production (no table locks)
   - Trigger for updated_at: CREATE TRIGGER update_[table]_updated_at BEFORE UPDATE

Tools: Read, Write, Bash

When to use:
- Creating database migrations
- Adding indexes for performance
- Optimizing slow queries
- Designing new tables for features
- Analyzing query performance with EXPLAIN
- Eliminating N+1 queries

This Skill should generate:
- Complete migration files with proper indexes and constraints
- Optimized queries using json_agg for nested data
- Correct JSONB and array query patterns
- Serverless-optimized connection pooling
- Production-ready SQL following PostgreSQL 14+ best practices
```

**First Usage**:
```bash
Use nasa-portal-database-designer Skill:
"Create 001_create_users_table.sql migration"
```

---

#### Skill 4: nasa-portal-auth-specialist

**When to Create**: Before Phase 2

**skill-creator Specification**:
```
Create nasa-portal-auth-specialist Skill with embedded knowledge of:

1. JWT Configuration (EXACT VALUES):
   - Access token: 15 minutes expiration ('15m')
   - Refresh token: 7 days expiration ('7d')
   - Algorithm: HS256
   - Secret generation: 64+ character random string
   - Token payload: {userId: number, email: string, role: enum}

2. Password Security (EXACT VALUES):
   - Bcrypt rounds: 10
   - Min length: 8 characters
   - Requirements: uppercase, lowercase, number, special character
   - Validation regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
   - Timing-safe comparison: bcrypt.compare()

3. Account Lockout Logic (EXACT VALUES):
   - Max failed attempts: 5
   - Lockout duration: 30 minutes (1800000 ms)
   - Track in: users.failed_login_attempts
   - Lock timestamp: users.account_locked_until
   - Reset on successful login: SET failed_login_attempts = 0

4. Rate Limiting by Role (EXACT VALUES):
   - Guest: 30 requests / 15 minutes
   - User: 100 requests / 15 minutes
   - Premium: 500 requests / 15 minutes
   - Admin/Moderator: 1000 requests / 15 minutes
   - Window: 15 * 60 * 1000 ms

5. Authentication Flow:
   - Register: Validate email/password → Hash password (bcrypt, 10 rounds) → INSERT user → Generate JWT pair
   - Login: Validate credentials → Check account_locked_until → Compare password (timing-safe) → Update failed_login_attempts → Generate JWT pair
   - Refresh: Verify refresh token → Check token expiry → Generate new access token
   - Logout: Invalidate refresh token (optional token blacklist)

6. Middleware Implementation:
   - authenticateToken: Extract Bearer token → jwt.verify() → Set req.user → next()
   - optionalAuth: Try to authenticate, but don't block if fails → next() always
   - authorizeRole: Check req.user.role in allowed roles array

Tools: Read, Write, Edit

When to use:
- Implementing JWT authentication system
- Creating authentication middleware
- Setting up password hashing and validation
- Implementing account lockout mechanism
- Configuring rate limiting
- Creating user registration/login endpoints

This Skill should generate:
- Production-ready authentication code with exact security parameters
- Proper JWT configuration (15m access, 7d refresh)
- Bcrypt implementation with correct rounds
- Complete account lockout logic
- Role-based rate limiting
- Secure password validation
```

**First Usage**:
```bash
Use nasa-portal-auth-specialist Skill:
"Implement authService.js with registration and login"
```

---

#### Skill 5: nasa-portal-frontend-architect

**When to Create**: Before Phase 2

**skill-creator Specification**:
```
Create nasa-portal-frontend-architect Skill with embedded knowledge of:

1. System.css Styling Patterns:
   - Window classes: .window, .window__title-bar, .window__title, .window__controls, .window__content
   - Button styles: .btn, .btn--primary, .btn--secondary
   - Layout: .desktop, .desktop-icon, .menu-bar
   - Typography: Chicago 12pt for titles, Geneva 9pt for body
   - Colors: #000 (black), #FFF (white), #888 (gray patterns)

2. NASA Component Structures:
   - ApodApp: Fetches APOD data, displays image/video, shows title/explanation, handles loading/error states
   - NeoWsApp: Fetches NEO data, lists asteroids, shows hazard status, date filtering
   - ResourceNavigatorApp: Lists NASA resources, category filtering, search functionality
   - All use: useState, useEffect, error boundaries, System 6 styling

3. React Patterns and Optimization:
   - Hooks: useState, useEffect, useContext, useCallback, useMemo, useRef
   - Context: AuthContext for user state, AppContext for application state
   - Optimization: React.memo for expensive components, useCallback for event handlers, useMemo for computed values
   - Error handling: ErrorBoundary components, try/catch in async functions
   - Loading states: Show loading indicators during data fetch

4. AuthContext Integration:
   - Context structure: {user: {id, email, role}, login: (credentials) => {}, logout: () => {}, isAuthenticated: boolean, loading: boolean}
   - Usage: const {user, login, logout} = useContext(AuthContext)
   - Protected routes: Check isAuthenticated before rendering
   - Token management: Store JWT in localStorage, attach to API requests

5. Framer Motion Animation Patterns:
   - Window animations: <motion.div initial={{scale: 0.8, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.8, opacity: 0}}>
   - Desktop icon: <motion.div whileHover={{scale: 1.1}} whileTap={{scale: 0.95}}>
   - List items: <motion.div variants={listItemVariants} initial="hidden" animate="visible">
   - Transitions: smooth spring animations, 0.3s duration

6. Component Composition:
   - Desktop → MenuBar + DesktopIcon[] + Window[]
   - Window → TitleBar + Content (NASA app component)
   - Apps → Use services/nasaApi.js for data fetching
   - Error handling → ErrorBoundary wraps all apps

Tools: Read, Write, Edit, Bash

When to use:
- Creating React components for NASA portal
- Implementing System 6 UI styling
- Setting up AuthContext and user authentication
- Adding Framer Motion animations
- Creating NASA app components (APOD, NEO, Resources)
- Optimizing React performance

This Skill should generate:
- React components with proper System.css classes
- Correct NASA API integration patterns
- Optimized hooks usage (memo, callback, context)
- Proper error boundaries
- Authentic System 6 styling
- Smooth Framer Motion animations
```

**First Usage**:
```bash
Use nasa-portal-frontend-architect Skill:
"Create AuthContext provider with login/logout functionality"
```

---

### TIER 2 & 3 SKILLS - ABBREVIATED

**For brevity, Tier 2 and 3 Skills follow the same pattern**:

1. Identify knowledge areas (5-8 specific domains)
2. Include exact values (no placeholders)
3. Define clear usage scenarios
4. Specify tools needed
5. State quality criteria

**Create these as needed before their respective phases.**

---

## 6. QUALITY ASSURANCE

### How to Verify Skill Quality

After creating a Skill, test it with this checklist:

#### Level 1: Invocation Test
```bash
# Can you invoke the Skill?
Use [skill-name] Skill:
"[Simple task]"

✅ Skill activates
✅ No "Skill not found" errors
❌ If fails: Check SKILL.md exists in .claude/skills/[skill-name]/
```

#### Level 2: Knowledge Embedding Test
```bash
# Does it include embedded knowledge without prompting?
Use [skill-name] Skill:
"[Task that requires NASA-specific knowledge]"

✅ Output includes NASA API structures
✅ Output uses exact database schema
✅ Output has correct enum values
✅ Output follows project patterns
❌ If fails: Add missing knowledge to Skill
```

#### Level 3: Context Independence Test
```bash
# Does it work WITHOUT additional context?
# Don't provide ANY context in the prompt

Use [skill-name] Skill:
"[Minimal prompt - 1 sentence]"

✅ Produces complete output
✅ No "I need more information" responses
✅ No generic placeholders (no "TODO", "configure", "customize")
❌ If fails: Embed more specific knowledge
```

#### Level 4: Production Quality Test
```bash
# Is the output production-ready?
Use [skill-name] Skill:
"[Complex real-world task]"

✅ Code compiles/runs without errors
✅ Follows best practices
✅ Includes error handling
✅ Has proper security
✅ Matches project style
❌ If fails: Improve Skill instructions
```

### Common Pitfalls to Avoid

#### ❌ Pitfall 1: Vague Knowledge
```
BAD: "Password should be strong"
GOOD: "Password: min 8 chars, uppercase, lowercase, number, special char, regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/"
```

#### ❌ Pitfall 2: Missing Exact Values
```
BAD: "JWT tokens should expire quickly"
GOOD: "JWT access token: 15 minutes ('15m'), refresh token: 7 days ('7d')"
```

#### ❌ Pitfall 3: Generic Examples
```
BAD: "Test with sample data"
GOOD: "Test with: {email: 'test@example.com', password: 'Test123!@#', role: 'user'}"
```

#### ❌ Pitfall 4: Incomplete Patterns
```
BAD: "Use pagination"
GOOD: "Pagination: {page: 1, limit: 20}, return {items: [...], pagination: {total, page, limit, totalPages}}"
```

#### ❌ Pitfall 5: No Error Cases
```
BAD: "Implement login"
GOOD: "Implement login with error handling: InvalidCredentialsError (401), AccountLockedError (403), ValidationError (400)"
```

### Debugging Skills That Don't Work

**Problem**: Skill doesn't activate
```bash
# Check: Does SKILL.md exist?
ls -la .claude/skills/[skill-name]/

# Check: Is YAML frontmatter correct?
head -10 .claude/skills/[skill-name]/SKILL.md

# Fix: Recreate with correct format
```

**Problem**: Skill produces generic output
```bash
# Check: Does description mention NASA portal?
cat .claude/skills/[skill-name]/SKILL.md | head -5

# Fix: Add NASA-specific trigger words to description
Use skill-creator Skill:
"Update [skill-name] description to include 'NASA System 6 Portal' and specific use cases"
```

**Problem**: Skill asks for context
```bash
# Check: Is knowledge embedded or just referenced?
grep -n "exact" .claude/skills/[skill-name]/SKILL.md

# Fix: Replace references with actual values
Use skill-creator Skill:
"Update [skill-name] to include exact values for [knowledge area] instead of referencing them"
```

### Measuring ROI and Effectiveness

Track each Skill's impact:

```markdown
## Skill Performance Tracker

### nasa-portal-test-generator
**Created**: Nov 14, 2025
**Investment**: 75 minutes

**Usage Log**:
1. Phase 0 - NeoWsApp tests (saved 30 min)
2. Phase 2 - authService tests (saved 45 min)
3. Phase 3 - favoritesService tests (saved 40 min)
...

**Total Savings**: 4.5 hours
**ROI**: 3.6x (270 min saved / 75 min invested)
**Status**: Highly effective ✅
```

---

## 7. QUICK REFERENCE

### Command Cheat Sheet

```bash
# CREATE NEW SKILL
Use skill-creator Skill:
"Create [skill-name] Skill with embedded knowledge of..."

# UPDATE EXISTING SKILL
Use skill-creator Skill:
"Update [skill-name] to include [additional knowledge]"

# USE A SKILL
Use [skill-name] Skill:
"[Task description]"

# LIST ALL SKILLS
ls -la .claude/skills/

# VIEW SKILL CONTENTS
cat .claude/skills/[skill-name]/SKILL.md

# TEST SKILL
Use [skill-name] Skill:
"[Minimal test prompt]"
```

### Skill Naming Conventions

```
Pattern: nasa-portal-[purpose]

Examples:
✅ nasa-portal-test-generator
✅ nasa-portal-backend-architect
✅ nasa-portal-database-designer

❌ NasaTestGenerator (not camelCase)
❌ test_generator (not underscore)
❌ nasa-tests (not specific enough)
```

### Tool Usage Patterns

```yaml
# Specify exactly which tools the Skill should use

Read-only Skills:
Tools: Read, Grep, Glob

Generation Skills:
Tools: Read, Write, Bash

Modification Skills:
Tools: Read, Edit, Bash

Comprehensive Skills:
Tools: Read, Write, Edit, Bash, Grep
```

### Troubleshooting Guide

| Problem | Cause | Solution |
|---------|-------|----------|
| Skill not found | Missing SKILL.md | Recreate Skill |
| Generic output | Knowledge not embedded | Add exact values |
| Asks for context | Incomplete specification | Embed more details |
| Wrong patterns | Outdated knowledge | Update Skill |
| Inconsistent results | Vague instructions | Add specific examples |

---

## APPENDIX: SUCCESS METRICS

### Phase 0 (Current)
- [ ] nasa-portal-test-generator created
- [ ] Tested on NeoWsApp
- [ ] Saves 20-30 minutes
- [ ] Ready for Phase 2, 3, 4

### After Week 1 (Tier 1 Complete)
- [ ] 5 Skills created
- [ ] 7 hours invested
- [ ] 16-30 hours savings potential
- [ ] Ready for Phases 1-3

### After Week 2 (Tier 1 + 2 Complete)
- [ ] 8 Skills created
- [ ] 9.5 hours invested
- [ ] 23-44 hours savings potential
- [ ] Ready for all phases

### Project Completion
- [ ] 15 Skills created
- [ ] 9-13 hours total investment
- [ ] 37-75 hours actual savings
- [ ] 2.8-8.3x ROI achieved
- [ ] 40-60% time reduction
- [ ] All phases completed faster

---

## FINAL CHECKLIST

Before starting Skill creation:
- [ ] Read this entire guide
- [ ] Review SKILLS_STRATEGY.md
- [ ] Review SKILLS_IMPLEMENTATION_PLAN.md
- [ ] Review relevant PHASE_ documentation
- [ ] Understand project context
- [ ] Have exact values ready (no TBD)

When creating each Skill:
- [ ] Follow Step-by-Step Protocol (Section 4)
- [ ] Use specification template
- [ ] Include 5-8 knowledge areas
- [ ] Provide exact values
- [ ] Define clear triggers
- [ ] Specify tools needed
- [ ] Test with minimal prompt
- [ ] Verify production quality
- [ ] Document in tracker

After creating Skills:
- [ ] Track usage and savings
- [ ] Update ROI calculations
- [ ] Iterate based on feedback
- [ ] Share learnings
- [ ] Maintain Skills as project evolves

---

**Document Version**: 1.0
**Status**: Ready for Use
**Next Action**: Create nasa-portal-test-generator (60-90 min)
**Expected Result**: 4-7 hours saved across project

**THE END** 🚀

*This guide is your complete reference for creating hyper-specific Skills that will accelerate the NASA System 6 Portal project by 40-60%. Follow it precisely for maximum impact.*
