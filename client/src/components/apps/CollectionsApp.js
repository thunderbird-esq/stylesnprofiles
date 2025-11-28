import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';
import { CollectionsPanel } from '../favorites';

/**
 * CollectionsApp component
 * Dedicated collections management application
 * @param {Object} props - Component props
 * @param {string} props.windowId - Window identifier
 * @returns {JSX.Element} Collections application window
 */
const CollectionsApp = ({ windowId: _windowId }) => {
  const { user, loading: authLoading } = useAuth();

  // Handle error display
  const handleError = useCallback((error) => {
    console.error('Collections App Error:', error);
    alert(`Error: ${error}`);
  }, []);

  // Handle loading state
  if (authLoading) return <div className="nasa-loading">Loading...</div>;

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
      <div className="collections-app" style={{ height: '100%' }}>
        <CollectionsPanel onError={handleError} />
      </div>
    </div>
  );
};

CollectionsApp.propTypes = {
  windowId: PropTypes.string.isRequired,
};

export default CollectionsApp;