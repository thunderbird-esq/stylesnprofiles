# PHASE 3: USER RESOURCES - NASA System 6 Portal

**Status**: 📋 READY - Awaiting Phase 2 Completion
**Priority**: P1 - Core User Features
**Estimated Time**: 36-48 hours (Week 4-5)
**Created**: November 14, 2025
**Target Completion**: Week 4-5 of Implementation

---

## 🎯 Executive Summary

Phase 3 implements user-specific features enabling:
1. **Favorites System** - Users can save NASA items
2. **Collections Management** - Users can organize favorites
3. **CRUD Operations** - Complete create, read, update, delete
4. **Database Persistence** - All data stored in PostgreSQL
5. **UI Integration** - System 6 styled components

**Why This Matters**:
- Enables personalization and data organization
- Users can build their own NASA archives
- Foundation for advanced features (sharing, recommendations)
- Core value proposition of the application

**Prerequisites**:
- ✅ Phase 0 complete (critical fixes)
- ✅ Phase 1 complete (database tables exist)
- ✅ Phase 2 complete (authentication working)

**Success Criteria**:
Users can save favorites → create collections → organize items → view their saved data

---

## 📊 Phase 3 Task Inventory

### Task Matrix

| ID | Task | Focus | Hours | Week | Priority |
|---|---|---|---|---|---|
| 3.1 | Favorites Service | Backend Core | 8-10 | 4 | P1 |
| 3.2 | Favorites API | REST Endpoints | 4-6 | 4 | P1 |
| 3.3 | Favorites UI | Frontend | 6-8 | 4 | P1 |
| 3.4 | Collections Service | Backend Core | 8-10 | 5 | P1 |
| 3.5 | Collections API | REST Endpoints | 4-6 | 5 | P1 |
| 3.6 | Collections UI | Frontend | 6-8 | 5 | P1 |
| 3.7 | Integration Testing | Validation | 2-3 | 5 | P1 |

**Total Tasks**: 7 major tasks
**Total Time**: 36-48 hours
**Structure**: Week 4 (Favorites), Week 5 (Collections)

---

## 📋 Phase 3 Master Checklist

### Week 4: Favorites Implementation (18-24 hours)

- [ ] **Task 3.1**: Favorites Service (8-10 hours)
  - [ ] Create favoritesService.js
  - [ ] Implement getFavorites with pagination
  - [ ] Implement addToFavorites
  - [ ] Implement removeFromFavorites
  - [ ] Add filtering by type
  - [ ] Write unit tests

- [ ] **Task 3.2**: Favorites API (4-6 hours)
  - [ ] GET /api/v1/users/favorites
  - [ ] POST /api/v1/users/favorites
  - [ ] DELETE /api/v1/users/favorites/:id
  - [ ] Add pagination support
  - [ ] Add filtering support

- [ ] **Task 3.3**: Favorites UI (6-8 hours)
  - [ ] Create FavoritesPanel component
  - [ ] Add "Save" buttons in apps
  - [ ] Display saved favorites
  - [ ] Implement remove functionality
  - [ ] Add loading/error states

### Week 5: Collections Implementation (18-24 hours)

- [ ] **Task 3.4**: Collections Service (8-10 hours)
  - [ ] Create collectionsService.js
  - [ ] Implement getCollections
  - [ ] Implement createCollection
  - [ ] Implement getCollectionItems
  - [ ] Implement addItemToCollection
  - [ ] Write unit tests

- [ ] **Task 3.5**: Collections API (4-6 hours)
  - [ ] GET /api/v1/users/collections
  - [ ] POST /api/v1/users/collections
  - [ ] GET /api/v1/users/collections/:id
  - [ ] POST /api/v1/users/collections/:id/items
  - [ ] DELETE /api/v1/users/collections/:id

- [ ] **Task 3.6**: Collections UI (6-8 hours)
  - [ ] Create CollectionsManager component
  - [ ] Add "Create Collection" dialog
  - [ ] Add "Add to Collection" dropdown
  - [ ] Display collection details
  - [ ] Implement edit/delete

- [ ] **Task 3.7**: Integration Testing (2-3 hours)
  - [ ] Test complete favorites workflow
  - [ ] Test complete collections workflow
  - [ ] Verify database persistence
  - [ ] Test error scenarios

---

## 🔖 Task 3.1: Favorites Service Creation

### Purpose

Create service layer for managing user favorites with full CRUD operations.

### Complete Implementation

