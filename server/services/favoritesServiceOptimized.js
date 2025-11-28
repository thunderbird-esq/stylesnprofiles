const { pool } = require('../db');
const crypto = require('crypto');

/**
 * Redis-like cache interface implementation
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

  // Generate cache key
  key(prefix, ...parts) {
    const key = `${prefix}:${parts.join(':')}`;
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
  }
}

const cache = new SimpleCache();

class FavoritesServiceOptimized {
  constructor() {
    this.cache = cache;
    this.defaultCacheTTL = 300; // 5 minutes
  }

  /**
   * Generate cache key for favorites query
   */
  getFavoritesCacheKey(userId, options) {
    const keyParts = [
      userId,
      options.page || 1,
      options.limit || 20,
      options.type || 'all',
      options.archived ? 'archived' : 'active',
      options.tags ? JSON.stringify(options.tags.sort()) : 'none',
      options.sortBy || 'saved_at',
    ];
    return this.cache.key('favorites', ...keyParts);
  }

  /**
   * Generate cache key for search results
   */
  getSearchCacheKey(userId, query, options) {
    const keyParts = [
      userId,
      query.toLowerCase().trim(),
      options.page || 1,
      options.limit || 20,
      options.types ? JSON.stringify(options.types.sort()) : 'all',
      options.tags ? JSON.stringify(options.tags.sort()) : 'none',
    ];
    return this.cache.key('search', ...keyParts);
  }

  /**
   * Invalidate user-specific cache
   */
  invalidateUserCache(userId) {
    // In a real implementation, this would use Redis patterns
    // For now, we'll clear all favorites-related cache for this user
    for (const key of this.cache.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get favorites using optimized query with caching
   */
  async getFavorites(
    userId,
    { page = 1, limit = 20, type = null, archived = false, tags = null, sortBy = 'saved_at' } = {},
  ) {
    // Validate input
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    // Check cache first
    const cacheKey = this.getFavoritesCacheKey(userId, { page, limit, type, archived, tags, sortBy });
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Use optimized function
      const query = 'SELECT * FROM get_user_favorites_optimized($1, $2, $3, $4, $5, $6, $7)';
      const values = [userId, page, limit, type, archived, tags, sortBy];

      const result = await client.query(query, values);

      // Get total count for pagination (cached separately)
      const countCacheKey = this.cache.key('count', userId, type, archived, tags ? JSON.stringify(tags) : 'none');
      let totalCount = this.cache.get(countCacheKey);

      if (!totalCount) {
        const countQuery = `
          SELECT COUNT(*) as total
          FROM saved_items
          WHERE user_id = $1
          AND ($2 OR is_archived = false)
          AND ($3::TEXT IS NULL OR type = $3)
          AND ($4 IS NULL OR user_tags && $4)
        `;
        const countResult = await client.query(countQuery, [userId, archived, type, tags]);
        totalCount = parseInt(countResult.rows[0].total);
        this.cache.set(countCacheKey, totalCount, this.defaultCacheTTL);
      }

      const totalPages = Math.ceil(totalCount / limit);

      const response = {
        favorites: result.rows.map(row => ({
          id: row.id,
          user_id: row.user_id,
          type: row.type,
          title: row.title,
          url: row.url,
          hd_url: row.hd_url,
          media_type: row.media_type,
          category: row.category,
          description: row.description,
          copyright: row.copyright,
          date: row.date,
          service_version: row.service_version,
          saved_at: row.saved_at,
          created_at: row.created_at,
          updated_at: row.updated_at,
          metadata: row.metadata,
          is_archived: row.is_archived,
          user_note: row.user_note,
          user_tags: row.user_tags || [],
          is_favorite: row.is_favorite,
          collection_count: parseInt(row.collection_count) || 0,
          collection_names: row.collection_names || [],
          relevance_score: parseFloat(row.relevance_score) || 0,
        })),
        pagination: {
          total: totalCount,
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
   * Get a specific favorite with optimized query
   */
  async getFavoriteById(userId, favoriteId) {
    const cacheKey = this.cache.key('favorite', userId, favoriteId);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Optimized query with pre-joined collection data
      const query = `
        SELECT
          si.*,
          COALESCE(collection_data.collection_count, 0) as collection_count,
          COALESCE(collection_data.collection_names, '{}') as collection_names
        FROM saved_items si
        LEFT JOIN (
          SELECT
            ci.item_id,
            COUNT(DISTINCT ci.collection_id) as collection_count,
            ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as collection_names
          FROM collection_items ci
          JOIN collections c ON ci.collection_id = c.id
          WHERE c.user_id = $1 OR c.is_public = true
          GROUP BY ci.item_id
        ) collection_data ON si.id = collection_data.item_id
        WHERE si.user_id = $1 AND si.id = $2
      `;

      const result = await client.query(query, [userId, favoriteId]);

      if (!result.rows[0]) {
        return null;
      }

      const row = result.rows[0];
      const favorite = {
        ...row,
        collection_count: parseInt(row.collection_count) || 0,
        collection_names: row.collection_names || [],
      };

      // Cache the result
      this.cache.set(cacheKey, favorite, this.defaultCacheTTL);

      return favorite;
    } finally {
      client.release();
    }
  }

  /**
   * Add a favorite with cache invalidation
   */
  async addFavorite(userId, { itemType, itemId, itemDate, data }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Validate required fields
      if (!itemType || !itemId) {
        throw new Error('itemType and itemId are required');
      }

      const validTypes = ['APOD', 'NEO', 'MARS', 'EPIC', 'EARTH', 'IMAGES'];
      if (!validTypes.includes(itemType)) {
        throw new Error(`Invalid item type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Check if already exists with optimized index
      const checkResult = await client.query(
        'SELECT id, is_archived FROM saved_items WHERE user_id = $1 AND id = $2',
        [userId, itemId],
      );

      if (checkResult.rows.length > 0) {
        const existing = checkResult.rows[0];
        if (existing.is_archived) {
          // Reactivate archived item
          const reactivateQuery = `
            UPDATE saved_items
            SET is_archived = false, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $1 AND id = $2
            RETURNING *
          `;
          const reactivateResult = await client.query(reactivateQuery, [userId, itemId]);
          await client.query('COMMIT');

          // Invalidate cache
          this.invalidateUserCache(userId);

          return reactivateResult.rows[0];
        } else {
          await client.query('ROLLBACK');
          throw new Error('Item already in favorites');
        }
      }

      // Prepare insert data with optimizations
      const {
        title,
        url,
        hd_url,
        media_type = 'image',
        category,
        description,
        copyright,
        metadata = {},
      } = data || {};

      const query = `
        INSERT INTO saved_items (
          id, user_id, type, title, url, hd_url, media_type,
          category, description, copyright, date, metadata,
          is_archived, user_note, user_tags, is_favorite
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, NULL, '{}', false)
        RETURNING *
      `;

      const values = [
        itemId,
        userId,
        itemType,
        title,
        url,
        hd_url,
        media_type,
        category,
        description,
        copyright,
        itemDate,
        JSON.stringify(metadata),
      ];

      const result = await client.query(query, values);
      await client.query('COMMIT');

      // Invalidate all user cache after modification
      this.invalidateUserCache(userId);

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update favorite with cache invalidation
   */
  async updateFavorite(userId, favoriteId, { userNote, userTags, isFavorite }) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Optimized existence check with index
      const existsResult = await client.query(
        'SELECT id FROM saved_items WHERE user_id = $1 AND id = $2 AND is_archived = false',
        [userId, favoriteId],
      );

      if (!existsResult.rows[0]) {
        await client.query('ROLLBACK');
        return null;
      }

      const updates = [];
      const values = [userId, favoriteId];
      let paramIndex = 3;

      if (userNote !== undefined) {
        updates.push(`user_note = $${paramIndex}`);
        values.push(userNote);
        paramIndex++;
      }

      if (userTags !== undefined) {
        updates.push(`user_tags = $${paramIndex}`);
        values.push(Array.isArray(userTags) ? userTags : []);
        paramIndex++;
      }

      if (isFavorite !== undefined) {
        updates.push(`is_favorite = $${paramIndex}`);
        values.push(isFavorite);
        paramIndex++;
      }

      if (updates.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('No valid update fields provided');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');

      const query = `
        UPDATE saved_items
        SET ${updates.join(', ')}
        WHERE user_id = $1 AND id = $2 AND is_archived = false
        RETURNING *
      `;

      const result = await client.query(query, values);
      await client.query('COMMIT');

      // Invalidate cache
      this.invalidateUserCache(userId);

      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Remove favorite with cache invalidation
   */
  async removeFavorite(userId, favoriteId) {
    const client = await pool.connect();
    try {
      const query = `
        UPDATE saved_items
        SET is_archived = true, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND id = $2 AND is_archived = false
        RETURNING id
      `;

      const result = await client.query(query, [userId, favoriteId]);

      if (result.rowCount > 0) {
        // Invalidate cache
        this.invalidateUserCache(userId);
      }

      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Search favorites using optimized full-text search with caching
   */
  async searchFavorites(userId, searchQuery, { page = 1, limit = 20, types = null, tags = null } = {}) {
    // Validate input
    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new Error('Search query is required');
    }
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }
    if (page < 1) {
      throw new Error('Page must be greater than 0');
    }

    // Check cache
    const cacheKey = this.getSearchCacheKey(userId, searchQuery, { page, limit, types, tags });
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Use optimized search function
      const query = 'SELECT * FROM search_favorites_optimized($1, $2, $3, $4, $5, $6)';
      const values = [userId, searchQuery.trim(), page, limit, types, tags];

      const result = await client.query(query, values);

      // Get total count for pagination (separate query for performance)
      const countCacheKey = this.cache.key('search_count', userId, searchQuery.toLowerCase(),
        types ? JSON.stringify(types) : 'all', tags ? JSON.stringify(tags) : 'none');

      let totalCount = this.cache.get(countCacheKey);
      if (!totalCount) {
        const countQuery = `
          SELECT COUNT(*) as total
          FROM saved_items si
          WHERE si.user_id = $1
          AND si.is_archived = false
          AND to_tsvector('english',
            COALESCE(si.title, '') || ' ' ||
            COALESCE(si.description, '') || ' ' ||
            COALESCE(si.category, '') || ' ' ||
            COALESCE(si.user_note, '')
          ) @@ plainto_tsquery('english', $2)
          AND ($3 IS NULL OR si.type = ANY($3))
          AND ($4 IS NULL OR si.user_tags && $4)
        `;
        const countResult = await client.query(countQuery, [userId, searchQuery.trim(), types, tags]);
        totalCount = parseInt(countResult.rows[0].total);
        this.cache.set(countCacheKey, totalCount, this.defaultCacheTTL);
      }

      const totalPages = Math.ceil(totalCount / limit);

      const response = {
        favorites: result.rows.map(row => ({
          id: row.id,
          type: row.type,
          title: row.title,
          url: row.url,
          category: row.category,
          description: row.description,
          saved_at: row.saved_at,
          relevance_score: parseFloat(row.relevance_score) || 0,
          collection_count: parseInt(row.collection_count) || 0,
          collection_names: row.collection_names || [],
        })),
        pagination: {
          total: totalCount,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        search: {
          query: searchQuery,
          types,
          tags,
        },
      };

      // Cache search results with shorter TTL due to dynamic nature
      this.cache.set(cacheKey, response, 180); // 3 minutes

      return response;
    } finally {
      client.release();
    }
  }

  /**
   * Get favorite statistics using optimized query with caching
   */
  async getFavoriteStats(userId) {
    const cacheKey = this.cache.key('stats', userId);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const client = await pool.connect();
    try {
      // Optimized single query for all statistics
      const query = `
        SELECT
          COUNT(*) FILTER (WHERE is_archived = false) as total_favorites,
          COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
          COUNT(*) FILTER (WHERE is_favorite = true AND is_archived = false) as marked_favorites,
          COUNT(DISTINCT type) FILTER (WHERE is_archived = false) as unique_types,
          ARRAY_AGG(DISTINCT type) FILTER (WHERE is_archived = false) as types,
          MIN(saved_at) FILTER (WHERE is_archived = false) as first_saved,
          MAX(saved_at) FILTER (WHERE is_archived = false) as last_saved,
          -- Additional performance metrics
          COUNT(*) FILTER (WHERE is_archived = false AND user_tags != '{}') as tagged_count,
          COUNT(*) FILTER (WHERE is_archived = false AND user_note IS NOT NULL) as noted_count,
          COUNT(*) FILTER (WHERE is_archived = false AND saved_at >= CURRENT_DATE - INTERVAL '30 days') as recent_count
        FROM saved_items
        WHERE user_id = $1
      `;

      const result = await client.query(query, [userId]);
      const stats = result.rows[0];

      const response = {
        totalFavorites: parseInt(stats.total_favorites) || 0,
        archivedCount: parseInt(stats.archived_count) || 0,
        markedFavorites: parseInt(stats.marked_favorites) || 0,
        uniqueTypes: parseInt(stats.unique_types) || 0,
        types: stats.types?.filter(Boolean) || [],
        firstSaved: stats.first_saved,
        lastSaved: stats.last_saved,
        // Additional metrics
        taggedCount: parseInt(stats.tagged_count) || 0,
        notedCount: parseInt(stats.noted_count) || 0,
        recentCount: parseInt(stats.recent_count) || 0,
        engagementRate: stats.total_favorites > 0
          ? ((parseInt(stats.marked_favorites) + parseInt(stats.tagged_count)) /
             parseInt(stats.total_favorites) * 100).toFixed(2)
          : 0,
      };

      // Cache stats with moderate TTL
      this.cache.set(cacheKey, response, this.defaultCacheTTL);

      return response;
    } finally {
      client.release();
    }
  }

  /**
   * Batch operations for bulk processing
   */
  async batchAddFavorites(userId, items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Items array is required');
    }

    if (items.length > 100) {
      throw new Error('Maximum 100 items allowed per batch operation');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const results = [];
      const errors = [];

      for (const item of items) {
        try {
          const result = await this.addFavorite(userId, item);
          results.push(result);
        } catch (error) {
          errors.push({ item, error: error.message });
        }
      }

      await client.query('COMMIT');

      // Invalidate cache once after batch operation
      this.invalidateUserCache(userId);

      return {
        successful: results,
        failed: errors,
        total: items.length,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Export favorites data with optimized query
   */
  async exportFavorites(userId, { format = 'json', includeArchived = false } = {}) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          id,
          type,
          title,
          url,
          hd_url,
          category,
          description,
          copyright,
          date,
          saved_at,
          user_note,
          user_tags,
          is_favorite,
          metadata
        FROM saved_items
        WHERE user_id = $1
        AND ($2 OR is_archived = false)
        ORDER BY saved_at DESC
      `;

      const result = await client.query(query, [userId, includeArchived]);

      if (format === 'csv') {
        // Simple CSV export
        const headers = ['ID', 'Type', 'Title', 'URL', 'Category', 'Date', 'Saved At', 'Note', 'Tags', 'Is Favorite'];
        const rows = result.rows.map(row => [
          row.id,
          row.type,
          row.title,
          row.url,
          row.category,
          row.date,
          row.saved_at,
          row.user_note || '',
          row.user_tags ? row.user_tags.join(';') : '',
          row.is_favorite,
        ]);

        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      }

      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = new FavoritesServiceOptimized();