import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { addFavorite, removeFavorite, isFavorited } from '../../services/favoritesService';
import './favorites.css';
import AddToCollectionButton from './AddToCollectionButton';

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
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if item is already saved on mount
  useEffect(() => {
    let mounted = true;

    const checkSavedStatus = async () => {
      if (!itemId) return;

      try {
        const isSaved = await isFavorited(itemId);
        if (mounted) setSaved(isSaved);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };

    checkSavedStatus();
    return () => { mounted = false; };
  }, [itemId]);

  const handleToggleSave = async (e) => {
    e.stopPropagation(); // Prevent parent click events

    setLoading(true);

    try {
      if (saved) {
        await removeFavorite(itemId);
        setSaved(false);
      } else {
        await addFavorite({
          id: itemId,
          type: itemType,
          date: itemDate,
          ...itemData,
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

  return (
    <div
      className={`save-button-container ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
    >
      <button
        className={`nasa-btn ${saved ? 'nasa-btn-primary' : ''}`}
        onClick={handleToggleSave}
        disabled={loading}
        title={saved ? 'Remove from favorites' : 'Add to favorites'}
        style={size === 'small' ? { fontSize: '10px', padding: '2px 6px' } : {}}
      >
        {loading ? '...' : saved ? '★ Saved' : '☆ Save'}
      </button>

      {saved && (
        <div style={size === 'small' ? { transform: 'scale(0.9)', transformOrigin: 'left center' } : {}}>
          <AddToCollectionButton
            itemId={itemId}
            itemType={itemType}
            onError={onError}
            onSuccess={() => console.log('Added to collection')}
          />
        </div>
      )}
    </div>
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