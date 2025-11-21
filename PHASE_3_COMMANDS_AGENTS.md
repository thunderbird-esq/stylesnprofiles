# PHASE 3: USER RESOURCES - Commands & Agents Integration

**Phase Overview**: Implement favorites and collections CRUD operations
**Original Estimated Time**: 36-48 hours
**With Automation**: 25-35 hours
**Time Savings**: 10-14 hours (28-30% reduction)
**Automation Level**: Very High

---

## 🎯 Phase 3 Objectives

Phase 3 implements user resource management:
1. **Favorites Service** - CRUD operations for NASA data favorites
2. **Collections Service** - User collections with organization
3. **REST API Endpoints** - 8 endpoints for favorites + collections
4. **Client UI Components** - React components for resource management
5. **Integration Testing** - Comprehensive testing with real database

**Automation Strategy**: Use backend-architect for service design, database-optimizer for query optimization, and fullstack-developer for UI implementation.

---

## 🤖 Primary Agents for This Phase

### Agent 1: backend-architect (Time Savings: 3-4 hours)
**Purpose**: Design service layer and API architecture
**Usage**:
```
"Design favorites and collections services for Express.js:

FavoritesService (server/services/favoritesService.js):
- getFavorites(userId, {page, limit, type, archived}) - Paginated list
- getFavoriteById(userId, favoriteId)
- addFavorite(userId, {itemType, itemId, itemDate, data})
- updateFavorite(userId, favoriteId, {userNote, userTags, isFavorite})
- removeFavorite(userId, favoriteId) - Soft delete (is_archived)
- searchFavorites(userId, query)

CollectionsService (server/services/collectionsService.js):
- getCollections(userId, {page, limit})
- getCollectionById(userId, collectionId)
- createCollection(userId, {name, description, isPublic})
- updateCollection(userId, collectionId, data)
- deleteCollection(userId, collectionId)
- addItemToCollection(collectionId, favoriteId, position)
- removeItemFromCollection(collectionId, favoriteId)
- getCollectionItems(collectionId, {page, limit})

Use PostgreSQL with proper JOINs, no N+1 queries."
```

### Agent 2: database-optimizer (Time Savings: 2-3 hours)
**Purpose**: Optimize queries and indexes
**Usage**:
```
"Optimize database queries for favorites and collections:
1. Eliminate N+1 queries with proper JOINs
2. Add indexes for: (user_id, item_type), (user_id, is_archived), item_date
3. Use json_agg for collection items in single query
4. Optimize pagination with OFFSET/LIMIT
5. Add query result caching strategy
Provide optimized SQL for all operations."
```

### Agent 3: fullstack-developer (Time Savings: 4-5 hours)
**Purpose**: Implement React UI components
**Usage**:
```
"Create React components for favorites and collections:

Components needed:
1. FavoritesPanel.js - List favorites with filters
2. FavoriteCard.js - Display single favorite
3. CollectionsPanel.js - List collections
4. CollectionDetail.js - Show collection with items
5. CreateCollectionModal.js - Modal for new collection
6. AddToCollectionButton.js - Add favorite to collection

Features:
- System 6 styling (use existing system-css)
- Pagination controls
- Filter by type (apod, neo, resource)
- Search functionality
- Drag-and-drop for collection ordering
- Loading states and error handling

Use React hooks, context, modern patterns."
```

### Agent 4: test-automator (Time Savings: 3-4 hours)
**Purpose**: Generate comprehensive test suite
**Usage**:
```
"Create test suite for user resources:

Unit Tests:
- favoritesService.js methods
- collectionsService.js methods
- Input validation
- Error handling

Integration Tests:
- All 8 API endpoints with real database
- CRUD operations end-to-end
- Authentication enforcement
- Pagination logic

Coverage target: 85%+, no mocks."
```

---

## ⚡ Slash Commands

### /design-rest-api (Time Savings: 1-2 hours)
```bash
/design-rest-api favorites collections \
  --crud \
  --auth-required \
  --pagination
```
**Output**: Complete API endpoint specifications with routes, methods, auth requirements

### /optimize-database-performance (Time Savings: 1.5-2 hours)
```bash
/optimize-database-performance \
  --tables favorites,collections,collection_items \
  --focus queries
```
**Output**: Index recommendations, query optimizations, N+1 elimination

### /write-tests (Time Savings: 3-4 hours)
```bash
/write-tests server/services/favoritesService.js --unit --integration
/write-tests server/services/collectionsService.js --unit --integration
/write-tests server/routes/favorites.js --integration
```
**Output**: Comprehensive test suites with 85%+ coverage

---

## 🎯 Task Breakdown with Automation

### Task 3.1: Favorites Service (Manual: 8-10h → Automated: 5-6h)

**Automated Approach**:
1. Launch **backend-architect** for favoritesService design (1h)
2. Launch **database-optimizer** for query optimization (1h)
3. Manual: Implement service with agent guidance (2-3h)
4. Manual: Test with real database (1h)

