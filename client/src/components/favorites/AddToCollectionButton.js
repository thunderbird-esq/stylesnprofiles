/**
 * AddToCollectionButton.js
 * Button to add a favorite item to a collection
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import * as collectionsService from '../../services/collectionsService';

/**
 * AddToCollectionButton component
 * @param {Object} props - Component props
 * @param {string} props.itemId - ID of the item to add
 * @param {string} props.itemType - Type of the item (APOD, NEO, etc.)
 * @param {string} [props.collectionId] - Specific collection ID (for dropdown mode)
 * @param {string} [props.collectionName] - Collection name (for dropdown mode)
 * @param {Function} props.onSuccess - Callback for successful addition
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Add to collection button component
 */
export default function AddToCollectionButton({
  itemId,
  itemType,
  collectionId,
  collectionName,
  onSuccess,
  onError,
}) {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [collections, setCollections] = useState([]);
  const [itemCollections, setItemCollections] = useState([]);
  const dropdownRef = useRef(null);

  // Is this a specific collection button or dropdown button?
  const isSpecificCollection = !!collectionId;

  // Fetch collections and item's current collections
  const fetchData = useCallback(async () => {
    if (!user || !token || isSpecificCollection) return;

    setLoading(true);
    try {
      const [userCollections, itemCollectionsData] = await Promise.all([
        collectionsService.getCollections(),
        // Note: Backend would need an endpoint to get item's collections
        // collectionsService.getItemCollections(itemId)
      ]);

      setCollections(userCollections || []);
      setItemCollections(itemCollectionsData || []);
    } catch (err) {
      console.error('Error fetching collections data:', err);
      const errorMessage = err.message || 'Failed to load collections';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, token, isSpecificCollection, onError]);

  // Initial load for dropdown mode
  useEffect(() => {
    if (!isSpecificCollection) {
      fetchData();
    }
  }, [fetchData, isSpecificCollection]);

  // Handle click outside dropdown
  const handleClickOutside = useCallback((event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  }, []);

  useEffect(() => {
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown, handleClickOutside]);

  // Handle add to collection
  const handleAddToCollection = useCallback(async (targetCollectionId) => {
    if (!targetCollectionId) return;

    setLoading(true);
    try {
      // Assuming addItemToCollection now accepts itemType and other item data
      await collectionsService.addItemToCollection(targetCollectionId, {
        itemId,
        itemType,
        // Add other item data if needed, e.g., itemDate, itemData
      });

      if (onSuccess) {
        onSuccess(targetCollectionId);
      }

      // If in dropdown mode, update item's collections
      if (!isSpecificCollection) {
        setItemCollections(prev => [...prev, targetCollectionId]);
        setShowDropdown(false);
      }
    } catch (err) {
      console.error('Error adding item to collection:', err);
      const errorMessage = err.message || 'Failed to add item to collection';
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [itemId, itemType, onSuccess, onError, isSpecificCollection]);

  // Handle button click
  const handleButtonClick = useCallback(() => {
    if (isSpecificCollection) {
      handleAddToCollection(collectionId);
    } else {
      setShowDropdown(!showDropdown);
    }
  }, [isSpecificCollection, collectionId, handleAddToCollection, showDropdown]);

  // Check if item is already in a collection
  const isItemInCollection = useCallback((colId) => {
    return itemCollections.includes(colId);
  }, [itemCollections]);

  // Get button text
  const getButtonText = useCallback(() => {
    if (isSpecificCollection) {
      return loading ? 'Adding...' : 'Add';
    }

    if (loading) {
      return 'Loading...';
    }

    if (itemCollections.length > 0) {
      return `In ${itemCollections.length} collection${itemCollections.length === 1 ? '' : 's'}`;
    }

    return 'Add to Collection';
  }, [isSpecificCollection, loading, itemCollections.length]);

  // Get display name for collection
  const getCollectionDisplayName = useCallback((collection) => {
    return collectionName || collection.name || 'Unnamed Collection';
  }, [collectionName]);

  return (
    <div className="add-to-collection-container" ref={dropdownRef}>
      {/* Main Button */}
      <button
        className={`btn add-to-collection-btn ${isSpecificCollection ? 'specific-collection-btn' : 'dropdown-btn'
        } ${itemCollections.length > 0 && !isSpecificCollection ? 'has-collections' : ''
        }`}
        onClick={handleButtonClick}
        disabled={loading}
        title={
          isSpecificCollection
            ? `Add to ${getCollectionDisplayName({ name: collectionName })}`
            : 'Add to collection'
        }
      >
        {getButtonText()}
      </button>

      {/* Collections Dropdown */}
      {!isSpecificCollection && (
        <AnimatePresence>
          {showDropdown && (
            <motion.div
              className="collections-dropdown"
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="dropdown-header">
                <span>Add to collection:</span>
              </div>

              {collections.length === 0 ? (
                <div className="no-collections">
                  <div className="no-collections-message">
                    No collections found
                  </div>
                  <button className="btn create-collection-btn">
                    Create Collection
                  </button>
                </div>
              ) : (
                <div className="collections-list">
                  {collections.map((collection) => {
                    const isInCollection = isItemInCollection(collection.id);
                    return (
                      <button
                        key={collection.id}
                        className={`collection-option ${isInCollection ? 'in-collection' : ''}`}
                        onClick={() => !isInCollection && handleAddToCollection(collection.id)}
                        disabled={isInCollection || loading}
                        title={
                          isInCollection
                            ? 'Already in this collection'
                            : `Add to ${collection.name}`
                        }
                      >
                        <span className="collection-name">
                          {getCollectionDisplayName(collection)}
                        </span>
                        {isInCollection && (
                          <span className="in-collection-indicator">✓</span>
                        )}
                        {collection.is_public && (
                          <span className="public-indicator">Public</span>
                        )}
                        <span className="item-count">
                          {collection.item_count || 0} items
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="dropdown-footer">
                <button className="btn create-new-collection-btn">
                  + Create New Collection
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style jsx>{`
        .add-to-collection-container {
          position: relative;
          display: inline-block;
        }

        .add-to-collection-btn {
          font-size: 11px;
          padding: 0 8px;
          min-height: auto;
          white-space: nowrap;
        }

        .specific-collection-btn {
          background: var(--primary);
          color: var(--secondary);
          border: 1.5px solid var(--secondary);
        }

        .specific-collection-btn:hover:not(:disabled) {
          background: var(--secondary);
          color: var(--primary);
        }

        .dropdown-btn {
          background: var(--primary);
          color: var(--secondary);
          border: 1.5px solid var(--secondary);
        }

        .dropdown-btn:hover:not(:disabled) {
          background: var(--secondary);
          color: var(--primary);
        }

        .dropdown-btn.has-collections {
          background: var(--secondary);
          color: var(--primary);
        }

        .dropdown-btn.has-collections:hover:not(:disabled) {
          background: var(--primary);
          color: var(--secondary);
        }

        .add-to-collection-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .collections-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: var(--primary);
          border: 2px solid var(--secondary);
          border-top: none;
          box-shadow: 2px 2px var(--secondary);
          z-index: 1000;
          min-width: 200px;
          max-height: 300px;
          overflow-y: auto;
        }

        .dropdown-header {
          padding: 0.5rem 0.75rem;
          background: var(--secondary);
          color: var(--primary);
          font-weight: bold;
          font-size: 12px;
          border-bottom: 1px solid var(--secondary);
        }

        .no-collections {
          padding: 1rem;
          text-align: center;
        }

        .no-collections-message {
          color: var(--tertiary);
          font-style: italic;
          margin-bottom: 0.5rem;
          font-size: 12px;
        }

        .create-collection-btn {
          font-size: 11px;
          padding: 0.25rem 0.5rem;
          min-height: auto;
        }

        .collections-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .collection-option {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: var(--primary);
          border: none;
          border-bottom: 1px solid var(--tertiary);
          text-align: left;
          cursor: pointer;
          font-size: 12px;
          color: var(--secondary);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          transition: all 0.2s ease;
        }

        .collection-option:hover:not(:disabled) {
          background: var(--secondary);
          color: var(--primary);
        }

        .collection-option:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: var(--tertiary);
        }

        .collection-option.in-collection {
          background: var(--tertiary);
          color: var(--primary);
          font-style: italic;
        }

        .collection-name {
          font-weight: bold;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .in-collection-indicator {
          font-weight: bold;
          color: var(--primary);
          font-size: 10px;
        }

        .collection-option.in-collection .in-collection-indicator {
          color: var(--secondary);
        }

        .public-indicator {
          background: var(--secondary);
          color: var(--primary);
          padding: 0.125rem 0.25rem;
          border-radius: 2px;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: bold;
          align-self: flex-start;
        }

        .collection-option.in-collection .public-indicator {
          background: var(--primary);
          color: var(--tertiary);
        }

        .item-count {
          font-size: 10px;
          color: var(--tertiary);
          font-style: italic;
        }

        .collection-option.in-collection .item-count {
          color: var(--primary);
          opacity: 0.7;
        }

        .dropdown-footer {
          padding: 0.5rem;
          border-top: 1px solid var(--secondary);
          background: var(--primary);
        }

        .create-new-collection-btn {
          width: 100%;
          font-size: 11px;
          padding: 0.25rem 0.5rem;
          min-height: auto;
          background: var(--primary);
          color: var(--secondary);
          border: 1px solid var(--secondary);
        }

        .create-new-collection-btn:hover:not(:disabled) {
          background: var(--secondary);
          color: var(--primary);
        }

        /* System 6 button styles integration */
        .btn {
          min-height: 20px;
          min-width: 59px;
          padding: 0 20px;
          text-align: center;
          background: var(--primary);
          border-style: solid;
          border-width: 5.5px;
          border-image: url('./icon/button.svg') 30 stretch;
          color: var(--secondary);
          text-decoration: none;
          font-size: 18px;
          font-family: Chicago_12;
          cursor: pointer;
        }

        .btn:active {
          background: var(--secondary);
          border-radius: 6px;
          color: var(--primary);
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .collections-dropdown {
            left: -50px;
            right: -50px;
            min-width: auto;
          }

          .collection-option {
            padding: 0.75rem;
          }

          .add-to-collection-btn {
            font-size: 10px;
            padding: 0 6px;
          }
        }

        /* Scrollbar styling for dropdown */
        .collections-list::-webkit-scrollbar {
          width: 12px;
        }

        .collections-list::-webkit-scrollbar-track {
          background: var(--primary);
        }

        .collections-list::-webkit-scrollbar-thumb {
          background: var(--secondary);
          border-radius: 2px;
        }

        .collections-list::-webkit-scrollbar-thumb:hover {
          background: var(--tertiary);
        }
      `}</style>
    </div>
  );
}

AddToCollectionButton.propTypes = {
  itemId: PropTypes.string.isRequired,
  itemType: PropTypes.string.isRequired,
  collectionId: PropTypes.string,
  collectionName: PropTypes.string,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};

AddToCollectionButton.defaultProps = {
  collectionId: null,
  collectionName: null,
  onSuccess: null,
  onError: null,
};