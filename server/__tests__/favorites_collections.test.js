/**
 * Favorites and Collections Service Integration Tests
 *
 * Tests the enhanced favorites and collections services with PostgreSQL
 * ensuring proper database operations, error handling, and performance.
 */

const { pool } = require('../db');
const favoritesService = require('../services/favoritesService');
const collectionsService = require('../services/collectionsService');

// Test user and data constants
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000';
const TEST_USER_ID_2 = '123e4567-e89b-12d3-a456-426614174001';

// Test data helpers
const createTestFavorite = (overrides = {}) => ({
  itemType: 'APOD',
  itemId: `apod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  itemDate: '2024-01-15',
  data: {
    title: 'Test APOD Image',
    url: 'https://apod.nasa.gov/apod/image/2401/test.jpg',
    hd_url: 'https://apod.nasa.gov/apod/image/2401/test_hd.jpg',
    media_type: 'image',
    category: 'nebula',
    description: 'A beautiful nebula image from APOD',
    copyright: 'NASA/ESA',
    metadata: { source: 'apod', resolution: '1920x1080' }
  },
  ...overrides
});

const createTestCollection = (overrides = {}) => ({
  name: `Test Collection ${Date.now()}`,
  description: 'A test collection for integration testing',
  isPublic: false,
  ...overrides
});

describe('FavoritesService Integration Tests', () => {
  let testFavorites = [];
  let testCollections = [];

  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  afterEach(async () => {
    // Clean up created favorites after each test
    for (const favorite of testFavorites) {
      try {
        await pool.query(
          'DELETE FROM saved_items WHERE user_id = $1 AND id = $2',
          [TEST_USER_ID, favorite.id]
        );
      } catch (error) {
        console.warn('Failed to cleanup favorite:', error.message);
      }
    }
    testFavorites = [];
  });

  describe('getFavorites', () => {
    test('should return paginated favorites', async () => {
      // Create test favorites
      const favorite1 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      const favorite2 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testFavorites.push(favorite1, favorite2);

      const result = await favoritesService.getFavorites(TEST_USER_ID, { page: 1, limit: 10 });

      expect(result).toHaveProperty('favorites');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.favorites)).toBe(true);
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    test('should filter by type', async () => {
      const apodFavorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite({ itemType: 'APOD' }));
      const neoFavorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite({ itemType: 'NEO' }));
      testFavorites.push(apodFavorite, neoFavorite);

      const result = await favoritesService.getFavorites(TEST_USER_ID, { type: 'APOD' });

      expect(result.favorites.every(fav => fav.type === 'APOD')).toBe(true);
    });

    test('should include archived items when requested', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      await favoritesService.removeFavorite(TEST_USER_ID, favorite.id);
      testFavorites.push(favorite);

      const normalResult = await favoritesService.getFavorites(TEST_USER_ID, { archived: false });
      const archivedResult = await favoritesService.getFavorites(TEST_USER_ID, { archived: true });

      expect(normalResult.favorites.find(fav => fav.id === favorite.id)).toBeUndefined();
      expect(archivedResult.favorites.find(fav => fav.id === favorite.id)).toBeDefined();
    });

    test('should validate pagination parameters', async () => {
      await expect(favoritesService.getFavorites(TEST_USER_ID, { page: 0 }))
        .rejects.toThrow('Page must be greater than 0');

      await expect(favoritesService.getFavorites(TEST_USER_ID, { limit: 0 }))
        .rejects.toThrow('Limit must be between 1 and 100');

      await expect(favoritesService.getFavorites(TEST_USER_ID, { limit: 101 }))
        .rejects.toThrow('Limit must be between 1 and 100');
    });

    test('should include collection information in favorites', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      await collectionsService.addItemToCollection(collection.id, favorite.id, { position: 0 });
      testFavorites.push(favorite);
      testCollections.push(collection);

      const result = await favoritesService.getFavorites(TEST_USER_ID);
      const favoriteWithCollection = result.favorites.find(fav => fav.id === favorite.id);

      expect(favoriteWithCollection.collection_count).toBe(1);
      expect(favoriteWithCollection.collection_names).toContain(collection.name);
    });
  });

  describe('getFavoriteById', () => {
    test('should return favorite by ID', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testFavorites.push(favorite);

      const result = await favoritesService.getFavoriteById(TEST_USER_ID, favorite.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(favorite.id);
      expect(result.user_id).toBe(TEST_USER_ID);
    });

    test('should return null for non-existent favorite', async () => {
      const result = await favoritesService.getFavoriteById(TEST_USER_ID, 'non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('addFavorite', () => {
    test('should add a new favorite', async () => {
      const favoriteData = createTestFavorite();
      const result = await favoritesService.addFavorite(TEST_USER_ID, favoriteData);
      testFavorites.push(result);

      expect(result).toBeDefined();
      expect(result.id).toBe(favoriteData.itemId);
      expect(result.user_id).toBe(TEST_USER_ID);
      expect(result.type).toBe(favoriteData.itemType);
      expect(result.is_archived).toBe(false);
      expect(result.user_tags).toEqual([]);
    });

    test('should validate required fields', async () => {
      await expect(favoritesService.addFavorite(TEST_USER_ID, { itemType: 'APOD' }))
        .rejects.toThrow('itemId is required');

      await expect(favoritesService.addFavorite(TEST_USER_ID, { itemId: 'test-id' }))
        .rejects.toThrow('itemType is required');
    });

    test('should validate item type', async () => {
      await expect(favoritesService.addFavorite(TEST_USER_ID, {
        itemType: 'INVALID_TYPE',
        itemId: 'test-id'
      })).rejects.toThrow('Invalid item type');
    });

    test('should reactivate archived favorite', async () => {
      const favoriteData = createTestFavorite();
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, favoriteData);
      await favoritesService.removeFavorite(TEST_USER_ID, favorite.id);
      testFavorites.push(favorite);

      const reactivatedFavorite = await favoritesService.addFavorite(TEST_USER_ID, favoriteData);

      expect(reactivatedFavorite.id).toBe(favorite.id);
      expect(reactivatedFavorite.is_archived).toBe(false);
    });

    test('should throw error for duplicate favorite', async () => {
      const favoriteData = createTestFavorite();
      await favoritesService.addFavorite(TEST_USER_ID, favoriteData);

      await expect(favoritesService.addFavorite(TEST_USER_ID, favoriteData))
        .rejects.toThrow('Item already in favorites');
    });
  });

  describe('updateFavorite', () => {
    test('should update favorite with new data', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testFavorites.push(favorite);

      const updateData = {
        userNote: 'Updated note',
        userTags: ['space', 'astronomy'],
        isFavorite: true
      };

      const result = await favoritesService.updateFavorite(TEST_USER_ID, favorite.id, updateData);

      expect(result.user_note).toBe(updateData.userNote);
      expect(result.user_tags).toEqual(updateData.userTags);
      expect(result.is_favorite).toBe(updateData.isFavorite);
    });

    test('should return null for non-existent favorite', async () => {
      const result = await favoritesService.updateFavorite(TEST_USER_ID, 'non-existent-id', {
        userNote: 'test'
      });

      expect(result).toBeNull();
    });

    test('should validate update fields', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testFavorites.push(favorite);

      await expect(favoritesService.updateFavorite(TEST_USER_ID, favorite.id, {}))
        .rejects.toThrow('No valid update fields provided');
    });
  });

  describe('removeFavorite', () => {
    test('should soft delete favorite', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testFavorites.push(favorite);

      const result = await favoritesService.removeFavorite(TEST_USER_ID, favorite.id);

      expect(result).toBe(true);

      // Verify it's archived but still exists
      const archivedFavorite = await favoritesService.getFavoriteById(TEST_USER_ID, favorite.id);
      expect(archivedFavorite).toBeNull(); // Not returned normally

      // Check directly in database
      const dbResult = await pool.query(
        'SELECT is_archived FROM saved_items WHERE id = $1 AND user_id = $2',
        [favorite.id, TEST_USER_ID]
      );
      expect(dbResult.rows[0].is_archived).toBe(true);
    });

    test('should return false for non-existent favorite', async () => {
      const result = await favoritesService.removeFavorite(TEST_USER_ID, 'non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('searchFavorites', () => {
    beforeEach(async () => {
      // Create test favorites for searching
      const favorites = [
        createTestFavorite({
          itemType: 'APOD',
          data: { title: 'Nebula in Space', description: 'A beautiful cosmic nebula', category: 'space' }
        }),
        createTestFavorite({
          itemType: 'NEO',
          data: { title: 'Asteroid', description: 'Near Earth Object', category: 'asteroids' }
        }),
        createTestFavorite({
          itemType: 'MARS',
          data: { title: 'Mars Surface', description: 'Red planet exploration', category: 'planets' }
        })
      ];

      for (const fav of favorites) {
        const result = await favoritesService.addFavorite(TEST_USER_ID, fav);
        testFavorites.push(result);
      }
    });

    test('should search favorites with full-text search', async () => {
      const result = await favoritesService.searchFavorites(TEST_USER_ID, 'space');

      expect(result).toHaveProperty('favorites');
      expect(result).toHaveProperty('pagination');
      expect(result).toHaveProperty('search');
      expect(result.search.query).toBe('space');
      expect(result.favorites.length).toBeGreaterThan(0);
    });

    test('should filter by types in search', async () => {
      const result = await favoritesService.searchFavorites(TEST_USER_ID, 'planet', {
        types: ['APOD', 'MARS']
      });

      expect(result.favorites.every(fav => ['APOD', 'MARS'].includes(fav.type))).toBe(true);
    });

    test('should filter by tags in search', async () => {
      // Add tags to a favorite
      const favorite = testFavorites[0];
      await favoritesService.updateFavorite(TEST_USER_ID, favorite.id, {
        userTags: ['space', 'nebula']
      });

      const result = await favoritesService.searchFavorites(TEST_USER_ID, 'nebula', {
        tags: ['space']
      });

      expect(result.favorites.length).toBeGreaterThan(0);
    });

    test('should validate search parameters', async () => {
      await expect(favoritesService.searchFavorites(TEST_USER_ID, ''))
        .rejects.toThrow('Search query is required');

      await expect(favoritesService.searchFavorites(TEST_USER_ID, 'test', { page: 0 }))
        .rejects.toThrow('Page must be greater than 0');
    });
  });

  describe('getFavoriteStats', () => {
    test('should return favorite statistics', async () => {
      // Create test favorites with different states
      const fav1 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      const fav2 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      await favoritesService.updateFavorite(TEST_USER_ID, fav1.id, { isFavorite: true });
      await favoritesService.removeFavorite(TEST_USER_ID, fav2.id);
      testFavorites.push(fav1, fav2);

      const stats = await favoritesService.getFavoriteStats(TEST_USER_ID);

      expect(stats).toHaveProperty('totalFavorites');
      expect(stats).toHaveProperty('archivedCount');
      expect(stats).toHaveProperty('markedFavorites');
      expect(stats).toHaveProperty('uniqueTypes');
      expect(stats).toHaveProperty('types');
      expect(stats.totalFavorites).toBeGreaterThanOrEqual(1);
      expect(stats.archivedCount).toBeGreaterThanOrEqual(1);
      expect(stats.markedFavorites).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('CollectionsService Integration Tests', () => {
  let testCollections = [];
  let testFavorites = [];

  beforeAll(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await pool.end();
  });

  afterEach(async () => {
    // Clean up created collections and favorites
    for (const collection of testCollections) {
      try {
        await pool.query(
          'DELETE FROM collections WHERE user_id = $1 AND id = $2',
          [TEST_USER_ID, collection.id]
        );
      } catch (error) {
        console.warn('Failed to cleanup collection:', error.message);
      }
    }
    testCollections = [];

    for (const favorite of testFavorites) {
      try {
        await pool.query(
          'DELETE FROM saved_items WHERE user_id = $1 AND id = $2',
          [TEST_USER_ID, favorite.id]
        );
      } catch (error) {
        console.warn('Failed to cleanup favorite:', error.message);
      }
    }
    testFavorites = [];
  });

  describe('getCollections', () => {
    test('should return paginated collections', async () => {
      const collection1 = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const collection2 = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      testCollections.push(collection1, collection2);

      const result = await collectionsService.getCollections(TEST_USER_ID, { page: 1, limit: 10 });

      expect(result).toHaveProperty('collections');
      expect(result).toHaveProperty('pagination');
      expect(Array.isArray(result.collections)).toBe(true);
      expect(result.pagination.total).toBeGreaterThanOrEqual(2);
      expect(result.collections.every(col => col.item_count >= 0)).toBe(true);
    });

    test('should include public collections when requested', async () => {
      const publicCollection = await collectionsService.createCollection(TEST_USER_ID_2,
        createTestCollection({ isPublic: true }));
      testCollections.push(publicCollection);

      const result = await collectionsService.getCollections(TEST_USER_ID, { includePublic: true });

      expect(result.collections.some(col => col.user_id !== TEST_USER_ID)).toBe(true);
    });

    test('should validate pagination parameters', async () => {
      await expect(collectionsService.getCollections(TEST_USER_ID, { page: 0 }))
        .rejects.toThrow('Page must be greater than 0');

      await expect(collectionsService.getCollections(TEST_USER_ID, { limit: 0 }))
        .rejects.toThrow('Limit must be between 1 and 100');
    });
  });

  describe('createCollection', () => {
    test('should create a new collection', async () => {
      const collectionData = createTestCollection();
      const result = await collectionsService.createCollection(TEST_USER_ID, collectionData);
      testCollections.push(result);

      expect(result).toBeDefined();
      expect(result.user_id).toBe(TEST_USER_ID);
      expect(result.name).toBe(collectionData.name);
      expect(result.description).toBe(collectionData.description);
      expect(result.is_public).toBe(collectionData.isPublic);
      expect(result.item_count).toBe(0);
      expect(result.is_owner).toBe(true);
    });

    test('should validate collection data', async () => {
      await expect(collectionsService.createCollection(TEST_USER_ID, {}))
        .rejects.toThrow('Collection name is required');

      await expect(collectionsService.createCollection(TEST_USER_ID, { name: '' }))
        .rejects.toThrow('Collection name is required');

      await expect(collectionsService.createCollection(TEST_USER_ID, {
        name: 'a'.repeat(101)
      })).rejects.toThrow('Collection name must be 100 characters or less');

      await expect(collectionsService.createCollection(TEST_USER_ID, {
        name: 'Test',
        description: 'a'.repeat(501)
      })).rejects.toThrow('Collection description must be 500 characters or less');
    });

    test('should prevent duplicate collection names', async () => {
      const collectionData = createTestCollection();
      await collectionsService.createCollection(TEST_USER_ID, collectionData);

      await expect(collectionsService.createCollection(TEST_USER_ID, collectionData))
        .rejects.toThrow('You already have a collection with this name');
    });
  });

  describe('updateCollection', () => {
    test('should update collection successfully', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      testCollections.push(collection);

      const updateData = {
        name: 'Updated Collection Name',
        description: 'Updated description',
        isPublic: true
      };

      const result = await collectionsService.updateCollection(TEST_USER_ID, collection.id, updateData);

      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.is_public).toBe(updateData.isPublic);
    });

    test('should return null for non-existent collection', async () => {
      const result = await collectionsService.updateCollection(TEST_USER_ID, 'non-existent-id', {
        name: 'Test'
      });

      expect(result).toBeNull();
    });

    test('should prevent name conflicts during update', async () => {
      const collection1 = await collectionsService.createCollection(TEST_USER_ID,
        createTestCollection({ name: 'Collection 1' }));
      const collection2 = await collectionsService.createCollection(TEST_USER_ID,
        createTestCollection({ name: 'Collection 2' }));
      testCollections.push(collection1, collection2);

      await expect(collectionsService.updateCollection(TEST_USER_ID, collection1.id, {
        name: 'Collection 2'
      })).rejects.toThrow('You already have another collection with this name');
    });
  });

  describe('deleteCollection', () => {
    test('should delete collection successfully', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      testCollections.push(collection);

      const result = await collectionsService.deleteCollection(TEST_USER_ID, collection.id);

      expect(result).toBe(true);

      // Verify collection is deleted
      const deletedCollection = await collectionsService.getCollectionById(TEST_USER_ID, collection.id);
      expect(deletedCollection).toBeNull();
    });

    test('should return false for non-existent collection', async () => {
      const result = await collectionsService.deleteCollection(TEST_USER_ID, 'non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('addItemToCollection', () => {
    test('should add item to collection successfully', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testCollections.push(collection);
      testFavorites.push(favorite);

      const result = await collectionsService.addItemToCollection(collection.id, favorite.id, {
        position: 0,
        notes: 'Test notes'
      });

      expect(result.collection_id).toBe(collection.id);
      expect(result.item_id).toBe(favorite.id);
      expect(result.position).toBe(0);
      expect(result.notes).toBe('Test notes');
    });

    test('should auto-assign position if not provided', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testCollections.push(collection);
      testFavorites.push(favorite);

      const result = await collectionsService.addItemToCollection(collection.id, favorite.id);

      expect(result.position).toBeGreaterThan(0);
    });

    test('should prevent duplicate items in collection', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testCollections.push(collection);
      testFavorites.push(favorite);

      await collectionsService.addItemToCollection(collection.id, favorite.id);

      await expect(collectionsService.addItemToCollection(collection.id, favorite.id))
        .rejects.toThrow('Item already in collection');
    });

    test('should handle non-existent collection or item', async () => {
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testFavorites.push(favorite);

      await expect(collectionsService.addItemToCollection('non-existent-collection', favorite.id))
        .rejects.toThrow('Collection not found');

      await expect(collectionsService.addItemToCollection('some-collection-id', 'non-existent-item'))
        .rejects.toThrow('Item not found or is archived');
    });
  });

  describe('removeItemFromCollection', () => {
    test('should remove item and reorder remaining items', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const favorite1 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      const favorite2 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testCollections.push(collection);
      testFavorites.push(favorite1, favorite2);

      await collectionsService.addItemToCollection(collection.id, favorite1.id, { position: 0 });
      await collectionsService.addItemToCollection(collection.id, favorite2.id, { position: 1 });

      const result = await collectionsService.removeItemFromCollection(collection.id, favorite1.id);

      expect(result).toBe(true);

      // Check that remaining item has been reordered to position 0
      const items = await collectionsService.getCollectionItems(collection.id);
      expect(items.items[0].id).toBe(favorite2.id);
      expect(items.items[0].position).toBe(0);
    });

    test('should return false for non-existent item', async () => {
      const result = await collectionsService.removeItemFromCollection('collection-id', 'non-existent-item');

      expect(result).toBe(false);
    });
  });

  describe('getCollectionItems', () => {
    test('should return paginated collection items', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      await collectionsService.addItemToCollection(collection.id, favorite.id, { notes: 'Test note' });
      testCollections.push(collection);
      testFavorites.push(favorite);

      const result = await collectionsService.getCollectionItems(collection.id, { page: 1, limit: 10 });

      expect(result).toHaveProperty('collection');
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result.collection.id).toBe(collection.id);
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe(favorite.id);
      expect(result.items[0].collection_notes).toBe('Test note');
      expect(result.pagination.total).toBe(1);
    });

    test('should validate pagination parameters', async () => {
      await expect(collectionsService.getCollectionItems('collection-id', { page: 0 }))
        .rejects.toThrow('Page must be greater than 0');
    });

    test('should throw error for non-existent collection', async () => {
      await expect(collectionsService.getCollectionItems('non-existent-collection'))
        .rejects.toThrow('Collection not found');
    });
  });

  describe('reorderCollectionItems', () => {
    test('should reorder items successfully', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      const favorite1 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      const favorite2 = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      testCollections.push(collection);
      testFavorites.push(favorite1, favorite2);

      await collectionsService.addItemToCollection(collection.id, favorite1.id);
      await collectionsService.addItemToCollection(collection.id, favorite2.id);

      const itemOrders = [
        { itemId: favorite2.id, position: 0 },
        { itemId: favorite1.id, position: 1 }
      ];

      const result = await collectionsService.reorderCollectionItems(TEST_USER_ID, collection.id, itemOrders);

      expect(result).toBe(true);

      // Verify the new order
      const items = await collectionsService.getCollectionItems(collection.id);
      expect(items.items[0].id).toBe(favorite2.id);
      expect(items.items[1].id).toBe(favorite1.id);
    });

    test('should return false for non-existent collection', async () => {
      const result = await collectionsService.reorderCollectionItems(TEST_USER_ID, 'non-existent-id', []);

      expect(result).toBe(false);
    });

    test('should validate order data', async () => {
      const collection = await collectionsService.createCollection(TEST_USER_ID, createTestCollection());
      testCollections.push(collection);

      await expect(collectionsService.reorderCollectionItems(TEST_USER_ID, collection.id, []))
        .rejects.toThrow('Item orders must be a non-empty array');

      await expect(collectionsService.reorderCollectionItems(TEST_USER_ID, collection.id, [
        { itemId: 'test', position: -1 }
      ])).rejects.toThrow('Invalid item order data');
    });
  });

  describe('getCollectionStats', () => {
    test('should return collection statistics', async () => {
      const collection1 = await collectionsService.createCollection(TEST_USER_ID,
        createTestCollection({ isPublic: true }));
      const collection2 = await collectionsService.createCollection(TEST_USER_ID,
        createTestCollection({ isPublic: false }));
      const favorite = await favoritesService.addFavorite(TEST_USER_ID, createTestFavorite());
      await collectionsService.addItemToCollection(collection1.id, favorite.id);
      testCollections.push(collection1, collection2);
      testFavorites.push(favorite);

      const stats = await collectionsService.getCollectionStats(TEST_USER_ID);

      expect(stats).toHaveProperty('totalCollections');
      expect(stats).toHaveProperty('publicCollections');
      expect(stats).toHaveProperty('privateCollections');
      expect(stats).toHaveProperty('totalItemsInCollections');
      expect(stats).toHaveProperty('avgItemsPerCollection');
      expect(stats.totalCollections).toBeGreaterThanOrEqual(2);
      expect(stats.publicCollections).toBeGreaterThanOrEqual(1);
      expect(stats.privateCollections).toBeGreaterThanOrEqual(1);
      expect(stats.totalItemsInCollections).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getPublicCollections', () => {
    test('should return paginated public collections', async () => {
      const publicCollection = await collectionsService.createCollection(TEST_USER_ID_2,
        createTestCollection({
          isPublic: true,
          name: 'Space Photos',
          description: 'Beautiful space photography'
        }));
      testCollections.push(publicCollection);

      const result = await collectionsService.getPublicCollections({ page: 1, limit: 10 });

      expect(result).toHaveProperty('collections');
      expect(result).toHaveProperty('pagination');
      expect(result.collections.some(col => col.is_public)).toBe(true);
      expect(result.collections.every(col => col.is_owner === false)).toBe(true);
    });

    test('should search public collections', async () => {
      const publicCollection = await collectionsService.createCollection(TEST_USER_ID_2,
        createTestCollection({
          isPublic: true,
          name: 'Nebula Collection',
          description: 'Amazing nebula images'
        }));
      testCollections.push(publicCollection);

      const result = await collectionsService.getPublicCollections({
        search: 'nebula',
        page: 1,
        limit: 10
      });

      expect(result.collections.some(col =>
        col.name.toLowerCase().includes('nebula') ||
        col.description?.toLowerCase().includes('nebula')
      )).toBe(true);
    });

    test('should validate pagination parameters', async () => {
      await expect(collectionsService.getPublicCollections({ page: 0 }))
        .rejects.toThrow('Page must be greater than 0');

      await expect(collectionsService.getPublicCollections({ limit: 101 }))
        .rejects.toThrow('Limit must be between 1 and 100');
    });
  });
});

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Clean up collection items
    await pool.query(`
      DELETE FROM collection_items
      WHERE collection_id IN (
        SELECT id FROM collections
        WHERE user_id = $1 OR user_id = $2
      )
    `, [TEST_USER_ID, TEST_USER_ID_2]);

    // Clean up collections
    await pool.query(
      'DELETE FROM collections WHERE user_id = $1 OR user_id = $2',
      [TEST_USER_ID, TEST_USER_ID_2]
    );

    // Clean up saved items
    await pool.query(
      'DELETE FROM saved_items WHERE user_id = $1 OR user_id = $2',
      [TEST_USER_ID, TEST_USER_ID_2]
    );

    // Clean up users if they exist
    await pool.query(
      'DELETE FROM users WHERE id = $1 OR id = $2',
      [TEST_USER_ID, TEST_USER_ID_2]
    );

    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.warn('Cleanup error:', error.message);
  }
}