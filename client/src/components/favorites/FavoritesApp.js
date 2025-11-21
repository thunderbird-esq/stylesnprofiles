import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getFavorites, removeFavorite } from '../../services/favoritesService';
import { useAuth } from '../../contexts/AuthContext';
import './favorites.css';

/**
 * FavoritesApp Component
 * Displays a list of user's saved favorites
 */
const FavoritesApp = ({ windowId: _windowId }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFavorites = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const data = await getFavorites(page);
      setFavorites(data.favorites);
      setTotalPages(data.pagination.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [user, page]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemove = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to remove this item?')) return;

    try {
      await removeFavorite(id);
      // Refresh list
      fetchFavorites();
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove item');
    }
  };

  if (!user) {
    return (
      <div className="favorites-empty">
        Please login to view your favorites.
      </div>
    );
  }

  if (loading && favorites.length === 0) {
    return <div className="favorites-loading">Loading favorites...</div>;
  }

  if (error) {
    return <div className="nasa-error">{error}</div>;
  }

  return (
    <div className="favorites-app">
      <div className="nasa-data-section">
        <div className="nasa-data-title">My Saved Items</div>

        {favorites.length === 0 ? (
          <div className="favorites-empty">
            No favorites yet. Save items from other apps!
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map(item => (
              <div key={item.id} className="favorite-item">
                {item.media_type === 'image' && (
                  <img
                    src={item.url}
                    alt={item.title}
                    className="favorite-thumbnail"
                  />
                )}
                <div className="favorite-info">
                  <div className="favorite-title">{item.title}</div>
                  <div className="favorite-meta">
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{new Date(item.saved_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="favorite-actions">
                  <button
                    className="favorite-action-btn"
                    onClick={(e) => handleRemove(item.id, e)}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination-controls text-center mt-2">
            <button
              className="nasa-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <span className="font-geneva mx-2">
              Page {page} of {totalPages}
            </span>
            <button
              className="nasa-btn"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

FavoritesApp.propTypes = {
  windowId: PropTypes.string,
};

export default FavoritesApp;
