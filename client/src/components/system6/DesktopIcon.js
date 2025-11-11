import React from 'react';
import PropTypes from 'prop-types';

/**
 * Desktop icon component that represents an application shortcut
 * @component
 * @param {Object} props - Component props
 * @param {string} props.label - Display label for the icon
 * @param {string} props.icon - Emoji or icon character to display
 * @param {Function} props.onDoubleClick - Handler for double-click events
 * @returns {JSX.Element} A clickable desktop icon
 */
export default function DesktopIcon({ label, icon, onDoubleClick }) {
  return (
    <div className="desktop-icon" onDoubleClick={onDoubleClick}>
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <div className="desktop-icon-text">{label}</div>
    </div>
  );
}

DesktopIcon.propTypes = {
  label: PropTypes.string.isRequired,
  icon: PropTypes.string.isRequired,
  onDoubleClick: PropTypes.func.isRequired,
};
