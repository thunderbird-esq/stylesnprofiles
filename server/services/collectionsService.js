const { pool } = require('../db');

class CollectionsService {
  /**
   * Get all collections for a user with pagination
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page (1-100)
   * @param {boolean} [options.includePublic=false] - Include public collections from other users
   * @returns {Promise<Object>} { collections, pagination }
   */
  async getCollections(userId, { page = 1, limit = 20, includePublic = false } = {}) {
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

      let whereClause = 'WHERE c.user_id = $1';
      const queryParams = [userId];
      const paramIndex = 2;

      if (includePublic) {
        whereClause += ' OR (c.is_public = true AND c.user_id != $1)';
      }

      // Main query with JOIN to get item counts without N+1 queries
      const query = `
        SELECT
          c.*,
          COUNT(ci.id)::int as item_count,
          u.username as owner_username,
          u.display_name as owner_display_name,
          CASE WHEN c.user_id = $1 THEN true ELSE false END as is_owner
        FROM collections c
        LEFT JOIN collection_items ci ON c.id = ci.collection_id
        LEFT JOIN users u ON c.user_id = u.id
        ${whereClause}
        GROUP BY c.id, u.username, u.display_name
        ORDER BY c.updated_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      // Count query for pagination
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

      return {
        collections: collectionsResult.rows.map(row => ({
          ...row,
          item_count: parseInt(row.item_count) || 0,
          is_owner: row.is_owner,
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
   * Get a specific collection by ID
   * @param {string} userId - User UUID
   * @param {string} collectionId - Collection UUID
   * @returns {Promise<Object|null>} Collection or null
   */
  async getCollectionById(userId, collectionId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          c.*,
          COUNT(ci.id)::int as item_count,
          u.username as owner_username,
          u.display_name as owner_display_name,
          CASE WHEN c.user_id = $1 THEN true ELSE false END as is_owner
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
      return {
        ...row,
        item_count: parseInt(row.item_count) || 0,
        is_owner: row.is_owner,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Create a new collection
   * @param {string} userId - User UUID
   * @param {Object} data - Collection data
   * @param {string} data.name - Collection name (1-100 chars)
   * @param {string} [data.description] - Collection description (max 500 chars)
   * @param {boolean} [data.isPublic=false] - Make collection public
   * @returns {Promise<Object>} Created collection
   */
  async createCollection(userId, { name, description, isPublic }) {
    console.log(`📁 createCollection called for user ${userId}`, { name, description, isPublic });
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

      // Check if user already has a collection with this name
      const existingResult = await client.query(
        'SELECT id FROM collections WHERE user_id = $1 AND name = $2',
        [userId, name.trim()],
      );

      if (existingResult.rows.length > 0) {
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
      return {
        ...result.rows[0],
        item_count: 0,
        is_owner: true,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Update a collection
   * @param {string} userId - User UUID
   * @param {string} collectionId - Collection UUID
   * @param {Object} data - Update data
   * @param {string} [data.name] - New collection name
   * @param {string} [data.description] - New description
   * @param {boolean} [data.isPublic] - Public visibility
   * @returns {Promise<Object|null>} Updated collection or null
   */
  async updateCollection(userId, collectionId, data) {
    const client = await pool.connect();
    try {
      // First verify ownership
      const ownershipResult = await client.query(
        'SELECT id, name FROM collections WHERE id = $1 AND user_id = $2',
        [collectionId, userId],
      );

      if (!ownershipResult.rows[0]) {
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

        // Check if name conflicts with existing collection (excluding current one)
        const conflictResult = await client.query(
          'SELECT id FROM collections WHERE user_id = $1 AND name = $2 AND id != $3',
          [userId, name.trim(), collectionId],
        );

        if (conflictResult.rows.length > 0) {
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
      const updatedCollection = result.rows[0];

      // Get item count for response
      const countResult = await client.query(
        'SELECT COUNT(*) as count FROM collection_items WHERE collection_id = $1',
        [collectionId],
      );

      return {
        ...updatedCollection,
        item_count: parseInt(countResult.rows[0].count) || 0,
        is_owner: true,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Delete a collection
   * @param {string} userId - User UUID
   * @param {string} collectionId - Collection UUID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteCollection(userId, collectionId) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING id, name',
        [collectionId, userId],
      );

      return result.rowCount > 0;
    } finally {
      client.release();
    }
  }

  /**
   * Add an item to a collection with optional position and notes
   * @param {string} collectionId - Collection UUID
   * @param {string} favoriteId - Favorite item ID
   * @param {Object} options - Options
   * @param {number} [options.position] - Position in collection (optional)
   * @param {string} [options.notes] - Notes about this item in the collection
   * @returns {Promise<Object>} Created collection item
   */
  async addItemToCollection(collectionId, favoriteId, { position = null, notes = null } = {}) {
    const client = await pool.connect();
    try {
      // Start transaction for data consistency
      await client.query('BEGIN');

      try {
        // Verify collection exists
        const collectionResult = await client.query(
          'SELECT user_id, is_public FROM collections WHERE id = $1',
          [collectionId],
        );

        if (!collectionResult.rows[0]) {
          throw new Error('Collection not found');
        }

        const collection = collectionResult.rows[0];

        // Verify item exists and is not archived
        const itemResult = await client.query(
          'SELECT user_id, title FROM saved_items WHERE id = $1 AND is_archived = false',
          [favoriteId],
        );

        if (!itemResult.rows[0]) {
          throw new Error('Item not found or is archived');
        }

        // Check if item already in collection
        const existingResult = await client.query(
          'SELECT id FROM collection_items WHERE collection_id = $1 AND item_id = $2',
          [collectionId, favoriteId],
        );

        if (existingResult.rows.length > 0) {
          throw new Error('Item already in collection');
        }

        // Determine position if not specified
        let finalPosition = position;
        if (finalPosition === null) {
          const positionResult = await client.query(
            'SELECT MAX(position) as max_position FROM collection_items WHERE collection_id = $1',
            [collectionId],
          );
          finalPosition = (parseInt(positionResult.rows[0].max_position) || 0) + 1;
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

        return {
          ...insertResult.rows[0],
          collection: {
            id: collectionId,
            user_id: collection.user_id,
            is_public: collection.is_public,
          },
          item: {
            id: favoriteId,
            title: itemResult.rows[0].title,
          },
        };

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  }

  /**
   * Remove an item from a collection
   * @param {string} collectionId - Collection UUID
   * @param {string} favoriteId - Favorite item ID
   * @returns {Promise<boolean>} True if removed
   */
  async removeItemFromCollection(collectionId, favoriteId) {
    const client = await pool.connect();
    try {
      // Start transaction for consistency
      await client.query('BEGIN');

      try {
        // Remove the item
        const deleteResult = await client.query(
          'DELETE FROM collection_items WHERE collection_id = $1 AND item_id = $2 RETURNING id, position',
          [collectionId, favoriteId],
        );

        if (deleteResult.rowCount === 0) {
          await client.query('ROLLBACK');
          return false;
        }

        // Reorder remaining items to fill gaps
        const reorderQuery = `
          UPDATE collection_items
          SET position = new_position
          FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY position ASC) as new_position
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
        return true;

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get items in a collection with pagination
   * @param {string} collectionId - Collection UUID
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number (1-based)
   * @param {number} [options.limit=20] - Items per page (1-100)
   * @returns {Promise<Object>} { items, pagination, collection }
   */
  async getCollectionItems(collectionId, { page = 1, limit = 20 } = {}) {
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

      // Get collection details
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

      const collection = collectionResult.rows[0];

      // Get collection items with proper JOIN
      const itemsQuery = `
        SELECT
          si.*,
          ci.position,
          ci.notes as collection_notes,
          ci.added_at as added_to_collection_at
        FROM collection_items ci
        JOIN saved_items si ON ci.item_id = si.id
        WHERE ci.collection_id = $1 AND si.is_archived = false
        ORDER BY ci.position ASC, ci.added_at ASC
        LIMIT $2 OFFSET $3
      `;

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM collection_items ci
        JOIN saved_items si ON ci.item_id = si.id
        WHERE ci.collection_id = $1 AND si.is_archived = false
      `;

      const [itemsResult, countResult] = await Promise.all([
        client.query(itemsQuery, [collectionId, limit, offset]),
        client.query(countQuery, [collectionId]),
      ]);

      const totalItems = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(totalItems / limit);

      return {
        collection: {
          ...collection,
          item_count: totalItems,
        },
        items: itemsResult.rows,
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
   * Reorder items in a collection
   * @param {string} userId - User UUID
   * @param {string} collectionId - Collection UUID
   * @param {Array} itemOrders - Array of { itemId, position } objects
   * @returns {Promise<boolean>} True if reordered successfully
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

      // Start transaction
      await client.query('BEGIN');

      try {
        // Update each item position
        for (const { itemId, position } of itemOrders) {
          if (!itemId || position === undefined || position < 0) {
            throw new Error('Invalid item order data');
          }

          await client.query(
            'UPDATE collection_items SET position = $1 WHERE collection_id = $2 AND item_id = $3',
            [position, collectionId, itemId],
          );
        }

        // Update collection timestamp
        await client.query(
          'UPDATE collections SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
          [collectionId],
        );

        await client.query('COMMIT');
        return true;

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } finally {
      client.release();
    }
  }

  /**
   * Get collection statistics for a user
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Statistics object
   */
  async getCollectionStats(userId) {
    const client = await pool.connect();
    try {
      const query = `
        SELECT
          COUNT(*) as total_collections,
          COUNT(*) FILTER (WHERE is_public = true) as public_collections,
          COUNT(*) FILTER (WHERE is_public = false) as private_collections,
          SUM(item_count) as total_items_in_collections,
          AVG(item_count) as avg_items_per_collection
        FROM collections c
        LEFT JOIN (
          SELECT collection_id, COUNT(*) as item_count
          FROM collection_items
          GROUP BY collection_id
        ) ci ON c.id = ci.collection_id
        WHERE c.user_id = $1
      `;

      const result = await client.query(query, [userId]);
      const stats = result.rows[0];

      return {
        totalCollections: parseInt(stats.total_collections) || 0,
        publicCollections: parseInt(stats.public_collections) || 0,
        privateCollections: parseInt(stats.private_collections) || 0,
        totalItemsInCollections: parseInt(stats.total_items_in_collections) || 0,
        avgItemsPerCollection: parseFloat(stats.avg_items_per_collection) || 0,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Get public collections with optional search
   * @param {Object} options - Query options
   * @param {number} [options.page=1] - Page number
   * @param {number} [options.limit=20] - Items per page
   * @param {string} [options.search] - Search query
   * @returns {Promise<Object>} { collections, pagination }
   */
  async getPublicCollections({ page = 1, limit = 20, search = null } = {}) {
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
          END as relevance_score
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

      return {
        collections: collectionsResult.rows.map(row => ({
          ...row,
          item_count: parseInt(row.item_count) || 0,
          relevance_score: parseFloat(row.relevance_score) || 1.0,
          is_owner: false, // Always false for public collections
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
}

module.exports = new CollectionsService();
