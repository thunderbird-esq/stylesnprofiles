/**
 * Favorites Service
 * Manages user's saved favorite items (APOD, NEO, MARS, etc.)
 */

import apiClient from './apiClient';

/**
 * Get user's favorites with optional filtering and pagination
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {string} type - Filter by type (APOD, NEO, MARS, etc.)
 * @param {string} search - Search term
 * @returns {Promise<{favorites: Array, pagination: object}>}
 */
export const getFavorites = async (page = 1, limit = 20, type = null, search = '') => {
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
};

/**
 * Add an item to favorites
 * @param {object} itemData - Item data (id, type, title, url, date, etc.)
 * @returns {Promise<object>} - Saved favorite item
 */
export const addFavorite = async (itemData) => {
  try {
    const response = await apiClient.post('/api/v1/users/favorites', itemData);
    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw new Error(error.response?.data?.message || 'Failed to add favorite');
  }
};

/**
 * Remove an item from favorites
 * @param {string} itemId - ID of the item to remove
 * @returns {Promise<void>}
 */
export const removeFavorite = async (itemId) => {
  try {
    await apiClient.delete(`/api/v1/users/favorites/${itemId}`);
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove favorite');
  }
};

/**
 * Get a specific favorite by ID
 * @param {string} itemId - ID of the item
 * @returns {Promise<object>}
 */
export const getFavoriteById = async (itemId) => {
  try {
    const response = await apiClient.get(`/api/v1/users/favorites/${itemId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch favorite');
  }
};

/**
 * Check if an item is favorited
 * @param {string} itemId - ID of the item
 * @returns {Promise<boolean>}
 */
export const isFavorited = async (itemId) => {
  try {
    await getFavoriteById(itemId);
    return true;
  } catch (error) {
    // If 404, item is not favorited
    if (error.response?.status === 404) {
      return false;
    }
    throw error;
  }
};

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
  getFavoriteById,
  isFavorited,
};
