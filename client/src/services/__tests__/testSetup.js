/**
 * Simple test setup for services unit tests
 */

// Mock console methods to keep test output clean
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Add custom matchers if needed
expect.extend({
  toBeValidApiResponse(received) {
    if (typeof received !== 'object' || received === null) {
      return {
        message: () => `Expected ${received} to be a valid API response object`,
        pass: false,
      };
    }
    return {
      message: () => `Expected ${received} not to be a valid API response object`,
      pass: true,
    };
  },
});