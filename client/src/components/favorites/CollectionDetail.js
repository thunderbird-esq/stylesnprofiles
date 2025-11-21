/**
 * CollectionDetail.js
 * Shows collection with items and management options
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import * as collectionsService from '../../services/collectionsService';
import EditCollectionModal from './EditCollectionModal';

/**
 * CollectionDetail component
 * @param {Object} props - Component props
 * @param {Object} props.collection - Collection data
 * @param {Function} props.onBack - Callback for back navigation
 * @param {Function} props.onCollectionUpdate - Callback for collection updates
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Collection detail component
 */
export default function CollectionDetail({
  collection,
  onBack,
  onCollectionUpdate,
  onError,
}) {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch collection items
  const fetchItems = useCallback(async () => {
    if (!collection?.id || !user || !token) return;

    setLoading(true);

    try {
      const collectionItems = await collectionsService.getCollectionItems(collection.id);
      setItems(collectionItems || []);
    } catch (err) {
      console.error('Error fetching collection items:', err);
      const errorMessage = err.message || 'Failed to load collection items';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collection?.id, user, token, onError]);

  // Initial load
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle item removal from collection
  const handleItemRemove = useCallback(async (itemId) => {
    try {
      await collectionsService.removeItemFromCollection(collection.id, itemId);
      setItems(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error removing item from collection:', err);
      const errorMessage = err.message || 'Failed to remove item from collection';
      if (onError) onError(errorMessage);
    }
  }, [collection.id, onError]);

  // Handle collection update
  const handleCollectionUpdated = useCallback((updatedCollection) => {
    if (onCollectionUpdate) {
      onCollectionUpdate(updatedCollection);
    }
    setShowEditModal(false);
  }, [onCollectionUpdate]);

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="collection-detail loading-state">
        <div className="back-button">
          <button className="btn" onClick={onBack}>
            ← Back to Collections
          </button>
        </div>
        <div className="loading-container">
          <div className="loading-spinner">Loading collection items...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="collection-detail">
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
        <h2>{collection.name}</h2>
        <div className="header-actions">
          <button className="nasa-btn" onClick={() => setShowEditModal(true)}>
            Edit
          </button>
          {/* Delete functionality not yet implemented */}
          {/* in this component */}
          {/*
            <button
              className="nasa-btn danger"
              onClick={handleDeleteCollection}
            >
              Delete
            </button>
          */}
        </div>
      </div>

      <div className="collection-meta">
        <p className="description">{collection.description || 'No description'}</p>
        <div className="meta-tags">
          {collection.is_public && <span className="tag public">Public</span>}
          <span className="tag count">{items.length} items</span>
          <span className="tag date">
            Created: {new Date(collection.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="items-grid">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>This collection is empty.</p>
            <p>Browse the APOD or NEO apps to add items!</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="collection-item-card">
              <div className="item-preview">
                {item.data.media_type === 'video' ? (
                  <div className="video-placeholder">▶</div>
                ) : (
                  <img src={item.data.url} alt={item.data.title} />
                )}
              </div>
              <div className="item-info">
                <h4>{item.data.title || item.data.name}</h4>
                <p className="item-date">
                  {item.data.date || item.data.close_approach_date}
                </p>
                <button
                  className="remove-btn"
                  onClick={() => handleItemRemove(item.id)}
                  title="Remove from collection"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEditModal && (
        <EditCollectionModal
          collection={collection}
          onClose={() => setShowEditModal(false)}
          onCollectionUpdated={handleCollectionUpdated}
          onError={onError}
        />
      )}

      <style jsx>{`
        .collection-detail {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--text-secondary);
        }
        .back-btn {
          background: none;
          border: none;
          color: var(--text);
          cursor: pointer;
          font-family: 'Chicago_12';
        }
        .header-actions {
          display: flex;
          gap: 8px;
        }
        .collection-meta {
          background: var(--surface-secondary);
          padding: 12px;
          border: 1px dotted var(--text-secondary);
        }
        .description {
          margin-bottom: 8px;
          font-style: italic;
        }
        .meta-tags {
          display: flex;
          gap: 8px;
          font-size: 11px;
        }
        .tag {
          padding: 2px 6px;
          background: var(--primary);
          color: var(--secondary);
          border: 1px solid var(--secondary);
        }
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 16px;
          overflow-y: auto;
          flex: 1;
          padding: 4px;
        }
        .collection-item-card {
          border: 1px solid var(--text);
          background: var(--surface);
          position: relative;
        }
        .item-preview {
          height: 100px;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .item-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .video-placeholder {
          color: white;
          font-size: 24px;
        }
        .item-info {
          padding: 8px;
        }
        .item-info h4 {
          margin: 0 0 4px 0;
          font-size: 12px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .item-date {
          font-size: 10px;
          color: var(--text-secondary);
          margin: 0;
        }
        .remove-btn {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(0,0,0,0.5);
          color: white;
          border: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .remove-btn:hover {
          background: red;
        }
        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 32px;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}

CollectionDetail.propTypes = {
  collection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    created_at: PropTypes.string,
    updated_at: PropTypes.string,
  }).isRequired,
  onBack: PropTypes.func.isRequired,
  onCollectionUpdate: PropTypes.func,
  onError: PropTypes.func,
};

CollectionDetail.defaultProps = {
  onCollectionUpdate: null,
  onError: null,
};