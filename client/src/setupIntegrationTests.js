/**
 * Setup for Integration Tests
 *
 * Configures the testing environment for integration tests with real server connections.
 * Tests require the actual server to be running on localhost:3001.
 *
 * @module setupIntegrationTests
 */

import '@testing-library/jest-dom';

// Server health check function
export const checkServerHealth = async () => {
  try {
    /* eslint-disable-next-line no-undef */
    const response = await fetch('http://localhost:3001/health', {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};

// Wait for server to be available
export const waitForServer = async (maxAttempts = 5, delay = 1000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkServerHealth();
    if (isHealthy) {
      console.log('✅ Server is ready for integration tests');
      return true;
    }

    if (i < maxAttempts - 1) {
      console.log(`⏳ Waiting for server... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    '❌ Server is not responding on http://localhost:3001. ' +
    'Please start the server with: cd server && npm start',
  );
};

// Suppress console warnings for integration tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(async () => {
  console.log('🔧 Setting up integration test environment with real server...');

  // Filter out expected console messages during tests
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('act(...) is not supported') ||
       args[0].includes('Warning: An invalid form control') ||
       args[0].includes('Network Error') ||
       args[0].includes('AggregateError'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps has been renamed') ||
       args[0].includes('Server health check failed'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // Wait for server to be ready
  try {
    await waitForServer();
  } catch (error) {
    console.error(error.message);
    // Don't fail the test setup, but warn that tests may fail
    console.warn('⚠️ Integration tests will fail without the server running');
  }
});

afterAll(() => {
  console.log('🧹 Cleaning up integration test environment...');

  // Restore original console functions
  console.error = originalError;
  console.warn = originalWarn;
});

// Configure Jest for integration tests
beforeEach(() => {
  // Increase timeout for real API calls
  jest.setTimeout(15000);
});

afterEach(() => {
  // Clear any timers
  jest.clearAllTimers();
});