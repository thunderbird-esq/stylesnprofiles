/**
 * CollectionsPanel.js
 * Displays user's collections with management options
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import * as collectionsService from '../../services/collectionsService';
import CreateCollectionModal from './CreateCollectionModal';
import CollectionDetail from './CollectionDetail';

/**
 * CollectionsPanel component
 * @param {Object} props - Component props
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Collections panel component
 */
export default function CollectionsPanel({ onError }) {
  const { user, token } = useAuth();
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    try {
      const userCollections = await collectionsService.getCollections();
      setCollections(userCollections);
    } catch (err) {
      console.error('Error fetching collections:', err);
      const errorMessage = err.message || 'Failed to load collections';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, token, onError]);

  // Initial load
  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Handle collection selection
  const handleCollectionSelect = useCallback((collection) => {
    setSelectedCollection(collection);
  }, []);

  // Handle collection creation
  const handleCollectionCreated = useCallback((newCollection) => {
    setCollections(prev => [...prev, newCollection]);
    setShowCreateModal(false);
  }, []);

  // Handle collection deletion
  const handleDeleteCollection = useCallback(async (collectionId, e) => {
    e.stopPropagation(); // Prevent parent onClick from firing
    if (window.confirm('Are you sure you want to delete this collection?')) {
      try {
        await collectionsService.deleteCollection(collectionId);
        setCollections(prev => prev.filter(c => c.id !== collectionId));
        if (selectedCollection?.id === collectionId) {
          setSelectedCollection(null);
        }
        // Optionally re-fetch if there are complex dependencies or caching issues
        // fetchCollections();
      } catch (err) {
        console.error('Error deleting collection:', err);
        const errorMessage = err.message || 'Failed to delete collection';
        setError(errorMessage); // Set local error state
        if (onError) onError(errorMessage); // Also call global error handler
      }
    }
  }, [selectedCollection, onError]);

  // Handle back to collections list
  const handleBackToList = useCallback(() => {
    setSelectedCollection(null);
  }, []);

  // Handle collection update
  const handleCollectionUpdate = useCallback((updatedCollection) => {
    setCollections(prev =>
      prev.map(c => c.id === updatedCollection.id ? updatedCollection : c),
    );
    if (selectedCollection?.id === updatedCollection.id) {
      setSelectedCollection(updatedCollection);
    }
  }, [selectedCollection]);

  // Loading state
  if (loading && collections.length === 0) {
    return (
      <div className="collections-panel loading-state">
        <div className="loading-container">
          <div className="loading-spinner">Loading collections...</div>
        </div>
      </div>
    );
  }

  // Show collection detail if selected
  if (selectedCollection) {
    return (
      <CollectionDetail
        collection={selectedCollection}
        onBack={handleBackToList}
        onCollectionUpdate={handleCollectionUpdate}
        onError={onError}
      />
    );
  }

  return (
    <div className="collections-panel">
      {/* Header */}
      <div className="collections-header">
        <h2 className="collections-title">My Collections</h2>
        <button
          className="btn btn-default create-collection-btn"
          onClick={() => setShowCreateModal(true)}
        >
          New Collection
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="error-state">
          <div className="error-message">
            {error}
          </div>
          <button
            className="retry-btn btn"
            onClick={fetchCollections}
          >
            Retry
          </button>
        </div>
      )}

      {/* Collections Grid */}
      <div className="collections-grid">
        {collections.length === 0 ? (
          <div className="empty-state">
            <div className="empty-message">
              No collections yet. Create your first collection to organize your favorites!
            </div>
            <button
              className="btn btn-default create-first-btn"
              onClick={() => setShowCreateModal(true)}
            >
              Create Collection
            </button>
          </div>
        ) : (
          collections.map((collection) => (
            <motion.div
              key={collection.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="collection-card">
                <div className="collection-content">
                  <h3 className="collection-title">{collection.name}</h3>
                  {collection.description && (
                    <p className="collection-description">
                      {collection.description.length > 100
                        ? `${collection.description.substring(0, 100)}...`
                        : collection.description}
                    </p>
                  )}
                  <div className="collection-meta">
                    <span className="item-count">
                      {collection.item_count || 0} {collection.item_count === 1 ? 'item' : 'items'}
                    </span>
                    {collection.is_public && (
                      <span className="public-badge">Public</span>
                    )}
                    {collection.created_at && (
                      <span className="created-date">
                        Created {new Date(collection.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="collection-actions">
                  <button
                    className="btn view-collection-btn"
                    onClick={() => handleCollectionSelect(collection)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-default delete-collection-btn"
                    onClick={(e) => handleDeleteCollection(collection.id, e)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Collection Modal */}
      {showCreateModal && (
        <CreateCollectionModal
          onClose={() => setShowCreateModal(false)}
          onCollectionCreated={handleCollectionCreated}
          onError={onError}
        />
      )}

      {/* Loading overlay */}
      {loading && collections.length > 0 && (
        <div className="loading-overlay">
          <div className="loading-spinner">Loading...</div>
        </div>
      )}
    </div>
  );
}

CollectionsPanel.propTypes = {
  onError: PropTypes.func,
};

CollectionsPanel.defaultProps = {
  onError: null,
};
