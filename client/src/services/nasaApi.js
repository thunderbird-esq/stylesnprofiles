/* eslint-env browser */
import axios from 'axios';

/**
 * NASA API Service
 * Direct calls to NASA APIs for GitHub Pages static deployment
 * API key is read from localStorage (set in Settings panel)
 * @module nasaApi
 */

const NASA_BASE_URL = 'https://api.nasa.gov';
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


