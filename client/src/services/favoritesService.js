/**
 * Favorites Service
 * Manages user's saved favorite items (APOD, NEO, MARS, etc.)
 * Pure localStorage implementation for GitHub Pages static deployment
 */

/* eslint-env browser */

const STORAGE_KEY = 'nasa_favorites';

/**
 * Helper to get favorites from local storage
 */
const getLocalFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (_e) {
    return [];
  }
};

/**
 * Helper to save favorites to local storage
 */
const saveLocalFavorites = (favorites) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
};

/**
 * Get user's favorites with optional filtering and pagination
 */
export const getFavorites = async (page = 1, limit = 20, type = null, search = '') => {
  let favorites = getLocalFavorites();

  // Filter by type
  if (type) {
    favorites = favorites.filter(f => f.type === type);
  }

  // Filter by search
  if (search) {
    const lowerSearch = search.toLowerCase();
    favorites = favorites.filter(f =>
      (f.title && f.title.toLowerCase().includes(lowerSearch)) ||
      (f.description && f.description.toLowerCase().includes(lowerSearch)),
    );
  }

  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginated = favorites.slice(startIndex, endIndex);

  return {
    data: paginated,
    pagination: {
      total: favorites.length,
      page,
      pages: Math.ceil(favorites.length / limit),
    },
  };
};

/**
 * Add an item to favorites
 */
export const addFavorite = async (itemData) => {
  const favorites = getLocalFavorites();

  // Check for duplicates
  if (favorites.some(f => f.id === itemData.id)) {
    throw new Error('Item already favorited');
  }

  const newFavorite = {
    ...itemData,
    created_at: new Date().toISOString(),
  };

  favorites.unshift(newFavorite); // Add to beginning
  saveLocalFavorites(favorites);
  return newFavorite;
};

/**
 * Remove an item from favorites
 */
export const removeFavorite = async (itemId) => {
  const favorites = getLocalFavorites();
  const filtered = favorites.filter(f => f.id !== itemId);

  if (favorites.length === filtered.length) {
    throw new Error('Favorite not found');
  }

  saveLocalFavorites(filtered);
};

/**
 * Get a specific favorite by ID
 */
export const getFavoriteById = async (itemId) => {
  const favorites = getLocalFavorites();
  const favorite = favorites.find(f => f.id === itemId);

  if (!favorite) {
    const error = new Error('Favorite not found');
    error.response = { status: 404 };
    throw error;
  }
  return favorite;
};

/**
 * Check if an item is favorited
 */
export const isFavorited = async (itemId) => {
  const favorites = getLocalFavorites();
  return favorites.some(f => f.id === itemId);
};

