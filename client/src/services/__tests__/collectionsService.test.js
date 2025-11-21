/**
 * Collections Service Unit Tests
 * Tests for collectionsService.js methods without mocking
 * Focus on input validation, error handling, and method behavior
 */

import {
  getCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollectionItems,
  addItemToCollection,
  removeItemFromCollection,
} from '../services/collectionsService';
import apiClient from '../services/apiClient';

// Mock console.error to keep test output clean
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

describe('Collections Service Unit Tests', () => {
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

  describe('getCollections', () => {
    test('should call API with correct endpoint', async () => {
      const mockData = [
        { id: '1', name: 'Collection 1' },
        { id: '2', name: 'Collection 2' },
      ];
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      const result = await getCollections();

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/collections');
      expect(result).toEqual(mockData);
    });

    test('should handle API error response', async () => {
      const errorMessage = 'Failed to fetch collections';
      apiClient.get = jest.fn().mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      await expect(getCollections()).rejects.toThrow(errorMessage);
      expect(console.error).toHaveBeenCalledWith('Error fetching collections:', expect.any(Error));
    });

    test('should handle network error with generic message', async () => {
      apiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(getCollections()).rejects.toThrow('Failed to fetch collections');
      expect(console.error).toHaveBeenCalledWith('Error fetching collections:', expect.any(Error));
    });

    test('should handle empty collections array', async () => {
      const mockData = [];
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockData));

      const result = await getCollections();

      expect(result).toEqual([]);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/collections');
    });
  });

  describe('createCollection', () => {
    test('should call API with correct collection data', async () => {
      const collectionData = {
        name: 'Test Collection',
        description: 'A test collection',
        is_public: false,
      };
      const mockResponse = { id: '123', ...collectionData };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await createCollection('Test Collection', 'A test collection', false);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections', {
        name: 'Test Collection',
        description: 'A test collection',
        is_public: false,
      });
      expect(result).toEqual(mockResponse);
    });

    test('should use default values for optional parameters', async () => {
      const collectionData = {
        name: 'Test Collection',
        description: '',
        is_public: false,
      };
      const mockResponse = { id: '123', ...collectionData };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      await createCollection('Test Collection');

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections', {
        name: 'Test Collection',
        description: '',
        is_public: false,
      });
    });

    test('should handle public collection creation', async () => {
      const collectionData = {
        name: 'Public Collection',
        description: 'A public collection',
        is_public: true,
      };
      const mockResponse = { id: '123', ...collectionData };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      await createCollection('Public Collection', 'A public collection', true);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections', {
        name: 'Public Collection',
        description: 'A public collection',
        is_public: true,
      });
    });

    test('should handle validation errors', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Name is required' } },
      });

      await expect(createCollection('')).rejects.toThrow('Name is required');
      expect(console.error).toHaveBeenCalledWith('Error creating collection:', expect.any(Error));
    });

    test('should handle network error', async () => {
      apiClient.post = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(createCollection('Test')).rejects.toThrow('Failed to create collection');
    });

    test('should handle long names and descriptions', async () => {
      const longName = 'a'.repeat(100);
      const longDescription = 'b'.repeat(500);
      const collectionData = {
        name: longName,
        description: longDescription,
        is_public: false,
      };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse({ id: '123', ...collectionData }));

      await createCollection(longName, longDescription);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections', collectionData);
    });
  });

  describe('getCollectionById', () => {
    test('should call API with correct collection ID', async () => {
      const mockResponse = { id: '123', name: 'Test Collection' };
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await getCollectionById('123');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/collections/123');
      expect(result).toEqual(mockResponse);
    });

    test('should handle not found error', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Collection not found' } },
      });

      await expect(getCollectionById('non-existent')).rejects.toThrow('Collection not found');
      expect(console.error).toHaveBeenCalledWith('Error fetching collection:', expect.any(Error));
    });

    test('should handle network error', async () => {
      apiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(getCollectionById('123')).rejects.toThrow('Failed to fetch collection');
    });

    test('should handle empty collection ID', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid collection ID' } },
      });

      await expect(getCollectionById('')).rejects.toThrow('Invalid collection ID');
    });
  });

  describe('updateCollection', () => {
    test('should call API with correct update data', async () => {
      const updates = {
        name: 'Updated Collection',
        description: 'Updated description',
        is_public: true,
      };
      const mockResponse = { id: '123', ...updates };
      apiClient.patch = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await updateCollection('123', updates);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/collections/123', updates);
      expect(result).toEqual(mockResponse);
    });

    test('should handle partial updates', async () => {
      const updates = { name: 'New Name' };
      const mockResponse = { id: '123', name: 'New Name' };
      apiClient.patch = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      await updateCollection('123', updates);

      expect(apiClient.patch).toHaveBeenCalledWith('/api/v1/users/collections/123', updates);
    });

    test('should handle not found error', async () => {
      apiClient.patch = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Collection not found' } },
      });

      await expect(updateCollection('non-existent', {})).rejects.toThrow('Collection not found');
      expect(console.error).toHaveBeenCalledWith('Error updating collection:', expect.any(Error));
    });

    test('should handle validation errors', async () => {
      apiClient.patch = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid update data' } },
      });

      await expect(updateCollection('123', { name: '' })).rejects.toThrow('Invalid update data');
    });

    test('should handle network error', async () => {
      apiClient.patch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(updateCollection('123', {})).rejects.toThrow('Failed to update collection');
    });
  });

  describe('deleteCollection', () => {
    test('should call API with correct collection ID', async () => {
      apiClient.delete = jest.fn().mockResolvedValue({ status: 204 });

      await deleteCollection('123');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/users/collections/123');
    });

    test('should handle not found error', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Collection not found' } },
      });

      await expect(deleteCollection('non-existent')).rejects.toThrow('Collection not found');
      expect(console.error).toHaveBeenCalledWith('Error deleting collection:', expect.any(Error));
    });

    test('should handle network error', async () => {
      apiClient.delete = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(deleteCollection('123')).rejects.toThrow('Failed to delete collection');
    });

    test('should handle empty collection ID', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid collection ID' } },
      });

      await expect(deleteCollection('')).rejects.toThrow('Invalid collection ID');
    });
  });

  describe('getCollectionItems', () => {
    test('should call API with correct collection ID', async () => {
      const mockItems = [
        { id: '1', title: 'Item 1' },
        { id: '2', title: 'Item 2' },
      ];
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockItems));

      const result = await getCollectionItems('123');

      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/collections/123/items');
      expect(result).toEqual(mockItems);
    });

    test('should handle empty items array', async () => {
      const mockItems = [];
      apiClient.get = jest.fn().mockResolvedValue(mockApiResponse(mockItems));

      const result = await getCollectionItems('123');

      expect(result).toEqual([]);
      expect(apiClient.get).toHaveBeenCalledWith('/api/v1/users/collections/123/items');
    });

    test('should handle collection not found', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Collection not found' } },
      });

      await expect(getCollectionItems('non-existent')).rejects.toThrow('Collection not found');
      expect(console.error).toHaveBeenCalledWith('Error fetching collection items:', expect.any(Error));
    });

    test('should handle network error', async () => {
      apiClient.get = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(getCollectionItems('123')).rejects.toThrow('Failed to fetch collection items');
    });
  });

  describe('addItemToCollection', () => {
    test('should call API with correct collection and item IDs', async () => {
      const mockResponse = { collection_id: '123', item_id: '456' };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse(mockResponse));

      const result = await addItemToCollection('123', '456');

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections/123/items', {
        itemId: '456',
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle collection not found', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Collection not found' } },
      });

      await expect(addItemToCollection('non-existent', '456')).rejects.toThrow('Collection not found');
      expect(console.error).toHaveBeenCalledWith('Error adding item to collection:', expect.any(Error));
    });

    test('should handle item not found', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Item not found in saved items' } },
      });

      await expect(addItemToCollection('123', 'non-existent')).rejects.toThrow('Item not found in saved items');
    });

    test('should handle duplicate item error', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 409, data: { message: 'Item already in collection' } },
      });

      await expect(addItemToCollection('123', '456')).rejects.toThrow('Item already in collection');
    });

    test('should handle validation errors', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Item ID is required' } },
      });

      await expect(addItemToCollection('123', '')).rejects.toThrow('Item ID is required');
    });

    test('should handle network error', async () => {
      apiClient.post = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(addItemToCollection('123', '456')).rejects.toThrow('Failed to add item to collection');
    });
  });

  describe('removeItemFromCollection', () => {
    test('should call API with correct collection and item IDs', async () => {
      apiClient.delete = jest.fn().mockResolvedValue({ status: 204 });

      await removeItemFromCollection('123', '456');

      expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/users/collections/123/items/456');
    });

    test('should handle collection not found', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Collection not found' } },
      });

      await expect(removeItemFromCollection('non-existent', '456')).rejects.toThrow('Collection not found');
      expect(console.error).toHaveBeenCalledWith('Error removing item from collection:', expect.any(Error));
    });

    test('should handle item not found in collection', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 404, data: { message: 'Item not found in collection' } },
      });

      await expect(removeItemFromCollection('123', 'non-existent')).rejects.toThrow('Item not found in collection');
    });

    test('should handle network error', async () => {
      apiClient.delete = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(removeItemFromCollection('123', '456')).rejects.toThrow('Failed to remove item from collection');
    });

    test('should handle empty IDs', async () => {
      apiClient.delete = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Invalid IDs' } },
      });

      await expect(removeItemFromCollection('', '')).rejects.toThrow('Invalid IDs');
    });
  });

  describe('Input Validation and Edge Cases', () => {
    test('should handle special characters in collection names', async () => {
      const specialName = 'Collection with "quotes" & symbols 🚀';
      const collectionData = {
        name: specialName,
        description: '',
        is_public: false,
      };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse({ id: '123', ...collectionData }));

      await createCollection(specialName);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections', collectionData);
    });

    test('should handle unicode characters in descriptions', async () => {
      const unicodeDescription = 'Description with ñiño and 中文 and русский';
      const collectionData = {
        name: 'Test',
        description: unicodeDescription,
        is_public: false,
      };
      apiClient.post = jest.fn().mockResolvedValue(mockApiResponse({ id: '123', ...collectionData }));

      await createCollection('Test', unicodeDescription);

      expect(apiClient.post).toHaveBeenCalledWith('/api/v1/users/collections', collectionData);
    });

    test('should handle null and undefined inputs gracefully', async () => {
      // Test with empty strings instead of null/undefined since the service expects strings
      apiClient.post = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'Validation error' } },
      });

      await expect(createCollection('', undefined, null)).rejects.toThrow('Failed to create collection');
    });

    test('should handle extremely long IDs', async () => {
      const longId = 'a'.repeat(1000);
      apiClient.get = jest.fn().mockRejectedValue({
        response: { status: 400, data: { message: 'ID too long' } },
      });

      await expect(getCollectionById(longId)).rejects.toThrow('ID too long');
    });
  });

  describe('Error Handling Patterns', () => {
    test('should handle missing response data gracefully', async () => {
      apiClient.get = jest.fn().mockRejectedValue({
        response: {}, // No data property
      });

      await expect(getCollections()).rejects.toThrow('Failed to fetch collections');
    });

    test('should handle missing error message in response', async () => {
      apiClient.post = jest.fn().mockRejectedValue({
        response: { data: {} }, // No message property
      });

      await expect(createCollection('Test')).rejects.toThrow('Failed to create collection');
    });

    test('should handle malformed error objects', async () => {
      apiClient.delete = jest.fn().mockRejectedValue('String error instead of object');

      await expect(deleteCollection('test')).rejects.toThrow('Failed to delete collection');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.code = 'ECONNABORTED';
      apiClient.get = jest.fn().mockRejectedValue(timeoutError);

      await expect(getCollections()).rejects.toThrow('Failed to fetch collections');
    });
  });
});