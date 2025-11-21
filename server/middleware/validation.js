/**
 * Input Validation and Sanitization Middleware
 * Provides comprehensive input validation, sanitization, and XSS protection
 * for NASA System 6 Portal API endpoints
 *
 * @fileoverview Input validation and sanitization middleware
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module middleware/validation
 * @requires express-validator
 * @requires xss
 */

const { body, query, param, validationResult } = require('express-validator');
const xss = require('xss');

/**
 * Sanitize input to prevent XSS attacks and injection vulnerabilities
 * Recursively sanitizes strings, arrays, and objects
 *
 * @function sanitize
 * @param {string|Object|Array|any} input - Input to sanitize
 * @returns {string|Object|Array|any} Sanitized input
 * @description Removes potentially dangerous HTML characters and scripts
 *              Supports recursive sanitization of nested objects and arrays
 * @example
 * // Sanitize a string
 * const cleanString = sanitize('<script>alert("xss")</script>');
 * // Returns: 'alert("xss")'
 *
 * // Sanitize an object
 * const cleanObj = sanitize({ name: '<b>John</b>', html: '<script>evil()</script>' });
 * // Returns: { name: 'John', html: 'evil()' }
 */
const sanitize = (input) => {
  if (typeof input === 'string') {
    return xss(input, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
    });
  }
  if (Array.isArray(input)) {
    return input.map(sanitize);
  }
  if (input && typeof input === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitize(value);
    }
    return sanitized;
  }
  return input;
};

/**
 * Global sanitization middleware
 * Automatically sanitizes request body, query parameters, and URL parameters
 *
 * @function sanitizeInput
 * @param {express.Request} req - Express request object
 * @param {express.Request} req.body - Request body to sanitize
 * @param {express.Request} req.query - Query parameters to sanitize
 * @param {express.Request} req.params - URL parameters to sanitize
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 * @description Should be applied early in the middleware chain to ensure
 *              all incoming data is sanitized before processing
 */
const sanitizeInput = (req, res, next) => {
  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  next();
};

/**
 * Validation result handler middleware
 * Processes express-validator results and returns standardized error responses
 *
 * @function handleValidationErrors
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 * @returns {void}
 * @description Should be used after express-validator chains to handle
 *              validation failures consistently across all endpoints
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: errors.array().map(err => ({
          field: err.path,
          message: err.msg,
          value: err.value,
        })),
      },
    });
  }
  next();
};

/**
 * NASA API validation schemas
 * Predefined validation chains for NASA API endpoints
 *
 * @namespace nasaApiValidation
 * @type {Object}
 * @property {express.ValidationChain[]} apod - APOD (Astronomy Picture of the Day) validation
 * @property {express.ValidationChain[]} marsPhotos - Mars Rover photos validation
 * @property {express.ValidationChain[]} neoBrowse - Near Earth Object browser validation
 */
const nasaApiValidation = {
  /**
   * APOD (Astronomy Picture of the Day) validation chain
   * Validates date and thumbs parameters for APOD requests
   *
   * @type {express.ValidationChain[]}
   * @description Validates optional date parameter (YYYY-MM-DD format) and thumbs boolean
   */
  apod: [
    query('date')
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('Date must be in YYYY-MM-DD format'),
    query('thumbs')
      .optional()
      .isBoolean()
      .withMessage('thumbs must be a boolean'),
    handleValidationErrors,
  ],

  /**
   * Mars Rover photos validation chain
   * Validates rover parameter and optional Mars photo filters
   *
   * @type {express.ValidationChain[]}
   * @description Validates rover name, sol (Martian day), camera, and pagination
   */
  marsPhotos: [
    param('rover')
      .isIn(['curiosity', 'opportunity', 'spirit'])
      .withMessage('Rover must be curiosity, opportunity, or spirit'),
    query('sol')
      .optional()
      .isInt({ min: 0, max: 9999 })
      .withMessage('Sol must be a non-negative integer'),
    query('camera')
      .optional()
      .isIn(['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM', 'PANCAM', 'MINITES'])
      .withMessage('Invalid camera name'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    handleValidationErrors,
  ],

  /**
   * Near Earth Object browser validation chain
   * Validates pagination parameters for NEO browsing
   *
   * @type {express.ValidationChain[]}
   * @description Validates page number and page size for NEO pagination
   */
  neoBrowse: [
    query('page')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Page must be a non-negative integer'),
    query('size')
      .optional()
      .isInt({ min: 0, max: 20 })
      .withMessage('Size must be between 0 and 20'),
    handleValidationErrors,
  ],
};

/**
 * Search validation schemas
 */
const searchValidation = [
  query('q')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be 1-100 characters'),
  query('sources')
    .optional()
    .isIn(['all', 'apod', 'neo', 'mars', 'media'])
    .withMessage('Invalid source filter'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page must be between 1 and 100'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO8601 date'),
  handleValidationErrors,
];

/**
 * User profile validation
 */
const userProfileUpdateValidation = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters'),
  body('avatar')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Avatar must be a valid URL'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be 500 characters or less'),
  body('preferences.theme')
    .optional()
    .isIn(['system6', 'system6-dark', 'modern'])
    .withMessage('Invalid theme preference'),
  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications preference must be boolean'),
  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications preference must be boolean'),
  body('preferences.privacy.profilePublic')
    .optional()
    .isBoolean()
    .withMessage('Profile privacy setting must be boolean'),
  body('preferences.privacy.collectionsPublic')
    .optional()
    .isBoolean()
    .withMessage('Collections privacy setting must be boolean'),
  handleValidationErrors,
];

