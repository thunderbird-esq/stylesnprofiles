import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';

/**
 * Error Report App component for displaying and managing error reports
 * @component
 * @param {Object} props - Component props
 * @param {string} props.windowId - Unique identifier for the window
 * @param {Object} props.errorData - Error data object
 * @returns {JSX.Element} Error report application window
 */
export default function ErrorReportApp({ _windowId, errorData }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [includeSystemInfo, setIncludeSystemInfo] = useState(true);
  const [userDescription, setUserDescription] = useState('');

  // Format error data for display
  const formatErrorData = () => {
    if (!errorData) return null;

    const {
      errorId,
      error,
      errorInfo,
      errorHistory,
      timestamp,
    } = errorData;

    return {
      id: errorId || 'Unknown',
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace available',
      componentStack: errorInfo?.componentStack || 'No component stack available',
      timestamp: timestamp || new Date().toISOString(),
      history: errorHistory || [],
    };
  };

  const formattedData = formatErrorData();

  // Copy error report to clipboard
  const copyToClipboard = async () => {
    const report = generateErrorReport();

    try {
      await navigator.clipboard.writeText(report);
      alert('Error report copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      alert('Failed to copy to clipboard');
    }
  };

  // Generate complete error report text
  const generateErrorReport = () => {
    let report = 'NASA Portal Error Report\n';
    report += '========================\n\n';

    report += `Error ID: ${formattedData.id}\n`;
    report += `Timestamp: ${new Date(formattedData.timestamp).toLocaleString()}\n`;
    report += `Error Message: ${formattedData.message}\n\n`;

    if (userDescription) {
      report += `User Description: ${userDescription}\n\n`;
    }

    report += 'Stack Trace:\n';
    report += `${formattedData.stack}\n\n`;

    if (
      formattedData.componentStack &&
      formattedData.componentStack !== 'No component stack available'
    ) {
      report += 'Component Stack:\n';
      report += `${formattedData.componentStack}\n\n`;
    }

    if (includeSystemInfo) {
      report += 'System Information:\n';
      report += `- User Agent: ${navigator.userAgent}\n`;
      report += `- URL: ${window.location.href}\n`;
      report += `- Screen Resolution: ${window.screen.width}x${window.screen.height}\n`;
      report += `- Viewport Size: ${window.innerWidth}x${window.innerHeight}\n`;
      report += `- Language: ${navigator.language}\n`;
      report += `- Platform: ${navigator.platform}\n`;
      report += `- Cookie Enabled: ${navigator.cookieEnabled}\n`;
      report += `- Online Status: ${navigator.onLine ? 'Online' : 'Offline'}\n\n`;
    }

    if (formattedData.history.length > 0) {
      report += 'Recent Error History:\n';
      formattedData.history.forEach((err, index) => {
        report += `${index + 1}. [${err.id}] ${new Date(err.timestamp).toLocaleTimeString()}`
          + ` - ${err.message}\n`;
      });
    }

    return report;
  };

  // Download error report as file
  const downloadReport = () => {
    const report = generateErrorReport();
    /* eslint-disable-next-line no-undef */
    const blob = new Blob([report], { type: 'text/plain' });
    /* eslint-disable-next-line no-undef */
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${formattedData.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    /* eslint-disable-next-line no-undef */
    URL.revokeObjectURL(url);
  };

  if (!formattedData) {
    return (
      <div className="nasa-window-content" style={{ padding: '16px' }}>
        <p className="nasa-error">No error data available</p>
      </div>
    );
  }

  return (
    <motion.div
      className="window-pane nasa-window-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--secondary)',
        marginBottom: '12px',
      }}>
        {['overview', 'details', 'system'].map((tab) => (
          <button
            key={tab}
            className={`font-chicago ${activeTab === tab ? 'nasa-btn-primary' : 'nasa-btn'}`}
            onClick={() => setActiveTab(tab)}
            style={{
              fontSize: '9px',
              padding: '4px 8px',
              margin: '0 2px 8px 0',
              borderBottom: activeTab === tab ? '2px solid var(--secondary)' : 'none',
              borderRadius: activeTab === tab ? '4px 4px 0 0' : '0',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '300px' }}>
        {activeTab === 'overview' && (
          <div>
            <div className="nasa-data-section">
              <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
                Error Overview
              </h3>

              <div style={{
                backgroundColor: 'var(--primary)',
                border: '1px solid var(--secondary)',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '12px',
              }}>
                <div className="font-geneva" style={{ fontSize: '9px', marginBottom: '8px' }}>
                  <strong>Error ID:</strong> {formattedData.id}
                </div>
                <div className="font-geneva" style={{ fontSize: '9px', marginBottom: '8px' }}>
                  <strong>Time:</strong> {new Date(formattedData.timestamp).toLocaleString()}
                </div>
                <div className="font-geneva" style={{ fontSize: '9px', marginBottom: '8px' }}>
                  <strong>Message:</strong> {formattedData.message}
                </div>
              </div>

              <div className="nasa-data-section">
                <label className="font-geneva" style={{
                  fontSize: '9px',
                  display: 'block',
                  marginBottom: '4px',
                }}>
                  What were you doing when this error occurred?
                </label>
                <textarea
                  value={userDescription}
                  onChange={(e) => setUserDescription(e.target.value)}
                  placeholder="Describe the steps that led to this error..."
                  style={{
                    width: '100%',
                    height: '80px',
                    fontFamily: 'Geneva, monospace',
                    fontSize: '9px',
                    padding: '8px',
                    border: '1px solid var(--secondary)',
                    borderRadius: '4px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--text)',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div className="nasa-data-section">
                <label className="font-geneva" style={{
                  fontSize: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <input
                    type="checkbox"
                    checked={includeSystemInfo}
                    onChange={(e) => setIncludeSystemInfo(e.target.checked)}
                  />
                  Include system information in report
                </label>
              </div>

              <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '16px',
              }}>
                <button
                  className="nasa-btn nasa-btn-primary font-chicago"
                  onClick={copyToClipboard}
                  style={{ fontSize: '10px', padding: '4px 12px' }}
                >
                  Copy Report
                </button>
                <button
                  className="nasa-btn font-chicago"
                  onClick={downloadReport}
                  style={{ fontSize: '10px', padding: '4px 12px' }}
                >
                  Download
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div>
            <div className="nasa-data-section">
              <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
                Stack Trace
              </h3>
              <div style={{
                backgroundColor: 'var(--primary)',
                border: '1px solid var(--secondary)',
                borderRadius: '4px',
                padding: '8px',
                fontFamily: 'Monaco, monospace',
                fontSize: '8px',
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}>
                {formattedData.stack}
              </div>
            </div>

            {formattedData.componentStack &&
              formattedData.componentStack !== 'No component stack available' && (
              <div className="nasa-data-section">
                <h3 className="nasa-data-title font-chicago" style={{
                  fontSize: '12px',
                }}>
                    Component Stack
                </h3>
                <div style={{
                  backgroundColor: 'var(--primary)',
                  border: '1px solid var(--secondary)',
                  borderRadius: '4px',
                  padding: '8px',
                  fontFamily: 'Monaco, monospace',
                  fontSize: '8px',
                  maxHeight: '200px',
                  overflow: 'auto',
                  whiteSpace: 'pre-wrap',
                }}>
                  {formattedData.componentStack}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div>
            <div className="nasa-data-section">
              <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
                System Information
              </h3>
              <div style={{
                backgroundColor: 'var(--primary)',
                border: '1px solid var(--secondary)',
                borderRadius: '4px',
                padding: '12px',
                fontSize: '9px',
              }}>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>User Agent:</strong> {navigator.userAgent}
                </div>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>URL:</strong> {window.location.href}
                </div>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>Screen:</strong> {window.screen.width}x{window.screen.height}
                </div>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}
                </div>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>Language:</strong> {navigator.language}
                </div>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>Platform:</strong> {navigator.platform}
                </div>
                <div className="font-geneva" style={{ marginBottom: '4px' }}>
                  <strong>Cookie Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}
                </div>
                <div className="font-geneva">
                  <strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}
                </div>
              </div>
            </div>

            {formattedData.history.length > 0 && (
              <div className="nasa-data-section">
                <h3 className="nasa-data-title font-chicago" style={{ fontSize: '12px' }}>
                  Recent Error History
                </h3>
                <div style={{
                  maxHeight: '150px',
                  overflow: 'auto',
                }}>
                  {formattedData.history.map((err, index) => (
                    <div key={err.id} style={{
                      backgroundColor: index % 2 === 0
                        ? 'transparent'
                        : 'var(--secondary)',
                      padding: '8px',
                      marginBottom: '4px',
                      borderRadius: '4px',
                      fontSize: '9px',
                    }}>
                      <div
                        className="font-geneva"
                        style={{ fontWeight: 'bold', marginBottom: '4px' }}
                      >
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
          </div>
        )}
      </div>
    </motion.div>
  );
}

ErrorReportApp.propTypes = {
  _windowId: PropTypes.string.isRequired,
  errorData: PropTypes.shape({
    errorId: PropTypes.string,
    error: PropTypes.object,
    errorInfo: PropTypes.object,
    errorHistory: PropTypes.array,
    timestamp: PropTypes.string,
  }),
};