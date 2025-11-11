/**
 * NASA API Proxy Router
 * 
 * Provides secure proxy endpoints for NASA APIs by adding authentication
 * and handling error responses consistently. All requests to /api/nasa/*
 * are forwarded to the official NASA API with the secret API key.
 * 
 * @module apiProxy
 * @requires express
 * @requires axios
 */

/**
 * NASA API Proxy Route
 * Handles forwarding requests to the official NASA API with authentication
 * @module routes/apiProxy
 */

const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const NASA_API_KEY = process.env.NASA_API_KEY;
const NASA_API_URL = 'https://api.nasa.gov';

// Rate limiting for NASA API proxy
const nasaLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 NASA API requests per windowMs
  message: {
    error: 'Too many requests to NASA API from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generic NASA API proxy handler
 * 
 * Forwards all GET requests to NASA APIs while automatically adding
 * the required API key for authentication. Handles various NASA
 * endpoints including APOD, NeoWS, Mars Rover, and EPIC APIs.
 * 
 * @function
 * @async
 * @param {Object} req - Express request object
 * @param {Object} req.path - The NASA API endpoint path
 * @param {Object} req.query - Query parameters from the client
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * 
 * @example
 * // GET /api/nasa/planetary/apod
 * // Proxies to: https://api.nasa.gov/planetary/apod?api_key=YOUR_KEY
 * 
 * @example
 * // GET /api/nasa/neo/rest/v1/feed?start_date=2024-01-01&end_date=2024-01-07
 * // Proxies to: https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-01-01&end_date=2024-01-07&api_key=YOUR_KEY
 */
router.get('/*', nasaLimiter, async (req, res) => {
  const endpointPath = req.path;
  
  // Validate endpoint path
  if (!endpointPath || endpointPath.length > 200) {
    return res.status(400).json({ error: 'Invalid endpoint path' });
  }
  
  // Sanitize query parameters
  const sanitizedQuery = {};
  for (const [key, value] of Object.entries(req.query)) {
    if (typeof value === 'string' && value.length < 500) {
      sanitizedQuery[key] = value.replace(/[<>"'&]/g, '');
    }
  }
  
  const queryParams = { ...sanitizedQuery, api_key: NASA_API_KEY };

  try {
    const { data } = await axios.get(`${NASA_API_URL}${endpointPath}`, {
      params: queryParams,
      timeout: 10000, // 10 second timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max response size
    });
    
    // Validate response data
    if (typeof data !== 'object' || data === null) {
      return res.status(500).json({ error: 'Invalid response from NASA API' });
    }
    
    res.json(data);
  } catch (error) {
    console.error('NASA API Proxy Error:', error.message);
    
    // Handle specific error types
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'NASA API request timeout' });
    }
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data;
      
      // Don't expose internal NASA API errors
      if (status >= 500) {
        return res.status(503).json({ error: 'NASA API service unavailable' });
      }
      
      return res.status(status).json({ error: message });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;