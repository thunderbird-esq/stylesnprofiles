import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

/**
 * SettingsWindow - System 6 styled Control Panel for API Key management
 * @component
 */
export default function SettingsWindow({ onClose }) {
  const { apiKey, saveApiKey, user } = useAuth();
  const [keyInput, setKeyInput] = useState('');
  const [status, setStatus] = useState('');
  const [showSavedKey, setShowSavedKey] = useState(false);

  // Local database settings (for future use)
  const [dbSettings, setDbSettings] = useState({
    username: '',
    password: '',
  });

  useEffect(() => {
    setKeyInput(apiKey || '');

    // Load any local database settings from localStorage
    const savedDbSettings = localStorage.getItem('nasa_db_settings');
    if (savedDbSettings) {
      try {
        setDbSettings(JSON.parse(savedDbSettings));
      } catch (e) {
        console.warn('Failed to parse saved database settings');
      }
    }
  }, [apiKey]);

  const handleSave = (e) => {
    e.preventDefault();
    saveApiKey(keyInput);

    // Save database settings locally
    localStorage.setItem('nasa_db_settings', JSON.stringify(dbSettings));

    setStatus('Settings saved successfully!');
    setTimeout(() => setStatus(''), 3000);
  };

  const handleClearApiKey = () => {
    if (window.confirm('Are you sure you want to clear your NASA API Key?')) {
      setKeyInput('');
      saveApiKey('');
      setStatus('API Key cleared');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const handleResetAll = () => {
    if (window.confirm(
      'Are you sure you want to reset all settings to defaults? '
      + 'This will clear your API key and local database settings.',
    )) {
      setKeyInput('');
      setDbSettings({ username: '', password: '' });
      saveApiKey('');
      localStorage.removeItem('nasa_db_settings');
      setStatus('All settings reset to defaults');
      setTimeout(() => setStatus(''), 2000);
    }
  };

  const toggleKeyVisibility = () => {
    setShowSavedKey(!showSavedKey);
  };

  return (
    <div className="nasa-auth-window">
      <div className="window-body">
        {/* Control Panel Header */}
        <div className="nasa-heading-primary" style={{ marginBottom: '16px' }}>
          Control Panel
        </div>

        <form onSubmit={handleSave}>
          {/* API Key Section */}
          <div className="nasa-data-section" style={{ marginBottom: '16px' }}>
            <div className="nasa-data-title">NASA API Configuration</div>

            <div className="field-row" style={{ marginBottom: '12px' }}>
              <label
                htmlFor="api-key"
                className="font-geneva"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                NASA API Key:
              </label>
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  id="api-key"
                  type={showSavedKey ? 'text' : 'password'}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  style={{
                    width: '100%',
                    paddingRight: '30px',
                    fontFamily: 'Monaco, monospace',
                    fontSize: '11px',
                  }}
                  placeholder="Enter your NASA API Key (optional)"
                />
                <button
                  type="button"
                  onClick={toggleKeyVisibility}
                  style={{
                    position: 'absolute',
                    right: '4px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: '#666',
                  }}
                  title={showSavedKey ? 'Hide key' : 'Show key'}
                >
                  {showSavedKey ? '👁️' : '🔒'}
                </button>
              </div>
              <div
                className="font-geneva"
                style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}
              >
                Leave empty to use the demo key (rate limited).
                Get your free API key from:{' '}
                <a
                  href="https://api.nasa.gov/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nasa-link"
                >
                  api.nasa.gov
                </a>
              </div>
            </div>

            <div className="field-row" style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={handleClearApiKey}
                className="btn"
                style={{ fontSize: '11px' }}
              >
                Clear API Key
              </button>
            </div>
          </div>

          {/* Local Database Section (for future use) */}
          <div className="nasa-data-section" style={{ marginBottom: '16px' }}>
            <div className="nasa-data-title">Local Database Settings</div>

            <div className="field-row" style={{ marginBottom: '8px' }}>
              <label
                htmlFor="db-username"
                className="font-geneva"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Username:
              </label>
              <input
                id="db-username"
                type="text"
                value={dbSettings.username}
                onChange={(e) => setDbSettings(
                  prev => ({ ...prev, username: e.target.value }),
                )}
                style={{ width: '100%' }}
                placeholder="Local username (optional)"
              />
            </div>

            <div className="field-row" style={{ marginBottom: '8px' }}>
              <label
                htmlFor="db-password"
                className="font-geneva"
                style={{ display: 'block', marginBottom: '4px' }}
              >
                Password:
              </label>
              <input
                id="db-password"
                type="password"
                value={dbSettings.password}
                onChange={(e) => setDbSettings(
                  prev => ({ ...prev, password: e.target.value }),
                )}
                style={{ width: '100%' }}
                placeholder="Local password (optional)"
              />
            </div>
          </div>

          {/* Current User Info */}
          {user && (
            <div className="nasa-data-section" style={{ marginBottom: '16px' }}>
              <div className="nasa-data-title">Current Session</div>
              <div className="font-geneva" style={{ fontSize: '11px', lineHeight: '1.4' }}>
                <div style={{ marginBottom: '4px' }}>
                  <strong>User ID:</strong> {user.id}
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <strong>Username:</strong> {user.username}
                </div>
                <div>
                  <strong>Status:</strong> <span className="nasa-status-online">● Local Mode</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Messages */}
          {status && (
            <div
              className="font-geneva"
              style={{
                color: '#000',
                background: '#fff',
                border: '1px solid #000',
                padding: '6px',
                marginBottom: '12px',
                fontSize: '11px',
                textAlign: 'center',
                boxShadow: '1px 1px 0 0 #000',
              }}
            >
              ✓ {status}
            </div>
          )}

          {/* Control Buttons */}
          <div className="field-row" style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-default"
              style={{ flex: 1 }}
            >
              Save Settings
            </button>
            <button
              type="button"
              onClick={handleResetAll}
              className="btn"
              style={{ fontSize: '11px' }}
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn"
            >
              Close
            </button>
          </div>
        </form>

        {/* Help Information */}
        <div className="nasa-data-section" style={{ marginTop: '20px' }}>
          <div className="font-geneva" style={{ fontSize: '10px', lineHeight: '1.4' }}>
            <p><strong>System Information:</strong></p>
            <ul style={{ margin: '4px 0', paddingLeft: '16px' }}>
              <li>Your favorites and collections are saved locally to this device</li>
              <li>NASA API data is fetched in real-time when available</li>
              <li>Demo mode uses limited public NASA endpoints</li>
              <li>Local database settings are stored in your browser</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

SettingsWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
};
