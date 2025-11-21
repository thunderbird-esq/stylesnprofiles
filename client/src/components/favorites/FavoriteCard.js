/**
 * FavoriteCard.js
 * Displays a single favorite item with actions
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as favoritesService from '../../services/favoritesService';
import AddToCollectionButton from './AddToCollectionButton';

/**
 * FavoriteCard component
 * @param {Object} props - Component props
 * @param {Object} props.favorite - Favorite item data
 * @param {string} props.favorite.id - Item ID
 * @param {string} props.favorite.type - Item type (APOD, NEO, etc.)
 * @param {string} props.favorite.title - Item title
 * @param {string} props.favorite.description - Item description
 * @param {string} props.favorite.url - Item URL
 * @param {string} props.favorite.date - Item date
 * @param {Function} props.onRemove - Callback for removing favorite
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Favorite card component
 */
export default function FavoriteCard({ favorite, onRemove, onError }) {
  const [loading, setLoading] = useState(false);

  // Handle remove from favorites
  const handleRemove = useCallback(async (_e) => {
    if (!window.confirm('Are you sure you want to remove this item from favorites?')) {
      return;
    }

    setLoading(true);
    try {
      await favoritesService.removeFavorite(favorite.id);
      if (onRemove) onRemove(favorite.id);
    } catch (err) {
      console.error('Error removing favorite:', err);
      const errorMessage = err.message || 'Failed to remove favorite';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [favorite.id, onRemove, onError]);

  // Format date
  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  }, []);

  // Get item type display name
  const getTypeDisplayName = useCallback((type) => {
    const typeMap = {
      'APOD': 'Astronomy Picture',
      'NEO': 'Near Earth Object',
      'MARS': 'Mars Photo',
      'EPIC': 'EPIC Image',
    };
    return typeMap[type] || type;
  }, []);

  return (
    <motion.div
      className="favorite-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="favorite-card-content">
        {/* Image or thumbnail */}
        {favorite.url && (
          <div className="favorite-thumbnail">
            <img
              src={favorite.url}
              alt={favorite.title}
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="thumbnail-placeholder">
              <span>{getTypeDisplayName(favorite.type)}</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="favorite-content">
          {/* Header */}
          <div className="favorite-header">
            <div className="favorite-type">
              {getTypeDisplayName(favorite.type)}
            </div>
            {favorite.date && (
              <div className="favorite-date">
                {formatDate(favorite.date)}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 className="favorite-title">
            {favorite.title || 'Untitled'}
          </h3>

          {/* Description */}
          {favorite.description && (
            <div className="favorite-description">
              {favorite.description.length > 150
                ? `${favorite.description.substring(0, 150)}...`
                : favorite.description}
            </div>
          )}

          {/* Actions */}
          <div className="favorite-actions">
            <AddToCollectionButton
              itemId={favorite.id}
              itemType={favorite.type}
              onError={onError}
            />

            <button
              className="btn btn-default remove-btn"
              onClick={handleRemove}
              disabled={loading}
              title="Remove from favorites"
            >
              {loading ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

FavoriteCard.propTypes = {
  favorite: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    title: PropTypes.string,
    description: PropTypes.string,
    url: PropTypes.string,
    date: PropTypes.string,
  }).isRequired,
  onRemove: PropTypes.func,
  onError: PropTypes.func,
};

FavoriteCard.defaultProps = {
  onRemove: null,
  onError: null,
};