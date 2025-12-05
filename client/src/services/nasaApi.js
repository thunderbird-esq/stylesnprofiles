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
  const key = localStorage.getItem(API_KEY_STORAGE_KEY);
  console.log('NASA API Key from localStorage:', key ? `${key.substring(0, 4)}...` : 'NOT SET, using DEMO_KEY');
  return key || 'DEMO_KEY';
};

/**
 * Make a NASA API request with proper api_key injection
 */
const nasaRequest = async (endpoint, params = {}) => {
  const apiKey = getApiKey();
  const url = `${NASA_BASE_URL}${endpoint}`;
  const mergedParams = { ...params, api_key: apiKey };

  console.log('🚀 NASA API Request:', endpoint, 'Key:', apiKey.substring(0, 4) + '...');

  try {
    const response = await axios.get(url, { params: mergedParams });
    console.log('✅ NASA API Response received');
    return response;
  } catch (error) {
    console.error('❌ NASA API Error:', error.response?.data || error.message);
    throw error;
  }
};

// --- NASA API Functions ---

/**
 * Fetches the Astronomy Picture of the Day
 */
export const getApod = (params = {}) => {
  return nasaRequest('/planetary/apod', params);
};

/**
 * Fetches Near Earth Objects for a given date range
 */
export const getNeoFeed = (startDate, endDate) => {
  return nasaRequest('/neo/rest/v1/feed', { start_date: startDate, end_date: endDate });
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

  return nasaRequest(`/mars-photos/api/v1/rovers/${rover}/photos`, params);
};

/**
 * Get available Mars Rover manifests (mission info and photo counts)
 * @param {string} rover - Rover name
 */
