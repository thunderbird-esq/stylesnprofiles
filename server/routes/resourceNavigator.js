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
const router = express.Router();

// Input validation middleware
const validateSavedItem = [
  body('id').isString().isLength({ min: 1, max: 100 }).trim().escape(),
  body('type').isString().isIn(['APOD', 'NEO', 'MARS', 'IMAGES']).trim().escape(),
  body('title').isString().isLength({ min: 1, max: 200 }).trim().escape(),
  body('url').optional().isURL({ protocols: ['http', 'https'] }),
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
 * 
 * Retrieves all saved NASA resources from the database.
 * Currently returns mock data for demonstration purposes.
 * 
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // GET /api/resources/saved
 * // Response: [
 * //   {
 * //     id: 'apod-2024-01-01',
 * //     type: 'APOD',
 * //     title: 'Galaxy NGC 1234',
 * //     url: 'https://apod.nasa.gov/apod/image/2401/ngc1234.jpg',
 * //     category: 'astronomy',
 * //     description: 'A beautiful spiral galaxy in the constellation',
 * //     saved_at: '2024-01-01T12:00:00.000Z'
 * //   }
 * // ]
 */
router.get('/saved', async (req, res) => {
  try {
    // Return mock data since database isn't set up
    const mockItems = [
      {
        id: 'apod-2024-01-01',
        type: 'APOD',
        title: 'Galaxy NGC 1234',
        url: 'https://apod.nasa.gov/apod/image/2401/ngc1234.jpg',
        category: 'astronomy',
        description: 'A beautiful spiral galaxy in the constellation',
        saved_at: new Date().toISOString(),
      },
    ];
    res.json(mockItems);
  } catch (err) {
    console.error('Error fetching saved items:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved items' });
  }
});

/**
 * Save a new item
 * 
 * Creates a new saved item in the database with the provided details.
 * Currently uses mock implementation for demonstration purposes.
 * 
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing item data
 * @param {string} req.body.id - Unique identifier for the item
 * @param {string} req.body.type - Type of NASA resource (APOD, NeoWS, etc.)
 * @param {string} req.body.title - Title of the resource
 * @param {string} [req.body.url] - Optional URL to the resource
 * @param {string} [req.body.category] - Optional category classification
 * @param {string} [req.body.description] - Optional description
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // POST /api/resources/saved
 * // Body: {
 * //   "id": "apod-2024-01-01",
 * //   "type": "APOD",
 * //   "title": "Galaxy NGC 1234",
 * //   "url": "https://apod.nasa.gov/apod/image/2401/ngc1234.jpg",
 * //   "category": "astronomy",
 * //   "description": "A beautiful spiral galaxy"
 * // }
 */
router.post('/saved', validateSavedItem, async (req, res) => {
  const { id, type, title, url, category, description } = req.body;

  try {
    // Return success without actually saving to database
    const mockItem = {
      id,
      type,
      title,
      url,
      category,
      description,
      saved_at: new Date().toISOString(),
    };
    res.status(201).json(mockItem);
    console.log('Item saved (mock):', title);
  } catch (err) {
    console.error('Error saving item:', err.message);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

/**
 * Save a search query
 * 
 * Logs a search query to the database for analytics and search history tracking.
 * Currently uses mock implementation for demonstration purposes.
 * 
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body containing search data
 * @param {string} req.body.query_string - The search query string to save
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // POST /api/resources/search
 * // Body: { "query_string": "mars rover photos" }
 * // Response: {
 * //   "id": 123,
 * //   "query_string": "mars rover photos",
 * //   "search_time": "2024-01-01T12:00:00.000Z"
 * // }
 */
router.post('/search', validateSearchQuery, async (req, res) => {
  const { query_string } = req.body;

  try {
    // Return success without actually saving to database
    const mockSearch = {
      id: Math.floor(Math.random() * 1000),
      query_string,
      search_time: new Date().toISOString(),
    };
    res.status(201).json(mockSearch);
    console.log('Search saved (mock):', query_string);
  } catch (err) {
    console.error('Error saving search:', err.message);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

module.exports = router;