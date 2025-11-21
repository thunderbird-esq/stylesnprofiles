import React from 'react';
import PropTypes from 'prop-types';
import Window from '../Window';
import LoginWindow from './LoginWindow';
import RegisterWindow from './RegisterWindow';

/**
 * AuthModal - System 6 styled authentication modal that switches between login and register
 * @component
 */
export default function AuthModal({ isOpen, onClose, initialMode = 'login' }) {
  const [mode, setMode] = React.useState(initialMode);

  React.useEffect(() => {
    setMode(initialMode);
  }, [initialMode, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSwitchToRegister = () => {
    setMode('register');
  };

  const handleSwitchToLogin = () => {
    setMode('login');
  };

  const handleClose = () => {
    setMode(initialMode);
    onClose();
  };

  return (
    <Window
      title={mode === 'login' ? 'NASA Portal Login' : 'NASA Portal Registration'}
      windowId="auth-modal"
      zIndex={1000}
      width={400}
      height={mode === 'login' ? 350 : 450}
      x="center"
      y="center"
    >
      {mode === 'login' ? (
        <LoginWindow
          onClose={handleClose}
          onSwitchToRegister={handleSwitchToRegister}
        />
      ) : (
        <RegisterWindow
          onClose={handleClose}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </Window>
  );
}

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialMode: PropTypes.oneOf(['login', 'register']),
};

AuthModal.defaultProps = {
  initialMode: 'login',
};