/**
 * Mock authService for testing
 */

export const getToken = jest.fn(() => 'mock-token');
export const logout = jest.fn();
export const isTokenExpired = jest.fn(() => false);
export const login = jest.fn();
export const register = jest.fn();
export const getCurrentUser = jest.fn(() => null);
export const setToken = jest.fn();
export const isAuthenticated = jest.fn(() => true);
export const decodeToken = jest.fn(() => ({ exp: Date.now() / 1000 + 3600 }));

export default {
  getToken,
  logout,
  isTokenExpired,
  login,
  register,
  getCurrentUser,
  setToken,
  isAuthenticated,
  decodeToken,
};