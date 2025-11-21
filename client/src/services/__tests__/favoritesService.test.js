/* eslint-disable */
/**
 * Favorites Service Unit Tests
 * Tests for favoritesService.js methods without mocking
 * Focus on input validation, error handling, and method behavior
  */

require('./testSetup');
const favoritesService = require('../services/favoritesService');
const apiClient = require('../services/apiClient');

describe('Favorites Service Unit Tests', () => {
  const mockApiResponse = (data, status = 200) => {
    const response = { data };
    if (status >= 400) {
      throw Object.assign(new Error('Request failed'), {
        response: {
          status,
          data: { message: 'API Error' },
        },
      });
    }
    return response;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    test('should call API with correct default parameters', async () => {
      const mockData = {
        favorites: [],
        pagination: { page: 1, limit: 20, total: 0 },
      };

      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      const result = await getFavorites();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites', {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockData);
    });

    test('should call API with custom parameters', async () => {
      const mockData = {
        favorites: [],
        pagination: { page: 2, limit: 10, total: 0 },
      };

      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      await getFavorites(2, 10, 'APOD');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites', {
        params: { page: 2, limit: 10, type: 'APOD' },
      });
    });

    test('should include type parameter when provided', async () => {
      const mockData = { favorites: [], pagination: { page: 1, limit: 20, total: 0 } };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      await getFavorites(1, 20, 'MARS');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites', {
        params: { page: 1, limit: 20, type: 'MARS' },
      });
    });

    test('should handle API error response', async () => {
      const errorMessage = 'Failed to fetch favorites';
      apiClient.get = jest.fn().mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(getFavorites()).rejects.toThrow(errorMessage);
      expect(console.error).toHaveBeenCalledWith('Error fetching favorites:', expect.any(Error));
    });

    test('should handle network error with generic message', async () => {
      apiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(getFavorites()).rejects.toThrow('Failed to fetch favorites');
      expect(console.error).toHaveBeenCalledWith('Error fetching favorites:', expect.any(Error));
    });

    test('should handle invalid parameters gracefully', async () => {
      const mockData = { favorites: [], pagination: { page: 1, limit: 20, total: 0 } };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      // Test with negative page (should still make the call, validation happens on server)
      await getFavorites(-1, 0, 'INVALID_TYPE');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites', {
        params: { page: -1, limit: 0, type: 'INVALID_TYPE' },
      });
    });
  });

  describe('addFavorite', () => {
    const validItemData = {
      id: 'test-123',
      type: 'APOD',
      title: 'Test Item',
      url: 'https://example.com/image.jpg',
      date: '2024-01-01',
    };

    test('should call API with correct item data', async () => {
      const mockResponse = { id: 'test-123', ...validItemData };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await addFavorite(validItemData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/favorites', validItemData);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API error response', async () => {
      const errorMessage = 'Item already exists';
      apiClient.post = jest.fn().mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(addFavorite(validItemData)).rejects.toThrow(errorMessage);
      expect(console.error).toHaveBeenCalledWith('Error adding favorite:', expect.any(Error));
    });

    test('should handle missing item data', async () => {
      const invalidData = { id: '', type: 'INVALID' };
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Validation error' } },
      });

      await expect(addFavorite(invalidData)).rejects.toThrow('Validation error');
    });

    test('should handle network error', async () => {
      apiClient.post = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(addFavorite(validItemData)).rejects.toThrow('Failed to add favorite');
    });

    test('should accept minimal valid item data', async () => {
      const minimalData = { id: 'test-456', type: 'NEO', title: 'Minimal Item' };
      const mockResponse = { id: 'test-456', ...minimalData };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await addFavorite(minimalData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/favorites', minimalData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('removeFavorite', () => {
    test('should call API with correct item ID', async () => {
      apiClient.delete = jest.fn().mockResolvedValue({ status: 204 });

      await removeFavorite('test-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/users/favorites/test-123');
    });

    test('should handle not found error', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Favorite not found' } },
      });

      await expect(removeFavorite('non-existent')).rejects.toThrow('Favorite not found');
      expect(console.error).toHaveBeenCalledWith('Error removing favorite:', expect.any(Error));
    });

    test('should handle network error', async () => {
      apiClient.delete = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(removeFavorite('test-123')).rejects.toThrow('Failed to remove favorite');
    });

    test('should handle empty item ID', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid item ID' } },
      });

      await expect(removeFavorite('')).rejects.toThrow('Invalid item ID');
    });
  });

  describe('getFavoriteById', () => {
    test('should call API with correct item ID', async () => {
      const mockResponse = { id: 'test-123', title: 'Test Item' };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await getFavoriteById('test-123');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites/test-123');
      expect(result).toEqual(mockResponse);
    });

    test('should handle not found error', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Favorite not found' } },
      });

      await expect(getFavoriteById('non-existent')).rejects.toThrow('Favorite not found');
      expect(console.error).toHaveBeenCalledWith('Error fetching favorite:', expect.any(Error));
    });

    test('should handle network error', async () => {
      apiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(getFavoriteById('test-123')).rejects.toThrow('Failed to fetch favorite');
    });
  });

  describe('isFavorited', () => {
    test('should return true when item exists', async () => {
      const mockResponse = { id: 'test-123', title: 'Test Item' };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await isFavorited('test-123');

      expect(result).toBe(true);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites/test-123');
    });

    test('should return false when item does not exist (404)', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Favorite not found' } },
      });

      const result = await isFavorited('non-existent');

      expect(result).toBe(false);
    });

    test('should propagate non-404 errors', async () => {
      const errorMessage = 'Server error';
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 500, data: { message: errorMessage } },
      });

      await expect(isFavorited('test-123')).rejects.toThrow(errorMessage);
    });

    test('should handle network errors', async () => {
      apiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(isFavorited('test-123')).rejects.toThrow('Network error');
    });

    test('should handle empty item ID', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid item ID' } },
      });

      // Since this is not a 404, it should throw an error
      await expect(isFavorited('')).rejects.toThrow('Invalid item ID');
    });
  });

  describe('Input Validation and Edge Cases', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      const mockData = { favorites: [], pagination: { page: 1, limit: 20, total: 0 } };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      // These should not crash, but let the server handle validation
      await getFavorites(null, undefined, null);
      expect(apiClient.get).toHaveBeenCalled();
    });

    test('should handle extremely long strings', async () => {
      const longString = 'a'.repeat(10000);
      const mockData = { favorites: [], pagination: { page: 1, limit: 20, total: 0 } };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      await getFavorites(1, 20, longString);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/favorites', {
        params: { page: 1, limit: 20, type: longString },
      });
    });

    test('should handle special characters in item data', async () => {
      const specialData = {
        id: 'test-🚀-123',
        type: 'APOD',
        title: 'Test with "quotes" and \'apostrophes\' & symbols',
        url: 'https://example.com/image.jpg?param=value&other=测试',
      };

      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(specialData));

      const result = await addFavorite(specialData);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/favorites', specialData);
      expect(result).toEqual(specialData);
    });
  });

  describe('Error Handling Patterns', () => {
    test('should handle missing response data gracefully', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: {}, // No data property
      });

      await expect(getFavorites()).rejects.toThrow('Failed to fetch favorites');
    });

    test('should handle missing error message in response', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { data: {} }, // No message property
      });

      await expect(addFavorite({})).rejects.toThrow('Failed to add favorite');
    });

    test('should handle malformed error objects', async () => {
      apiClient.delete = jest.fn().mockRejectedValue('String error instead of object');

      await expect(removeFavorite('test')).rejects.toThrow('Failed to remove favorite');
    });
  });
});