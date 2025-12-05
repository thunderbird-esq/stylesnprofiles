/**
 * BookmarksApp.js
 * Unified bookmarks/collections system - simplified approach
 * Combines the concept of Favorites and Collections into one
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { CollectionsPanel } from '../favorites';
import '../favorites/favorites.css';

/**
 * BookmarksApp component
 * A simplified unified bookmarks system (formerly Favorites + Collections)
 */
const BookmarksApp = ({ windowId: _windowId }) => {
    const [showError, setShowError] = useState(null);

    const handleError = useCallback((error) => {
        console.error('Bookmarks Error:', error);
        setShowError(error);
        // Auto-dismiss after 3 seconds
        setTimeout(() => setShowError(null), 3000);
    }, []);

    return (
        <div className="window-pane" style={{ padding: '16px' }}>
            <div className="bookmarks-app" style={{ height: '100%' }}>
                {/* Header */}
                <div style={{
                    marginBottom: '16px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid var(--secondary)',
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: '20px',
                        fontFamily: 'Chicago_12',
                    }}>
                        📚 My Bookmarks
                    </h2>
                    <p style={{
                        margin: '8px 0 0 0',
                        fontSize: '14px',
                        opacity: 0.8,
                    }}>
                        Organize your saved APOD images, NEO data, and more into collections.
                    </p>
                </div>

                {/* Error display */}
                {showError && (
                    <div style={{
                        padding: '10px',
                        marginBottom: '12px',
                        background: '#ffeeee',
                        border: '1px solid #ff0000',
                        fontSize: '14px',
                    }}>
                        ⚠️ {showError}
                    </div>
                )}

                {/* Collections Panel - the main content */}
                <CollectionsPanel onError={handleError} />
            </div>
        </div>
    );
};

BookmarksApp.propTypes = {
    windowId: PropTypes.string,
};

BookmarksApp.defaultProps = {
    windowId: null,
};

export default BookmarksApp;
