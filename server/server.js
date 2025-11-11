/**
 * NASA System 6 Portal - Backend Server
 * 
 * Express server that provides:
 * - NASA API proxy with authentication
 * - Resource navigator endpoints for saved items
 * - Database integration for persistence
 * - CORS configuration for React frontend
 * 
 * @module server
 * @requires express
 * @requires cors
 * @requires dotenv
 * @requires ./routes/apiProxy
 * @requires ./routes/resourceNavigator
 * @requires ./db
 */

/**
 * NASA System 6 Portal Server
 * Main Express server configuration and route setup
 * @module server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const apiProxyRouter = require('./routes/apiProxy');
const resourceNavigatorRouter = require('./routes/resourceNavigator');
require('./db'); // Import db to ensure pool is created

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.nasa.gov'],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Middleware
// Allow requests from the React client with proper security
app.use(cors({ 
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200,
}));
app.use(express.json());

// Input validation middleware
const validateApiProxy = [
  (req, res, next) => {
    // Validate that the path doesn't contain malicious characters
    const path = req.path;
    if (!path.match(/^[\w/-]+$/)) {
      return res.status(400).json({ error: 'Invalid path format' });
    }
    next();
  },
];

const validateResourceInput = [
  body('id').optional().isString().isLength({ min: 1, max: 100 }),
  body('type').optional().isString().isIn(['APOD', 'NEO', 'MARS', 'IMAGES']),
  body('title').optional().isString().isLength({ min: 1, max: 200 }),
  body('url').optional().isURL({ protocols: ['http', 'https'] }),
  body('category').optional().isString().isLength({ min: 1, max: 50 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('query_string').optional().isString().isLength({ min: 1, max: 200 }),
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

// API Routes
// Path 1: The NASA proxy
app.use('/api/nasa', validateApiProxy, apiProxyRouter);
// Path 2: The database API for saved items/searches
app.use('/api/resources', validateResourceInput, resourceNavigatorRouter);

/**
 * Health check endpoint
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/**
 * 404 Handler - Catches all unmatched routes
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 */
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Basic Error Handler - Catches all server errors
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 */
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

/**
 * Starts the NASA System 6 Portal server
 * 
 * @event
 * @listens PORT
 * @callback
 * @returns {void}
 */
app.listen(PORT, () => {
  console.log(`🚀 NASA System 6 Server running on http://localhost:${PORT}`);
});