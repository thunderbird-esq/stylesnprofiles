const express = require('express');
const db = require('../db');
const router = express.Router();

// --- API for Resource Navigator (Database persistence) ---

// Get all saved items (mock data for now)
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
        saved_at: new Date().toISOString()
      }
    ];
    res.json(mockItems);
  } catch (err) {
    console.error('Error fetching saved items:', err.message);
    res.status(500).json({ error: 'Failed to fetch saved items' });
  }
});

// Save a new item (mock implementation)
router.post('/saved', async (req, res) => {
  const { id, type, title, url, category, description } = req.body;
  if (!id || !type || !title) {
    return res.status(400).json({ error: 'Missing required fields: id, type, title' });
  }

  try {
    // Return success without actually saving to database
    const mockItem = {
      id,
      type,
      title,
      url,
      category,
      description,
      saved_at: new Date().toISOString()
    };
    res.status(201).json(mockItem);
    console.log('Item saved (mock):', title);
  } catch (err) {
    console.error('Error saving item:', err.message);
    res.status(500).json({ error: 'Failed to save item' });
  }
});

// Save a search query (mock implementation)
router.post('/search', async (req, res) => {
  const { query_string } = req.body;
  if (!query_string) {
    return res.status(400).json({ error: 'Missing required field: query_string' });
  }

  try {
    // Return success without actually saving to database
    const mockSearch = {
      id: Math.floor(Math.random() * 1000),
      query_string,
      search_time: new Date().toISOString()
    };
    res.status(201).json(mockSearch);
    console.log('Search saved (mock):', query_string);
  } catch (err) {
    console.error('Error saving search:', err.message);
    res.status(500).json({ error: 'Failed to save search' });
  }
});

module.exports = router;