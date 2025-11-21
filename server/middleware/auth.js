/**
 * Authentication and Authorization Middleware
 * Provides JWT-based authentication, role-based authorization, and user validation
 *
 * @fileoverview Authentication and authorization middleware for NASA System 6 Portal
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module middleware/auth
 * @requires jsonwebtoken
 * @requires express-validator
 */

const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header and attaches user to request
 *
 * @function authenticateToken
 * @param {express.Request} req - Express request object
 * @param {express.Request} req.headers - Request headers
 * @param {string} [req.headers.authorization] - Bearer token in format "Bearer <token>"
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {void}
 * @throws {Object} Returns 401 if token is missing
 * @throws {Object} Returns 403 if token is invalid or expired
 * @example
 * // Usage in Express route
 * app.get('/protected', authenticateToken, (req, res) => {
 *   // req.user is now available
 *   res.json({ user: req.user });
 * });
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token required',
      },
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (
      err &&
      err.name === 'TokenExpiredError' &&
      err.message &&
      err.message.includes('jwt expired')
    ) {
      // Token has expired – respond with 401
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Authentication token has expired' },
      });
    }
    if (err) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Invalid or expired token',
        },
      });
    }
    req.user = user;
    next();
  });
};

/**
 * Optional Authentication Middleware
 * Attempts to authenticate but continues if token is invalid or missing
 * Useful for endpoints that allow both authenticated and anonymous access
 *
 * @function optionalAuth
 * @param {express.Request} req - Express request object
 * @param {express.Request} req.headers - Request headers
 * @param {string} [req.headers.authorization] - Bearer token in format "Bearer <token>"
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {void}
 * @description Unlike authenticateToken, this middleware never blocks the request
 *              and will always call next(), regardless of authentication status
 * @example
 * // Usage for endpoints that work with or without authentication
 * app.get('/public-data', optionalAuth, (req, res) => {
 *   // req.user may be undefined if not authenticated
 *   const isAuth = req.user ? 'authenticated' : 'anonymous';
 *   res.json({ status: isAuth, data: someData });
 * });
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without user
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    }
    next(); // Continue regardless of token validity
  });
};

/**
 * Role-Based Authorization Middleware
 * Factory function that creates middleware to check if user has required roles
 *
 * @function authorize
 * @param {string[]} [roles=[]] - Array of allowed user roles
 * @returns {express.RequestHandler} Express middleware function for role checking
 * @throws {Object} Returns 401 if user is not authenticated
 * @throws {Object} Returns 403 if user doesn't have required roles
 * @example
 * // Usage for admin-only endpoints
 * app.get('/admin/users', authenticateToken, authorize(['admin']), handler);
 *
 * // Usage for multiple allowed roles
 * app.get('/premium-content', authenticateToken, authorize(['admin', 'premium']), handler);
 *
 * // Usage with no roles (just authentication)
 * app.get('/user-profile', authenticateToken, authorize(), handler);
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

/**
 * User roles enumeration
 * Defines all possible user roles in the system
 * @readonly
 * @enum {string}
 */
const ROLES = {
  /** Guest user - no authentication required */
  GUEST: 'guest',
  /** Regular authenticated user */
  USER: 'user',
  /** Premium user with enhanced features */
  PREMIUM: 'premium',
  /** Administrator with full system access */
  ADMIN: 'admin',
  /** Moderator with content management privileges */
  MODERATOR: 'moderator',
};

/**
 * User permissions enumeration
 * Defines granular permissions for different actions
 * @readonly
 * @enum {string}
 */
const PERMISSIONS = {
  /** Read NASA API data */
  NASA_READ: 'nasa:read',
  /** Read own user profile */
  USER_READ_OWN: 'user:read:own',
  /** Update own user profile */
  USER_UPDATE_OWN: 'user:update:own',
  /** Create new collections */
  COLLECTION_CREATE: 'collection:create',
  /** Read own collections */
  COLLECTION_READ_OWN: 'collection:read:own',
  /** Update own collections */
  COLLECTION_UPDATE_OWN: 'collection:update:own',
  /** Delete own collections */
  COLLECTION_DELETE_OWN: 'collection:delete:own',
  /** Manage all users (admin only) */
  ADMIN_USERS: 'admin:users',
  /** System administration (admin only) */
  ADMIN_SYSTEM: 'admin:system',
};