```javascript
// server/services/favoritesService.js

const db = require('../db');

/**
 * Get user's favorites with pagination and filtering
 * @param {number} userId - User ID
 * @param {object} options - Query options (page, limit, type, archived)
 * @returns {Promise<object>} Paginated favorites
 */
async function getFavorites(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    archived = false
  } = options;

  const offset = (page - 1) * limit;

  // Build query
  let query = `
    SELECT id, user_id, item_type, item_id, item_date,
           item_data, user_note, user_tags, is_favorite,
           is_archived, created_at, updated_at
    FROM favorites
    WHERE user_id = $1 AND is_archived = $2
  `;

  const params = [userId, archived];
  let paramIndex = 3;

  // Add type filter if specified
  if (type) {
    query += ` AND item_type = $${paramIndex}`;
    params.push(type);
    paramIndex++;
  }

  // Add ordering and pagination
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  // Execute query
  const result = await db.query(query, params);

  // Get total count
  let countQuery = `
    SELECT COUNT(*) as total
    FROM favorites
    WHERE user_id = $1 AND is_archived = $2
  `;
  const countParams = [userId, archived];

  if (type) {
    countQuery += ' AND item_type = $3';
    countParams.push(type);
  }

  const countResult = await db.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].total);

  return {
    favorites: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}

/**
 * Add item to favorites
 * @param {number} userId - User ID
 * @param {object} itemData - Item to save
 * @returns {Promise<object>} Created favorite
 */
async function addToFavorites(userId, itemData) {
  const {
    itemType,
    itemId,
    itemDate,
    data,
    userNote = null,
    userTags = []
  } = itemData;

  // Validate required fields
  if (!itemType || !itemId || !data) {
    throw new Error('itemType, itemId, and data are required');
  }

  // Check if already exists
  const existing = await db.query(
    'SELECT id FROM favorites WHERE user_id = $1 AND item_type = $2 AND item_id = $3',
    [userId, itemType, itemId]
  );

  if (existing.rows.length > 0) {
    throw new Error('Item already in favorites');
  }

  // Insert favorite
  const result = await db.query(
    `INSERT INTO favorites (
      user_id, item_type, item_id, item_date,
      item_data, user_note, user_tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *`,
    [userId, itemType, itemId, itemDate, JSON.stringify(data), userNote, userTags]
  );

  return result.rows[0];
}

/**
 * Remove favorite
 * @param {number} userId - User ID
 * @param {number} favoriteId - Favorite ID
 * @returns {Promise<void>}
 */
async function removeFromFavorites(userId, favoriteId) {
  const result = await db.query(
    'DELETE FROM favorites WHERE id = $1 AND user_id = $2 RETURNING id',
    [favoriteId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Favorite not found');
  }
}

/**
 * Update favorite note and tags
 * @param {number} userId - User ID
 * @param {number} favoriteId - Favorite ID
 * @param {object} updates - Updates (userNote, userTags)
 * @returns {Promise<object>} Updated favorite
 */
async function updateFavorite(userId, favoriteId, updates) {
  const { userNote, userTags } = updates;

  const result = await db.query(
    `UPDATE favorites
     SET user_note = COALESCE($1, user_note),
         user_tags = COALESCE($2, user_tags),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $3 AND user_id = $4
     RETURNING *`,
    [userNote, userTags, favoriteId, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('Favorite not found');
  }

  return result.rows[0];
}

module.exports = {
  getFavorites,
  addToFavorites,
  removeFromFavorites,
  updateFavorite
};
```

### Success Criteria

- [x] ✅ favoritesService.js created
- [x] ✅ Pagination implemented
- [x] ✅ Filtering by type works
- [x] ✅ CRUD operations complete
- [x] ✅ Unit tests passing

### Estimated Time
⏱️ **8-10 hours**

---

## 🌐 Task 3.2: Favorites API Endpoints

### Complete API Routes

```javascript
// server/routes/favorites.js

const express = require('express');
const router = express.Router();
const favoritesService = require('../services/favoritesService');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/v1/users/favorites
 * Get user's favorites with pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { page, limit, type, archived } = req.query;

    const result = await favoritesService.getFavorites(userId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      type,
      archived: archived === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/users/favorites
 * Add item to favorites
 */
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const favorite = await favoritesService.addToFavorites(userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: { favorite }
    });
  } catch (error) {
    if (error.message.includes('already in favorites')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/v1/users/favorites/:id
 * Remove from favorites
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const favoriteId = parseInt(req.params.id);

    await favoritesService.removeFromFavorites(userId, favoriteId);

    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

module.exports = router;
```

### Estimated Time
⏱️ **4-6 hours**

---

## 💻 Task 3.3: Favorites UI Components

### FavoritesPanel Component

```jsx
// client/src/components/FavoritesPanel.js

import React, { useState, useEffect } from 'react';
import authService from '../services/auth';

function FavoritesPanel({ onClose }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      setLoading(true);
      const token = authService.getAccessToken();

      const response = await fetch('http://localhost:3001/api/v1/users/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setFavorites(data.data.favorites);
      }
    } catch (err) {
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(id) {
    try {
      const token = authService.getAccessToken();

      await fetch(`http://localhost:3001/api/v1/users/favorites/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Remove from local state
      setFavorites(favorites.filter(f => f.id !== id));
    } catch (err) {
      setError('Failed to remove favorite');
    }
  }

  if (loading) return <div>Loading favorites...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="favorites-panel system6-window">
      <div className="system6-window-title">
        My Favorites
        <button onClick={onClose}>×</button>
      </div>
      <div className="system6-window-content">
        {favorites.length === 0 ? (
          <p>No favorites yet. Start saving items!</p>
        ) : (
          <ul>
            {favorites.map(fav => (
              <li key={fav.id}>
                <strong>{fav.item_type}</strong>: {fav.item_data.title}
                <button onClick={() => removeFavorite(fav.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FavoritesPanel;
```

### Estimated Time
⏱️ **6-8 hours**

---

## 📦 Task 3.4: Collections Service

### Complete Collections Service

```javascript
// server/services/collectionsService.js

const db = require('../db');

/**
 * Get user's collections
 */
async function getCollections(userId) {
  const result = await db.query(
    `SELECT id, user_id, name, description, color, icon,
            is_public, item_count, created_at
     FROM collections
     WHERE user_id = $1 AND is_archived = FALSE
     ORDER BY sort_order, created_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Create new collection
 */
async function createCollection(userId, collectionData) {
  const { name, description, color, icon, isPublic = false } = collectionData;

  if (!name) {
    throw new Error('Collection name is required');
  }

  const result = await db.query(
    `INSERT INTO collections (user_id, name, description, color, icon, is_public)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, name, description, color, icon, isPublic]
  );

  return result.rows[0];
}

/**
 * Get collection with items
 */
async function getCollectionItems(userId, collectionId) {
  // Verify ownership
  const collection = await db.query(
    'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId]
  );

  if (collection.rows.length === 0) {
    throw new Error('Collection not found');
  }

  // Get items
  const items = await db.query(
    `SELECT ci.id as collection_item_id, ci.sort_order,
            f.id as favorite_id, f.item_type, f.item_id, f.item_data
     FROM collection_items ci
     JOIN favorites f ON ci.favorite_id = f.id
     WHERE ci.collection_id = $1
     ORDER BY ci.sort_order, ci.added_at`,
    [collectionId]
  );

  return {
    collection: collection.rows[0],
    items: items.rows
  };
}

/**
 * Add item to collection
 */
async function addItemToCollection(userId, collectionId, favoriteId) {
  // Verify collection ownership
  const collection = await db.query(
    'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
    [collectionId, userId]
  );

  if (collection.rows.length === 0) {
    throw new Error('Collection not found');
  }

  // Verify favorite ownership
  const favorite = await db.query(
    'SELECT id FROM favorites WHERE id = $1 AND user_id = $2',
    [favoriteId, userId]
  );

  if (favorite.rows.length === 0) {
    throw new Error('Favorite not found');
  }

  // Add to collection
  const result = await db.query(
    `INSERT INTO collection_items (collection_id, favorite_id)
     VALUES ($1, $2)
     ON CONFLICT (collection_id, favorite_id) DO NOTHING
     RETURNING *`,
    [collectionId, favoriteId]
  );

  return result.rows[0];
}

module.exports = {
  getCollections,
  createCollection,
  getCollectionItems,
  addItemToCollection
};
```

### Estimated Time
⏱️ **8-10 hours**

---

## 🎉 Phase 3 Completion

### Success Criteria

- [x] ✅ Users can save favorites
- [x] ✅ Users can create collections
- [x] ✅ Collections can contain favorites
- [x] ✅ All CRUD operations working
- [x] ✅ UI fully functional
- [x] ✅ Database persistence verified
- [x] ✅ Tests passing

### Git Commit

```bash
git commit -m "feat: Implement user resources (Phase 3)

FAVORITES:
- Created favoritesService with full CRUD
- Implemented API endpoints with pagination
- Added FavoritesPanel UI component
- Users can save/remove NASA items
- Filtering by type supported

COLLECTIONS:
- Created collectionsService
- Implemented collections API
- Added CollectionsManager UI
- Users can create and organize collections
- Many-to-many relationship with favorites

DATABASE:
- All operations persist to PostgreSQL
- Triggers update item_count automatically
- Full referential integrity

UI:
- System 6 styled components
- Save buttons in all NASA apps
- Display saved items and collections
- Loading and error states

Ready for Phase 4: Testing & Quality

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

**Document Version**: 1.0
**Estimated Time**: 36-48 hours
**Status**: Implementation Guide
