import axios from 'axios';

// Create an axios instance that communicates with our *own* server.
// The server's proxy (server/routes/apiProxy.js) will handle forwarding
// the request to api.nasa.gov with the secret API key.
// The `proxy` key in client/package.json handles the `http://localhost:3001` part.

const localApi = axios.create({
  baseURL: '/api', // Will be proxied to http://localhost:3001/api
});

// --- NASA API Functions ---

/**
 * Fetches the Astronomy Picture of the Day.
 * Uses our proxy: /api/nasa/planetary/apod
 */
export const getApod = (params = {}) => {
  return localApi.get('/nasa/planetary/apod', { params });
};

/**
 * Fetches Near Earth Objects for a given start and end date.
 * Uses our proxy: /api/nasa/neo/rest/v1/feed
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 */
export const getNeoFeed = (startDate, endDate) => {
  return localApi.get('/nasa/neo/rest/v1/feed', {
    params: { start_date: startDate, end_date: endDate },
  });
};

// --- Resource Navigator Functions (Database) ---

/**
 * Fetches all saved items from our local database.
 * Calls: /api/resources/saved
 */
export const getSavedItems = () => {
  return localApi.get('/resources/saved');
};

/**
 * Saves a new item to our local database.
 * Calls: /api/resources/saved
 */
export const saveItem = (itemData) => {
  return localApi.post('/resources/saved', itemData);
};

/**
 * Logs a search query to our local database.
 * Calls: /api/resources/search
 */
export const saveSearch = (query_string) => {
  return localApi.post('/resources/search', { query_string });
};