import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getApod } from '../../services/nasaApi';

/**
 * Astronomy Picture of the Day (APOD) application component
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.windowId] - Optional window ID for window management
 * @returns {JSX.Element} APOD viewer interface
 */
export default function ApodApp({ windowId: _windowId }) {
  const [apodData, setApodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getApod()
      .then(res => {
        setApodData(res.data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch APOD:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="nasa-loading">Loading today's astronomy picture...</div>;
  if (error) return <div className="nasa-error">Error: {error}</div>;
  if (!apodData) return null;

  return (
    <div className="nasa-data-section">
      <div className="nasa-data-title">{apodData.title}</div>

      <div className="mb-1">
        <small>Date: {apodData.date}</small>
      </div>

      {apodData.media_type === 'image' ? (
        <div className="mb-2">
          <img
            src={apodData.url}
            alt={apodData.title}
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              border: '1px solid var(--secondary)',
            }}
          />
        </div>
      ) : (
        <div className="mb-2">
          <a href={apodData.url} target="_blank" rel="noopener noreferrer" className="nasa-link">
            View Video (YouTube)
          </a>
        </div>
      )}

      <div className="nasa-data-content">
        <div className="nasa-data-title mb-1">Explanation:</div>
        <p style={{ lineHeight: '1.3' }}>{apodData.explanation}</p>
      </div>

      {apodData.copyright && (
        <div className="mt-2">
          <small>© {apodData.copyright}</small>
        </div>
      )}
    </div>
  );
}

ApodApp.propTypes = {
  windowId: PropTypes.string,
};

ApodApp.defaultProps = {
  windowId: null,
};
