const express = require('express');
const { body, validationResult } = require('express-validator');
const collectionsService = require('../services/collectionsService');
const router = express.Router();

// Validation middleware
const createCollectionValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (1-100 chars)'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('is_public').optional().isBoolean(),
];

const addItemValidation = [
  body('itemId').exists().withMessage('Item ID is required'),
];

// Get all collections
router.get('/', async (req, res, next) => {
  try {
    const collections = await collectionsService.getCollections(req.user.id);
    res.json(collections);
  } catch (error) {
    next(error);
  }
});

// Create collection
router.post('/', createCollectionValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const collection = await collectionsService.createCollection(req.user.id, req.body);
    res.status(201).json(collection);
  } catch (error) {
    next(error);
  }
});

// Get single collection
router.get('/:id', async (req, res, next) => {
  try {
    const collection = await collectionsService.getCollectionById(req.user.id, req.params.id);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    next(error);
  }
});

// Update collection
router.patch('/:id', createCollectionValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const collection = await collectionsService.updateCollection(req.user.id, req.params.id, req.body);
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.json(collection);
  } catch (error) {
    next(error);
  }
});

// Delete collection
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await collectionsService.deleteCollection(req.user.id, req.params.id);
    if (!success) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Get collection items
router.get('/:id/items', async (req, res, next) => {
  try {
    const items = await collectionsService.getCollectionItems(req.user.id, req.params.id);
    res.json(items);
  } catch (error) {
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: 'Collection not found' });
    }
    next(error);
  }
});

// Add item to collection
router.post('/:id/items', addItemValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const item = await collectionsService.addItemToCollection(req.user.id, req.params.id, req.body.itemId);
    res.status(201).json(item);
  } catch (error) {
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: 'Collection not found' });
    }
    if (error.message === 'Item not found in saved items') {
      return res.status(404).json({ message: 'Item not found in favorites' });
    }
    if (error.message === 'Item already in collection') {
      return res.status(409).json({ message: 'Item already in collection' });
    }
    next(error);
  }
});

// Remove item from collection
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    const success = await collectionsService.removeItemFromCollection(req.user.id, req.params.id, req.params.itemId);
    if (!success) {
      return res.status(404).json({ message: 'Item not found in collection' });
    }
    res.status(204).send();
  } catch (error) {
    if (error.message === 'Collection not found') {
      return res.status(404).json({ message: 'Collection not found' });
    }
    next(error);
  }
});

module.exports = router;