**Generated favoritesService.js** (Key Methods):
```javascript
const db = require('../db');

async function getFavorites(userId, options = {}) {
  const { page = 1, limit = 20, type = null, archived = false } = options;
  const offset = (page - 1) * limit;

  let query = `
    SELECT id, user_id, item_type, item_id, item_date,
           item_data, user_note, user_tags, is_favorite, is_archived,
           created_at, updated_at
    FROM favorites
    WHERE user_id = $1 AND is_archived = $2
  `;

  const params = [userId, archived];

  if (type) {
    query += ` AND item_type = $3`;
    params.push(type);
  }

  query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // Get total count
  const countQuery = `SELECT COUNT(*) FROM favorites WHERE user_id = $1 AND is_archived = $2`;
  const countParams = [userId, archived];
  if (type) {
    countQuery += ` AND item_type = $3`;
    countParams.push(type);
  }
  const countResult = await db.query(countQuery, countParams);

  return {
    favorites: result.rows,
    pagination: {
      total: parseInt(countResult.rows[0].count),
      page,
      limit,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    }
  };
}

async function addFavorite(userId, favoriteData) {
  const { itemType, itemId, itemDate, data, userNote = null, userTags = [] } = favoriteData;

  // Check if already exists
  const existing = await db.query(
    'SELECT id FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
    [userId, itemType, itemId]
  );

  if (existing.rows.length > 0) {
    throw new Error('Item already in favorites');
  }

  const result = await db.query(
    `INSERT INTO favorites (user_id, item_type, item_id, item_date, item_data, user_note, user_tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, itemType, itemId, itemDate, JSON.stringify(data), userNote, userTags]
  );

  return result.rows[0];
}

module.exports = {
  getFavorites,
  getFavoriteById,
  addFavorite,
  updateFavorite,
  removeFavorite,
  searchFavorites
};
```

---

### Task 3.2: Collections Service (Manual: 10-12h → Automated: 7-8h)

**Automated Approach**:
1. Launch **backend-architect** for collectionsService (1h)
2. Launch **database-optimizer** for JOIN optimization (1h)
3. Manual: Implement with optimized queries (3-4h)
4. Manual: Test collection item management (2h)

**Key Optimization** - Get collection with items in single query:
```javascript
async function getCollectionWithItems(userId, collectionId) {
  const result = await db.query(`
    SELECT
      c.*,
      COALESCE(
        json_agg(
          json_build_object(
            'id', ci.id,
            'favoriteId', ci.favorite_id,
            'position', ci.position,
            'itemData', f.item_data,
            'itemType', f.item_type,
            'addedAt', ci.created_at
          ) ORDER BY ci.position
        ) FILTER (WHERE ci.id IS NOT NULL),
        '[]'
      ) as items
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    LEFT JOIN favorites f ON ci.favorite_id = f.id
    WHERE c.user_id = $1 AND c.id = $2
    GROUP BY c.id
  `, [userId, collectionId]);

  return result.rows[0] || null;
}
```

---

### Task 3.3: API Endpoints (Manual: 6-8h → Automated: 4-5h)

**Use /design-rest-api command**:
```bash
/design-rest-api favorites collections --crud --auth-required --pagination
```

**Generated Routes**:
```javascript
// Favorites endpoints
router.get('/favorites', authenticateToken, getFavoritesHandler);
router.get('/favorites/:id', authenticateToken, getFavoriteByIdHandler);
router.post('/favorites', authenticateToken, addFavoriteHandler);
router.patch('/favorites/:id', authenticateToken, updateFavoriteHandler);
router.delete('/favorites/:id', authenticateToken, removeFavoriteHandler);

