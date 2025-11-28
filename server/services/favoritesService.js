const { pool } = require('../db');

class FavoritesService {
  /**
   * Get favorites for a user with pagination and filtering
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page (1-100)
   * @param {string} [options.type] - Filter by item type (APOD, NEO, MARS, EPIC, EARTH, IMAGES)
   * @param {boolean} [options.archived=false] - Include archived items
   * @returns {Promise<Object>} { favorites, pagination }
   */
  async getFavorites(userId, { page = 1, limit = 20, type = null, archived = false } = {}) {
    console.log(`🔍 getFavorites called for user ${userId} with options:`, { page, limit, type, archived });
    const client = await pool.connect();
    try {
      // Validate input
      if (limit < 1 || limit > 100) {
        throw new Error('Limit must be between 1 and 100');
      }
      if (page < 1) {
        throw new Error('Page must be greater than 0');
      }

      const offset = (page - 1) * limit;
      const queryParams = [userId];
      let whereClause = 'WHERE si.user_id = $1';
      let paramIndex = 2;

      // Add type filter if specified
      if (type) {
        whereClause += ` AND si.type = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
      }

      // Add archive filter if not archived (default behavior)
      if (!archived) {
        whereClause += ' AND si.is_archived = false';
      }

      // Main query with JOIN to avoid N+1 queries
      const query = `
        SELECT
          si.*,
          COUNT(ci.id) as collection_count,
          ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as collection_names
        FROM saved_items si
        LEFT JOIN collection_items ci ON si.id = ci.item_id
        LEFT JOIN collections c ON ci.collection_id = c.id AND c.user_id = si.user_id
        ${whereClause}
        GROUP BY si.id
        ORDER BY si.saved_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM saved_items si
        ${whereClause}
      `;

      // Add pagination parameters
      queryParams.push(limit, offset);
      const countParams = queryParams.slice(0, -2);

      // Execute queries
      const [itemsResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, countParams),
      ]);

      console.log('🔎 getFavorites query:', query.trim());
      console.log('🔎 getFavorites params:', queryParams);
      console.log('🔎 count query:', countQuery.trim());
      console.log('🔎 count params:', countParams);

      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        favorites: itemsResult.rows.map(row => ({
          ...row,
          collection_count: parseInt(row.collection_count) || 0,
          collection_names: (row.collection_names || []).filter(Boolean),
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
    } finally {
      client.release();
    }
  }

  /**
   * Get a specific favorite item by ID
   * @param {string} userId - User UUID
   * @param {string} favoriteId - Favorite item ID
   * @returns {Promise<Object|null>} Favorite item or null
   */
  async getFavoriteById(userId, favoriteId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          si.*,
          COUNT(ci.id) as collection_count,
          ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as collection_names
        FROM saved_items si
        LEFT JOIN collection_items ci ON si.id = ci.item_id
        LEFT JOIN collections c ON ci.collection_id = c.id AND c.user_id = si.user_id
        WHERE si.user_id = $1 AND si.id = $2
        GROUP BY si.id
      `;

      const result = await client.query(query, [userId, favoriteId]);

      if (!result.rows[0]) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...row,
        collection_count: parseInt(row.collection_count) || 0,
        collection_names: row.collection_names.filter(Boolean) || [],
      };
    } finally {
      client.release();
    }
  }

