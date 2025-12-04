import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import FavoritesPanel from './FavoritesPanel';
import './favorites.css';

/**
 * FavoritesApp Component
 * Displays a list of user's saved favorites using FavoritesPanel
 */
const FavoritesApp = ({ windowId: _windowId }) => {
  const handleError = useCallback((error) => {
    console.error('Favorites App Error:', error);
    // Optional: Show toast or alert
  }, []);

  return (
    <div className="window-pane">
      <div className="favorites-app" style={{ height: '100%' }}>
        <FavoritesPanel onError={handleError} />
      </div>
    </div>
  );
};

FavoritesApp.propTypes = {
  windowId: PropTypes.string,
};

export default FavoritesApp;

