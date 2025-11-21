import React from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './system6/auth/AuthModal';

/**
 * ProtectedRoute - Component that protects routes requiring authentication
 * Shows auth modal when user is not authenticated
 * @component
 */
export default function ProtectedRoute({ children, allowedRoles = [], showMessage = true }) {
  const { isAuthenticated, user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  React.useEffect(() => {
    // Show auth modal if not authenticated and not loading
    if (!loading && !isAuthenticated()) {
      setShowAuthModal(true);
    }
  }, [loading, isAuthenticated]);

  // Check if user has required roles
  const hasRequiredRole = React.useMemo(() => {
    if (allowedRoles.length === 0) return true;
    return user && allowedRoles.includes(user.role);
  }, [user, allowedRoles]);

  // Still loading authentication state
  if (loading) {
    return (
      <div className="nasa-loading-container">
        <div className="font-chicago" style={{ fontSize: '16px' }}>
          Loading...
        </div>
      </div>
    );
  }

  // User is not authenticated
  if (!isAuthenticated()) {
    return (
      <>
        {showMessage && (
          <div className="nasa-auth-message">
            <div className="window" style={{ margin: '20px' }}>
              <div className="title-bar">
                <h1 className="title font-chicago">Authentication Required</h1>
              </div>
              <div className="separator"></div>
              <div className="window-pane">
                <div className="font-geneva" style={{ fontSize: '14px' }}>
                  Please log in to access this content.
                </div>
                <div className="field-row" style={{ marginTop: '16px' }}>
                  <button
                    className="btn"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Login / Register
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  // User doesn't have required role
  if (!hasRequiredRole) {
    return (
      <div className="nasa-access-denied">
        <div className="window" style={{ margin: '20px' }}>
          <div className="title-bar">
            <h1 className="title font-chicago">Access Denied</h1>
          </div>
          <div className="separator"></div>
          <div className="window-pane">
            <div className="font-geneva" style={{ fontSize: '14px' }}>
              You don't have permission to access this content.
              <br />
              Required roles: {allowedRoles.join(', ')}
              <br />
              Your role: {user?.role || 'Unknown'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated and has required role
  return <>{children}</>;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  showMessage: PropTypes.bool,
};

ProtectedRoute.defaultProps = {
  allowedRoles: [],
  showMessage: true,
};