/**
 * Rate limiting configuration based on user role
 * Returns rate limit settings tailored to different user privilege levels
 *
 * @function getRateLimitConfig
 * @param {Object|null} user - User object or null for unauthenticated users
 * @param {string} [user.role] - User role from ROLES enumeration
 * @returns {Object} Rate limit configuration object
 * @returns {number} returns.windowMs - Time window in milliseconds (15 minutes)
 * @returns {number} returns.max - Maximum requests allowed in the time window
 * @returns {string} returns.message - Human-readable message for rate limit exceeded
 * @example
  * // Guest user configuration
  * const guestConfig = getRateLimitConfig(null);
  * // Returns: { windowMs: 900000, max: 30, message: 'Guest limit: 30 requests/15min' }
  *
  * // Premium user configuration
  * const premiumConfig = getRateLimitConfig({ role: 'premium' });
  * // Returns: { windowMs: 900000, max: 500, message: 'Premium limit: 500 requests/15min' }
 */
const getRateLimitConfig = (user) => {
  if (!user) {
    return {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 30, // 30 requests per window
      message: 'Guest limit: 30 requests/15min',
    };
  }

  switch (user.role) {
  case ROLES.PREMIUM:
    return {
      windowMs: 15 * 60 * 1000,
      max: 500,
      message: 'Premium limit: 500 requests/15min',
    };
  case ROLES.ADMIN:
  case ROLES.MODERATOR:
    return {
      windowMs: 15 * 60 * 1000,
      max: 1000,
      message: 'Admin limit: 1000 requests/15min',
    };
  default: // USER
    return {
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'User limit: 100 requests/15min',
    };
  }
};

/**
 * User registration validation middleware
 * Validates and sanitizes user registration data
 *
 * @type {express.ValidationChain[]}
 * @description Validates email, password, username, and optional display name
 *              Ensures password strength and username format requirements
 */
const userRegistrationValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8, max: 128 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be 8+ chars with uppercase, lowercase, number, and special char'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-30 chars, alphanumeric, underscore, or hyphen'),
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Display name must be 1-50 characters'),
  /**
   * Validation error handler middleware
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next function
   * @returns {void}
   */
  (req, res, next) => {
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
          })),
        },
      });
    }
    next();
  },
];

/**
 * User login validation middleware
 * Validates and sanitizes user login credentials
 *
 * @type {express.ValidationChain[]}
 * @description Validates email and password for user authentication
 */
const userLoginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  body('password')
    .notEmpty()
    .withMessage('Password required'),
  /**
   * Validation error handler middleware
   * @param {express.Request} req - Express request object
   * @param {express.Response} res - Express response object
   * @param {express.NextFunction} next - Express next function
   * @returns {void}
   */
  (req, res, next) => {
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
          })),
        },
      });
    }
    next();
  },
];

/**
 * Authentication middleware module exports
 * @type {Object}
 * @property {Function} authenticateToken - JWT authentication middleware
 * @property {Function} optionalAuth - Optional authentication middleware
 * @property {Function} authorize - Role-based authorization middleware factory
 * @property {Object} ROLES - User roles enumeration
 * @property {Object} PERMISSIONS - User permissions enumeration
 * @property {Function} getRateLimitConfig - Rate limit configuration function
 * @property {express.ValidationChain[]} userRegistrationValidation - User registration validation middleware
 * @property {express.ValidationChain[]} userLoginValidation - User login validation middleware
 */
module.exports = {
  authenticateToken,
  optionalAuth,
  authorize,
  ROLES,
  PERMISSIONS,
  getRateLimitConfig,
  userRegistrationValidation,
  userLoginValidation,
};