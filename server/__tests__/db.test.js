describe('Database Configuration', () => {
  let Pool;
  let mockPoolInstance;
  let db;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env.DB_USER = 'test_user';
    process.env.DB_HOST = 'localhost';
    process.env.DB_DATABASE = 'test_db';
    process.env.DB_PASSWORD = 'test_password';
    process.env.DB_PORT = '5432';

    // Clear the require cache
    jest.resetModules();
    jest.clearAllMocks();

    // Create mock pool instance
    mockPoolInstance = {
      query: jest.fn(),
      connect: jest.fn(),
      end: jest.fn(),
    };

    // Mock the Pool constructor
    Pool = jest.fn(() => mockPoolInstance);

    // Mock the pg module
    jest.doMock('pg', () => ({
      Pool,
    }));

    // Import the db module after mocks are set up
    db = require('../db');
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DB_USER;
    delete process.env.DB_HOST;
    delete process.env.DB_DATABASE;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_PORT;
  });

  test('should create a pool with correct configuration', () => {
    expect(Pool).toHaveBeenCalledWith({
      user: 'test_user',
      host: 'localhost',
      database: 'test_db',
      password: 'test_password',
      port: 5432,
    });
  });

  test('should export query function', () => {
    expect(typeof db.query).toBe('function');
  });

  test('should export initDb function', () => {
    expect(typeof db.initDb).toBe('function');
  });

  test('should export pool object', () => {
    expect(db.pool).toBe(mockPoolInstance);
  });
});