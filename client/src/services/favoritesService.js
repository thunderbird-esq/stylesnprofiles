/**
 * Favorites Service
 * Manages user's saved favorite items (APOD, NEO, MARS, etc.)
 */

const apiClient = require('./apiClient').default;

/**
 * Get user's favorites with optional filtering and pagination
 */
async function getFavorites(page = 1, limit = 20, type = null, search = '') {
  try {
    const params = { page, limit };
    if (type) params.type = type;
    if (search) params.search = search;

    const response = await apiClient.get('/api/v1/users/favorites', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch favorites');
  }
}

/**
 * Add an item to favorites
 */
async function addFavorite(itemData) {
  try {
    const response = await apiClient.post('/api/v1/users/favorites', itemData);
    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw new Error(error.response?.data?.message || 'Failed to add favorite');
  }
}

/**
 * Remove an item from favorites
 */
async function removeFavorite(itemId) {
  try {
    await apiClient.delete(`/api/v1/users/favorites/${itemId}`);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove favorite');
  }
}

/**
 * Get a specific favorite by ID
 */
async function getFavoriteById(itemId) {
  try {
    const response = await apiClient.get(`/api/v1/users/favorites/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to fetch favorite');
    enhancedError.response = error.response;
    throw enhancedError;
  }
}

/**
 * Check if an item is favorited
 */
async function isFavorited(itemId) {
  try {
    await getFavoriteById(itemId);
    return true;
  } catch (error) {
    // If 404, item is not favorited
    if (error.response?.status === 404) return false;
    throw error;
  }
}

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  getFavoriteById,
  isFavorited,
};
