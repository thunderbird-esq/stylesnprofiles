const express = require('express');
const { body, query, validationResult } = require('express-validator');
const favoritesService = require('../services/favoritesService');
const router = express.Router();

// Validation middleware
const addFavoriteValidation = [
  body('itemId').exists().withMessage('Item ID is required'),
  body('itemType')
    .isIn(['APOD', 'NEO', 'MARS', 'EPIC', 'EARTH', 'IMAGES'])
    .withMessage('Invalid item type'),
  body('data.title').exists().withMessage('Title is required'),
  body('data.url').optional().isURL(),
  body('itemDate').optional().isISO8601(),
];

const queryValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['APOD', 'NEO', 'MARS', 'EPIC', 'EARTH', 'IMAGES']),
];

// Get all favorites
router.get('/', queryValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page, limit, type } = req.query;
    const result = await favoritesService.getFavorites(req.user.id, { page, limit, type });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Add favorite
router.post('/', addFavoriteValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await favoritesService.addFavorite(req.user.id, req.body);
    res.status(201).json(item);
  } catch (error) {
    if (error.message === 'Item already in favorites') {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
});

// Get single favorite
router.get('/:id', async (req, res, next) => {
  try {
    const item = await favoritesService.getFavoriteById(req.user.id, req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// Remove favorite
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await favoritesService.removeFavorite(req.user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Favorite not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
