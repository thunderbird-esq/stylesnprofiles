import axios from 'axios';

/**
 * NASA API Service
 * Provides functions to interact with NASA APIs through the local server proxy
 * and manage saved resources in the local database
 * @module nasaApi
 */

/**
 * Axios instance configured to communicate with the local server
 * The server's proxy handles forwarding requests to api.nasa.gov with authentication
 * @constant {axios.AxiosInstance}
 */
const localApi = axios.create({
  baseURL: '/api', // Will be proxied to http://localhost:3001/api
});

// --- NASA API Functions ---

/**
 * Fetches the Astronomy Picture of the Day from NASA API
 * @function getApod
 * @param {Object} [params={}] - Optional query parameters
 * @param {string} [params.date] - Specific date in YYYY-MM-DD format
 * @param {string} [params.start_date] - Start date for date range
 * @param {string} [params.end_date] - End date for date range
 * @param {number} [params.count] - Number of random images to return
 * @param {boolean} [params.thumbs] - Return thumbnail URL for video URLs
 * @returns {Promise<axios.AxiosResponse>} Axios response with APOD data
 * @throws {Error} When API request fails
 * @example
 * // Get today's APOD
 * const response = await getApod();
 * // Get APOD for specific date
 * const response = await getApod({ date: '2024-01-01' });
 */
export const getApod = (params = {}) => {
  return localApi.get('/nasa/planetary/apod', { params });
};

/**
 * Fetches Near Earth Objects for a given date range from NASA API
 * @function getNeoFeed
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format (max 7 days from start)
 * @returns {Promise<axios.AxiosResponse>} Axios response with NEO data
 * @throws {Error} When API request fails or date range is invalid
 * @example
 * // Get NEOs for today
 * const today = new Date().toISOString().split('T')[0];
 * const response = await getNeoFeed(today, today);
 * @example
 * // Get NEOs for date range
 * const response = await getNeoFeed('2024-01-01', '2024-01-07');
 */
export const getNeoFeed = (startDate, endDate) => {
  return localApi.get('/nasa/neo/rest/v1/feed', {
    params: { start_date: startDate, end_date: endDate },
  });
};

// --- Resource Navigator Functions (Database) ---

/**
 * Fetches all saved items from the local database
 * @function getSavedItems
 * @returns {Promise<axios.AxiosResponse>} Axios response with array of saved items
 * @throws {Error} When API request fails
 * @example
 * // Get all saved items
 * const response = await getSavedItems();
 * const items = response.data;
 * @example
 * // Response data format
 * // [{
 * //   id: 'apod-2024-01-01',
 * //   type: 'APOD',
 * //   title: 'Galaxy Image',
 * //   url: 'https://apod.nasa.gov/image.jpg',
 * //   category: 'astronomy',
 * //   description: 'Beautiful galaxy',
 * //   saved_at: '2024-01-01T12:00:00Z'
 * // }]
 */
export const getSavedItems = () => {
  return localApi.get('/resources/saved');
};

/**
 * Saves a new item to the local database
 * @function saveItem
 * @param {Object} itemData - Item data to save
 * @param {string} itemData.id - Unique identifier for the item
 * @param {string} itemData.type - Type of NASA resource ('APOD', 'NEO', 'MARS', 'IMAGES')
 * @param {string} itemData.title - Title of the resource
 * @param {string} [itemData.url] - Optional URL to the resource
 * @param {string} [itemData.category] - Optional category classification
 * @param {string} [itemData.description] - Optional description
 * @returns {Promise<axios.AxiosResponse>} Axios response with saved item data
 * @throws {Error} When API request fails or validation fails
 * @example
 * // Save an APOD item
 * const response = await saveItem({
 *   id: 'apod-2024-01-01',
 *   type: 'APOD',
 *   title: 'Galaxy Image',
 *   url: 'https://apod.nasa.gov/image.jpg',
 *   category: 'astronomy',
 *   description: 'Beautiful galaxy image'
 * });
 */
export const saveItem = itemData => {
  return localApi.post('/resources/saved', itemData);
};

/**
 * Logs a search query to the local database for analytics
 * @function saveSearch
 * @param {string} query_string - The search query string to log
 * @returns {Promise<axios.AxiosResponse>} Axios response with search log data
 * @throws {Error} When API request fails or validation fails
 * @example
 * // Log a search query
 * const response = await saveSearch('mars rover photos');
 * @example
 * // Response data format
 * // {
 * //   id: 123,
 * //   query_string: 'mars rover photos',
 * //   search_time: '2024-01-01T12:00:00Z'
 * // }
 */
export const saveSearch = query_string => {
  return localApi.post('/resources/search', { query_string });
};
