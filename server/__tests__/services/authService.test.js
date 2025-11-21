const authService = require('../../services/authService');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../../db');

jest.mock('../../db', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const email = 'test@example.com';
      const username = 'testuser';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const userId = 'user-123';

      // Mock user check (no existing user)
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValue(hashedPassword);

      // Mock insert user
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: userId, email, username, role: 'user' }],
      });

      const result = await authService.registerUser(email, username, password);

      expect(pool.connect).toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(result).toEqual({ id: userId, email, username, role: 'user' });
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const email = 'test@example.com';

      // Mock user check (user exists)
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'existing' }] });

      await expect(authService.registerUser(email, 'user', 'pass'))
        .rejects.toThrow('User with this email or username already exists');

      expect(mockClient.query).toHaveBeenCalledTimes(1);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = {
        id: '123',
        email,
        password_hash: 'hashed',
        role: 'user',
      };

      mockClient.query.mockResolvedValueOnce({ rows: [user] });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      const result = await authService.loginUser(email, password);

      expect(result).toHaveProperty('token', 'mock-token');
      expect(result).toHaveProperty('refreshToken', 'mock-token');
      expect(result.user).not.toHaveProperty('password_hash');
    });

    it('should throw error on invalid password', async () => {
      const email = 'test@example.com';
      const user = { id: '123', email, password_hash: 'hashed' };

      mockClient.query.mockResolvedValueOnce({ rows: [user] });
      bcrypt.compare.mockResolvedValue(false);

      await expect(authService.loginUser(email, 'wrongpass'))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