  /**
   * Add an item to favorites
   * @param {string} userId - User UUID
   * @param {Object} itemData - Item data
   * @param {string} itemData.itemType - Type of item (APOD, NEO, etc.)
   * @param {string} itemData.itemId - Unique identifier for the item
   * @param {string} [itemData.itemDate] - Date associated with the item
   * @param {Object} itemData.data - Additional item data
   * @returns {Promise<Object>} Created favorite item
   */
  async addFavorite(userId, { itemType, itemId, itemDate, data }) {
    console.log(`➕ addFavorite called for user ${userId}`, { itemType, itemId });
    const client = await pool.connect();
    try {
      // Validate required fields
      if (!itemType || !itemId) {
        throw new Error('itemType and itemId are required');
      }

      // Validate item type
      const validTypes = ['APOD', 'NEO', 'MARS', 'EPIC', 'EARTH', 'IMAGES'];
      if (!validTypes.includes(itemType)) {
        throw new Error(`Invalid item type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Check if already exists (including archived items)
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
          return reactivateResult.rows[0];
        } else {
          throw new Error('Item already in favorites');
        }
      }

      // Prepare insert data
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
          is_archived, user_note, user_tags
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, NULL, '{}')
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
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Update a favorite item
   * @param {string} userId - User UUID
   * @param {string} favoriteId - Favorite item ID
   * @param {Object} updateData - Data to update
   * @param {string} [updateData.userNote] - User's personal note
   * @param {string[]} [updateData.userTags] - User's tags
   * @param {boolean} [updateData.isFavorite] - Mark as favorite
   * @returns {Promise<Object|null>} Updated favorite item or null
   */
  async updateFavorite(userId, favoriteId, { userNote, userTags, isFavorite }) {
    const client = await pool.connect();
    try {
      // First check if item exists
      const existsResult = await client.query(
        'SELECT id FROM saved_items WHERE user_id = $1 AND id = $2 AND is_archived = false',
        [userId, favoriteId],
      );

      if (!existsResult.rows[0]) {
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
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
   * Remove an item from favorites (soft delete)
   * @param {string} userId - User UUID
   * @param {string} favoriteId - Favorite item ID
   * @returns {Promise<boolean>} True if archived, false if not found
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
      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Search favorites with full-text search
   * @param {string} userId - User UUID
   * @param {string} searchQuery - Search query string
   * @param {Object} options - Search options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string[]} [options.types] - Filter by item types
   * @param {string[]} [options.tags] - Filter by user tags
   * @returns {Promise<Object>} { favorites, pagination, query }
   */
  async searchFavorites(userId, searchQuery, { page = 1, limit = 20, types = null, tags = null } = {}) {
    const client = await pool.connect();
    try {
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

      const offset = (page - 1) * limit;
      const queryParams = [userId];
      let whereClause = 'WHERE si.user_id = $1 AND si.is_archived = false';
      let paramIndex = 2;

      // Add full-text search using PostgreSQL's tsvector
      const searchTerms = searchQuery.trim().split(/\s+/).join(' & ');

      whereClause += ` AND (
        to_tsvector(
            'english',
            COALESCE(si.title, '') || ' ' ||
            COALESCE(si.description, '') || ' ' ||
            COALESCE(si.category, '') || ' ' ||
            COALESCE(si.user_note, '')
          )
        @@ to_tsquery('english', $${paramIndex})
      )`;
      queryParams.push(searchTerms);
      paramIndex++;

      // Add type filter if specified
      if (types && types.length > 0) {
        whereClause += ` AND si.type = ANY($${paramIndex})`;
        queryParams.push(types);
        paramIndex++;
      }

      // Add tags filter if specified
      if (tags && tags.length > 0) {
        whereClause += ` AND si.user_tags && $${paramIndex}`;
        queryParams.push(tags);
        paramIndex++;
      }

      // Main search query with relevance scoring
      const query = `
        SELECT
          si.*,
          ts_rank(
            to_tsvector(
            'english',
            COALESCE(si.title, '') || ' ' ||
            COALESCE(si.description, '') || ' ' ||
            COALESCE(si.category, '') || ' ' ||
            COALESCE(si.user_note, '')
          ),
            to_tsquery('english', $2)
          ) as relevance_score,
          COUNT(ci.id) as collection_count,
          ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as collection_names
        FROM saved_items si
        LEFT JOIN collection_items ci ON si.id = ci.item_id
        LEFT JOIN collections c ON ci.collection_id = c.id AND c.user_id = si.user_id
        ${whereClause}
        GROUP BY si.id
        ORDER BY relevance_score DESC, si.saved_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM saved_items si
        ${whereClause}
      `;

      queryParams.push(limit, offset);
      const countParams = queryParams.slice(0, -2);

      const [itemsResult, countResult] = await Promise.all([
        client.query(query, queryParams),
        client.query(countQuery, countParams),
      ]);

      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        favorites: itemsResult.rows.map(row => ({
          ...row,
          relevance_score: parseFloat(row.relevance_score),
          collection_count: parseInt(row.collection_count) || 0,
          collection_names: row.collection_names.filter(Boolean) || [],
        })),
        pagination: {
          total: totalItems,
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
    } finally {
      client.release();
    }
  }

  /**
   * Get favorite statistics for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Statistics object
   */
  async getFavoriteStats(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          COUNT(*) FILTER (WHERE is_archived = false) as total_favorites,
          COUNT(*) FILTER (WHERE is_archived = true) as archived_count,
          COUNT(*) FILTER (WHERE is_favorite = true AND is_archived = false) as marked_favorites,
          COUNT(DISTINCT type) FILTER (WHERE is_archived = false) as unique_types,
          ARRAY_AGG(DISTINCT type) FILTER (WHERE is_archived = false) as types,
          MIN(saved_at) FILTER (WHERE is_archived = false) as first_saved,
          MAX(saved_at) FILTER (WHERE is_archived = false) as last_saved
        FROM saved_items
        WHERE user_id = $1
      `;

      const result = await client.query(query, [userId]);
      const stats = result.rows[0];

      return {
        totalFavorites: parseInt(stats.total_favorites) || 0,
        archivedCount: parseInt(stats.archived_count) || 0,
        markedFavorites: parseInt(stats.marked_favorites) || 0,
        uniqueTypes: parseInt(stats.unique_types) || 0,
        types: stats.types?.filter(Boolean) || [],
        firstSaved: stats.first_saved,
        lastSaved: stats.last_saved,
      };
    } finally {
      client.release();
    }
  }
}

module.exports = new FavoritesService();
