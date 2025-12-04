import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { CollectionsPanel } from '../favorites';

/**
 * CollectionsApp component
 * Dedicated collections management application
 * @param {Object} props - Component props
 * @param {string} props.windowId - Window identifier
 * @returns {JSX.Element} Collections application window
 */
const CollectionsApp = ({ windowId: _windowId }) => {
  // Handle error display
  const handleError = useCallback((error) => {
    console.error('Collections App Error:', error);
    alert(`Error: ${error}`);
  }, []);

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