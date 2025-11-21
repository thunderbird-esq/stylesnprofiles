import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { useApps } from '../contexts/AppContext';

/**
 * Error Boundary component that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI with System 6 styling
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {React.ReactNode} props.fallback - Custom fallback UI (optional)
 * @param {boolean} props.showErrorDetails - Whether to show detailed error information
 * @param {Function} props.onError - Callback function when an error occurs
 * @param {Function} props.onReset - Callback function when the error boundary is reset
 * @returns {JSX.Element} Error boundary component
 */
class ErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      errorCount: 0,
      retryCount: 0,
      errorHistory: [],
    };

    // Generate unique error ID for tracking
    this.generateErrorId = () => {
      return `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Log error to console and external service
    this.logError = (error, errorInfo, errorId) => {
      const errorData = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        errorCount: this.state.errorCount + 1,
      };

      // Console logging for development
      console.group(`🚨 Error Boundary - ${errorId}`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Error Data:', errorData);
      console.groupEnd();

      // Log to external service (if available)
      this.logToExternalService(errorData);

      // Update error history
      this.setState(prevState => ({
        errorHistory: [...prevState.errorHistory.slice(-4), errorData], // Keep last 5 errors
      }));
    };

    // Log to external monitoring service
    this.logToExternalService = (errorData) => {
      // In a real application, you would send this to a service like:
      // - Sentry, LogRocket, Bugsnag, etc.
      // - Custom error logging endpoint
      // - Analytics service

      try {
        // Example: Send to custom endpoint
        if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ERROR_ENDPOINT) {
          /* eslint-disable-next-line no-undef */
          fetch(process.env.REACT_APP_ERROR_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(errorData),
          }).catch(err => {
            console.warn('Failed to log error to external service:', err);
          });
        }
      } catch (err) {
        console.warn('Error logging service unavailable:', err);
      }
    };

    // Reset error boundary state
    this.resetErrorBoundary = () => {
      const { onReset } = this.props;

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1,
      }));

      // Call reset callback if provided
      if (onReset) {
        onReset();
      }
    };

    // Handle retry with exponential backoff
    this.handleRetry = () => {
      const { retryCount } = this.state;
      const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 second delay

      setTimeout(() => {
        this.resetErrorBoundary();
      }, delay);
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorCount: prev => prev.errorCount + 1,
    };
  }

  componentDidCatch(error, errorInfo) {
    const { onError } = this.props;
    const errorId = this.generateErrorId();

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // Log the error
    this.logError(error, errorInfo, errorId);

    // Call error callback if provided
    if (onError) {
      onError(error, errorInfo, errorId);
    }
  }

  render() {
    const {
      children,
      fallback,
      showErrorDetails = process.env.NODE_ENV === 'development',
    } = this.props;
    const { hasError, error, errorInfo, errorId, retryCount, errorHistory } = this.state;

    if (hasError) {
      // If custom fallback is provided, use it
      if (fallback) {
        return typeof fallback === 'function' ? fallback({
          error,
          errorInfo,
          errorId,
          retryCount,
          reset: this.resetErrorBoundary,
          retry: this.handleRetry,
        }) : fallback;
      }

      // Default error UI with System 6 styling
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo}
          errorId={errorId}
          retryCount={retryCount}
          errorHistory={errorHistory}
          showErrorDetails={showErrorDetails}
          _onReset={this.resetErrorBoundary}
          onRetry={this.handleRetry}
        />
      );
    }

    return children;
  }
}

ErrorBoundaryClass.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  showErrorDetails: PropTypes.bool,
  onError: PropTypes.func,
  onReset: PropTypes.func,
};

/**
 * Error Fallback component with System 6 styling
 */
function ErrorFallback({
  error,
  errorInfo,
  errorId,
  retryCount,
  errorHistory,
  showErrorDetails,
  _onReset,
  onRetry,
}) {
  const [showDetails, setShowDetails] = React.useState(false);
  const { openApp } = useApps();

  // Handle opening error report window
  const openErrorReport = () => {
    openApp('errorReport', {
      title: 'Error Report',
      errorId,
      error,
      errorInfo,
      errorHistory,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="nasa-desktop" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <motion.div
        className="nasa-window"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          maxWidth: '90vw',
          height: showDetails ? '600px' : '300px',
          maxHeight: '90vh',
        }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="title-bar">
          <h1 className="title font-chicago">⚠️ System Error</h1>
        </div>
        <div className="separator"></div>

        <div className="window-pane nasa-window-content" style={{ padding: '16px' }}>
          {/* Error Icon and Message */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '16px',
            gap: '12px',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: 'var(--secondary)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0,
            }}>
              ⚠️
            </div>
            <div>
              <h2 className="font-chicago" style={{ margin: '0 0 4px 0', fontSize: '14px' }}>
                Application Error
              </h2>
              <p
                className="font-geneva"
                style={{ margin: 0, fontSize: '9px', color: 'var(--tertiary)' }}
              >
                Error ID: {errorId}
              </p>
              {retryCount > 0 && (
                <p className="font-geneva" style={{
                  margin: '4px 0 0 0',
                  fontSize: '8px',
                  color: '#ff6b6b',
                }}>
                  Retry attempt: {retryCount}
                </p>
              )}
            </div>
          </div>

          {/* Error Description */}
          <div className="nasa-data-section">
            <p className="font-geneva" style={{ fontSize: '9px', lineHeight: '1.4' }}>
              The application encountered an unexpected error. You can try to recover by
              clicking the "Try Again" button below, or restart the application.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            justifyContent: 'center',
          }}>
            <button
              className="nasa-btn nasa-btn-primary font-chicago"
              onClick={onRetry}
              style={{ fontSize: '10px', padding: '4px 12px' }}
            >
              Try Again
            </button>
            <button
              className="nasa-btn font-chicago"
              onClick={() => window.location.reload()}
              style={{ fontSize: '10px', padding: '4px 12px' }}
            >
              Reload App
            </button>
            <button
              className="nasa-btn font-chicago"
              onClick={openErrorReport}
              style={{ fontSize: '10px', padding: '4px 12px' }}
            >
              Report Issue
            </button>
            {(showErrorDetails || errorHistory.length > 0) && (
              <button
                className="nasa-btn font-chicago"
                onClick={() => setShowDetails(!showDetails)}
                style={{ fontSize: '10px', padding: '4px 12px' }}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            )}
          </div>

          {/* Error Details (Development Only) */}
          {showDetails && (showErrorDetails || errorHistory.length > 0) && (
            <div style={{ marginTop: '16px' }}>
              <div className="separator" style={{ margin: '8px 0' }}></div>

              <h3 className="font-chicago" style={{ fontSize: '12px', margin: '8px 0' }}>
                Error Details
              </h3>

              {/* Current Error */}
              {error && (
                <div className="nasa-data-section">
                  <h4 className="nasa-data-title font-geneva" style={{ fontSize: '10px' }}>
                    Current Error:
                  </h4>
                  <div style={{
                    backgroundColor: 'var(--primary)',
                    border: '1px solid var(--secondary)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '8px',
                    maxHeight: '120px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}>
                    {error.toString()}
                    {error.stack && `\n\n${error.stack}`}
                  </div>
                </div>
              )}

              {/* Error History */}
              {errorHistory.length > 0 && (
                <div className="nasa-data-section">
                  <h4 className="nasa-data-title font-geneva" style={{ fontSize: '10px' }}>
                    Recent Errors ({errorHistory.length}):
                  </h4>
                  <div style={{
                    maxHeight: '150px',
                    overflow: 'auto',
                    fontSize: '8px',
                  }}>
                    {errorHistory.map((err, index) => (
                      <div key={err.id} style={{
                        backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--secondary)',
                        padding: '4px',
                        marginBottom: '2px',
                        borderRadius: '2px',
                      }}>
                        <div className="font-geneva" style={{ fontWeight: 'bold' }}>
                          {err.id} - {new Date(err.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="font-geneva" style={{ opacity: 0.8 }}>
                          {err.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Component Stack */}
              {errorInfo?.componentStack && (
                <div className="nasa-data-section">
                  <h4 className="nasa-data-title font-geneva" style={{ fontSize: '10px' }}>
                    Component Stack:
                  </h4>
                  <div style={{
                    backgroundColor: 'var(--primary)',
                    border: '1px solid var(--secondary)',
                    borderRadius: '4px',
                    padding: '8px',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '8px',
                    maxHeight: '100px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {errorInfo.componentStack}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

ErrorFallback.propTypes = {
  error: PropTypes.object.isRequired,
  errorInfo: PropTypes.object,
  errorId: PropTypes.string.isRequired,
  retryCount: PropTypes.number,
  errorHistory: PropTypes.array,
  showErrorDetails: PropTypes.bool,
  _onReset: PropTypes.func.isRequired,
  onRetry: PropTypes.func.isRequired,
};

/**
 * Hook-based Error Boundary wrapper for functional components
 */
export default function ErrorBoundary(props) {
  return <ErrorBoundaryClass {...props} />;
}

// Export the class component for advanced usage
export { ErrorBoundaryClass };