/**
 * EditCollectionModal.js
 * Modal for editing existing collections
 */

import React, { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as collectionsService from '../../services/collectionsService';

/**
 * EditCollectionModal component
 * @param {Object} props - Component props
 * @param {Object} props.collection - Collection data to edit
 * @param {Function} props.onClose - Callback for closing modal
 * @param {Function} props.onCollectionUpdated - Callback for successful collection update
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Edit collection modal component
 */
export default function EditCollectionModal({
  collection,
  onClose,
  onCollectionUpdated,
  onError,
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data with collection data
  useEffect(() => {
    setFormData({
      name: collection.name || '',
      description: collection.description || '',
      isPublic: collection.is_public || false,
    });
    setHasChanges(false);
    setError(null);
  }, [collection]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    };
    setFormData(newFormData);

    // Check if there are changes
    const changed = (
      newFormData.name !== (collection.name || '') ||
      newFormData.description !== (collection.description || '') ||
      newFormData.isPublic !== (collection.is_public || false)
    );
    setHasChanges(changed);

    // Clear error when user starts typing
    if (error) setError(null);
  }, [formData, collection, error]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setError('Collection name is required');
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('Collection name must be at least 2 characters long');
      return;
    }

    if (formData.name.trim().length > 100) {
      setError('Collection name must be less than 100 characters');
      return;
    }

    if (formData.description && formData.description.length > 500) {
      setError('Description must be less than 500 characters');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        is_public: formData.isPublic,
      };

      const _updatedCollection = await collectionsService.updateCollection(
        collection.id,
        updates,
      );

      if (onCollectionUpdated) {
        onCollectionUpdated(_updatedCollection);
      }

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error updating collection:', err);
      const errorMessage = err.message || 'Failed to update collection';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, collection.id, onClose, onCollectionUpdated, onError]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!loading) {
      setFormData({
        name: collection.name || '',
        description: collection.description || '',
        isPublic: collection.is_public || false,
      });
      setHasChanges(false);
      setError(null);
      onClose();
    }
  }, [loading, collection, onClose]);

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !loading) {
      handleClose();
    }
  }, [loading, handleClose]);

  // Add keyboard listener
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Handle delete collection
  const handleDeleteCollection = useCallback(async () => {
    const confirmMsg =
      'Are you sure you want to delete this collection? ' +
      'This action cannot be undone and will remove all items from this collection.';
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      await collectionsService.deleteCollection(collection.id);

      // Close modal without calling onCollectionUpdated since it's deleted
      onClose();

      // Navigate back or trigger a refresh if needed
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      console.error('Error deleting collection:', err);
      const errorMessage = err.message || 'Failed to delete collection';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [collection.id, onClose, onError]);

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="modal-content edit-collection-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Edit Collection</h2>
          <button
            className="close-modal"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        {/* Current collection info */}
        <div className="collection-info">
          <div className="info-item">
            <strong>Created:</strong> {new Date(collection.created_at).toLocaleDateString()}
          </div>
          <div className="info-item">
            <strong>Last updated:</strong> {new Date(collection.updated_at).toLocaleDateString()}
          </div>
          {collection.item_count !== undefined && (
            <div className="info-item">
              <strong>Items:</strong> {collection.item_count}{' '}
              {collection.item_count === 1 ? 'item' : 'items'}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Collection Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter collection name..."
              maxLength={100}
              required
              autoFocus
              disabled={loading}
            />
            <div className="form-hint">
              {formData.name.length}/100 characters
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description for your collection..."
              maxLength={500}
              disabled={loading}
            />
            <div className="form-hint">
              {formData.description.length}/500 characters
            </div>
          </div>

          {/* Public checkbox */}
          <div className="form-group">
            <div className="form-checkbox">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                className="checkbox-input"
                checked={formData.isPublic}
                onChange={handleInputChange}
                disabled={loading}
              />
              <label htmlFor="isPublic" className="checkbox-label">
                Make this collection public
              </label>
            </div>
            <div className="form-hint">
              Public collections can be viewed by other users
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-default cancel-btn"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn save-btn"
              disabled={loading || !hasChanges || !formData.name.trim()}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Delete Section */}
          <div className="delete-section">
            <div className="delete-divider"></div>
            <button
              type="button"
              className="btn btn-danger delete-btn"
              onClick={handleDeleteCollection}
              disabled={loading}
            >
              {loading ? 'Deleting...' : 'Delete Collection'}
            </button>
            <div className="delete-warning">
              Warning: This action cannot be undone and will permanently delete this collection and
              remove all items from it.
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

EditCollectionModal.propTypes = {
  collection: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    is_public: PropTypes.bool,
    created_at: PropTypes.string.isRequired,
    updated_at: PropTypes.string.isRequired,
    item_count: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onCollectionUpdated: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

EditCollectionModal.defaultProps = {
  onError: null,
};