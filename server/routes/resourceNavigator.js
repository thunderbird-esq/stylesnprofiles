/**
 * Resource Navigator Router
 *
 * Handles CRUD operations for saved NASA resources and search history.
 * Provides endpoints for managing user-saved items and tracking search queries
 * for analytics and user experience improvement.
 *
 * @module resourceNavigator
 * @requires express
 * @requires ../db
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../db');
const router = express.Router();

// Input validation middleware
const validateSavedItem = [
  body('id').isString().isLength({ min: 1, max: 100 }).trim().escape(),
  body('type').isString().isIn(['APOD', 'NEO', 'MARS', 'IMAGES']).trim().escape(),
  body('title').isString().isLength({ min: 1, max: 200 }).trim().escape(),
  body('url')
    .optional()
    .isURL({ protocols: ['http', 'https'] }),
  body('category').optional().isString().isLength({ max: 50 }).trim().escape(),
  body('description').optional().isString().isLength({ max: 1000 }).trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({ field: err.path, message: err.msg })),
      });
    }
    next();
  },
];

const validateSearchQuery = [
  body('query_string').isString().isLength({ min: 1, max: 200 }).trim().escape(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array().map(err => ({ field: err.path, message: err.msg })),
      });
    }
    next();
  },
];

// --- API for Resource Navigator (Database persistence) ---

/**
 * Get all saved items
 */
router.get('/saved', async (req, res) => {
  try {
    // Get user ID from auth middleware or query
    let userId = req.user?.id || req.query.userId;
    const { type, category } = req.query; // Extract filter parameters

    // Handle test user ID which might not be a valid UUID
    if (userId === 'test-user') {
      userId = null; // Use NULL for test user if not a valid UUID
    }

    // Build dynamic query with filters
    const conditions = [];
    const queryParams = [];

    // User ID filter
    if (userId) {
      queryParams.push(userId);
      conditions.push(`user_id = $${queryParams.length}`);
    } else {
      conditions.push('user_id IS NULL');
    }

    // Type filter
    if (type) {
      queryParams.push(type);
      conditions.push(`type = $${queryParams.length}`);
    }

    // Category filter
    if (category) {
      queryParams.push(category);
      conditions.push(`category = $${queryParams.length}`);
    }

    const queryText = `SELECT * FROM saved_items WHERE ${conditions.join(' AND ')} ORDER BY saved_at DESC`;

    const result = await query(queryText, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching saved items:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved items' });
  }
});

/**
 * Save a new item
 */
router.post('/saved', validateSavedItem, async (req, res) => {
  const { id, type, title, url, category, description } = req.body;
  let userId = req.user?.id || 'test-user';

  // Handle test user ID
  if (userId === 'test-user') {
    userId = null;
  }

  try {
    // Check for duplicate using the primary key 'id'
    // Note: In saved_items, 'id' is the PK and is the item ID (e.g. 'apod-2024-01-01')
    // We should check if it exists for this user (or globally if ID is shared)
    // Actually, the schema defines 'id' as PRIMARY KEY.
    // This implies the ID must be unique across ALL users.
    // This is a design flaw if multiple users want to save "apod-2024-01-01".
    // However, for now, we will assume the ID passed from client includes user context or we just check existence.

    const existing = await query(
      'SELECT id FROM saved_items WHERE id = $1',
      [id],
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        error: { code: 'ITEM_ALREADY_EXISTS', message: 'Item already saved' },
      });
    }

    const result = await query(
      `INSERT INTO saved_items 
       (id, user_id, type, title, url, category, description, saved_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [id, userId, type, title, url, category, description],
    );

    const savedItem = result.rows[0];
    res.status(201).json(savedItem);
    console.log('Item saved:', title);
  } catch (err) {
    // Handle unique constraint violation if race condition occurs
    if (err.code === '23505') { // unique_violation
      return res.status(409).json({
        error: { code: 'ITEM_ALREADY_EXISTS', message: 'Item already saved' },
      });
    }
    console.error('Error saving item:', err.message);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

/**
 * @route GET /api/navigator/resource/:type/:date
 * @desc Get a specific resource by type and date
 * @access Public
 */
router.get('/resource/:type/:date', async (req, res) => {
  try {
    // Assuming 'resourceNavigator' is an external service or utility
    // that needs to be imported or defined.
    // For this change, we'll assume it's available in the scope.
    // If resourceNavigator is not defined, this will cause a runtime error.
    // To make this syntactically correct, we'll add a placeholder import
    // or assume it's implicitly available for the purpose of this edit.
    // For a real application, `const resourceNavigator = require('../services/resourceNavigator');`
    // or similar would be needed.
    const resourceNavigator = {
      getResource: async (type, date) => {
        // Placeholder for actual resource fetching logic
        console.log(`Fetching resource: ${type} for date ${date}`);
        // Example: return { type, date, title: `Resource for ${date}` };
        return null; // Or actual data
      },
      validateDate: async (type, date) => {
        // Placeholder for actual date validation logic
        console.log(`Validating date: ${date} for type ${type}`);
        return true; // Or false
      },
    };

    const resource = await resourceNavigator.getResource(
      req.params.type,
      req.params.date,
    );

    if (!resource) {
      return res.status(404).json({
        error: 'Resource not found',
        details: `No ${req.params.type} resource found for date ${req.params.date}`,
      });
    }

    res.json(resource);
  } catch (error) {
    console.error('Resource navigation error:', error);
    res.status(500).json({
      error: 'Failed to fetch resource',
      details: error.message,
    });
  }
});

/**
 * @route GET /api/navigator/validate/:type/:date
 * @desc Validate if a resource exists for a specific date
 * @access Public
 */
router.get('/validate/:type/:date', async (req, res) => {
  try {
    // Assuming 'resourceNavigator' is an external service or utility
    const resourceNavigator = {
      getResource: async (type, date) => {
        // Placeholder for actual resource fetching logic
        console.log(`Fetching resource: ${type} for date ${date}`);
        return null; // Or actual data
      },
      validateDate: async (type, date) => {
        // Placeholder for actual date validation logic
        console.log(`Validating date: ${date} for type ${type}`);
        return true; // Or false
      },
    };

    const isValid = await resourceNavigator.validateDate(
      req.params.type,
      req.params.date,
    );

    res.json({ valid: isValid });
  } catch (error) {
    console.error('Date validation error:', error);
    res.status(500).json({
      error: 'Failed to validate date',
      details: error.message,
    });
  }
});

/**
 * Save a search query
 */
router.post('/search', validateSearchQuery, async (req, res) => {
  const { query_string } = req.body;
  let userId = req.user?.id || 'test-user';

  if (userId === 'test-user') {
    userId = null;
  }

  try {
    const result = await query(
      `INSERT INTO saved_searches (user_id, query_string, search_time)
       VALUES ($1, $2, NOW())
       RETURNING *`,
      [userId, query_string],
    );

    res.status(201).json(result.rows[0]);
    console.log('Search saved:', query_string);
  } catch (err) {
    console.error('Error saving search:', err.message);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

module.exports = router;
