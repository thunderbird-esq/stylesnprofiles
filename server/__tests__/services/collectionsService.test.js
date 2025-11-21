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
      mockClient.query.mockResolvedValueOnce({ rows: mockCollections });

      const result = await collectionsService.getCollections('user-1');
      expect(result).toEqual(mockCollections);
      expect(mockClient.query).toHaveBeenCalledWith(expect.stringContaining('SELECT c.*'), ['user-1']);
    });
  });

  describe('createCollection', () => {
    it('should create a new collection', async () => {
      const newCollection = { id: 'col-1', name: 'New Col' };
      mockClient.query.mockResolvedValueOnce({ rows: [newCollection] });

      const result = await collectionsService.createCollection('user-1', { name: 'New Col' });
      expect(result).toEqual({ ...newCollection, item_count: 0 });
    });
  });

  describe('addItemToCollection', () => {
    it('should add item successfully', async () => {
      // Mock collection check
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'col-1' }] });
      // Mock item check
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'item-1' }] });
      // Mock insert
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'ci-1' }] });

      const result = await collectionsService.addItemToCollection('user-1', 'col-1', 'item-1');
      expect(result).toEqual({ id: 'ci-1' });
    });

    it('should throw if collection not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Collection not found

      await expect(collectionsService.addItemToCollection('user-1', 'col-1', 'item-1'))
        .rejects.toThrow('Collection not found');
    });

    it('should throw if item not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'col-1' }] });
      mockClient.query.mockResolvedValueOnce({ rows: [] }); // Item not found

      await expect(collectionsService.addItemToCollection('user-1', 'col-1', 'item-1'))
        .rejects.toThrow('Item not found in saved items');
    });
  });

  describe('getCollectionItems', () => {
    it('should return items in collection', async () => {
      // Mock collection check
      mockClient.query.mockResolvedValueOnce({ rows: [{ id: 'col-1' }] });
      // Mock items query
      const mockItems = [{ id: 'item-1', title: 'Mars' }];
      mockClient.query.mockResolvedValueOnce({ rows: mockItems });

      const result = await collectionsService.getCollectionItems('user-1', 'col-1');
      expect(result).toEqual(mockItems);
    });
  });
});
