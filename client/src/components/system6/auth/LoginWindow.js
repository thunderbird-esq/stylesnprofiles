import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useAuth } from '../../../contexts/AuthContext';

/**
 * LoginWindow - System 6 styled login form
 * @component
 */
export default function LoginWindow({ onClose, onSwitchToRegister }) {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    try {
      await login(email, password);
      onClose(); // Close window on successful login
    } catch (err) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <div className="nasa-auth-window">
      <div className="window-body">
        <div className="font-chicago" style={{ fontSize: '14px', marginBottom: '16px' }}>
                    NASA System 6 Portal Login
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-row" style={{ marginBottom: '12px' }}>
            <label htmlFor="login-email" className="font-geneva">
                            Email:
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
              autoFocus
            />
          </div>

          <div className="field-row" style={{ marginBottom: '16px' }}>
            <label htmlFor="login-password" className="font-geneva">
                            Password:
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ width: '100%', marginTop: '4px' }}
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
              {loading ? 'Logging in...' : 'Login'}
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
                    Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
            }}
          >
                        Register
          </button>
        </div>
      </div>
    </div>
  );
}

LoginWindow.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSwitchToRegister: PropTypes.func.isRequired,
};
