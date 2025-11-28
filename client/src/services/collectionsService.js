/**
 * Collections Service
 * Manages user's collections of saved items
 */

const apiClient = require('./apiClient').default;

/**
 * Get all user collections
 * @returns {Promise<Array>} - List of collections
 */
const getCollections = async () => {
  try {
    const response = await apiClient.get('/api/v1/users/collections');
    return response.data;
  } catch (error) {
    console.error('Error fetching collections:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to fetch collections');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Create a new collection
 * @param {string} name - Collection name
 * @param {string} description - Collection description
 * @param {boolean} isPublic - Whether collection is public
 * @returns {Promise<object>} - Created collection
 */
const createCollection = async (name, description = '', isPublic = false) => {
  try {
    const response = await apiClient.post('/api/v1/users/collections', {
      name,
      description,
      is_public: isPublic,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating collection:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to create collection');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Get a specific collection by ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<object>}
 */
const getCollectionById = async (collectionId) => {
  try {
    const response = await apiClient.get(`/api/v1/users/collections/${collectionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collection:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to fetch collection');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Update a collection
 * @param {string} collectionId - Collection ID
 * @param {object} updates - Fields to update (name, description, is_public)
 * @returns {Promise<object>} - Updated collection
 */
const updateCollection = async (collectionId, updates) => {
  try {
    const response = await apiClient.patch(`/api/v1/users/collections/${collectionId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating collection:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to update collection');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Delete a collection
 * @param {string} collectionId - Collection ID
 * @returns {Promise<void>}
 */
const deleteCollection = async (collectionId) => {
  try {
    await apiClient.delete(`/api/v1/users/collections/${collectionId}`);
  } catch (error) {
    console.error('Error deleting collection:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to delete collection');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Get items in a collection
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Array>} - List of items
 */
const getCollectionItems = async (collectionId) => {
  try {
    const response = await apiClient.get(`/api/v1/users/collections/${collectionId}/items`);
    return response.data;
  } catch (error) {
    console.error('Error fetching collection items:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to fetch collection items');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Add an item to a collection
 * @param {string} collectionId - Collection ID
 * @param {string} itemId - Item ID to add
 * @returns {Promise<object>} - Collection item relation
 */
const addItemToCollection = async (collectionId, itemId) => {
  try {
    const response = await apiClient.post(`/api/v1/users/collections/${collectionId}/items`, {
      itemId,
    });
    return response.data;
  } catch (error) {
    console.error('Error adding item to collection:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to add item to collection');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

/**
 * Remove an item from a collection
 * @param {string} collectionId - Collection ID
 * @param {string} itemId - Item ID to remove
 * @returns {Promise<void>}
 */
const removeItemFromCollection = async (collectionId, itemId) => {
  try {
    await apiClient.delete(`/api/v1/users/collections/${collectionId}/items/${itemId}`);
  } catch (error) {
    console.error('Error removing item from collection:', error);
    // Preserve the original error object with response data
    const enhancedError = new Error(error.response?.data?.message || 'Failed to remove item from collection');
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

module.exports = {
  getCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollectionItems,
  addItemToCollection,
  removeItemFromCollection,
};
