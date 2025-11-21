/**
 * FavoritesPanel.js
 * Displays user's favorites with filtering and pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import FavoriteCard from './FavoriteCard';
import { useAuth } from '../../contexts/AuthContext';
import * as favoritesService from '../../services/favoritesService';

/**
 * FavoritesPanel component
 * @param {Object} props - Component props
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Favorites panel component
 */
export default function FavoritesPanel({ onError }) {
  const { user, token } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(12);

  // Filtering state
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch favorites
  const fetchFavorites = useCallback(
    async (page = 1, type = filterType, search = debouncedSearch) => {
      if (!user || !token) return;

      setLoading(true);
      setError(null);

      try {
        const response = await favoritesService.getFavorites(
          page,
          pageSize,
          type === 'all' ? null : type,
          search,
        );

        setFavorites(response.favorites || []);
        setCurrentPage(response.pagination?.currentPage || 1);
        setTotalPages(response.pagination?.totalPages || 1);
        setTotalCount(response.pagination?.totalCount || 0);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        const errorMessage = err.message || 'Failed to load favorites';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [user, token, filterType, debouncedSearch, pageSize, onError],
  );

  // Initial load and refetch on dependencies change
  useEffect(() => {
    fetchFavorites(1);
  }, [fetchFavorites]);

  // Handle favorite removal
  const handleFavoriteRemove = useCallback(
    async (id) => {
      try {
        await favoritesService.removeFavorite(id);
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        // If the last item on a page is removed, go to the previous page if not on the first page
        if (favorites.length === 1 && currentPage > 1) {
          fetchFavorites(currentPage - 1);
        } else {
          // Otherwise, just refresh the current page to update totalCount and other pagination info
          fetchFavorites(currentPage);
        }
      } catch (err) {
        console.error('Error removing favorite:', err);
        const errorMessage = err.message || 'Failed to remove favorite';
        setError(errorMessage);
        if (onError) onError(errorMessage);
      }
    },
    [setFavorites, setError, onError, favorites.length, currentPage, fetchFavorites],
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        fetchFavorites(newPage);
      }
    },
    [fetchFavorites, totalPages],
  );

  // Handle filter change
  const handleFilterChange = useCallback((newType) => {
    setFilterType(newType);
    setCurrentPage(1);
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  // Loading state
  if (loading && favorites.length === 0) {
    return (
      <div className="favorites-panel loading-state">
        <div className="loading-container">
          <div className="loading-spinner">Loading favorites...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-panel">
      {/* Header */}
      <div className="favorites-header">
        <h2 className="favorites-title">My Favorites</h2>
        <div className="favorites-count">
          {totalCount} {totalCount === 1 ? 'item' : 'items'}
        </div>
      </div>

      {/* Controls */}
      <div className="favorites-controls">
        {/* Search */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="Search favorites..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn btn"
              onClick={clearSearch}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="filter-container field-row">
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            className="type-filter"
            value={filterType}
            onChange={(e) => handleFilterChange(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="APOD">APOD</option>
            <option value="NEO">Near Earth Objects</option>
            <option value="MARS">Mars Photos</option>
            <option value="EPIC">EPIC Images</option>
          </select>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-message">
            {error}
          </div>
          <button
            className="retry-btn btn"
            onClick={() => fetchFavorites(currentPage)}
          >
            Retry
          </button>
        </div>
      )}

      {/* Favorites Grid */}
      <div className="favorites-grid">
        {favorites.length === 0 ? (
          <div className="empty-state">
            <div className="empty-message">
              {searchTerm || filterType !== 'all'
                ? 'No favorites found matching your criteria.'
                : 'No favorites yet. Start exploring and save your favorite items!'}
            </div>
          </div>
        ) : (
          favorites.map((favorite) => (
            <motion.div
              key={favorite.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <FavoriteCard
                favorite={favorite}
                onRemove={handleFavoriteRemove}
                onError={onError}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-controls">
            <button
              className="btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              Previous
            </button>

            <span className="page-info">
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay for pagination */}
      {loading && favorites.length > 0 && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
}

FavoritesPanel.propTypes = {
  onError: PropTypes.func,
};

FavoritesPanel.defaultProps = {
  onError: null,
};