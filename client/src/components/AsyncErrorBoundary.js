import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ErrorBoundary from './ErrorBoundary';

/**
 * Async Error Boundary component that handles both synchronous and asynchronous errors
 * including promise rejections and unhandled exceptions
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {React.ReactNode} props.fallback - Custom fallback UI (optional)
 * @param {Function} props.onError - Callback function when an error occurs
 * @param {Function} props.onAsyncError - Callback function for async errors
 * @param {boolean} props.handleGlobalErrors - Whether to handle global unhandled errors
 * @param {boolean} props.handlePromiseRejections - Whether to handle unhandled promise rejections
 * @returns {JSX.Element} Async error boundary component
 */
class AsyncErrorBoundaryClass extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      asyncErrors: [],
    };

    // Generate unique error ID for tracking
    this.generateErrorId = () => {
      return `ASYNC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    };

    // Handle unhandled promise rejections
    this.handleUnhandledRejection = (event) => {
      const { onAsyncError } = this.props;
      const errorId = this.generateErrorId();

      const errorData = {
        error: event.reason,
        errorId,
        type: 'promiseRejection',
        timestamp: new Date().toISOString(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack || 'No stack trace available',
      };

      console.group(`🚨 Async Error Boundary - ${errorId}`);
      console.error('Unhandled Promise Rejection:', event.reason);
      console.error('Event:', event);
      console.groupEnd();

      this.setState(prevState => ({
        asyncErrors: [...prevState.asyncErrors, errorData].slice(-9), // Keep last 10 async errors
      }));

      if (onAsyncError) {
        onAsyncError(errorData, event);
      }
    };

    // Handle unhandled errors
    this.handleUnhandledError = (event) => {
      const { onAsyncError } = this.props;
      const errorId = this.generateErrorId();

      const errorData = {
        error: event.error,
        errorId,
        type: 'unhandledError',
        timestamp: new Date().toISOString(),
        message: event.error?.message || 'Unhandled Error',
        stack: event.error?.stack || 'No stack trace available',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      };

      console.group(`🚨 Async Error Boundary - ${errorId}`);
      console.error('Unhandled Error:', event.error);
      console.error('Event:', event);
      console.groupEnd();

      this.setState(prevState => ({
        asyncErrors: [...prevState.asyncErrors, errorData].slice(-9), // Keep last 10 async errors
      }));

      if (onAsyncError) {
        onAsyncError(errorData, event);
      }
    };

    // Handle resource loading errors
    this.handleResourceError = (event) => {
      const { onAsyncError } = this.props;
      const errorId = this.generateErrorId();

      const errorData = {
        error: new Error(`Resource loading failed: ${event.target?.src || event.target?.href}`),
        errorId,
        type: 'resourceError',
        timestamp: new Date().toISOString(),
        message: `Failed to load resource: ${event.target?.tagName}`,
        element: event.target?.tagName,
        source: event.target?.src || event.target?.href,
      };

      console.group(`🚨 Async Error Boundary - ${errorId}`);
      console.error('Resource Error:', event);
      console.groupEnd();

      this.setState(prevState => ({
        asyncErrors: [...prevState.asyncErrors, errorData].slice(-9),
      }));

      if (onAsyncError) {
        onAsyncError(errorData, event);
      }
    };
  }

  componentDidMount() {
    const { handleGlobalErrors = true, handlePromiseRejections = true } = this.props;

    if (handlePromiseRejections) {
      window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    }

    if (handleGlobalErrors) {
      window.addEventListener('error', this.handleUnhandledError);
      // Handle resource loading errors
      window.addEventListener('error', this.handleResourceError, true);
    }
  }

  componentWillUnmount() {
    // Clean up event listeners
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    window.removeEventListener('error', this.handleUnhandledError);
    window.removeEventListener('error', this.handleResourceError, true);
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    const { onError } = this.props;
    const errorId = this.generateErrorId();

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    if (onError) {
      onError(error, errorInfo, errorId);
    }
  }

  // Reset error boundary state
  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  // Clear async errors
  clearAsyncErrors = () => {
    this.setState({ asyncErrors: [] });
  };

  render() {
    const { children, ...errorBoundaryProps } = this.props;
    const { hasError, asyncErrors } = this.state;

    // If we have async errors but no sync errors, show a warning indicator
    if (!hasError && asyncErrors.length > 0) {
      return (
        <ErrorBoundary
          {...errorBoundaryProps}
          fallback={({ error: syncError, reset }) => (
            <AsyncErrorFallback
              syncError={syncError}
              _errorInfo={undefined}
              errorId={undefined}
              asyncErrors={asyncErrors}
              _onReset={reset}
              onClearAsync={this.clearAsyncErrors}
              onResetBoundary={this.resetErrorBoundary}
            />
          )}
        >
          {children}
          <AsyncErrorIndicator
            asyncErrors={asyncErrors}
            onClear={this.clearAsyncErrors}
          />
        </ErrorBoundary>
      );
    }

    // Regular error boundary behavior
    return (
      <ErrorBoundary
        {...errorBoundaryProps}
        fallback={({ error: syncError, errorInfo, errorId, reset }) => (
          <AsyncErrorFallback
            syncError={syncError}
            _errorInfo={errorInfo}
            errorId={errorId}
            asyncErrors={asyncErrors}
            _onReset={reset}
            onClearAsync={this.clearAsyncErrors}
            onResetBoundary={this.resetErrorBoundary}
          />
        )}
      >
        {children}
      </ErrorBoundary>
    );
  }
}

AsyncErrorBoundaryClass.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  onError: PropTypes.func,
  onAsyncError: PropTypes.func,
  handleGlobalErrors: PropTypes.bool,
  handlePromiseRejections: PropTypes.bool,
};

/**
 * Async Error Fallback component with enhanced UI for both sync and async errors
 */
function AsyncErrorFallback({
  syncError,
  _errorInfo,
  errorId,
  asyncErrors,
  _onReset, // eslint-disable-line no-unused-vars
  onClearAsync,
  onResetBoundary,
}) {
  const [showAsyncErrors, setShowAsyncErrors] = React.useState(false);

  const hasAsyncErrors = asyncErrors.length > 0;
  const totalErrors = (syncError ? 1 : 0) + asyncErrors.length;

  return (
    <div className="nasa-desktop" style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      <div className="nasa-window" style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '550px',
        maxWidth: '90vw',
        height: hasAsyncErrors ? '500px' : '350px',
        maxHeight: '90vh',
      }}>
        <div className="title-bar">
          <h1 className="title font-chicago">
            {hasAsyncErrors ? `⚠️ Multiple Errors (${totalErrors})` : '⚠️ System Error'}
          </h1>
        </div>
        <div className="separator"></div>

        <div className="window-pane nasa-window-content" style={{ padding: '16px' }}>
          {/* Error Summary */}
          <div style={{ marginBottom: '16px' }}>
            <h2 className="font-chicago" style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
              Error Summary
            </h2>

            {syncError && (
              <div style={{
                backgroundColor: '#ffcccc',
                border: '1px solid #ff0000',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '8px',
              }}>
                <div className="font-geneva" style={{
                  fontSize: '9px',
                  fontWeight: 'bold',
                }}>
                  Synchronous Error: {errorId}
                </div>
                <div className="font-geneva" style={{ fontSize: '9px' }}>
                  {syncError.message}
                </div>
              </div>
            )}

            {hasAsyncErrors && (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '4px',
                padding: '8px',
                marginBottom: '8px',
                cursor: 'pointer',
              }}
              onClick={() => setShowAsyncErrors(!showAsyncErrors)}
              >
                <div className="font-geneva" style={{ fontSize: '9px', fontWeight: 'bold' }}>
                  {asyncErrors.length} Asynchronous Error{asyncErrors.length > 1 ? 's' : ''}
                  {' '}Detected
                </div>
                <div className="font-geneva" style={{ fontSize: '8px' }}>
                  Click to {showAsyncErrors ? 'hide' : 'show'} details
                </div>
              </div>
            )}
          </div>

          {/* Async Errors Details */}
          {showAsyncErrors && hasAsyncErrors && (
            <div style={{ marginBottom: '16px' }}>
              <h3 className="font-chicago" style={{ fontSize: '12px', margin: '8px 0' }}>
                Async Error Details
              </h3>
              <div style={{
                maxHeight: '150px',
                overflow: 'auto',
                border: '1px solid var(--secondary)',
                borderRadius: '4px',
              }}>
                {asyncErrors.map((asyncError, index) => (
                  <div key={asyncError.errorId} style={{
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--secondary)',
                    padding: '8px',
                    borderBottom: '1px solid var(--secondary)',
                    fontSize: '8px',
                  }}>
                    <div className="font-geneva" style={{
                      fontWeight: 'bold',
                      marginBottom: '4px',
                    }}>
                      {asyncError.errorId} - {asyncError.type}
                    </div>
                    <div className="font-geneva" style={{ marginBottom: '2px' }}>
                      {asyncError.message}
                    </div>
                    <div className="font-geneva" style={{ opacity: 0.7, fontSize: '7px' }}>
                      {new Date(asyncError.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="nasa-data-section">
            <p className="font-geneva" style={{ fontSize: '9px', lineHeight: '1.4' }}>
              {syncError
                ? 'The application encountered an error that prevented it from rendering properly.'
                : 'Asynchronous errors were detected in the application.'}
              {hasAsyncErrors && ' Some background operations may have failed.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <button
              className="nasa-btn nasa-btn-primary font-chicago"
              onClick={() => {
                onResetBoundary();
                if (hasAsyncErrors) onClearAsync();
              }}
              style={{
                fontSize: '10px',
                padding: '4px 12px',
              }}
            >
              Try Again
            </button>

            {syncError && (
              <button
                className="nasa-btn font-chicago"
                onClick={() => window.location.reload()}
                style={{ fontSize: '10px', padding: '4px 12px' }}
              >
                Reload App
              </button>
            )}

            {hasAsyncErrors && (
              <button
                className="nasa-btn font-chicago"
                onClick={onClearAsync}
                style={{ fontSize: '10px', padding: '4px 12px' }}
              >
                Clear Async Errors
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Small indicator component that shows when async errors have occurred
 * but the app is still functional
 */
function AsyncErrorIndicator({ asyncErrors, onClear }) {
  if (asyncErrors.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '24px',
      right: '8px',
      backgroundColor: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: '4px',
      padding: '8px',
      zIndex: 9998,
      maxWidth: '200px',
    }}>
      <div className="font-geneva" style={{ fontSize: '8px', fontWeight: 'bold' }}>
        ⚠️ {asyncErrors.length} async error{asyncErrors.length > 1 ? 's' : ''}
      </div>
      <button
        className="nasa-btn font-chicago"
        onClick={onClear}
        style={{ fontSize: '8px', padding: '2px 6px', marginTop: '4px' }}
      >
        Dismiss
      </button>
    </div>
  );
}

AsyncErrorIndicator.propTypes = {
  asyncErrors: PropTypes.array.isRequired,
  onClear: PropTypes.func.isRequired,
};

AsyncErrorFallback.propTypes = {
  syncError: PropTypes.object,
  _errorInfo: PropTypes.object,
  errorId: PropTypes.string,
  asyncErrors: PropTypes.array.isRequired,
  _onReset: PropTypes.func.isRequired,
  onClearAsync: PropTypes.func.isRequired,
  onResetBoundary: PropTypes.func.isRequired,
};

export default function AsyncErrorBoundary(props) {
  return <AsyncErrorBoundaryClass {...props} />;
}

export { AsyncErrorBoundaryClass };