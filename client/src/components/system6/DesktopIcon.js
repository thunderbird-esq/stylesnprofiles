import React from 'react';

export default function DesktopIcon({ label, icon, onDoubleClick }) {
  return (
    <div
      className="desktop-icon"
      onDoubleClick={onDoubleClick}
    >
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <div className="desktop-icon-text">{label}</div>
    </div>
  );
}