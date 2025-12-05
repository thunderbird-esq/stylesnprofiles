/* eslint-env browser */
import axios from 'axios';

/**
 * NASA API Service
 * Direct calls to NASA APIs for GitHub Pages static deployment
 * API key is read from localStorage (set in Settings panel)
 * @module nasaApi
 */

const NASA_BASE_URL = 'https://api.nasa.gov';
const NASA_IMAGES_URL = 'https://images-api.nasa.gov';
const API_KEY_STORAGE_KEY = 'nasa_api_key';

/**
 * Get the NASA API key from localStorage or use DEMO_KEY
 */
const getApiKey = () => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || 'DEMO_KEY';
};

/**
 * Axios instance for direct NASA API calls
 */
const createNasaClient = () => {
  return axios.create({
    baseURL: NASA_BASE_URL,
    params: {
      api_key: getApiKey(),
    },
  });
};

// --- NASA API Functions ---

/**
 * Fetches the Astronomy Picture of the Day
 */
export const getApod = (params = {}) => {
  const client = createNasaClient();
  return client.get('/planetary/apod', { params });
};

/**
 * Fetches Near Earth Objects for a given date range
 */
export const getNeoFeed = (startDate, endDate) => {
  const client = createNasaClient();
  return client.get('/neo/rest/v1/feed', {
    params: { start_date: startDate, end_date: endDate },
  });
};

/**
 * Fetches Mars Rover photos
 * @param {Object} options - Query options
 * @param {string} options.rover - Rover name: curiosity, opportunity, spirit, perseverance
 * @param {number} [options.sol] - Martian sol (day)
 * @param {string} [options.earthDate] - Earth date in YYYY-MM-DD format
 * @param {string} [options.camera] - Camera name (FHAZ, RHAZ, MAST, CHEMCAM, etc.)
 * @param {number} [options.page=1] - Page number for pagination
 */
export const getMarsPhotos = ({ rover = 'curiosity', sol, earthDate, camera, page = 1 }) => {
  const client = createNasaClient();
  const params = { page };

  if (sol !== undefined) {
    params.sol = sol;
  } else if (earthDate) {
    params.earth_date = earthDate;
  } else {
    // Default to sol 1000 for Curiosity
    params.sol = 1000;
  }

  if (camera) {
    params.camera = camera;
  }

  return client.get(`/mars-photos/api/v1/rovers/${rover}/photos`, { params });
};

/**
 * Get available Mars Rover manifests (mission info and photo counts)
 * @param {string} rover - Rover name
 */
export const getMarsRoverManifest = (rover = 'curiosity') => {
  const client = createNasaClient();
  return client.get(`/mars-photos/api/v1/manifests/${rover}`);
};

/**
 * Search NASA Image and Video Library
 * @param {Object} options - Search options
 * @param {string} options.query - Search query
 * @param {string} [options.mediaType] - Media type: image, video, audio
 * @param {number} [options.yearStart] - Start year
 * @param {number} [options.yearEnd] - End year
 * @param {number} [options.page=1] - Page number
 */
export const searchNasaLibrary = ({ query, mediaType, yearStart, yearEnd, page = 1 }) => {
  const params = { q: query, page };

  if (mediaType) {
    params.media_type = mediaType;
  }
  if (yearStart) {
    params.year_start = yearStart;
  }
  if (yearEnd) {
    params.year_end = yearEnd;
  }

  // NASA Images API doesn't require API key
  return axios.get(`${NASA_IMAGES_URL}/search`, { params });
};

/**
 * Get asset details from NASA Image Library
 * @param {string} nasaId - NASA ID of the asset
 */
export const getNasaLibraryAsset = (nasaId) => {
  return axios.get(`${NASA_IMAGES_URL}/asset/${nasaId}`);
};

/**
 * Fetches EPIC (Earth Polychromatic Imaging Camera) images
 * @param {Object} options - Query options
 * @param {string} [options.date] - Date in YYYY-MM-DD format
 * @param {string} [options.collection='natural'] - Collection: natural or enhanced
 */
export const getEpicImages = ({ date, collection = 'natural' } = {}) => {
  const client = createNasaClient();

  if (date) {
    return client.get(`/EPIC/api/${collection}/date/${date}`);
  }
  // Get most recent images
  return client.get(`/EPIC/api/${collection}`);
};

/**
 * Get available EPIC dates
 * @param {string} [collection='natural'] - Collection type
 */
export const getEpicDates = (collection = 'natural') => {
  const client = createNasaClient();
  return client.get(`/EPIC/api/${collection}/all`);
};

/**
 * Build EPIC image URL
 * @param {Object} image - EPIC image data
 * @param {string} [collection='natural'] - Collection type
 */
export const buildEpicImageUrl = (image, collection = 'natural') => {
  const date = image.date.split(' ')[0].replace(/-/g, '/');
  return `https://epic.gsfc.nasa.gov/archive/${collection}/${date}/png/${image.image}.png`;
};

// --- Resource Navigator Functions (localStorage) ---

/**
 * Fetches all saved items from localStorage
 */
export const getSavedItems = () => {
  const saved = JSON.parse(localStorage.getItem('nasa_favorites') || '[]');
  return Promise.resolve({ data: saved });
};

/**
 * Saves a new item to localStorage
 */
export const saveItem = itemData => {
  const saved = JSON.parse(localStorage.getItem('nasa_favorites') || '[]');
  // Check for duplicates
  const exists = saved.find(item => item.id === itemData.id);
  if (!exists) {
    const newItem = { ...itemData, saved_at: new Date().toISOString() };
    saved.push(newItem);
    localStorage.setItem('nasa_favorites', JSON.stringify(saved));
    return Promise.resolve({ data: newItem });
  }
  return Promise.resolve({ data: exists });
};

/**
 * Logs a search query (no-op in static mode)
 */
export const saveSearch = queryString => {
  console.log('Search logged:', queryString);
  return Promise.resolve({ data: { success: true } });
};
