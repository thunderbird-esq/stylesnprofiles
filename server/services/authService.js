const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

class AuthService {
  /**
     * Register a new user
     * @param {string} email
     * @param {string} username
     * @param {string} password
     * @returns {Promise<Object>} Created user object (without password)
     */
  async registerUser(email, username, password) {
    const client = await pool.connect();
    try {
      // Check if user exists
      const userCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username],
      );

      if (userCheck.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert user
      const result = await client.query(
        `INSERT INTO users (email, username, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, email, username, role, created_at`,
        [email, username, passwordHash],
      );

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  /**
     * Login user
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>} { user, token, refreshToken }
     */
  async loginUser(email, password) {
    const client = await pool.connect();
    try {
      // Find user
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email],
      );

      const user = result.rows[0];
      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        throw new Error('Invalid credentials');
      }

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Remove sensitive data
      delete user.password_hash;

      return { user, token, refreshToken };
    } finally {
      client.release();
    }
  }

  /**
     * Generate JWT access token
     * @param {Object} user
     * @returns {string} JWT token
     */
  generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
  }

  /**
     * Generate refresh token
     * @param {Object} user
     * @returns {string} Refresh token
     */
  generateRefreshToken(user) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN },
    );
  }
}

module.exports = new AuthService();
