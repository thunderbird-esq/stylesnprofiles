const { pool } = require('../db');
const crypto = require('crypto');

/**
 * Simple in-memory cache implementation (in production, use Redis)
 */
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + (ttlSeconds * 1000));
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    const expiry = this.ttl.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now > expiry) {
        this.delete(key);
      }
    }
  }

  key(prefix, ...parts) {
    const key = `${prefix}:${parts.join(':')}`;
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
  }
}

const cache = new SimpleCache();

class CollectionsServiceOptimized {
  constructor() {
    this.cache = cache;
    this.defaultCacheTTL = 300; // 5 minutes
    this.publicCacheTTL = 600; // 10 minutes for public data
  }

  /**
   * Generate cache key for collections query
   */
  getCollectionsCacheKey(userId, options) {
    const keyParts = [
      userId,
      options.page || 1,
      options.limit || 20,
      options.includePublic ? 'include_public' : 'private_only',
    ];
    return this.cache.key('collections', ...keyParts);
  }

  /**
   * Generate cache key for collection items
   */
  getCollectionItemsCacheKey(collectionId, options) {
    const keyParts = [
      collectionId,
      options.page || 1,
      options.limit || 20,
      options.sortBy || 'position',
    ];
    return this.cache.key('collection_items', ...keyParts);
  }

  /**
   * Invalidate collection-related cache
   */
  invalidateCollectionCache(userId) {
    for (const key of this.cache.cache.keys()) {
      if (key.includes(userId) || key.includes('public_collections')) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get collections with optimized query and caching
   */
  async getCollections(userId, { page = 1, limit = 20, includePublic = false } = {}) {
    // Validate input
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    const cacheKey = this.getCollectionsCacheKey(userId, { page, limit, includePublic });
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;

      // Optimized query using the existing efficient structure
      let whereClause = 'WHERE c.user_id = $1';
      const queryParams = [userId];
      const paramIndex = 2;

      if (includePublic) {
        whereClause += ' OR (c.is_public = true AND c.user_id != $1)';
      }

      const query = `
        SELECT
          c.*,
          COUNT(ci.id)::int as item_count,
          u.username as owner_username,
          u.display_name as owner_display_name,
          CASE WHEN c.user_id = $1 THEN true ELSE false END as is_owner,
          -- Pre-calculate additional metadata for performance
          (SELECT MAX(ci.added_at) FROM collection_items ci WHERE ci.collection_id = c.id) as last_item_added,
          (SELECT COUNT(DISTINCT si.type)
             FROM collection_items ci
             JOIN saved_items si ON ci.item_id = si.id
             WHERE ci.collection_id = c.id) as unique_item_types
        FROM collections c
        LEFT JOIN collection_items ci ON c.id = ci.collection_id
        LEFT JOIN users u ON c.user_id = u.id
        ${whereClause}
        GROUP BY c.id, u.username, u.display_name
        ORDER BY c.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Optimized count query
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM collections c
        ${whereClause}
      `;

      queryParams.push(limit, offset);
      const countParams = queryParams.slice(0, -2);

      const [collectionsResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, countParams),
      ]);

      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);

      const response = {
        collections: collectionsResult.rows.map(row => ({
          ...row,
          item_count: parseInt(row.item_count) || 0,
          is_owner: row.is_owner,
          unique_item_types: parseInt(row.unique_item_types) || 0,
          last_item_added: row.last_item_added,
        })),
        pagination: {
          total: totalItems,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      // Cache with appropriate TTL
      const cacheTTL = includePublic ? this.publicCacheTTL : this.defaultCacheTTL;
      this.cache.set(cacheKey, response, cacheTTL);

      return response;
    } finally {
      client.release();
    }
  }

