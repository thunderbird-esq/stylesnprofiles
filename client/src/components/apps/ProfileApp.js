import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../contexts/AuthContext';

/**
 * ProfileApp - System 6 styled user profile window
 * Displays user information and provides profile management
 * @component
 */
const ProfileApp = ({ windowId: _windowId }) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching user stats
    const timer = setTimeout(() => {
      setStats({
        memberSince: '2023-01-15',
        lastLogin: new Date().toLocaleDateString(),
        favoritesCount: 12,
        searchesCount: 45,
      });
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!user) return <div className="window-pane">Please login to view profile.</div>;

  return (
    <div className="window-pane">
      <div className="profile-app">
        <div className="profile-header">
          <div className="profile-avatar">
            <span>👤</span>
          </div>
          <div className="profile-info">
            <h2>{user.username || 'User'}</h2>
            <p>{user.email}</p>
            <span className="badge">Explorer Level 1</span>
          </div>
        </div>

        <div className="profile-stats">
          <h3>Mission Statistics</h3>
          {loading ? (
            <div className="loading">Loading stats...</div>
          ) : (
            <div className="stats-grid">
              <div className="stat-item">
                <label>Member Since</label>
                <span>{stats.memberSince}</span>
              </div>
              <div className="stat-item">
                <label>Last Login</label>
                <span>{stats.lastLogin}</span>
              </div>
              <div className="stat-item">
                <label>Saved Items</label>
                <span>{stats.favoritesCount}</span>
              </div>
              <div className="stat-item">
                <label>Total Searches</label>
                <span>{stats.searchesCount}</span>
              </div>
            </div>
          )}
        </div>

        <div className="profile-actions">
          <button className="nasa-btn">Edit Profile</button>
          <button className="nasa-btn">Account Settings</button>
          <button
            className="nasa-btn danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
              }
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

ProfileApp.propTypes = {
  windowId: PropTypes.string.isRequired,
};

export default ProfileApp;