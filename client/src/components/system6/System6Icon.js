import React from 'react';
import PropTypes from 'prop-types';

/**
 * Authentic System 6 style icon component
 * @component
 * @param {Object} props - Component props
 * @param {string} props.type - Icon type ('apod', 'neo', 'resources', 'error')
 * @param {number} [props.size=32] - Icon size in pixels
 * @returns {JSX.Element} System 6 style icon
 */
export default function System6Icon({ type, size = 32 }) {
  const iconStyle = {
    width: `${size}px`,
    height: `${size}px`,
    display: 'block',
    imageRendering: 'pixelated', // For crisp pixel art appearance
  };

  // System 6 style icons using SVG with authentic black & white design
  const icons = {
    apod: (
      <svg
        viewBox="0 0 32 32"
        style={iconStyle}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Picture frame icon */}
        <rect x="2" y="4" width="28" height="24" fill="none" stroke="black" strokeWidth="2"/>
        <rect x="4" y="6" width="24" height="18" fill="white" stroke="black" strokeWidth="1"/>
        {/* Sun/moon in corner */}
        <circle cx="20" cy="10" r="2" fill="black"/>
        {/* Mountain landscape */}
        <polygon points="6,20 12,12 18,16 26,10 26,22 6,22" fill="black"/>
        {/* Stars */}
        <rect x="8" y="8" width="1" height="1" fill="black"/>
        <rect x="14" y="10" width="1" height="1" fill="black"/>
        <rect x="10" y="12" width="1" height="1" fill="black"/>
      </svg>
    ),
    neo: (
      <svg
        viewBox="0 0 32 32"
        style={iconStyle}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Asteroid/comet icon */}
        <circle cx="16" cy="16" r="8" fill="none" stroke="black" strokeWidth="2"/>
        {/* Crater details */}
        <circle cx="12" cy="14" r="1" fill="black"/>
        <circle cx="18" cy="12" r="1" fill="black"/>
        <circle cx="16" cy="18" r="1" fill="black"/>
        {/* Tail */}
        <path d="M8 16 L4 14 L6 16" fill="black"/>
        <path d="M8 16 L4 18 L6 16" fill="black"/>
      </svg>
    ),
    resources: (
      <svg
        viewBox="0 0 32 32"
        style={iconStyle}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Folder icon */}
        <rect x="2" y="8" width="28" height="20" fill="white" stroke="black" strokeWidth="2"/>
        {/* Folder tab */}
        <path d="M2 8 L10 8 L12 4 L20 4 L22 8" fill="none" stroke="black" strokeWidth="2"/>
        {/* Document lines inside */}
        <line x1="6" y1="12" x2="26" y2="12" stroke="black" strokeWidth="1"/>
        <line x1="6" y1="16" x2="26" y2="16" stroke="black" strokeWidth="1"/>
        <line x1="6" y1="20" x2="20" y2="20" stroke="black" strokeWidth="1"/>
        <line x1="6" y1="24" x2="24" y2="24" stroke="black" strokeWidth="1"/>
      </svg>
    ),
    error: (
      <svg
        viewBox="0 0 32 32"
        style={iconStyle}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Warning triangle */}
        <polygon points="16,4 28,26 4,26" fill="none" stroke="black" strokeWidth="2"/>
        {/* Exclamation mark */}
        <rect x="15" y="10" width="2" height="10" fill="black"/>
        <rect x="15" y="22" width="2" height="2" fill="black"/>
        {/* Optional: Add small dots for emphasis */}
        <circle cx="12" cy="16" r="0.5" fill="black"/>
        <circle cx="20" cy="16" r="0.5" fill="black"/>
      </svg>
    ),
  };

  return icons[type] || icons.resources;
}

System6Icon.propTypes = {
  type: PropTypes.oneOf(['apod', 'neo', 'resources', 'error']).isRequired,
  size: PropTypes.number,
};