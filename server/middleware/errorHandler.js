/**
 * Comprehensive Error Handling Middleware for NASA System 6 Portal
 * Provides centralized error handling, logging, and graceful degradation
 *
 * @fileoverview Comprehensive error handling with custom error classes, logging, circuit breaker, and service monitoring
 * @author NASA System 6 Portal Team
 * @version 1.0.0
 * @since 2024-01-01
 *
 * @module middleware/errorHandler
 * @requires fs
 * @requires path
 */

const fs = require('fs');
const path = require('path');

/**
 * Base Application Error Class
 * Custom error class for operational errors with status codes and error codes
 *
 * @class AppError
 * @extends Error
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} [code='APP_ERROR'] - Error code for client identification
 * @param {*} [details=null] - Additional error details
 * @property {number} statusCode - HTTP status code
 * @property {string} code - Error code
 * @property {*} details - Additional error details
 * @property {boolean} isOperational - Indicates if error is operational (true)
 * @example
 * throw new AppError('Invalid input', 400, 'VALIDATION_ERROR', { field: 'email' });
 */
class AppError extends Error {
  constructor(message, statusCode, code = 'APP_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database Error Class
 * @class DatabaseError
 * @extends AppError
 * @param {string} message - Error message
 * @param {*} [details=null] - Additional error details
 */
class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, 503, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

/**
 * Cache Error Class
 * @class CacheError
 * @extends AppError
 * @param {string} message - Error message
 * @param {*} [details=null] - Additional error details
 */
class CacheError extends AppError {
  constructor(message, details = null) {
    super(message, 503, 'CACHE_ERROR', details);
    this.name = 'CacheError';
  }
}

/**
 * External Service Error Class
 * @class ExternalServiceError
 * @extends AppError
 * @param {string} service - Name of the external service
 * @param {string} message - Error message
 * @param {*} [details=null] - Additional error details
 */
class ExternalServiceError extends AppError {
  constructor(service, message, details = null) {
    super(`${service} service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', details);
    this.name = 'ExternalServiceError';
    this.service = service;
  }
}

/**
 * Validation Error Class
 * @class ValidationError
 * @extends AppError
 * @param {string} message - Error message
 * @param {*} [details=null] - Additional error details
 */
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication Error Class
 * @class AuthenticationError
 * @extends AppError
 * @param {string} [message='Authentication failed'] - Error message
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization Error Class
 * @class AuthorizationError
 * @extends AppError
 * @param {string} [message='Access denied'] - Error message
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Rate Limit Error Class
 * @class RateLimitError
 * @extends AppError
 * @param {string} [message='Rate limit exceeded'] - Error message
 */
class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * Circuit Breaker Implementation
 * Protects external services from cascading failures by monitoring failure rates
 * Implements three states: CLOSED (normal), OPEN (failing), HALF_OPEN (testing)
 *
 * @class CircuitBreaker
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.failureThreshold=5] - Number of failures before opening circuit
 * @param {number} [options.resetTimeout=60000] - Time in ms before attempting recovery (1 minute)
 * @param {number} [options.monitoringPeriod=10000] - Monitoring window in ms (10 seconds)
 * @property {string} state - Current circuit state (CLOSED, OPEN, HALF_OPEN)
 * @property {number} failureCount - Current failure count
 * @property {number} lastFailureTime - Timestamp of last failure
 * @property {number} successCount - Success count in HALF_OPEN state
 * @property {number} nextAttempt - Timestamp when next attempt is allowed
 * @example
 * const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeout: 30000 });
 * const result = await breaker.execute(() => externalApiCall());
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds

    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
    this.nextAttempt = null;
  }

  /**
   * Execute Operation with Circuit Breaker Protection
   * @param {Function} operation - Async operation to execute
   * @returns {Promise<*>} Result of the operation
   * @throws {AppError} Throws if circuit is OPEN
   */
  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new AppError(
          'Service temporarily unavailable (circuit breaker open)',
          503,
          'CIRCUIT_BREAKER_OPEN',
        );
      } else {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker entering HALF_OPEN state');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log('Circuit breaker CLOSED');
      }
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.log(`Circuit breaker OPEN until ${new Date(this.nextAttempt).toISOString()}`);
      this.successCount = 0;
    }
  }

  /**
   * Get Circuit Breaker State
   * @returns {Object} Current state information
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt,
    };
  }
}

/**
 * Logger Utility Class
 * Provides structured logging with file and console output
 *
 * @class Logger
 * @property {string} logDir - Directory where log files are stored
 * @example
 * const logger = new Logger();
 * logger.error('Database connection failed', { error: err.message });
 * logger.info('Server started', { port: 3000 });
 */
class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Log a Message with Metadata
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {Object} [meta={}] - Additional metadata
   */
  log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...meta,
    };

    // Log to console
    const consoleMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    if (level === 'error') {
      console.error(consoleMessage, meta);
    } else if (level === 'warn') {
      console.warn(consoleMessage, meta);
    } else {
      console.log(consoleMessage, meta);
    }

    // Log to file
    try {
      const logFile = path.join(this.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, `${JSON.stringify(logEntry)}\n`);
    } catch (err) {
      console.error('Failed to write to log file:', err);
    }
  }

  /**
   * Log Error Message
   * @param {string} message - Error message
   * @param {Object} [meta={}] - Additional metadata
   */
  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  /**
   * Log Warning Message
   * @param {string} message - Warning message
   * @param {Object} [meta={}] - Additional metadata
   */
  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  /**
   * Log Info Message
   * @param {string} message - Info message
   * @param {Object} [meta={}] - Additional metadata
   */
  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  /**
   * Log Debug Message
   * @param {string} message - Debug message
   * @param {Object} [meta={}] - Additional metadata
   */
  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

const logger = new Logger();

/**
 * Service Health Monitor Class
 * Monitors health of external services and tracks their availability
 *
 * @class ServiceHealthMonitor
 * @property {Map} services - Map of registered services
 * @property {number} checkInterval - Health check interval in ms
 * @property {boolean} isMonitoring - Monitoring status
 * @example
 * const monitor = new ServiceHealthMonitor();
 * monitor.registerService('database', dbHealthCheck);
 * const health = await monitor.checkService('database');
 */
class ServiceHealthMonitor {
  constructor() {
    this.services = new Map();
    this.checkInterval = 30000; // 30 seconds
    this.isMonitoring = false;
    this.monitoringInterval = null;

    // Only start monitoring automatically if not in test environment
    if (process.env.NODE_ENV !== 'test') {
      this.startMonitoring();
    }
  }

  /**
   * Register a Service for Health Monitoring
   * @param {string} name - Service name
   * @param {Function} checkFunction - Async function that returns health status
   */
  registerService(name, checkFunction) {
    this.services.set(name, {
      checkFunction,
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      circuitBreaker: new CircuitBreaker(),
    });
  }

  async checkService(name) {
    const service = this.services.get(name);
    if (!service) return null;

    try {
      const result = await service.circuitBreaker.execute(service.checkFunction);
      service.status = 'healthy';
      service.consecutiveFailures = 0;
      service.lastCheck = new Date();
      return { name, status: 'healthy', result };
    } catch (error) {
      service.consecutiveFailures++;
      service.status = service.consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';
      service.lastCheck = new Date();

      logger.warn(`Service health check failed: ${name}`, {
        error: error.message,
        consecutiveFailures: service.consecutiveFailures,
        circuitBreakerState: service.circuitBreaker.getState(),
      });

      return { name, status: service.status, error: error.message };
    }
  }

  async checkAllServices() {
    const promises = Array.from(this.services.keys()).map(name =>
      this.checkService(name).catch(err => ({ name, status: 'error', error: err.message })),
    );

    return Promise.all(promises);
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAllServices();
      } catch (error) {
        logger.error('Service health monitoring error:', { error: error.message });
      }
    }, this.checkInterval);

    this.isMonitoring = true;
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      this.isMonitoring = false;
    }
  }

  getServiceStatus(name) {
    const service = this.services.get(name);
    return service ? {
      status: service.status,
      lastCheck: service.lastCheck,
      consecutiveFailures: service.consecutiveFailures,
      circuitBreaker: service.circuitBreaker.getState(),
    } : null;
  }
}

const serviceMonitor = new ServiceHealthMonitor();

/* globals setTimeout, setInterval, clearInterval */
/**
 * Global Error Handler Middleware
 * Centralized error handling for all Express routes
 *
 * @function globalErrorHandler
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 * @returns {void}
 * @example
 * // In server.js
 * app.use(globalErrorHandler);
 */
const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  logger.error('Unhandled error occurred', {
    error: error.message,
    stack: error.stack,
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined,
    query: req.query,
  });

  // Handle specific error types
  if (err.name === 'CastError') {
    error = new AppError('Invalid data format', 400, 'INVALID_DATA_FORMAT');
  }

  if (err.code === 11000) {
    error = new AppError('Duplicate field value', 400, 'DUPLICATE_VALUE');
  }

  if (err.name === 'ValidationError') {
    error = new ValidationError(err.message, err.details);
  }

  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const errorCode = error.code || 'INTERNAL_ERROR';
  const message = process.env.NODE_ENV === 'production' && statusCode === 500
    ? 'Something went wrong!'
    : error.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      requestId: req.requestId,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.details,
      }),
    },
  });
};

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch unhandled promise rejections
 *
 * @function asyncHandler
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped handler function
 * @example
 * router.get('/data', asyncHandler(async (req, res) => {
 *   const data = await fetchData();
 *   res.json(data);
 * }));
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Service Degradation Middleware
 * Provides fallback responses when external services are unhealthy
 *
 * @function withServiceDegradation
 * @param {string} serviceName - Name of the service to monitor
 * @param {*} fallbackResponse - Fallback data to return if service is unhealthy
 * @returns {Function} Express middleware function
 * @example
 * router.get('/data',
 *   withServiceDegradation('nasa_api', { data: [], degraded: true }),
 *   nasaHandler
 * );
 */
const withServiceDegradation = (serviceName, fallbackResponse) => {
  return async (req, res, next) => {
    try {
      const serviceStatus = serviceMonitor.getServiceStatus(serviceName);

      if (serviceStatus && serviceStatus.status === 'unhealthy') {
        logger.warn(`Service ${serviceName} is unhealthy, using fallback`, {
          requestId: req.requestId,
          serviceStatus,
        });

        return res.status(200).json({
          success: true,
          data: fallbackResponse,
          degraded: true,
          service: serviceName,
        });
      }

      return next();
    } catch (error) {
      logger.error(`Service degradation check failed for ${serviceName}`, {
        error: error.message,
        requestId: req.requestId,
      });

      // Continue with normal flow if degradation check fails
      return next();
    }
  };
};

/**
 * Timeout Wrapper for Async Operations
 * Wraps promises with a timeout to prevent indefinite hanging
 *
 * @function withTimeout
 * @param {Promise} promise - Promise to execute with timeout
 * @param {number} [timeoutMs=10000] - Timeout duration in milliseconds (default: 10 seconds)
 * @param {string} [timeoutMessage='Operation timeout'] - Error message on timeout
 * @returns {Promise<*>} Promise that resolves with operation result or rejects on timeout
 * @throws {AppError} Throws AppError with 408 status code on timeout
 * @example
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   5000,
 *   'API request timeout'
 * );
 */
const withTimeout = (promise, timeoutMs = 10000, timeoutMessage = 'Operation timeout') => {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new AppError(timeoutMessage, 408, 'TIMEOUT')), timeoutMs);
    }),
  ]);
};

/**
 * Retry Wrapper with Exponential Backoff
 * Retries failed operations with increasing delays between attempts
 *
 * @function withRetry
 * @async
 * @param {Function} fn - Async function to retry
 * @param {number} [maxRetries=3] - Maximum number of retry attempts
 * @param {number} [baseDelayMs=1000] - Base delay in milliseconds (doubles each retry)
 * @returns {Promise<*>} Result of the successful operation
 * @throws {Error} Throws the last error if all retries fail
 * @example
 * const data = await withRetry(
 *   () => fetchFromAPI(),
 *   3,
 *   1000
 * ); // Retries 3 times with 1s, 2s, 4s delays
 */
const withRetry = async (fn, maxRetries = 3, baseDelayMs = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries || !isRetryableError(error)) {
        throw error;
      }

      const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
      logger.warn('Retrying operation after error', {
        attempt,
        maxRetries,
        delayMs,
        error: error.message,
      });

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Check if an Error is Retryable
 * Determines if an error should trigger a retry attempt
 *
 * @function isRetryableError
 * @param {Error} error - Error object to check
 * @returns {boolean} True if error is retryable
 * @example
 * if (isRetryableError(error)) {
 *   await retryOperation();
 * }
 */
const isRetryableError = (error) => {
  const retryableCodes = ['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND'];
  const retryableStatusCodes = [502, 503, 504, 429];

  return retryableCodes.includes(error.code) ||
    retryableStatusCodes.includes(error.statusCode) ||
    error.name === 'TimeoutError';
};

/**
 * Process-level error handlers
 */
const setupProcessErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥', {
      error: err.message,
      stack: err.stack,
    });

    // Graceful shutdown
    console.log('Shutting down gracefully due to uncaught exception...');
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! 💥', {
      reason: reason.toString(),
      promise: promise.toString(),
    });

    // Graceful shutdown
    console.log('Shutting down gracefully due to unhandled rejection...');
    process.exit(1);
  });

  // Handle warning events
  process.on('warning', (warning) => {
    logger.warn('Process warning', {
      name: warning.name,
      message: warning.message,
      stack: warning.stack,
    });
  });
};

// Initialize process error handlers
setupProcessErrorHandlers();

module.exports = {
  // Error classes
  AppError,
  DatabaseError,
  CacheError,
  ExternalServiceError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  RateLimitError,

  // Error handling utilities
  globalErrorHandler,
  asyncHandler,
  withTimeout,
  withRetry,
  withServiceDegradation,

  // Monitoring and utilities
  CircuitBreaker,
  ServiceHealthMonitor,
  serviceMonitor,
  logger,

  // Helper functions
  isRetryableError,
  setupProcessErrorHandlers,
};