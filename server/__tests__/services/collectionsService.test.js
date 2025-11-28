const collectionsService = require('../../services/collectionsService');
const { pool } = require('../../db');

jest.mock('../../db', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

describe('CollectionsService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('getCollections', () => {
    it('should return list of collections', async () => {
      const mockCollections = [{ id: 'col-1', name: 'My Collection', item_count: 5 }];
      mockClient.query
        .mockResolvedValueOnce({ rows: mockCollections }) // collections query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }); // count query

      const result = await collectionsService.getCollections('user-1');
      expect(result.collections).toEqual(mockCollections);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), ['user-1', 20, 0]);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', async () => {
      const newCollection = { id: 'col-1', name: 'New Col' };
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // existing check
        .mockResolvedValueOnce({ rows: [newCollection] }); // insert

      const result = await collectionsService.createCollection('user-1', { name: 'New Col' });
      expect(result).toEqual({ ...newCollection, item_count: 0, is_owner: true });
    });
  });

  describe('addItemToCollection', () => {
    it('should add item successfully', async () => {
      // Mock BEGIN transaction
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock collection check
      mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1', is_public: false }] });
      // Mock item check
      mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1', title: 'Test Item' }] });
      // Mock existing check
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock position check
      mockClient.query.mockResolvedValueOnce({ rows: [{ max_position: null }] });
      // Mock insert
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'ci-1', collection_id: 'col-1', item_id: 'item-1' }] });
      // Mock update timestamp
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock COMMIT transaction
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const result = await collectionsService.addItemToCollection('col-1', 'item-1');
      expect(result.id).toBe('ci-1');
      expect(mockClient.query).toHaveBeenCalledTimes(8);
    });

    it('should throw if collection not found', async () => {
      // Mock BEGIN transaction
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock collection check - returns empty
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Collection not found
      // Mock ROLLBACK
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(collectionsService.addItemToCollection('col-1', 'item-1'))
        .rejects.toThrow('Collection not found');
    });

    it('should throw if item not found', async () => {
      // Mock BEGIN transaction
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      // Mock collection check
      mockClient.query.mockResolvedValueOnce({ rows: [{ user_id: 'user-1', is_public: false }] });
      // Mock item check - returns empty
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Item not found
      // Mock ROLLBACK
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      await expect(collectionsService.addItemToCollection('col-1', 'item-1'))
        .rejects.toThrow('Item not found or is archived');
    });
  });

  describe('getCollectionItems', () => {
    it('should return items in collection', async () => {
      // Mock collection check
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'col-1', name: 'Test Collection' }] });
      // Mock items query
      const mockItems = [{ id: 'item-1', title: 'Mars', position: 1 }];
      mockClient.query.mockResolvedValueOnce({ rows: mockItems });
      // Mock count query
      mockClient.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

      const result = await collectionsService.getCollectionItems('col-1');
      expect(result.items).toEqual(mockItems);
      expect(result.collection).toEqual({ id: 'col-1', name: 'Test Collection', item_count: 1 });
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
    });
  });
});
