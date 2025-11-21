/**
 * Authentication Context
 * Provides authentication state and methods throughout the app
 */

import React, {
  createContext, useState, useContext, useEffect, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const checkAuth = useCallback(() => {
    setLoading(true);
    const storedToken = authService.getToken();
    const storedUser = authService.getCurrentUser();

    if (storedToken && storedUser) {
      // Check if token is expired
      if (authService.isTokenExpired(storedToken)) {
        // Token expired, clear storage
        authService.logout();
        setUser(null);
        setTokenState(null);
      } else {
        setTokenState(storedToken);
        setUser(storedUser);
      }
    }
    setLoading(false);
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const {
        user: loggedInUser,
        token: authToken,
      } = await authService.login(email, password);
      setUser(loggedInUser);
      setTokenState(authToken);
      setLoading(false);
      return { user: loggedInUser, token: authToken };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const register = async (email, username, password) => {
    setLoading(true);
    setError(null);

    try {
      const {
        user: newUser,
        token: authToken,
      } = await authService.register(email, username, password);
      setUser(newUser);
      setTokenState(authToken);
      setLoading(false);
      return { user: newUser, token: authToken };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
    setTokenState(null);
    setError(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthContext;