// Collections endpoints
router.get('/collections', authenticateToken, getCollectionsHandler);
router.post('/collections', authenticateToken, createCollectionHandler);
router.get('/collections/:id', authenticateToken, getCollectionByIdHandler);
router.patch('/collections/:id', authenticateToken, updateCollectionHandler);
router.delete('/collections/:id', authenticateToken, deleteCollectionHandler);
router.post('/collections/:id/items', authenticateToken, addItemToCollectionHandler);
router.delete('/collections/:id/items/:itemId', authenticateToken, removeItemHandler);
```

---

### Task 3.4: Client UI (Manual: 10-12h → Automated: 7-8h)

**Use fullstack-developer agent**:
```
"Create React components for favorites management with System 6 styling"
```

**Generated Components**:
```javascript
// FavoritesPanel.js
function FavoritesPanel() {
  const [favorites, setFavorites] = useState([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, [page, filter]);

  async function loadFavorites() {
    setLoading(true);
    const response = await favoritesService.getFavorites({ page, type: filter });
    setFavorites(response.favorites);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="favorites-panel">
      <div className="favorites-header">
        <h2>My Favorites</h2>
        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="apod">APOD</option>
          <option value="neo">Near Earth Objects</option>
          <option value="resource">Resources</option>
        </select>
      </div>

      <div className="favorites-grid">
        {favorites.map(fav => (
          <FavoriteCard key={fav.id} favorite={fav} onUpdate={loadFavorites} />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={Math.ceil(favorites.length / 20)}
        onChange={setPage}
      />
    </div>
  );
}
```

---

### Task 3.5: Testing (Manual: 6-8h → Automated: 3-4h)

**Use /write-tests command**:
```bash
/write-tests server/services/favoritesService.js --unit --integration
/write-tests server/services/collectionsService.js --unit --integration
/test-coverage --threshold 85
```

**Generated Tests** (30-40 test cases):
```javascript
describe('FavoritesService', () => {
  describe('addFavorite', () => {
    it('should add favorite successfully', async () => {
      const favorite = await favoritesService.addFavorite(userId, {
        itemType: 'apod',
        itemId: '2024-01-01',
        itemDate: '2024-01-01',
        data: { title: 'Test', url: 'https://...' }
      });

      expect(favorite).toHaveProperty('id');
      expect(favorite.item_type).toBe('apod');
    });

    it('should prevent duplicate favorites', async () => {
      // First add
      await favoritesService.addFavorite(userId, {...});

      // Try to add again
      await expect(
        favoritesService.addFavorite(userId, {...})
      ).rejects.toThrow('Item already in favorites');
    });
  });
});
```

---

## ✅ Implementation Checklist

### Pre-Phase Setup
- [ ] Phase 2 complete (authentication working)
- [ ] Database tables exist (favorites, collections)
- [ ] Test user account created

### Favorites Service (5-6 hours)
- [ ] Launch backend-architect for design
- [ ] Implement getFavorites with pagination
- [ ] Implement addFavorite with duplicate check
- [ ] Implement updateFavorite
- [ ] Implement removeFavorite (soft delete)
- [ ] Test all methods with real data

### Collections Service (7-8 hours)
- [ ] Launch backend-architect for design
- [ ] Launch database-optimizer for JOIN queries
- [ ] Implement getCollections
- [ ] Implement createCollection
- [ ] Implement getCollectionWithItems (optimized)
- [ ] Implement addItemToCollection
- [ ] Implement removeItemFromCollection
- [ ] Test collection item management

### API Endpoints (4-5 hours)
- [ ] Use /design-rest-api command
- [ ] Create server/routes/favorites.js
- [ ] Create server/routes/collections.js
- [ ] Add authenticateToken middleware
- [ ] Add validation middleware
- [ ] Test all 8 endpoints with curl/Postman

### Client UI (7-8 hours)
- [ ] Launch fullstack-developer agent
- [ ] Create FavoritesPanel.js
- [ ] Create FavoriteCard.js
- [ ] Create CollectionsPanel.js
- [ ] Create CollectionDetail.js
- [ ] Create CreateCollectionModal.js
- [ ] Add System 6 styling
- [ ] Test user flows in browser

### Testing (3-4 hours)
- [ ] Use /write-tests for services
- [ ] Use /write-tests for routes
- [ ] Run all tests
- [ ] Check coverage (target: 85%+)
- [ ] Fix failing tests

---

## 📊 Time & Efficiency Comparison

| Task | Manual Time | Automated Time | Savings |
|------|-------------|----------------|---------|
| 3.1: Favorites Service | 8-10 hours | 5-6 hours | 3-4 hours |
| 3.2: Collections Service | 10-12 hours | 7-8 hours | 3-4 hours |
| 3.3: API Endpoints | 6-8 hours | 4-5 hours | 2-3 hours |
| 3.4: Client UI | 10-12 hours | 7-8 hours | 3-4 hours |
| 3.5: Testing | 6-8 hours | 3-4 hours | 3-4 hours |
| **Total Phase 3** | **36-48 hours** | **25-35 hours** | **10-14 hours** |

---

## 🚀 Quick Start Guide

```bash
# 1. Design services
# Launch backend-architect for both services

# 2. Optimize database
/optimize-database-performance --tables favorites,collections

# 3. Generate API endpoints
/design-rest-api favorites collections --crud

# 4. Implement client UI
# Launch fullstack-developer for React components

# 5. Generate tests
/write-tests server/services/favoritesService.js --unit --integration
/write-tests server/services/collectionsService.js --unit --integration

# 6. Verify coverage
/test-coverage --threshold 85

# 7. Test manually
npm test
npm start
```

---

## 📝 Success Criteria

Phase 3 is complete when:

- [x] favoritesService.js fully implemented
- [x] collectionsService.js fully implemented
- [x] 8 API endpoints working
- [x] Pagination implemented
- [x] No N+1 queries
- [x] Client UI components functional
- [x] System 6 styling applied
- [x] Tests pass (85%+ coverage)
- [x] Can add/remove favorites
- [x] Can create/manage collections
- [x] Git commit created

---

**Document Version**: 1.0
**Automation Level**: Very High (28-30% time savings)
**Recommended**: Fully automated approach with agent design + command execution
