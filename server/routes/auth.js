const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const authService = require('../services/authService');
const router = express.Router();

// Validation middleware
const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').exists().withMessage('Password is required'),
];

const refreshTokenValidation = [
  body('refreshToken').exists().withMessage('Refresh token is required'),
];

// Register endpoint
router.post('/register', registerValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;
    const user = await authService.registerUser(email, username, password);

    res.status(201).json({
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    // Handle duplicate user error specifically if possible, otherwise pass to global handler
    if (error.message.includes('already exists')) {
      return res.status(409).json({ message: error.message });
    }
    next(error);
  }
});

// Login endpoint
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const { user, token, refreshToken } = await authService.loginUser(email, password);

    res.json({
      message: 'Login successful',
      user,
      token,
      refreshToken,
    });
  } catch (error) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    next(error);
  }
});

// Refresh token endpoint
router.post('/refresh', refreshTokenValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Get user from database
    const { pool } = require('../db');
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, email, username, role FROM users WHERE id = $1',
        [decoded.id],
      );

      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Generate new access token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' },
      );

      res.json({
        message: 'Token refreshed successfully',
        token,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Refresh token expired' });
    }
    next(error);
  }
});

// Verify token endpoint
router.get('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database
    const { pool } = require('../db');
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT id, email, username, role, created_at FROM users WHERE id = $1',
        [decoded.id],
      );

      const user = result.rows[0];
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      res.json({
        message: 'Token is valid',
        user,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    next(error);
  }
});

module.exports = router;
