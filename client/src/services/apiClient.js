/**
 * API Client with Authentication Interceptor
 * Configures axios to automatically attach JWT tokens and handle auth errors
 */

import axios from 'axios';
import { getToken, logout, isTokenExpired } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance for authenticated requests
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      // Check if token is expired before making request
      if (isTokenExpired(token)) {
        // Token expired, logout and redirect
        logout();
        if (typeof window !== 'undefined') {
          window.location.href = '/'; // Redirect to home/login
        }
        return Promise.reject(new Error('Token expired'));
      }

      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle 401 errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - token invalid or expired
      logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/'; // Redirect to home/login
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
