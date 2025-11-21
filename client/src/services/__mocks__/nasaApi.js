// Mock NASA API service for testing
// This prevents network errors in test environment

const mockNeoData = {
  element_count: 10,
  near_earth_objects: {
    '2024-01-01': [
      {
        id: '3724393',
        name: '(2015 OD22)',
        is_potentially_hazardous_asteroid: false,
        estimated_diameter: {
          meters: {
            estimated_diameter_max: 340.44,
          },
        },
        close_approach_data: [
          {
            miss_distance: {
              kilometers: '65417380.109699369',
            },
          },
        ],
      },
      {
        id: '54513047',
        name: '(2025 AB)',
        is_potentially_hazardous_asteroid: true,
        estimated_diameter: {
          meters: {
            estimated_diameter_max: 22.29,
          },
        },
        close_approach_data: [
          {
            miss_distance: {
              kilometers: '23693200.756004698',
            },
          },
        ],
      },
    ],
  },
};

// Mock successful API call
export const getNeoFeed = jest.fn().mockImplementation((_startDate, _endDate) => {
  return Promise.resolve({
    data: mockNeoData,
  });
});

// Mock APOD function as well for completeness
export const getApod = jest.fn().mockImplementation((_params = {}) => {
  return Promise.resolve({
    data: {
      title: 'Mock APOD Image',
      explanation: 'This is a mock APOD image for testing.',
      url: 'https://example.com/mock-image.jpg',
      date: '2024-01-01',
    },
  });
});

// Mock other functions
export const getSavedItems = jest.fn().mockResolvedValue({ data: [] });
export const saveItem = jest.fn().mockResolvedValue({ data: { id: 'test-item' } });
export const saveSearch = jest.fn().mockResolvedValue({ data: { id: 1 } });

// Export enhanced services as well
export const authService = {
  register: jest.fn().mockResolvedValue({
    data: { tokens: { accessToken: 'test', refreshToken: 'test' } },
  }),
  login: jest.fn().mockResolvedValue({
    data: { tokens: { accessToken: 'test', refreshToken: 'test' } },
  }),
  logout: jest.fn().mockResolvedValue({}),
  getProfile: jest.fn().mockResolvedValue({
    data: { user: { id: 1, name: 'Test User' } },
  }),
  updateProfile: jest.fn().mockResolvedValue({
    data: { user: { id: 1, name: 'Updated User' } },
  }),
};

export const nasaService = {
  getApodEnhanced: jest.fn().mockResolvedValue({ data: mockNeoData }),
  getRandomApod: jest.fn().mockResolvedValue({ data: mockNeoData }),
  getNEOsEnhanced: jest.fn().mockResolvedValue({ data: mockNeoData }),
  getMarsPhotosEnhanced: jest.fn().mockResolvedValue({ data: { photos: [] } }),
};

export const userService = {
  getFavorites: jest.fn().mockResolvedValue({ data: [] }),
  addToFavorites: jest.fn().mockResolvedValue({ data: { id: 'test' } }),
  removeFromFavorites: jest.fn().mockResolvedValue({ data: { success: true } }),
  getCollections: jest.fn().mockResolvedValue({ data: [] }),
  createCollection: jest.fn().mockResolvedValue({ data: { id: 'test-collection' } }),
};

export const searchService = {
  search: jest.fn().mockResolvedValue({ data: [] }),
  advancedSearch: jest.fn().mockResolvedValue({ data: [] }),
  getSuggestions: jest.fn().mockResolvedValue({ data: [] }),
};

export const systemService = {
  healthCheck: jest.fn().mockResolvedValue({ data: { status: 'healthy' } }),
  getSystemStatus: jest.fn().mockResolvedValue({ data: { status: 'ok' } }),
};

export const apiUtils = {
  isAuthenticated: jest.fn().mockReturnValue(true),
  getAccessToken: jest.fn().mockReturnValue('test-token'),
  clearTokens: jest.fn(),
  formatResponse: jest.fn((response) => response?.data || response),
  withLoading: jest.fn().mockImplementation(async (apiCall, setLoading) => {
    setLoading(true);
    try {
      const result = await apiCall();
      return result;
    } finally {
      setLoading(false);
    }
  }),
};

// Mock default export
export default {
  get: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
};