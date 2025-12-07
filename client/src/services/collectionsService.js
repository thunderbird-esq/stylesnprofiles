/**
 * Collections Service
 * Manages user's collections of saved items
 * Pure localStorage implementation for GitHub Pages static deployment
 */

/* eslint-env browser */

const COLLECTIONS_KEY = 'nasa_collections';
const COLLECTION_ITEMS_KEY = 'nasa_collection_items';

/**
 * Helper to get collections from local storage
 */
const getLocalCollections = () => {
  try {
    return JSON.parse(localStorage.getItem(COLLECTIONS_KEY) || '[]');
  } catch (_e) {
    return [];
  }
};

/**
 * Helper to save collections to local storage
 */
const saveLocalCollections = (collections) => {
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(collections));
};

/**
 * Helper to get collection items from local storage
 */
const getLocalCollectionItems = () => {
  try {
    return JSON.parse(localStorage.getItem(COLLECTION_ITEMS_KEY) || '{}');
  } catch (_e) {
    return {};
  }
};

/**
 * Helper to save collection items to local storage
 */
const saveLocalCollectionItems = (items) => {
  localStorage.setItem(COLLECTION_ITEMS_KEY, JSON.stringify(items));
};

/**
 * Get all user collections
 * @returns {Promise<Array>} - List of collections
 */
export const getCollections = async () => {
  return getLocalCollections();
};

/**
 * Create a new collection
 * @param {string} name - Collection name
 * @param {string} description - Collection description
 * @param {boolean} isPublic - Whether collection is public (unused in localStorage mode)
 * @returns {Promise<object>} - Created collection
 */
export const createCollection = async (name, description = '', isPublic = false) => {
  const collections = getLocalCollections();
  const newCollection = {
    id: `col-${Date.now()}`,
    name,
    description,
    is_public: isPublic,
    created_at: new Date().toISOString(),
    item_count: 0,
  };
  collections.push(newCollection);
  saveLocalCollections(collections);
  return newCollection;
};

/**
 * Get a specific collection by ID
 * @param {string} collectionId - Collection ID
 * @returns {Promise<object>}
 */
export const getCollectionById = async (collectionId) => {
  const collections = getLocalCollections();
  const collection = collections.find(c => c.id === collectionId);
  if (!collection) {
    const error = new Error('Collection not found');
    error.response = { status: 404 };
    throw error;
  }
  return collection;
};

/**
 * Update a collection
 * @param {string} collectionId - Collection ID
 * @param {object} updates - Fields to update (name, description, is_public)
 * @returns {Promise<object>} - Updated collection
 */
export const updateCollection = async (collectionId, updates) => {
  const collections = getLocalCollections();
  const index = collections.findIndex(c => c.id === collectionId);
  if (index === -1) {
    const error = new Error('Collection not found');
    error.response = { status: 404 };
    throw error;
  }

  collections[index] = { ...collections[index], ...updates };
  saveLocalCollections(collections);
  return collections[index];
};

/**
 * Delete a collection
 * @param {string} collectionId - Collection ID
 * @returns {Promise<void>}
 */
export const deleteCollection = async (collectionId) => {
  let collections = getLocalCollections();
  collections = collections.filter(c => c.id !== collectionId);
  saveLocalCollections(collections);

  // Also cleanup items
  const allItems = getLocalCollectionItems();
  if (allItems[collectionId]) {
    delete allItems[collectionId];
    saveLocalCollectionItems(allItems);
  }
};

/**
 * Get items in a collection
 * @param {string} collectionId - Collection ID
 * @returns {Promise<Array>} - List of items
 */
export const getCollectionItems = async (collectionId) => {
  const allItems = getLocalCollectionItems();
  return allItems[collectionId] || [];
};

/**
 * Add an item to a collection
 * @param {string} collectionId - Collection ID
 * @param {string} itemId - Item ID to add
 * @returns {Promise<object>} - Collection item relation
 */
export const addItemToCollection = async (collectionId, itemId) => {
  const allItems = getLocalCollectionItems();
  if (!allItems[collectionId]) allItems[collectionId] = [];

  // Check duplicates
  if (allItems[collectionId].some(item => item.id === itemId)) {
    throw new Error('Item already in collection');
  }

  // Fetch the actual item details from favorites
  const favorites = JSON.parse(localStorage.getItem('nasa_favorites') || '[]');
  const item = favorites.find(f => f.id === itemId);

  if (!item) {
    throw new Error('Item not found in favorites');
  }

  allItems[collectionId].push(item);
  saveLocalCollectionItems(allItems);

  // Update count
  const collections = getLocalCollections();
  const colIndex = collections.findIndex(c => c.id === collectionId);
  if (colIndex !== -1) {
    collections[colIndex].item_count = allItems[collectionId].length;
    saveLocalCollections(collections);
  }

  return { collectionId, itemId };
};

/**
 * Remove an item from a collection
 * @param {string} collectionId - Collection ID
 * @param {string} itemId - Item ID to remove
 * @returns {Promise<void>}
 */
export const removeItemFromCollection = async (collectionId, itemId) => {
  const allItems = getLocalCollectionItems();
  if (!allItems[collectionId]) return;

  allItems[collectionId] = allItems[collectionId].filter(item => item.id !== itemId);
  saveLocalCollectionItems(allItems);

  // Update count
  const collections = getLocalCollections();
  const colIndex = collections.findIndex(c => c.id === collectionId);
  if (colIndex !== -1) {
    collections[colIndex].item_count = allItems[collectionId].length;
    saveLocalCollections(collections);
  }
};

const collectionsService = {
  getCollections,
  createCollection,
  getCollectionById,
  updateCollection,
  deleteCollection,
  getCollectionItems,
  addItemToCollection,
  removeItemFromCollection,
};

export default collectionsService;