export const getMarsRoverManifest = (rover = 'curiosity') => {
  return nasaRequest(`/mars-photos/api/v1/manifests/${rover}`);
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
 * Uses epic.gsfc.nasa.gov API with fallback to api.nasa.gov mirror
 * @param {Object} options - Query options
 * @param {string} [options.date] - Date in YYYY-MM-DD format
 * @param {string} [options.collection='natural'] - Collection: natural or enhanced
 */
export const getEpicImages = async ({ date, collection = 'natural' } = {}) => {
  const EPIC_BASE = 'https://epic.gsfc.nasa.gov';
  const endpoint = date ? `/api/${collection}/date/${date}` : `/api/${collection}`;

  try {
    // Try direct EPIC API first
    console.log('🌍 EPIC Request:', endpoint);
    const response = await axios.get(`${EPIC_BASE}${endpoint}`, { timeout: 10000 });
    console.log('✅ EPIC Response received');
    return response;
  } catch (error) {
    console.log('⚠️ EPIC direct failed, trying api.nasa.gov mirror...');
    // Fallback to api.nasa.gov mirror with CORS support
    return nasaRequest(`/EPIC${endpoint}`);
  }
};

/**
 * Get available EPIC dates
 * @param {string} [collection='natural'] - Collection type
 */
export const getEpicDates = async (collection = 'natural') => {
  const EPIC_BASE = 'https://epic.gsfc.nasa.gov';
  try {
    return await axios.get(`${EPIC_BASE}/api/${collection}/all`, { timeout: 10000 });
  } catch (error) {
    return nasaRequest(`/EPIC/api/${collection}/all`);
  }
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

// ============================================
// DONKI - Space Weather Database
// ============================================

/**
 * Fetches Coronal Mass Ejection (CME) events
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 */
export const getDonkiCME = (startDate, endDate) => {
  return nasaRequest('/DONKI/CME', { startDate, endDate });
};

/**
 * Fetches Solar Flare (FLR) events
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 */
export const getDonkiFLR = (startDate, endDate) => {
  return nasaRequest('/DONKI/FLR', { startDate, endDate });
};

/**
 * Fetches Geomagnetic Storm (GST) events
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 */
export const getDonkiGST = (startDate, endDate) => {
  return nasaRequest('/DONKI/GST', { startDate, endDate });
};

/**
 * Fetches Solar Energetic Particle (SEP) events
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 */
export const getDonkiSEP = (startDate, endDate) => {
  return nasaRequest('/DONKI/SEP', { startDate, endDate });
};

/**
 * Fetches all DONKI notifications
 * @param {string} startDate - Start date YYYY-MM-DD
 * @param {string} endDate - End date YYYY-MM-DD
 * @param {string} [type] - Notification type filter
 */
export const getDonkiNotifications = (startDate, endDate, type) => {
  const params = { startDate, endDate };
  if (type) params.type = type;
  return nasaRequest('/DONKI/notifications', params);
};

// ============================================
// EONET - Earth Observatory Natural Events
// ============================================

const EONET_BASE = 'https://eonet.gsfc.nasa.gov/api/v3';

/**
 * Fetches natural events from EONET
 * @param {Object} options - Query options
 * @param {string} [options.category] - Category ID filter
 * @param {number} [options.limit=20] - Number of events to return
 * @param {number} [options.days] - Events from last N days
 * @param {string} [options.status] - 'open' or 'closed'
 */
export const getEonetEvents = async ({ category, limit = 20, days, status } = {}) => {
  const params = { limit };
  if (category) params.category = category;
  if (days) params.days = days;
  if (status) params.status = status;

  console.log('🌍 EONET Events Request');
  return axios.get(`${EONET_BASE}/events`, { params });
};

/**
 * Fetches EONET event categories
 */
export const getEonetCategories = async () => {
  return axios.get(`${EONET_BASE}/categories`);
};

// ============================================
// SSD/CNEOS - Close Approach Data
// ============================================

const SSD_BASE = 'https://ssd-api.jpl.nasa.gov';

/**
 * Fetches asteroid close approach data
 * @param {Object} options - Query options
 * @param {string} [options.dateMin] - Minimum date YYYY-MM-DD
 * @param {string} [options.dateMax] - Maximum date YYYY-MM-DD
 * @param {number} [options.distMax=0.5] - Maximum distance in AU
 */
export const getCloseApproaches = async ({ dateMin, dateMax, distMax = 0.5 } = {}) => {
  const params = { 'dist-max': distMax };
  if (dateMin) params['date-min'] = dateMin;
  if (dateMax) params['date-max'] = dateMax;

  console.log('☄️ Close Approach Request');
  return axios.get(`${SSD_BASE}/cad.api`, { params });
};

/**
 * Fetches specific asteroid/comet data by designation
 * @param {string} designation - Small body designation (e.g., "433" for Eros)
 */
export const getSmallBodyData = async (designation) => {
  return axios.get(`${SSD_BASE}/sbdb.api`, { params: { sstr: designation } });
};

// ============================================
// Exoplanet Archive
// ============================================

const EXOPLANET_BASE = 'https://exoplanetarchive.ipac.caltech.edu';

/**
 * Query the Exoplanet Archive using TAP
 * @param {Object} options - Query options
 * @param {string} [options.query] - Search term for planet name
 * @param {number} [options.limit=50] - Number of results
 * @param {string} [options.orderBy='disc_year'] - Order by field
 */
export const getExoplanets = async ({ query, limit = 50, orderBy = 'disc_year desc' } = {}) => {
  let sqlQuery = `select pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_bmasse,sy_dist from ps`;

  if (query) {
    sqlQuery += ` where pl_name like '%${query}%' or hostname like '%${query}%'`;
  }

  sqlQuery += ` order by ${orderBy}`;
  sqlQuery = `select top ${limit} * from (${sqlQuery})`;

  console.log('🪐 Exoplanet Query');
  return axios.get(`${EXOPLANET_BASE}/TAP/sync`, {
    params: { query: sqlQuery, format: 'json' }
  });
};

// ============================================
// Techport - NASA Technology Projects
// ============================================

/**
 * Fetches NASA technology projects from Techport
 * @param {Object} options - Query options
 * @param {string} [options.updatedSince] - Date filter YYYY-MM-DD
 */
export const getTechportProjects = async ({ updatedSince } = {}) => {
  const params = {};
  if (updatedSince) params.updatedSince = updatedSince;

  console.log('🔬 Techport Request');
  return nasaRequest('/techport/api/projects', params);
};

/**
 * Fetches specific Techport project details
 * @param {number} projectId - Project ID
 */
export const getTechportProject = async (projectId) => {
  return nasaRequest(`/techport/api/projects/${projectId}`);
};

// ============================================
// InSight Mars Weather
// ============================================

/**
 * Fetches Mars weather data from InSight lander
 */
export const getInsightWeather = () => {
  return nasaRequest('/insight_weather/', { feedtype: 'json', ver: '1.0' });
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
