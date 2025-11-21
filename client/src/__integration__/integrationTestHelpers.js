/**
 * Integration Test Helpers
 *
 * Provides utilities and helpers for integration testing with real server connections.
 * Tests require the actual server to be running on localhost:3001.
 *
 * @module integrationTestHelpers
 */

import axios from 'axios';

// Test configuration
const TEST_CONFIG = {
  serverBaseUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  healthCheckTimeout: 5000,
  apiRequestTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Server health check
 */
export const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${TEST_CONFIG.serverBaseUrl}/health`, {
      timeout: TEST_CONFIG.healthCheckTimeout,
    });
    return response.status === 200;
  } catch (error) {
    console.warn('Server health check failed:', error.message);
    return false;
  }
};

/**
 * Wait for server to be ready
 */
export const waitForServer = async (maxAttempts = 5, delay = 1000) => {
  console.log(`Checking server availability... (max ${maxAttempts} attempts)`);

  for (let i = 0; i < maxAttempts; i++) {
    const isHealthy = await checkServerHealth();
    if (isHealthy) {
      console.log('✅ Server is ready for integration tests');
      return true;
    }

    if (i < maxAttempts - 1) {
      console.log(`Server not ready, retrying in ${delay}ms... (${i + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `Server is not responding after ${maxAttempts} attempts. ` +
    `Make sure the server is running on ${TEST_CONFIG.serverBaseUrl} ` +
    'with: cd server && npm start',
  );
};

/**
 * Make API request with retry logic and error handling
 */
export const makeApiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    data = null,
    retries = TEST_CONFIG.retryAttempts,
    timeout = TEST_CONFIG.apiRequestTimeout,
  } = options;

  const config = {
    method,
    url: `${TEST_CONFIG.serverBaseUrl}${endpoint}`,
    timeout,
    validateStatus: (status) => status < 500, // Don't retry for 4xx errors
  };

  if (data) {
    config.data = data;
  }

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios(config);
      return response;
    } catch (error) {
      lastError = error;

      // Don't retry on 4xx errors or if we've exhausted retries
      if (error.response?.status < 500 || attempt === retries) {
        throw error;
      }

      console.warn(
        `API request failed (attempt ${attempt}/${retries}), retrying...`,
        error.message,
      );
      await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay));
    }
  }

  throw lastError;
};

/**
 * Integration test setup and teardown
 */
export class IntegrationTestManager {
  constructor() {
    this.originalAxiosDefaults = null;
  }

  async setup() {
    console.log('🔧 Setting up integration test environment...');

    // Store original axios defaults
    this.originalAxiosDefaults = {
      baseURL: axios.defaults.baseURL,
      timeout: axios.defaults.timeout,
    };

    // Configure axios for testing
    axios.defaults.baseURL = TEST_CONFIG.serverBaseUrl;
    axios.defaults.timeout = TEST_CONFIG.apiRequestTimeout;

    // Wait for server availability
    await waitForServer();

    console.log('✅ Integration test environment ready');
  }

  async teardown() {
    console.log('🧹 Cleaning up integration test environment...');

    // Restore original axios defaults
    if (this.originalAxiosDefaults) {
      axios.defaults.baseURL = this.originalAxiosDefaults.baseURL;
      axios.defaults.timeout = this.originalAxiosDefaults.timeout;
    }

    console.log('✅ Integration test environment cleaned up');
  }
}

/**
 * Test assertion helpers
 */
export const assertions = {
  // Validate APOD data structure
  validateApodData: (data) => {
    const requiredFields = ['title', 'date', 'explanation', 'url', 'media_type'];

    requiredFields.forEach(field => {
      expect(data).toHaveProperty(field);
      expect(typeof data[field]).toBe('string');
      expect(data[field].length).toBeGreaterThan(0);
    });

    // Validate date format
    expect(data.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    // Validate media type
    expect(['image', 'video']).toContain(data.media_type);

    // Validate URL
    expect(data.url).toMatch(/^https?:\/\/.+/);
  },

  // Validate NeoWS data structure
  validateNeoWsData: (data) => {
    expect(data).toHaveProperty('element_count');
    expect(data).toHaveProperty('near_earth_objects');
    expect(typeof data.element_count).toBe('number');
    expect(data.element_count).toBeGreaterThanOrEqual(0);

    const nearEarthObjects = data.near_earth_objects;
    expect(typeof nearEarthObjects).toBe('object');
  },

  // Check if component displays loading state
  expectLoadingState: (getByText) => {
    const loadingElement = getByText(/loading/i);
    expect(loadingElement).toBeInTheDocument();
  },

  // Wait for and validate data loading
  waitForDataLoad: async (waitFor, getByText, expectedData) => {
    await waitFor(() => {
      expect(getByText(expectedData.title || expectedData)).toBeInTheDocument();
    }, { timeout: 10000 });
  },

  // Validate error state
  expectErrorState: (getByText, expectedError) => {
    const errorElement = getByText(new RegExp(expectedError || 'error', 'i'));
    expect(errorElement).toBeInTheDocument();
  },
};

/**
 * Environment detection utilities
 */
export const environment = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isCI: () => process.env.CI === 'true',
  isTest: () => process.env.NODE_ENV === 'test',
};

/**
 * Create test data for real API tests
 */
export const createTestData = {
  // Create test APOD query parameters
  apodParams: (overrides = {}) => ({
    date: '2024-01-01',
    ...overrides,
  }),

  // Create test NEO query parameters
  neoParams: (overrides = {}) => ({
    start_date: '2024-01-01',
    end_date: '2024-01-07',
    ...overrides,
  }),

  // Create test resource data
  resourceData: (overrides = {}) => ({
    id: 'test-resource-1',
    type: 'APOD',
    title: 'Test Resource',
    url: 'https://test.com/image.jpg',
    category: 'test',
    description: 'Test description',
    ...overrides,
  }),
};

export default {
  IntegrationTestManager,
  checkServerHealth,
  waitForServer,
  makeApiRequest,
  assertions,
  environment,
  createTestData,
  TEST_CONFIG,
};