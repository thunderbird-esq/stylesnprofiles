import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProfileApp - System 6 styled user profile window
 * Displays user information from localStorage
 * @component
 */
const ProfileApp = ({ windowId: _windowId }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Calculate stats from localStorage
    const timer = setTimeout(() => {
      const favorites = JSON.parse(localStorage.getItem('nasa_favorites') || '[]');
      const collections = JSON.parse(localStorage.getItem('nasa_collections') || '[]');

      setStats({
        deviceCreated: localStorage.getItem('nasa_device_id')?.substring(0, 8) || 'Unknown',
        favoritesCount: favorites.length,
        collectionsCount: collections.length,
        storageUsed: `${Math.round((JSON.stringify(localStorage).length / 1024))} KB`,
      });
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="window-pane">
      <div className="profile-app">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>👤</span>
          </div>
          <div className="profile-info">
            <h2>{user?.username || 'Explorer'}</h2>
            <p style={{ fontSize: '11px', color: '#666' }}>Local Storage Mode</p>
            <span className="badge">Space Explorer</span>
          </div>
        </div>

        <div className="profile-stats">
          <h3>Your Statistics</h3>
          {loading ? (
            <div className="loading">Loading stats...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-item">
                <label>Device ID</label>
                <span>{stats.deviceCreated}</span>
              </div>
              <div className="stat-item">
                <label>Saved Items</label>
                <span>{stats.favoritesCount}</span>
              </div>
              <div className="stat-item">
                <label>Collections</label>
                <span>{stats.collectionsCount}</span>
              </div>
              <div className="stat-item">
                <label>Storage Used</label>
                <span>{stats.storageUsed}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-info" style={{ marginTop: '16px', fontSize: '11px', color: '#666' }}>
          <p>All your data is stored locally in your browser and is private to you.</p>
        </div>
      </div>
    </div>
  );
};

ProfileApp.propTypes = {
  windowId: PropTypes.string.isRequired,
};

export default ProfileApp;