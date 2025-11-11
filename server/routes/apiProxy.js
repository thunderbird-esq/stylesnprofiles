const express = require('express');
const axios = require('axios');
const router = express.Router();

const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_API_URL = 'https://api.nasa.gov';

// This proxy handles all requests to /api/nasa/*
// It adds the API key and forwards the request to the official NASA API
router.get('/*', async (req, res) => {
  const endpointPath = req.path;
  const queryParams = { ...req.query, api_key: NASA_API_KEY };

  try {
    const { data } = await axios.get(`${NASA_API_URL}${endpointPath}`, {
      params: queryParams,
    });
    res.json(data);
  } catch (error) {
    console.error('NASA API Proxy Error:', error.message);
    const status = error.response ? error.response.status : 500;
    const message = error.response ? error.response.data : 'Internal server error';
    res.status(status).json({ error: message });
  }
});

module.exports = router;