/* globals setTimeout */
/**
 * Test Helpers and Utilities for server tests
 */

// Set test timeout for real API calls
jest.setTimeout(10000);

// Suppress console errors during tests unless explicitly testing error handling
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Filter out expected console messages during tests
  console.error = (...args) => {
    // Suppress network errors from real API calls (expected in some tests)
    if (
      typeof args[0] === 'string' &&
      args[0].includes('connect ECONNREFUSED')
    ) {
      return;
    }
    // Suppress AxiosError logs
    if (
      args[0] &&
      typeof args[0] === 'object' &&
      args[0].message &&
      args[0].message.includes('ECONNREFUSED')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    // Suppress certain warnings during tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('deprecated')
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  // Restore original console functions
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to wait for async operations
  wait: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Helper to create mock request objects
  mockRequest: (overrides = {}) => ({
    method: 'GET',
    url: '/',
    headers: {},
    query: {},
    body: {},
    params: {},
    ...overrides,
  }),

  // Helper to create mock response objects
  mockResponse: () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
    };
    return res;
  },
};