/**
 * AuthContext.js
 * Provides authentication state and methods throughout the app
 * Refactored for Silent Authentication (UUID-based) and API Key management
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

const API_KEY_STORAGE_KEY = 'nasa_api_key';
const DEVICE_ID_KEY = 'nasa_device_id';
const USER_STORAGE_KEY = 'nasa_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem(API_KEY_STORAGE_KEY) || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to generate a UUID-like string
  const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);

      try {
        // 1. Get or create device ID
        let deviceId = localStorage.getItem(DEVICE_ID_KEY);
        if (!deviceId) {
          deviceId = generateId();
          localStorage.setItem(DEVICE_ID_KEY, deviceId);
        }

        // 2. Check for existing mock user
        const storedUser = localStorage.getItem(USER_STORAGE_KEY);
        let mockUser;
        if (storedUser) {
          mockUser = JSON.parse(storedUser);
        } else {
          // 3. Set a mock user for local-only mode (no server auth needed)
          mockUser = {
            id: deviceId,
            username: `user_${deviceId.substring(0, 8)}`,
            email: null,
          };
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser));
        }

        setUser(mockUser);
        // setIsAuthenticated(true); // This line was removed as per the original diff, but it's not in the provided instruction. Keeping it as is.

        console.log('Local auth initialized:', mockUser);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const saveApiKey = useCallback((key) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, []);

  // Logout effectively clears the session, but autoLogin will kick in on refresh
  // unless we clear the device ID (which we won't do by default to preserve data)
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setToken(null);
    // We do NOT clear apiKey or deviceId here to allow easy re-entry
    // To fully reset, user would need to clear browser data or we add a "Hard Reset" button
  }, []);

  const value = {
    user,
    token,
    apiKey,
    loading,
    error,
    saveApiKey,
    logout,
    isAuthenticated: !!user, // Only check for user in local mode
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}

export default AuthContext;
