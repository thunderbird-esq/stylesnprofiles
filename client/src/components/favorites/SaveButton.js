import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { addFavorite, removeFavorite, isFavorited } from '../../services/favoritesService';
import './favorites.css';

/**
 * SaveButton Component
 * System 6 styled button for saving/unsaving items to favorites
 * 
 * @param {Object} props
 * @param {string} props.itemType - Type of item (APOD, NEO, MARS, etc.)
 * @param {string} props.itemId - Unique identifier for the item
 * @param {string} props.itemDate - Date associated with the item (optional)
 * @param {Object} props.itemData - Complete item data to save
 * @param {string} [props.className] - Optional additional classes
 * @param {string} [props.size] - Button size (small/normal)
 * @param {Function} [props.onError] - Error callback
 */
const SaveButton = ({
  itemType,
  itemId,
  itemDate,
  itemData,
  className = '',
  size = 'normal',
  onError,
}) => {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if item is already saved on mount
  useEffect(() => {
    let mounted = true;

    const checkSavedStatus = async () => {
      if (!user || !itemId) return;

      try {
        const isSaved = await isFavorited(itemId);
        if (mounted) setSaved(isSaved);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };

    checkSavedStatus();
    return () => { mounted = false; };
  }, [user, itemId]);

  const handleToggleSave = async (e) => {
    e.stopPropagation(); // Prevent parent click events

    if (!user) {
      if (onError) onError('Please login to save items');
      return;
    }

    setLoading(true);

    try {
      if (saved) {
        await removeFavorite(itemId);
        setSaved(false);
      } else {
        await addFavorite({
          itemType,
          itemId,
          itemDate,
          data: itemData,
        });
        setSaved(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      if (onError) onError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <button
      className={`nasa-btn ${saved ? 'nasa-btn-primary' : ''} ${className}`}
      onClick={handleToggleSave}
      disabled={loading}
      title={saved ? 'Remove from favorites' : 'Add to favorites'}
      style={size === 'small' ? { fontSize: '10px', padding: '2px 6px' } : {}}
    >
      {loading ? '...' : saved ? '★ Saved' : '☆ Save'}
    </button>
  );
};

SaveButton.propTypes = {
  itemType: PropTypes.string.isRequired,
  itemId: PropTypes.string.isRequired,
  itemDate: PropTypes.string,
  itemData: PropTypes.object.isRequired,
  className: PropTypes.string,
  size: PropTypes.string,
  onError: PropTypes.func,
};

export default SaveButton;