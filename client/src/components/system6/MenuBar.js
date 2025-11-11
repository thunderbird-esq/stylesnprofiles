import React, { useState } from 'react';

export default function MenuBar() {
  const [time, setTime] = useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000 * 30); // Update every 30 sec
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
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