import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import {
  CollectionsPanel,
  CreateCollectionModal,
} from '../favorites';

/**
 * CollectionsApp component
 * Dedicated collections management application
 * @param {Object} props - Component props
 * @param {string} props.windowId - Window identifier
 * @returns {JSX.Element} Collections application window
 */
const CollectionsApp = ({ windowId: _windowId }) => {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Handle error display
  const handleError = useCallback((error) => {
    console.error('Collections App Error:', error);
    alert(`Error: ${error}`);
  }, []);

  // Handle collection creation
  const handleCollectionCreated = useCallback((newCollection) => {
    console.log('Collection created:', newCollection);
    setShowCreateModal(false);
  }, []);

  // If user is not authenticated, show login prompt
  if (!user) {
    return (
      <div className="window-pane">
        <div className="collections-app auth-required">
          <div className="auth-message" style={{ textAlign: 'center', padding: '2rem' }}>
            <h2
              className="font-chicago"
              style={{ marginBottom: '1rem', color: 'var(--secondary)' }}
            >
              Please Sign In
            </h2>
            <p className="font-geneva" style={{ color: 'var(--tertiary)', fontStyle: 'italic' }}>
              You need to be signed in to manage collections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="window-pane">
      <div className="collections-app">
        {/* Header with create button */}
        <div className="collections-header" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--secondary)',
        }}>
          <h2 className="font-chicago" style={{ fontSize: '16px', margin: 0 }}>
            My Collections
          </h2>
          <button
            className="btn btn-default"
            onClick={() => setShowCreateModal(true)}
            style={{ fontSize: '11px', padding: '0 8px', minHeight: 'auto' }}
          >
            + New Collection
          </button>
        </div>

        {/* Collections Panel */}
        <div className="collections-content" style={{ height: 'calc(100% - 60px)' }}>
          <CollectionsPanel onError={handleError} />
        </div>

        {/* Create Collection Modal */}
        {showCreateModal && (
          <CreateCollectionModal
            onClose={() => setShowCreateModal(false)}
            onCollectionCreated={handleCollectionCreated}
            onError={handleError}
          />
        )}
      </div>
    </div>
  );
};

CollectionsApp.propTypes = {
  windowId: PropTypes.string.isRequired,
};

export default CollectionsApp;