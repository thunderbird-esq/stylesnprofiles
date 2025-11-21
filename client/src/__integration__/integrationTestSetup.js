/**
 * Integration Test Setup
 *
 * Global setup for integration tests that handles mocking and environment configuration.
 * This file should be imported at the top of integration test files.
 *
 * @module integrationTestSetup
 */

import axios from 'axios';

// Sample test data
const mockApodData = {
  title: 'Test Astronomy Picture',
  date: '2024-01-15',
  explanation:
      'This is a test explanation for the astronomy picture of the day. ' +
      'It provides detailed information about the celestial object or ' +
      'phenomenon captured in the image.',
  url: 'https://test-nasa-images.com/test-image.jpg',
  hdurl: 'https://test-nasa-images.com/test-image-hd.jpg',
  media_type: 'image',
  copyright: 'Test Copyright',
  service_version: 'v1',
};

const mockNeoWsData = {
  links: [],
  element_count: 1,
  near_earth_objects: {
    '2024-01-15': [
      {
        id: '12345',
        neo_reference_id: '123456',
        name: 'Test Asteroid (2024 TEST)',
        absolute_magnitude_h: 19.5,
        estimated_diameter: {
          kilometers: { estimated_diameter_min: 0.2, estimated_diameter_max: 0.4 },
        },
        is_potentially_hazardous_asteroid: false,
        close_approach_data: [
          {
            close_approach_date: '2024-01-15',
            relative_velocity: {
              kilometers_per_hour: '55800',
            },
            miss_distance: {
              lunar: '38.9',
              kilometers: '14959787',
            },
            orbiting_body: 'Earth',
          },
        ],
        is_sentry_object: false,
      },
    ],
  },
};

const healthCheckResponse = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  server: 'integration-test-server',
  version: '1.0.0',
};

/**
 * Setup mocks for integration tests
 */
export const setupIntegrationMocks = () => {
  const mockAxiosGet = jest.fn();
  const mockAxiosPost = jest.fn();
  const mockAxiosPut = jest.fn();
  const mockAxiosDelete = jest.fn();

  // Mock axios create to return the same mocked axios instance
  const mockAxiosInstance = {
    get: mockAxiosGet,
    post: mockAxiosPost,
    put: mockAxiosPut,
    delete: mockAxiosDelete,
    defaults: {
      baseURL: 'http://localhost:3001',
      timeout: 10000,
      headers: {},
    },
    interceptors: {
      request: {
        use: jest.fn(),
        eject: jest.fn(),
      },
      response: {
        use: jest.fn(),
        eject: jest.fn(),
      },
    },
  };

  // Mock axios create method to return our mock instance
  axios.create = jest.fn(() => mockAxiosInstance);

  // Mock axios get method
  axios.get = mockAxiosGet.mockImplementation((url) => {
    console.log(`🔧 Mock API GET: ${url}`);

    if (url.includes('/health')) {
      return Promise.resolve({
        data: healthCheckResponse,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url },
        request: {},
      });
    }

    if (url.includes('/nasa/planetary/apod')) {
      /* eslint-disable-next-line no-undef */
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const date = urlParams.get('date');
      const hd = urlParams.get('hd') === 'true';
      const media = urlParams.get('media');

      const responseData = { ...mockApodData };

      if (date) {
        responseData.date = date;
        responseData.title = `Test Astronomy Picture for ${date}`;
      }

      if (hd && responseData.hdurl) {
        responseData.url = responseData.hdurl;
      }

      if (media === 'video') {
        responseData.media_type = 'video';
        responseData.url = 'https://www.youtube.com/watch?v=test-video';
        responseData.hdurl = undefined;
      }

      return Promise.resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url },
        request: {},
      });
    }

    if (url.includes('/nasa/neo/rest/v1/feed')) {
      /* eslint-disable-next-line no-undef */
      const urlParams = new URLSearchParams(url.split('?')[1]);
      const startDate = urlParams.get('start_date');

      const responseData = { ...mockNeoWsData };

      // Handle dynamic date from NeoWsApp
      if (startDate) {
        const newDate = new Date(startDate).toISOString().split('T')[0];
        if (!responseData.near_earth_objects[newDate]) {
          responseData.near_earth_objects[newDate] = responseData.near_earth_objects['2024-01-15'];
          delete responseData.near_earth_objects['2024-01-15'];
        }
      } else {
        // If no date specified, use today's date
        const today = new Date().toISOString().split('T')[0];
        if (!responseData.near_earth_objects[today]) {
          responseData.near_earth_objects[today] = responseData.near_earth_objects['2024-01-15'];
          delete responseData.near_earth_objects['2024-01-15'];
        }
      }

      return Promise.resolve({
        data: responseData,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { url },
        request: {},
      });
    }

    if (url.includes('/error-test')) {
      return Promise.reject(new Error('Test server error'));
    }

    // Default response
    return Promise.resolve({
      data: { message: 'Mock response' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url },
      request: {},
    });
  });

  // Mock other axios methods
  mockAxiosPost.mockImplementation((url, data) => {
    console.log(`🔧 Mock API POST: ${url}`);
    return Promise.resolve({
      data: { ...data, id: 'mock-id', created: true },
      status: 201,
      statusText: 'Created',
      headers: {},
      config: { url },
      request: {},
    });
  });

  mockAxiosPut.mockImplementation((url, data) => {
    console.log(`🔧 Mock API PUT: ${url}`);
    return Promise.resolve({
      data: { ...data, updated: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { url },
      request: {},
    });
  });

  mockAxiosDelete.mockImplementation((url) => {
    console.log(`🔧 Mock API DELETE: ${url}`);
    return Promise.resolve({
      data: { deleted: true },
      status: 204,
      statusText: 'No Content',
      headers: {},
      config: { url },
      request: {},
    });
  });

  // Also set these on the main axios object
  axios.post = mockAxiosPost;
  axios.put = mockAxiosPut;
  axios.delete = mockAxiosDelete;

  // Mock axios defaults
  axios.defaults = {
    baseURL: 'http://localhost:3001',
    timeout: 10000,
    headers: {},
  };

  // Mock axios interceptors
  axios.interceptors = {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  };

  return {
    mockAxiosGet,
    mockAxiosPost,
    mockAxiosPut,
    mockAxiosDelete,
  };
};

