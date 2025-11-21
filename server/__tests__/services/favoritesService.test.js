const favoritesService = require('../../services/favoritesService');
const { pool } = require('../../db');

jest.mock('../../db', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

describe('FavoritesService', () => {
  let mockClient;

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should return paginated favorites', async () => {
      const userId = 'user-123';
      const mockItems = [{
        id: 'item-1',
        title: 'Mars',
        collection_count: '2',
        collection_names: ['Collection 1', 'Collection 2'],
      }];

      mockClient.query
        .mockResolvedValueOnce({ rows: mockItems }) // items query
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }); // count query

      const result = await favoritesService.getFavorites(userId, { page: 1, limit: 10 });

      expect(result.favorites).toHaveLength(1);
      expect(result.favorites[0].collection_count).toBe(2);
      expect(result.favorites[0].collection_names).toEqual(['Collection 1', 'Collection 2']);
      expect(result.pagination).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      });
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should filter by type', async () => {
      const userId = 'user-123';
      const mockItems = [{
        id: 'item-1',
        collection_count: '0',
        collection_names: [],
      }];

      mockClient.query
        .mockResolvedValueOnce({ rows: mockItems })
        .mockResolvedValueOnce({ rows: [{ total: '0' }] });

      await favoritesService.getFavorites(userId, { type: 'MARS' });

      const queryCall = mockClient.query.mock.calls[0];
      expect(queryCall[0]).toContain('AND type =');
      expect(queryCall[1]).toContain('MARS');
    });
  });

  describe('addFavorite', () => {
    it('should add a new favorite', async () => {
      const userId = 'user-123';
      const itemData = {
        itemType: 'APOD',
        itemId: 'apod-2024-01-01',
        data: {
          title: 'Test APOD',
          url: 'http://example.com/image.jpg',
        },
      };

      const expected = {
        id: 'apod-2024-01-01',
        user_id: userId,
        type: 'APOD',
        title: 'Test APOD',
        url: 'http://example.com/image.jpg',
      };

      // Mock check (not found)
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      // Mock insert
      mockClient.query.mockResolvedValueOnce({ rows: [expected] });

      const result = await favoritesService.addFavorite(userId, itemData);

      expect(result).toEqual(expected);
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it('should throw error if already exists', async () => {
      const userId = 'user-123';
      const itemData = {
        itemType: 'APOD',
        itemId: 'existing-item',
        data: {},
      };

      // Mock check (found, not archived)
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: 'existing-item', is_archived: false }],
      });

      await expect(favoritesService.addFavorite(userId, itemData))
        .rejects.toThrow('Item already in favorites');
    });
  });

  describe('removeFavorite', () => {
    it('should remove favorite and return true', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      const result = await favoritesService.removeFavorite('user-1', 'item-1');
      expect(result).toBe(true);
    });

    it('should return false if not found', async () => {
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      const result = await favoritesService.removeFavorite('user-1', 'item-1');
      expect(result).toBe(false);
    });
  });
});
