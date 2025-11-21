import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * RegisterWindow - System 6 styled registration form
 * @component
 */
export default function RegisterWindow({ onClose, onSwitchToLogin }) {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      return 'Please fill in all fields';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }

    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'Please enter a valid email address';
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    const validationError = validateForm();
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    try {
      await register(formData.email, formData.username, formData.password);
      onClose(); // Close window on successful registration
    } catch (err) {
      setLocalError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="nasa-auth-window">
      <div className="window-body">
        <div className="font-chicago" style={{ fontSize: '14px', marginBottom: '16px' }}>
          NASA System 6 Portal Registration
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-row" style={{ marginBottom: '12px' }}>
            <label htmlFor="register-email" className="font-geneva">
              Email:
            </label>
            <input
              id="register-email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
              autoFocus
            />
          </div>

          <div className="field-row" style={{ marginBottom: '12px' }}>
            <label htmlFor="register-username" className="font-geneva">
              Username:
            </label>
            <input
              id="register-username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleInputChange}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
              placeholder="3-30 characters"
            />
          </div>

          <div className="field-row" style={{ marginBottom: '12px' }}>
            <label htmlFor="register-password" className="font-geneva">
              Password:
            </label>
            <input
              id="register-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
              placeholder="Minimum 6 characters"
            />
          </div>

          <div className="field-row" style={{ marginBottom: '16px' }}>
            <label htmlFor="register-confirm-password" className="font-geneva">
              Confirm Password:
            </label>
            <input
              id="register-confirm-password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
              placeholder="Re-enter password"
            />
          </div>

          {(error || localError) && (
            <div
              className="font-geneva"
              style={{
                color: '#000',
                background: '#fff',
                border: '2px solid #000',
                padding: '8px',
                marginBottom: '12px',
                fontSize: '11px',
              }}
            >
              ⚠️ {localError || error}
            </div>
          )}

          <div className="field-row" style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              disabled={loading}
              className="btn"
              style={{ flex: 1 }}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn"
            >
              Cancel
            </button>
          </div>
        </form>

        <div
          className="font-geneva"
          style={{
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid #000',
            fontSize: '11px',
            textAlign: 'center',
          }}
        >
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

RegisterWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
};