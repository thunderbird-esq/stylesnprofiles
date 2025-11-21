/**
 * User Resources Integration Tests
 * Tests all user resource endpoints with real database connections
 * No mocks - uses actual server endpoints and database
 *
 * Endpoints covered:
 * Favorites (4): GET, POST, GET/:id, DELETE/:id
 * Collections (8): GET, POST, GET/:id, PATCH/:id, DELETE/:id,
 *                  GET/:id/items, POST/:id/items, DELETE/:id/items/:itemId
 */

import axios from 'axios';
import { checkServerHealth, waitForServer } from './integrationTestHelpers';

// Test configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';
const TEST_TIMEOUT = 30000;

// Test user authentication token (would normally come from login)
let testAuthToken = '';
const testUserId = 'test-user-integration';

// Test data tracking for cleanup
const createdFavorites = [];
const createdCollections = [];

describe('User Resources Integration Tests', () => {
  beforeAll(async () => {
    console.log('🚀 Starting User Resources Integration Tests...');

    // Wait for server to be available
    await waitForServer();

    // Generate a test JWT token for authentication
    testAuthToken = await generateTestToken();

    // Set up axios defaults for authentication
    axios.defaults.headers.common['Authorization'] = `Bearer ${testAuthToken}`;
    axios.defaults.timeout = TEST_TIMEOUT;
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log('🧹 Cleaning up test data...');

    // Clean up created test data
    await cleanupTestData();

    // Reset axios defaults
    delete axios.defaults.headers.common['Authorization'];
  }, TEST_TIMEOUT);

  describe('Favorites API - Complete CRUD Operations', () => {
    let testFavoriteId;

    test('GET /api/v1/users/favorites - Should return empty favorites initially', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/favorites`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('favorites');
      expect(response.data).toHaveProperty('pagination');
      expect(Array.isArray(response.data.favorites)).toBe(true);
      expect(response.data.favorites).toHaveLength(0);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(20);
    });

    test('POST /api/v1/users/favorites - Should create a new favorite', async () => {
      const favoriteData = {
        id: `test-fav-${Date.now()}`,
        type: 'APOD',
        title: 'Test APOD Image',
        url: 'https://apod.nasa.gov/apod/image/test.jpg',
        date: '2024-01-01',
        explanation: 'Test astronomical picture',
      };

      const response = await axios.post(`${API_BASE_URL}/users/favorites`, favoriteData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id', favoriteData.id);
      expect(response.data).toHaveProperty('type', favoriteData.type);
      expect(response.data).toHaveProperty('title', favoriteData.title);
      expect(response.data).toHaveProperty('url', favoriteData.url);

      testFavoriteId = favoriteData.id;
      createdFavorites.push(favoriteData.id);
    });

    test('POST /api/v1/users/favorites - Should handle duplicate favorites', async () => {
      const favoriteData = {
        id: `test-duplicate-${Date.now()}`,
        type: 'NEO',
        title: 'Test NEO Object',
      };

      // Create first favorite
      await axios.post(`${API_BASE_URL}/users/favorites`, favoriteData);
      createdFavorites.push(favoriteData.id);

      // Try to create the same favorite again
      try {
        await axios.post(`${API_BASE_URL}/users/favorites`, favoriteData);
        fail('Should have thrown an error for duplicate favorite');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data).toHaveProperty('message', 'Item already in favorites');
      }
    });

    test('GET /api/v1/users/favorites - Should return created favorites', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/favorites`);

      expect(response.status).toBe(200);
      expect(response.data.favorites.length).toBeGreaterThan(0);

      // Should find our created favorite
      const createdFav = response.data.favorites.find(fav => fav.id === testFavoriteId);
      expect(createdFav).toBeDefined();
      expect(createdFav.title).toBe('Test APOD Image');
    });

    test('GET /api/v1/users/favorites with pagination - Should paginate results', async () => {
      // Create multiple favorites
      for (let i = 0; i < 5; i++) {
        const favData = {
          id: `test-page-${i}-${Date.now()}`,
          type: 'APOD',
          title: `Test Favorite ${i}`,
          url: `https://example.com/image${i}.jpg`,
        };

        await axios.post(`${API_BASE_URL}/users/favorites`, favData);
        createdFavorites.push(favData.id);
      }

      // Test pagination with limit 2
      const response = await axios.get(`${API_BASE_URL}/users/favorites?page=1&limit=2`);

      expect(response.status).toBe(200);
      expect(response.data.favorites.length).toBeLessThanOrEqual(2);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(2);
      expect(response.data.pagination.total).toBeGreaterThan(0);
    });

    test('GET /api/v1/users/favorites with type filter - Should filter by type', async () => {
      // Create a MARS favorite
      const marsFav = {
        id: `test-mars-${Date.now()}`,
        type: 'MARS',
        title: 'Test Mars Image',
        url: 'https://mars.nasa.gov/test.jpg',
      };

      await axios.post(`${API_BASE_URL}/users/favorites`, marsFav);
      createdFavorites.push(marsFav.id);

      // Filter by type MARS
      const response = await axios.get(`${API_BASE_URL}/users/favorites?type=MARS`);

      expect(response.status).toBe(200);
      response.data.favorites.forEach(fav => {
        expect(fav.type).toBe('MARS');
      });

      // Should find our MARS favorite
      const marsFavorite = response.data.favorites.find(fav => fav.id === marsFav.id);
      expect(marsFavorite).toBeDefined();
    });

    test('GET /api/v1/users/favorites/:id - Should return specific favorite', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/favorites/${testFavoriteId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', testFavoriteId);
      expect(response.data).toHaveProperty('title', 'Test APOD Image');
    });

    test('GET /api/v1/users/favorites/:id - Should handle non-existent favorite', async () => {
      try {
        await axios.get(`${API_BASE_URL}/users/favorites/non-existent-id`);
        fail('Should have thrown an error for non-existent favorite');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('message', 'Favorite not found');
      }
    });

    test('DELETE /api/v1/users/favorites/:id - Should remove favorite', async () => {
      const response = await axios.delete(`${API_BASE_URL}/users/favorites/${testFavoriteId}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      try {
        await axios.get(`${API_BASE_URL}/users/favorites/${testFavoriteId}`);
        fail('Should have thrown an error for deleted favorite');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }

      // Remove from cleanup list since it's already deleted
      const index = createdFavorites.indexOf(testFavoriteId);
      if (index > -1) {
        createdFavorites.splice(index, 1);
      }
    });

    test('DELETE /api/v1/users/favorites/:id - Should handle non-existent favorite', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/users/favorites/non-existent-id`);
        fail('Should have thrown an error for non-existent favorite');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('message', 'Favorite not found');
      }
    });

    test('POST /api/v1/users/favorites - Should validate input data', async () => {
      const invalidData = {
        id: '', // Invalid: empty
        type: 'INVALID_TYPE', // Invalid: not in enum
        title: 'x'.repeat(300), // Invalid: too long
      };

      try {
        await axios.post(`${API_BASE_URL}/users/favorites`, invalidData);
        fail('Should have thrown a validation error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('errors');
        expect(Array.isArray(error.response.data.errors)).toBe(true);
      }
    });
  });

  describe('Collections API - Complete CRUD Operations', () => {
    let testCollectionId;
    let testItemId;

    test('GET /api/v1/users/collections - Should return empty collections initially', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/collections`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(0);
    });

    test('POST /api/v1/users/collections - Should create a new collection', async () => {
      const collectionData = {
        name: 'Test Collection',
        description: 'A test collection for integration testing',
        is_public: false,
      };

      const response = await axios.post(`${API_BASE_URL}/users/collections`, collectionData);

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('name', collectionData.name);
      expect(response.data).toHaveProperty('description', collectionData.description);
      expect(response.data).toHaveProperty('is_public', collectionData.is_public);
      expect(response.data).toHaveProperty('created_at');

      testCollectionId = response.data.id;
      createdCollections.push(testCollectionId);
    });

    test('POST /api/v1/users/collections - Should create public collection', async () => {
      const collectionData = {
        name: 'Public Test Collection',
        description: 'A public test collection',
        is_public: true,
      };

      const response = await axios.post(`${API_BASE_URL}/users/collections`, collectionData);

      expect(response.status).toBe(201);
      expect(response.data.is_public).toBe(true);

      createdCollections.push(response.data.id);
    });

    test('GET /api/v1/users/collections - Should return created collections', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/collections`);

      expect(response.status).toBe(200);
      expect(response.data.length).toBeGreaterThan(0);

      // Should find our created collection
      const createdCollection = response.data.find(col => col.id === testCollectionId);
      expect(createdCollection).toBeDefined();
      expect(createdCollection.name).toBe('Test Collection');
    });

    test('GET /api/v1/users/collections/:id - Should return specific collection', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/collections/${testCollectionId}`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('id', testCollectionId);
      expect(response.data).toHaveProperty('name', 'Test Collection');
      expect(response.data).toHaveProperty('description', 'A test collection for integration testing');
    });

    test('PATCH /api/v1/users/collections/:id - Should update collection', async () => {
      const updateData = {
        name: 'Updated Test Collection',
        description: 'Updated description',
        is_public: true,
      };

      const response = await axios.patch(`${API_BASE_URL}/users/collections/${testCollectionId}`, updateData);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updateData.name);
      expect(response.data.description).toBe(updateData.description);
      expect(response.data.is_public).toBe(updateData.is_public);
    });

    test('PATCH /api/v1/users/collections/:id - Should handle partial updates', async () => {
      const partialUpdate = { name: 'Partially Updated Collection' };

      const response = await axios.patch(`${API_BASE_URL}/users/collections/${testCollectionId}`, partialUpdate);

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(partialUpdate.name);
      // Other fields should remain unchanged
      expect(response.data.description).toBe('Updated description');
      expect(response.data.is_public).toBe(true);
    });

    test('GET /api/v1/users/collections/:id/items - Should return empty items initially', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/collections/${testCollectionId}/items`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data).toHaveLength(0);
    });

    test('POST /api/v1/users/collections/:id/items - Should add item to collection', async () => {
      // First create a favorite to add to collection
      const favoriteData = {
        id: `test-collection-item-${Date.now()}`,
        type: 'APOD',
        title: 'Test Collection Item',
        url: 'https://example.com/collection-item.jpg',
      };

      await axios.post(`${API_BASE_URL}/users/favorites`, favoriteData);
      createdFavorites.push(favoriteData.id);
      testItemId = favoriteData.id;

      // Add the favorite to collection
      const response = await axios.post(`${API_BASE_URL}/users/collections/${testCollectionId}/items`, {
        itemId: testItemId,
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('collection_id', testCollectionId);
      expect(response.data).toHaveProperty('item_id', testItemId);
    });

    test('GET /api/v1/users/collections/:id/items - Should return collection items', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/collections/${testCollectionId}/items`);

      expect(response.status).toBe(200);
      expect(response.data.length).toBe(1);

      // Should find our added item
      const addedItem = response.data.find(item => item.id === testItemId);
      expect(addedItem).toBeDefined();
      expect(addedItem.title).toBe('Test Collection Item');
    });

    test('POST /api/v1/users/collections/:id/items - Should handle duplicate items', async () => {
      try {
        await axios.post(`${API_BASE_URL}/users/collections/${testCollectionId}/items`, {
          itemId: testItemId,
        });
        fail('Should have thrown an error for duplicate item');
      } catch (error) {
        expect(error.response.status).toBe(409);
        expect(error.response.data).toHaveProperty('message', 'Item already in collection');
      }
    });

    test('POST /api/v1/users/collections/:id/items - Should handle non-existent items', async () => {
      try {
        await axios.post(`${API_BASE_URL}/users/collections/${testCollectionId}/items`, {
          itemId: 'non-existent-item',
        });
        fail('Should have thrown an error for non-existent item');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('message', 'Item not found in favorites');
      }
    });

    test('DELETE /api/v1/users/collections/:id/items/:itemId - Should remove item from collection', async () => {
      const response = await axios.delete(`${API_BASE_URL}/users/collections/${testCollectionId}/items/${testItemId}`);

      expect(response.status).toBe(204);

      // Verify it's removed
      const itemsResponse = await axios.get(`${API_BASE_URL}/users/collections/${testCollectionId}/items`);
      expect(itemsResponse.data).toHaveLength(0);
    });

    test('DELETE /api/v1/users/collections/:id/items/:itemId - Should handle non-existent item', async () => {
      try {
        await axios.delete(`${API_BASE_URL}/users/collections/${testCollectionId}/items/non-existent-item`);
        fail('Should have thrown an error for non-existent item');
      } catch (error) {
        expect(error.response.status).toBe(404);
        expect(error.response.data).toHaveProperty('message', 'Item not found in collection');
      }
    });

    test('DELETE /api/v1/users/collections/:id - Should delete collection', async () => {
      const response = await axios.delete(`${API_BASE_URL}/users/collections/${testCollectionId}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      try {
        await axios.get(`${API_BASE_URL}/users/collections/${testCollectionId}`);
        fail('Should have thrown an error for deleted collection');
      } catch (error) {
        expect(error.response.status).toBe(404);
      }

      // Remove from cleanup list since it's already deleted
      const index = createdCollections.indexOf(testCollectionId);
      if (index > -1) {
        createdCollections.splice(index, 1);
      }
    });

    test('POST /api/v1/users/collections - Should validate input data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        description: 'x'.repeat(600), // Invalid: too long
        is_public: 'not-a-boolean', // Invalid: not boolean
      };

      try {
        await axios.post(`${API_BASE_URL}/users/collections`, invalidData);
        fail('Should have thrown a validation error');
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data).toHaveProperty('errors');
        expect(Array.isArray(error.response.data.errors)).toBe(true);
      }
    });
  });

  describe('Authentication Enforcement', () => {
    test('Should require authentication for favorites endpoints', async () => {
      // Remove auth header
      delete axios.defaults.headers.common['Authorization'];

      const endpoints = [
        { method: 'get', url: `${API_BASE_URL}/users/favorites` },
        { method: 'post', url: `${API_BASE_URL}/users/favorites`, data: { id: 'test', type: 'APOD', title: 'Test' } },
        { method: 'get', url: `${API_BASE_URL}/users/favorites/test-id` },
        { method: 'delete', url: `${API_BASE_URL}/users/favorites/test-id` },
      ];

      for (const endpoint of endpoints) {
        try {
          if (endpoint.method === 'get') {
            await axios.get(endpoint.url);
          } else if (endpoint.method === 'post') {
            await axios.post(endpoint.url, endpoint.data);
          } else if (endpoint.method === 'delete') {
            await axios.delete(endpoint.url);
          }
          fail(`Should have required authentication for ${endpoint.method.toUpperCase()} ${endpoint.url}`);
        } catch (error) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error.code).toBe('UNAUTHORIZED');
        }
      }

      // Restore auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${testAuthToken}`;
    });

    test('Should require authentication for collections endpoints', async () => {
      // Remove auth header
      delete axios.defaults.headers.common['Authorization'];

      const endpoints = [
        { method: 'get', url: `${API_BASE_URL}/users/collections` },
        { method: 'post', url: `${API_BASE_URL}/users/collections`, data: { name: 'Test' } },
        { method: 'get', url: `${API_BASE_URL}/users/collections/test-id` },
        { method: 'patch', url: `${API_BASE_URL}/users/collections/test-id`, data: { name: 'Updated' } },
        { method: 'delete', url: `${API_BASE_URL}/users/collections/test-id` },
        { method: 'get', url: `${API_BASE_URL}/users/collections/test-id/items` },
        { method: 'post', url: `${API_BASE_URL}/users/collections/test-id/items`, data: { itemId: 'test' } },
        { method: 'delete', url: `${API_BASE_URL}/users/collections/test-id/items/test-item-id` },
      ];

      for (const endpoint of endpoints) {
        try {
          if (endpoint.method === 'get') {
            await axios.get(endpoint.url);
          } else if (endpoint.method === 'post') {
            await axios.post(endpoint.url, endpoint.data);
          } else if (endpoint.method === 'patch') {
            await axios.patch(endpoint.url, endpoint.data);
          } else if (endpoint.method === 'delete') {
            await axios.delete(endpoint.url);
          }
          fail(`Should have required authentication for ${endpoint.method.toUpperCase()} ${endpoint.url}`);
        } catch (error) {
          expect(error.response.status).toBe(401);
          expect(error.response.data.error.code).toBe('UNAUTHORIZED');
        }
      }

      // Restore auth header
      axios.defaults.headers.common['Authorization'] = `Bearer ${testAuthToken}`;
    });
  });

  // Helper functions
  async function generateTestToken() {
    // This would normally come from your authentication service
    // For testing, we'll create a mock JWT token
    const jwt = require('jsonwebtoken');
    const payload = {
      id: testUserId,
      email: 'test@example.com',
      role: 'user',
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });
  }

  async function cleanupTestData() {
    const cleanupPromises = [];

    // Clean up favorites
    for (const favoriteId of createdFavorites) {
      cleanupPromises.push(
        axios.delete(`${API_BASE_URL}/users/favorites/${favoriteId}`).catch(() => {}),
      );
    }

    // Clean up collections
    for (const collectionId of createdCollections) {
      cleanupPromises.push(
        axios.delete(`${API_BASE_URL}/users/collections/${collectionId}`).catch(() => {}),
      );
    }

    // Wait for all cleanup operations to complete
    await Promise.allSettled(cleanupPromises);
    console.log('✅ Test data cleanup completed');
  }
});