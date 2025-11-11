import React, { useState } from 'react';

/**
 * Menu bar component that displays the system menu and current time
 * @component
 * @returns {JSX.Element} The menu bar with system controls and time display
 */
export default function MenuBar() {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000 * 30); // Update every 30 sec
    return () => clearInterval(timer);
  }, []);

  /**
   * Formats a date object into a time string
   * @param {Date} date - Date object to format
   * @returns {string} Formatted time string
   */
  const formatTime = date => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="nasa-menu-bar">
      <div className="nasa-menu-left">
        <span></span>
        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Special</span>
      </div>
      <div className="nasa-menu-right">
        <span>{formatTime(time)}</span>
      </div>
    </div>
  );
}
