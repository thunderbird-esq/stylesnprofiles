const request = require('supertest');
const express = require('express');
const axios = require('axios');

// Mock axios
jest.mock('axios');

const app = express();
app.use(express.json());

// Import and use the router
const apiProxyRouter = require('../routes/apiProxy');
app.use('/api', apiProxyRouter);

describe('API Proxy Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/apod', () => {
    test('should return APOD data successfully', async () => {
      const mockApodData = {
        title: 'Test Astronomy Picture',
        explanation: 'This is a test explanation of the astronomy picture.',
        url: 'https://example.com/apod.jpg',
        hdurl: 'https://example.com/apod-hd.jpg',
        date: '2024-01-01',
        media_type: 'image',
      };

      axios.get.mockResolvedValue({ data: mockApodData });

      const response = await request(app)
        .get('/api/apod')
        .expect(200);

      expect(response.body).toEqual(mockApodData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nasa.gov/apod'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: expect.any(String),
          }),
        }),
      );
    });

    test('should handle APOD API errors', async () => {
      axios.get.mockRejectedValue(new Error('API Error'));

      const response = await request(app)
        .get('/api/apod')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
      });
    });

    test('should handle missing API key', async () => {
      // Temporarily remove NASA_API_KEY
      const originalApiKey = process.env.NASA_API_KEY;
      delete process.env.NASA_API_KEY;

      const response = await request(app)
        .get('/api/apod')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
      });

      // Restore the API key
      process.env.NASA_API_KEY = originalApiKey;
    });
  });

  describe('GET /api/apod with date parameter', () => {
    test('should return APOD data for specific date', async () => {
      const mockApodData = {
        title: 'Test Picture for Specific Date',
        explanation: 'This is a test explanation.',
        url: 'https://example.com/apod-dated.jpg',
        date: '2023-12-25',
        media_type: 'image',
      };

      axios.get.mockResolvedValue({ data: mockApodData });

      const response = await request(app)
        .get('/api/apod')
        .query({ date: '2023-12-25' })
        .expect(200);

      expect(response.body).toEqual(mockApodData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nasa.gov/apod'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: expect.any(String),
            date: '2023-12-25',
          }),
        }),
      );
    });
  });

  describe('GET /api/neo', () => {
    test('should return NEO data successfully', async () => {
      const mockNeoData = {
        element_count: 3,
        near_earth_objects: {
          '2024-01-01': [
            {
              id: '12345',
              name: '(2024 AB)',
              estimated_diameter: {
                meters: {
                  estimated_diameter_min: 100,
                  estimated_diameter_max: 200,
                },
              },
              is_potentially_hazardous_asteroid: true,
              close_approach_data: [
                {
                  close_approach_date: '2024-01-01',
                  miss_distance: {
                    kilometers: '5000000',
                  },
                },
              ],
            },
          ],
        },
      };

      axios.get.mockResolvedValue({ data: mockNeoData });

      const response = await request(app)
        .get('/api/neo')
        .expect(200);

      expect(response.body).toEqual(mockNeoData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nasa.gov/neo'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: expect.any(String),
          }),
        }),
      );
    });

    test('should handle NEO API errors', async () => {
      axios.get.mockRejectedValue(new Error('NEO API Error'));

      const response = await request(app)
        .get('/api/neo')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal server error',
      });
    });
  });

  describe('GET /api/neo with date parameters', () => {
    test('should return NEO data for date range', async () => {
      const mockNeoData = {
        element_count: 5,
        near_earth_objects: {
          '2024-01-01': [],
          '2024-01-02': [],
          '2024-01-03': [],
        },
      };

      axios.get.mockResolvedValue({ data: mockNeoData });

      const response = await request(app)
        .get('/api/neo')
        .query({ start_date: '2024-01-01', end_date: '2024-01-03' })
        .expect(200);

      expect(response.body).toEqual(mockNeoData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nasa.gov/neo'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: expect.any(String),
            start_date: '2024-01-01',
            end_date: '2024-01-03',
          }),
        }),
      );
    });
  });

  describe('GET /api/neo/browse', () => {
    test('should return browsable NEO data', async () => {
      const mockBrowseData = {
        page: {
          size: 20,
          total_elements: 2000,
          total_pages: 100,
          number: 0,
        },
        near_earth_objects: [
          {
            id: '12345',
            name: '(2024 AB)',
            estimated_diameter: {
              meters: {
                estimated_diameter_min: 100,
                estimated_diameter_max: 200,
              },
            },
          },
        ],
      };

      axios.get.mockResolvedValue({ data: mockBrowseData });

      const response = await request(app)
        .get('/api/neo/browse')
        .expect(200);

      expect(response.body).toEqual(mockBrowseData);
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('https://api.nasa.gov/neo/browse'),
        expect.objectContaining({
          params: expect.objectContaining({
            api_key: expect.any(String),
          }),
        }),
      );
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limiting from NASA API', async () => {
      const rateLimitError = new Error('Rate limit exceeded');
      rateLimitError.response = {
        status: 429,
        data: { error: 'Rate limit exceeded' },
      };
      
      axios.get.mockRejectedValue(rateLimitError);

      const response = await request(app)
        .get('/api/apod')
        .expect(429);

      expect(response.body).toEqual({
        error: {
          error: 'Rate limit exceeded',
        },
      });
    });
  });
});