/**
 * Test data factories
 */
export const createTestData = {
  apod: (overrides = {}) => ({
    title: 'Test Astronomy Picture',
    date: '2024-01-15',
    explanation: 'This is a test explanation for astronomy picture.',
    url: 'https://example.com/image.jpg',
    hdurl: 'https://example.com/image-hd.jpg',
    media_type: 'image',
    copyright: 'Test Copyright',
    service_version: 'v1',
    ...overrides,
  }),

  apodVideo: (overrides = {}) => createTestData.apod({
    media_type: 'video',
    url: 'https://www.youtube.com/watch?v=test',
    hdurl: undefined,
    ...overrides,
  }),

  neows: (overrides = {}) => ({
    links: [],
    element_count: 1,
    near_earth_objects: {
      '2024-01-15': [
        {
          id: '12345',
          neo_reference_id: '123456',
          name: 'Test Asteroid (2024 TEST)',
          absolute_magnitude_h: 19.5,
          estimated_diameter: {
            kilometers: { estimated_diameter_min: 0.2, estimated_diameter_max: 0.4 },
          },
          is_potentially_hazardous_asteroid: false,
          close_approach_data: [
            {
              close_approach_date: '2024-01-15',
              relative_velocity: {
                kilometers_per_hour: '55800',
              },
              miss_distance: {
                lunar: '38.9',
                kilometers: '14959787',
              },
              orbiting_body: 'Earth',
            },
          ],
          is_sentry_object: false,
        },
      ],
    },
    ...overrides,
  }),
};

/**
 * Environment utilities
 */
export const environment = {
  isMockMode: () => process.env.REACT_APP_USE_MOCK_SERVER === 'true',
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isCI: () => process.env.CI === 'true',
};

/**
 * Test assertion helpers
 */
export const assertions = {
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

  validateNeoWsData: (data) => {
    expect(data).toHaveProperty('element_count');
    expect(data).toHaveProperty('near_earth_objects');
    expect(typeof data.element_count).toBe('number');
    expect(data.element_count).toBeGreaterThan(0);

    const nearEarthObjects = data.near_earth_objects;
    expect(typeof nearEarthObjects).toBe('object');
    expect(Object.keys(nearEarthObjects).length).toBeGreaterThan(0);
  },
};

export default {
  setupIntegrationMocks,
  createTestData,
  environment,
  assertions,
};