  /**
   * Get collection by ID with optimized query
   */
  async getCollectionById(userId, collectionId) {
    const cacheKey = this.cache.key('collection', userId, collectionId);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      const query = `
        SELECT
          c.*,
          COUNT(ci.id)::int as item_count,
          u.username as owner_username,
          u.display_name as owner_display_name,
          CASE WHEN c.user_id = $1 THEN true ELSE false END as is_owner,
          (SELECT MAX(ci.added_at) FROM collection_items ci WHERE ci.collection_id = c.id) as last_item_added,
          (SELECT COUNT(DISTINCT si.type)
             FROM collection_items ci
             JOIN saved_items si ON ci.item_id = si.id
             WHERE ci.collection_id = c.id) as unique_item_types
        FROM collections c
        LEFT JOIN collection_items ci ON c.id = ci.collection_id
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $2 AND (c.user_id = $1 OR c.is_public = true)
        GROUP BY c.id, u.username, u.display_name
      `;

      const result = await client.query(query, [userId, collectionId]);

      if (!result.rows[0]) {
        return null;
      }

      const row = result.rows[0];
      const collection = {
        ...row,
        item_count: parseInt(row.item_count) || 0,
        is_owner: row.is_owner,
        unique_item_types: parseInt(row.unique_item_types) || 0,
        last_item_added: row.last_item_added,
      };

      // Cache the result
      this.cache.set(cacheKey, collection, this.defaultCacheTTL);

      return collection;
    } finally {
      client.release();
    }
  }

  /**
   * Create collection with cache invalidation
   */
  async createCollection(userId, { name, description, isPublic }) {
    const client = await pool.connect();
    try {
      // Validate input
      if (!name || name.trim().length === 0) {
        throw new Error('Collection name is required');
      }
      if (name.length > 100) {
        throw new Error('Collection name must be 100 characters or less');
      }
      if (description && description.length > 500) {
        throw new Error('Collection description must be 500 characters or less');
      }

      await client.query('BEGIN');

      // Check if user already has a collection with this name
      const existingResult = await client.query(
        'SELECT id FROM collections WHERE user_id = $1 AND name = $2',
        [userId, name.trim()],
      );

      if (existingResult.rows.length > 0) {
        await client.query('ROLLBACK');
        throw new Error('You already have a collection with this name');
      }

      const query = `
        INSERT INTO collections (user_id, name, description, is_public)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const values = [
        userId,
        name.trim(),
        description?.trim() || null,
        isPublic || false,
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      const collection = {
        ...result.rows[0],
        item_count: 0,
        is_owner: true,
        unique_item_types: 0,
        last_item_added: null,
      };

      // Invalidate cache
      this.invalidateCollectionCache(userId);

      return collection;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update collection with cache invalidation
   */
  async updateCollection(userId, collectionId, data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify ownership
      const ownershipResult = await client.query(
        'SELECT id, name FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, userId],
      );

      if (!ownershipResult.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      const { name, description, isPublic } = data;
      const updates = [];
      const values = [collectionId, userId];
      let paramIndex = 3;

      if (name !== undefined) {
        if (!name || name.trim().length === 0) {
          throw new Error('Collection name cannot be empty');
        }
        if (name.length > 100) {
          throw new Error('Collection name must be 100 characters or less');
        }

        // Check for name conflicts
        const conflictResult = await client.query(
          'SELECT id FROM collections WHERE user_id = $1 AND name = $2 AND id != $3',
          [userId, name.trim(), collectionId],
        );

        if (conflictResult.rows.length > 0) {
          await client.query('ROLLBACK');
          throw new Error('You already have another collection with this name');
        }

        updates.push(`name = $${paramIndex}`);
        values.push(name.trim());
        paramIndex++;
      }

      if (description !== undefined) {
        if (description && description.length > 500) {
          throw new Error('Collection description must be 500 characters or less');
        }
        updates.push(`description = $${paramIndex}`);
        values.push(description?.trim() || null);
        paramIndex++;
      }

      if (isPublic !== undefined) {
        updates.push(`is_public = $${paramIndex}`);
        values.push(isPublic);
        paramIndex++;
      }

      if (updates.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('No valid update fields provided');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE collections
        SET ${updates.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      // Invalidate all related cache
      this.invalidateCollectionCache(userId);

      // Get updated item count
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM collection_items WHERE collection_id = $1',
        [collectionId],
      );

      return {
        ...result.rows[0],
        item_count: parseInt(countResult.rows[0].count) || 0,
        is_owner: true,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete collection with cache invalidation
   */
  async deleteCollection(userId, collectionId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id, name',
        [collectionId, userId],
      );

      if (result.rowCount > 0) {
        // Invalidate cache
        this.invalidateCollectionCache(userId);
      }

      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Add item to collection with optimized position handling
   */
  async addItemToCollection(collectionId, favoriteId, { position = null, notes = null } = {}) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify collection exists (more efficient query)
      const collectionResult = await client.query(
        'SELECT user_id, is_public FROM collections WHERE id = $1',
        [collectionId],
      );

      if (!collectionResult.rows[0]) {
        throw new Error('Collection not found');
      }

      // Verify item exists (optimized query with index)
      const itemResult = await client.query(
        'SELECT user_id, title FROM saved_items WHERE id = $1 AND is_archived = false',
        [favoriteId],
      );

      if (!itemResult.rows[0]) {
        throw new Error('Item not found or is archived');
      }

      // Check for duplicates (optimized query)
      const existingResult = await client.query(
        'SELECT id FROM collection_items WHERE collection_id = $1 AND item_id = $2',
        [collectionId, favoriteId],
      );

      if (existingResult.rows.length > 0) {
        throw new Error('Item already in collection');
      }

      // Determine position efficiently
      let finalPosition = position;
      if (finalPosition === null) {
        const positionResult = await client.query(
          'SELECT COALESCE(MAX(position), 0) as max_position FROM collection_items WHERE collection_id = $1',
          [collectionId],
        );
        finalPosition = parseInt(positionResult.rows[0].max_position) + 1;
      }

      // Insert the item
      const insertQuery = `
        INSERT INTO collection_items (collection_id, item_id, position, notes)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;

      const insertResult = await client.query(insertQuery, [
        collectionId,
        favoriteId,
        finalPosition,
        notes,
      ]);

      // Update collection timestamp
      await client.query(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [collectionId],
      );

      await client.query('COMMIT');

      // Invalidate cache for the collection owner
      this.invalidateCollectionCache(collectionResult.rows[0].user_id);

      return {
        ...insertResult.rows[0],
        collection: {
          id: collectionId,
          user_id: collectionResult.rows[0].user_id,
          is_public: collectionResult.rows[0].is_public,
        },
        item: {
          id: favoriteId,
          title: itemResult.rows[0].title,
        },
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove item from collection with optimized reordering
   */
  async removeItemFromCollection(collectionId, favoriteId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get collection owner before removing for cache invalidation
      const ownerResult = await client.query(
        'SELECT user_id FROM collections WHERE id = $1',
        [collectionId],
      );

      if (!ownerResult.rows[0]) {
        await client.query('ROLLBACK');
        return false;
      }

      const userId = ownerResult.rows[0].user_id;

      // Remove the item and get the position for reordering
      const deleteResult = await client.query(
        'DELETE FROM collection_items WHERE collection_id = $1 AND item_id = $2 RETURNING id, position',
        [collectionId, favoriteId],
      );

      if (deleteResult.rowCount === 0) {
        await client.query('ROLLBACK');
        return false;
      }

      // Efficient reordering using window function
      const reorderQuery = `
        UPDATE collection_items
        SET position = new_position
        FROM (
          SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC, added_at ASC) - 1 as new_position
          FROM collection_items
          WHERE collection_id = $1
        ) AS ordered_items
        WHERE collection_items.id = ordered_items.id
      `;

      await client.query(reorderQuery, [collectionId]);

      // Update collection timestamp
      await client.query(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [collectionId],
      );

      await client.query('COMMIT');

      // Invalidate cache
      this.invalidateCollectionCache(userId);

      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get collection items using optimized function
   */
  async getCollectionItems(collectionId, { page = 1, limit = 20, sortBy = 'position' } = {}) {
    // Validate input
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    const cacheKey = this.getCollectionItemsCacheKey(collectionId, { page, limit, sortBy });
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Use optimized function from migration
      const query = 'SELECT * FROM get_collection_items_optimized($1, $2, $3, $4)';
      const itemsResult = await client.query(query, [collectionId, page, limit, sortBy]);

      // Get collection details efficiently
      const collectionQuery = `
        SELECT
          c.*,
          u.username as owner_username,
          u.display_name as owner_display_name
        FROM collections c
        LEFT JOIN users u ON c.user_id = u.id
        WHERE c.id = $1
      `;

      const collectionResult = await client.query(collectionQuery, [collectionId]);

      if (!collectionResult.rows[0]) {
        throw new Error('Collection not found');
      }

      // Get total count for pagination (cached separately)
      const countCacheKey = this.cache.key('collection_count', collectionId);
      let totalItems = this.cache.get(countCacheKey);

      if (!totalItems) {
        const countResult = await client.query(
          'SELECT COUNT(*) as total FROM collection_items ci ' +
          'JOIN saved_items si ON ci.item_id = si.id ' +
          'WHERE ci.collection_id = $1 AND si.is_archived = false',
          [collectionId],
        );
        totalItems = parseInt(countResult.rows[0].total);
        this.cache.set(countCacheKey, totalItems, this.defaultCacheTTL);
      }

      const totalPages = Math.ceil(totalItems / limit);

      const response = {
        collection: {
          ...collectionResult.rows[0],
          item_count: totalItems,
        },
        items: itemsResult.rows.map(row => ({
          id: row.item_id,
          type: row.type,
          title: row.title,
          url: row.url,
          hd_url: row.hd_url,
          category: row.category,
          description: row.description,
          copyright: row.copyright,
          date: row.date,
          saved_at: row.saved_at,
          user_note: row.user_note,
          user_tags: row.user_tags || [],
          is_favorite: row.is_favorite,
          position: row.position,
          collection_notes: row.collection_notes,
          added_to_collection_at: row.added_to_collection_at,
        })),
        pagination: {
          total: totalItems,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      // Cache the result
      this.cache.set(cacheKey, response, this.defaultCacheTTL);

      return response;
    } finally {
      client.release();
    }
  }

  /**
   * Batch reorder items with optimized single query
   */
  async reorderCollectionItems(userId, collectionId, itemOrders) {
    const client = await pool.connect();
    try {
      // Verify ownership
      const ownershipResult = await client.query(
        'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, userId],
      );

      if (!ownershipResult.rows[0]) {
        return false;
      }

      // Validate input
      if (!Array.isArray(itemOrders) || itemOrders.length === 0) {
        throw new Error('Item orders must be a non-empty array');
      }

      await client.query('BEGIN');

      // Create a temporary table for efficient bulk updates
      await client.query(`
        CREATE TEMPORARY TABLE temp_reorders (item_id TEXT, new_position INTEGER)
      `);

      // Insert all reorders into temp table
      for (const { itemId, position } of itemOrders) {
        if (!itemId || position === undefined || position < 0) {
          throw new Error('Invalid item order data');
        }
        await client.query(
          'INSERT INTO temp_reorders (item_id, new_position) VALUES ($1, $2)',
          [itemId, position],
        );
      }

      // Perform batch update
      await client.query(`
        UPDATE collection_items
        SET position = tr.new_position
        FROM temp_reorders tr
        WHERE collection_items.item_id = tr.item_id
        AND collection_items.collection_id = $1
      `, [collectionId]);

      // Drop temp table
      await client.query('DROP TABLE temp_reorders');

      // Update collection timestamp
      await client.query(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [collectionId],
      );

      await client.query('COMMIT');

      // Invalidate cache
      this.invalidateCollectionCache(userId);

      return true;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get collection statistics using optimized function
   */
  async getCollectionStats(userId) {
    const cacheKey = this.cache.key('collection_stats', userId);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Use optimized function from migration
      const query = 'SELECT * FROM get_collection_stats_optimized($1)';
      const result = await client.query(query, [userId]);
      const stats = result.rows[0];

      const response = {
        totalCollections: parseInt(stats.total_collections) || 0,
        publicCollections: parseInt(stats.public_collections) || 0,
        privateCollections: parseInt(stats.private_collections) || 0,
        totalItemsInCollections: parseInt(stats.total_items_in_collections) || 0,
        avgItemsPerCollection: parseFloat(stats.avg_items_per_collection) || 0,
        largestCollectionSize: parseInt(stats.largest_collection_size) || 0,
        // Additional derived metrics
        collectionDensity: stats.total_collections > 0
          ? (parseFloat(stats.avg_items_per_collection) || 0) / 10 * 100  // Percentage of "full" collections
          : 0,
      };

      // Cache with moderate TTL
      this.cache.set(cacheKey, response, this.defaultCacheTTL);

      return response;
    } finally {
      client.release();
    }
  }

  /**
   * Get public collections with optimized search and caching
   */
  async getPublicCollections({ page = 1, limit = 20, search = null } = {}) {
    // Validate input
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    const cacheKey = this.cache.key('public_collections', page, limit, search || 'none');
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      const offset = (page - 1) * limit;
      const queryParams = [];
      let whereClause = 'WHERE c.is_public = true';
      let paramIndex = 1;

      // Add search filter if specified
      if (search && search.trim().length > 0) {
        const searchTerms = search.trim().split(/\s+/).join(' & ');
        whereClause += ` AND (
          to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, ''))
          @@ to_tsquery('english', $${paramIndex})
        )`;
        queryParams.push(searchTerms);
        paramIndex++;
      }

      const query = `
        SELECT
          c.*,
          COUNT(ci.id)::int as item_count,
          u.username as owner_username,
          u.display_name as owner_display_name,
          CASE
            WHEN search IS NOT NULL THEN
              ts_rank(
                to_tsvector('english', COALESCE(c.name, '') || ' ' || COALESCE(c.description, '')),
                to_tsquery('english', $1)
              )
            ELSE 1.0
          END as relevance_score,
          -- Additional metrics for better public browsing
          (SELECT COUNT(DISTINCT si.type)
             FROM collection_items ci
             JOIN saved_items si ON ci.item_id = si.id
             WHERE ci.collection_id = c.id) as unique_item_types,
          (SELECT MAX(ci.added_at) FROM collection_items ci WHERE ci.collection_id = c.id) as last_item_added
        FROM collections c
        LEFT JOIN collection_items ci ON c.id = ci.collection_id
        LEFT JOIN users u ON c.user_id = u.id
        ${whereClause}
        GROUP BY c.id, u.username, u.display_name
        ORDER BY relevance_score DESC, c.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM collections c
        ${whereClause}
      `;

      queryParams.push(limit, offset);
      const countParams = queryParams.slice(0, -2);

      const [collectionsResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, countParams),
      ]);

      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);

      const response = {
        collections: collectionsResult.rows.map(row => ({
          ...row,
          item_count: parseInt(row.item_count) || 0,
          relevance_score: parseFloat(row.relevance_score) || 1.0,
          is_owner: false, // Always false for public collections
          unique_item_types: parseInt(row.unique_item_types) || 0,
          last_item_added: row.last_item_added,
        })),
        pagination: {
          total: totalItems,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };

      // Cache with longer TTL for public data
      this.cache.set(cacheKey, response, this.publicCacheTTL);

      return response;
    } finally {
      client.release();
    }
  }

  /**
   * Batch add items to a collection
   */
  async batchAddItemsToCollection(collectionId, itemIds, options = {}) {
    if (!Array.isArray(itemIds) || itemIds.length === 0) {
      throw new Error('Item IDs array is required');
    }

    if (itemIds.length > 50) {
      throw new Error('Maximum 50 items allowed per batch operation');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify collection exists
      const collectionResult = await client.query(
        'SELECT user_id, is_public FROM collections WHERE id = $1',
        [collectionId],
      );

      if (!collectionResult.rows[0]) {
        throw new Error('Collection not found');
      }

      // Verify all items exist and are not archived
      const itemsResult = await client.query(
        'SELECT id, title FROM saved_items WHERE id = ANY($1) AND is_archived = false',
        [itemIds],
      );

      if (itemsResult.rows.length !== itemIds.length) {
        throw new Error('Some items not found or are archived');
      }

      // Check for existing items
      const existingResult = await client.query(
        'SELECT item_id FROM collection_items WHERE collection_id = $1 AND item_id = ANY($2)',
        [collectionId, itemIds],
      );

      if (existingResult.rows.length > 0) {
        const existingIds = existingResult.rows.map(row => row.item_id);
        throw new Error(`Items already in collection: ${existingIds.join(', ')}`);
      }

      // Get next position for batch insert
      const positionResult = await client.query(
        'SELECT COALESCE(MAX(position), 0) as max_position FROM collection_items WHERE collection_id = $1',
        [collectionId],
      );

      const currentPos = parseInt(positionResult.rows[0].max_position);

      // Insert all items
      const insertPromises = itemIds.map((itemId, index) => {
        // const item = itemsResult.rows.find(row => row.id === itemId);
        return client.query(
          'INSERT INTO collection_items (collection_id, item_id, position, notes) VALUES ($1, $2, $3, $4) RETURNING *',
          [collectionId, itemId, currentPos + index + 1, options.notes],
        );
      });

      const results = await Promise.all(insertPromises);

      // Update collection timestamp
      await client.query(
        'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [collectionId],
      );

      await client.query('COMMIT');

      // Invalidate cache
      this.invalidateCollectionCache(collectionResult.rows[0].user_id);

      return {
        added: results.length,
        items: results.map(result => ({
          id: result.rows[0].item_id,
          position: result.rows[0].position,
        })),
      };

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CollectionsServiceOptimized();