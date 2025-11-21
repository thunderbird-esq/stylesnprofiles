/**
 * CreateCollectionModal.js
 * Modal for creating new collections
 */

import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import * as collectionsService from '../../services/collectionsService';

/**
 * CreateCollectionModal component
 * @param {Object} props - Component props
 * @param {Function} props.onClose - Callback for closing modal
 * @param {Function} props.onCollectionCreated - Callback for successful collection creation
 * @param {Function} props.onError - Error handler function
 * @returns {JSX.Element} Create collection modal component
 */
export default function CreateCollectionModal({ onClose, onCollectionCreated, onError }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (error) setError(null);
  }, [error]);

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
      const newCollection = await collectionsService.createCollection(
        formData.name.trim(),
        formData.description.trim(),
        formData.isPublic,
      );

      if (onCollectionCreated) {
        onCollectionCreated(newCollection);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        isPublic: false,
      });

      // Close modal
      onClose();
    } catch (err) {
      console.error('Error creating collection:', err);
      const errorMessage = err.message || 'Failed to create collection';
      setError(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [formData, onClose, onCollectionCreated, onError]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        isPublic: false,
      });
      setError(null);
      onClose();
    }
  }, [loading, onClose]);

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

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleClose}
    >
      <motion.div
        className="modal-content create-collection-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Create New Collection</h2>
          <button
            className="close-modal"
            onClick={handleClose}
            disabled={loading}
            aria-label="Close modal"
          >
            ×
          </button>
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
              className="btn btn-default"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Creating...' : 'Create Collection'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

CreateCollectionModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCollectionCreated: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

CreateCollectionModal.defaultProps = {
  onError: null,
};