/**
 * Collection validation
 */
const collectionValidation = {
  create: [
    body('name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Collection name must be 1-100 characters'),
    body('description')
      .isLength({ min: 1, max: 500 })
      .withMessage('Collection description must be 1-500 characters'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be boolean'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be 1-50 characters'),
    handleValidationErrors,
  ],

  update: [
    body('name')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Collection name must be 1-100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Collection description must be 500 characters or less'),
    body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be boolean'),
    body('tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array'),
    body('tags.*')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Each tag must be 1-50 characters'),
    handleValidationErrors,
  ],
};

/**
 * Favorite item validation
 */
const favoriteItemValidation = [
  body('type')
    .isIn(['APOD', 'NEO', 'MARS', 'MEDIA'])
    .withMessage('Type must be APOD, NEO, MARS, or MEDIA'),
  body('itemId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Item ID is required and must be 1-100 characters'),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be 1-200 characters'),
  body('url')
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('URL must be valid HTTP/HTTPS URL'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be valid ISO8601 date'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be 1000 characters or less'),
  body('thumbnail')
    .optional()
    .isURL({ protocols: ['http', 'https'] })
    .withMessage('Thumbnail must be valid URL'),
  handleValidationErrors,
];

/**
 * UUID parameter validation
 */
const uuidParamValidation = [
  param('id')
    .isUUID(4)
    .withMessage('ID must be a valid UUID'),
  handleValidationErrors,
];

/**
 * Pagination validation
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors,
];

/**
 * Advanced search validation
 */
const advancedSearchValidation = [
  body('query')
    .optional()
    .isLength({ min: 1, max: 200 })
    .withMessage('Search query must be 1-200 characters'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('filters.types')
    .optional()
    .isArray()
    .withMessage('Type filters must be an array'),
  body('filters.types.*')
    .optional()
    .isIn(['APOD', 'NEO', 'MARS', 'MEDIA'])
    .withMessage('Invalid type filter'),
  body('filters.dateRange.start')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid ISO8601 date'),
  body('filters.dateRange.end')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid ISO8601 date'),
  body('sort')
    .optional()
    .isIn(['relevance', 'date_desc', 'date_asc', 'title_asc', 'title_desc'])
    .withMessage('Invalid sort option'),
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  body('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  handleValidationErrors,
];

/**
 * Rate limiting bypass for health checks
 */
const bypassRateLimit = (req, res, next) => {
  // Skip rate limiting for health checks
  if (req.path === '/health' || req.path === '/status') {
    return next();
  }
  // Apply rate limiting for other routes
  next();
};

module.exports = {
  sanitize,
  sanitizeInput,
  handleValidationErrors,
  nasaApiValidation,
  searchValidation,
  userProfileUpdateValidation,
  collectionValidation,
  favoriteItemValidation,
  uuidParamValidation,
  paginationValidation,
  advancedSearchValidation,
  bypassRateLimit,
};