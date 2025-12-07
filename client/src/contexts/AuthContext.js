/**
 * AuthContext.js
 * Simplified for GitHub Pages static deployment
 * Manages only: NASA API Key and local device ID (for localStorage identification)
 * NO login/register/tokens - everything is localStorage-based and private
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext(null);

const API_KEY_STORAGE_KEY = 'nasa_api_key';
const DEVICE_ID_KEY = 'nasa_device_id';

export function AuthProvider({ children }) {
  const [apiKey, setApiKeyState] = useState('');
  const [deviceId, setDeviceId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generate a UUID-like string for device identification
  const generateId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  };

  useEffect(() => {
    // Initialize on mount
    setLoading(true);

    // Get or create device ID (used for localStorage identification)
    let storedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!storedDeviceId) {
      storedDeviceId = generateId();
      localStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
    }
    setDeviceId(storedDeviceId);

    // Load saved API key
    const savedApiKey = localStorage.getItem(API_KEY_STORAGE_KEY) || '';
    setApiKeyState(savedApiKey);

    setLoading(false);
  }, []);

  const saveApiKey = useCallback((key) => {
    setApiKeyState(key);
    if (key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key);
    } else {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    }
  }, []);

  // Simple user object for components that expect it
  const user = deviceId ? {
    id: deviceId,
    username: `Explorer_${deviceId.substring(0, 8)}`,
  } : null;

  const value = {
    user,
    apiKey,
    saveApiKey,
    loading,
    // Always "authenticated" in localStorage mode - no login required
    isAuthenticated: true,
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
