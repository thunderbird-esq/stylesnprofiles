import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SettingsWindow from './SettingsWindow';
import Window from './Window';

/**
 * System 6 authentic menu bar component with dropdown menus and time display
 * @component
 * @returns {JSX.Element} The menu bar with system controls and time display
 */
export default function MenuBar() {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [activeMenu, setActiveMenu] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const menuBarRef = useRef(null);
  // In silent auth, we are always "authenticated" if the user object exists

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000 * 30); // Update every 30 sec
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuBarRef.current && !menuBarRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
      }

      // System 6 style menu keyboard shortcuts
      if (event.altKey && !activeMenu) {
        switch (event.key.toLowerCase()) {
          case 'f':
            setActiveMenu('File');
            event.preventDefault();
            break;
          case 'e':
            setActiveMenu('Edit');
            event.preventDefault();
            break;
          case 'v':
            setActiveMenu('View');
            event.preventDefault();
            break;
          case 's':
            setActiveMenu('Special');
            event.preventDefault();
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenu]);

  /**
   * Formats a date object into a System 6 style time string
   * @param {Date} date - Date object to format
   * @returns {string} Formatted time string
   */
  const formatTime = date => {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // NASA-specific menu items for System 6 authenticity
  const menuItems = {
    File: ['New Folder', 'Open', 'Print', 'Close'],
    Edit: ['Undo', 'Cut', 'Copy', 'Paste', 'Select All'],
    View: ['By Name', 'By Date', 'By Size', 'By Kind'],
    Special: ['Settings', 'Empty Trash', 'Eject Disk', 'Restart'],
  };

  const handleMenuClick = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  const handleMenuItemClick = (item) => {
    console.log(`Menu item clicked: ${item}`);
    setActiveMenu(null);

    // Handle authentication-related menu items
    switch (item) {
      case 'Settings':
        setShowSettings(true);
        break;
      case 'Close': {
        // Close focused window if any
        const activeWindow = document.querySelector('.window:focus');
        if (activeWindow) {
          const closeButton = activeWindow.querySelector('.close');
          if (closeButton) closeButton.click();
        }
        break;
      }
      case 'Restart':
        // Simulate system restart
        if (window.confirm('Are you sure you want to restart?')) {
          window.location.reload();
        }
        break;
      case 'Empty Trash':
        alert('Trash emptied (demo)');
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="nasa-menu-bar" ref={menuBarRef}>
        <div className="nasa-menu-left">
          {/* Apple Logo - System 6 style */}
          <span className="nasa-apple-logo"></span>

          {/* Menu Items */}
          {Object.keys(menuItems).map((menuName) => (
            <div key={menuName} className="nasa-menu-item-container">
              <button
                className={`nasa-menu-item ${activeMenu === menuName ? 'active' : ''}`}
                onClick={() => handleMenuClick(menuName)}
              >
                {menuName}
              </button>

              {activeMenu === menuName && (
                <div className="nasa-dropdown-menu">
                  {menuItems[menuName].map((item, index) => (
                    <div
                      key={item}
                      className={`nasa-dropdown-item ${index === menuItems[menuName].length - 1 ? 'last-item' : ''
                        }`}
                      onClick={() => handleMenuItemClick(item)}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="nasa-menu-right">
          {user && (
            <span style={{ marginRight: '12px', fontFamily: 'Chicago_12', fontSize: '12px' }}>
              {user.username || 'Guest'}
            </span>
          )}
          <span className="nasa-time-display">{formatTime(time)}</span>
        </div>
      </div>

      {/* Settings Window */}
      {showSettings && (
        <Window
          title="Control Panel"
          windowId="settings-window"
          zIndex={2000}
          width={400}
          height={300}
          x="center"
          y="center"
          onClose={() => setShowSettings(false)}
        >
          <SettingsWindow onClose={() => setShowSettings(false)} />
        </Window>
      )}
    </>
  );
}
