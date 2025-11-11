// Setup file for Jest tests

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_USER = 'test_user';
process.env.DB_HOST = 'localhost';
process.env.DB_DATABASE = 'test_db';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_PORT = '5432';
process.env.NASA_API_KEY = 'test_nasa_api_key';

// Mock console methods to reduce noise during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console.log during tests
  console.log = jest.fn();

  // Only show console.error if explicitly testing error cases
  console.error = jest.fn();
});

afterAll(() => {
  // Restore original console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Global test setup
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock process.exit to prevent tests from exiting
process.exit = jest.fn();

// Increase timeout for integration tests
jest.setTimeout(10000);
