import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getApod } from '../../services/nasaApi';
import { SaveButton } from '../favorites';

/**
 * Astronomy Picture of the Day (APOD) application component
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.windowId] - Optional window ID for window management
 * @returns {JSX.Element} APOD viewer interface
 */
export default function ApodApp({ windowId: _windowId }) {
  const [apodData, setApodData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const date = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchApod = async () => {
      setLoading(true);
      try {
        const data = await getApod(date);
        setApodData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApod();
  }, [date]);



  return (
    <div className="nasa-app-content">
      <div
        className="mb-1"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <small>Date: {apodData.date}</small>
        <SaveButton
          itemId={`apod-${apodData.date}`}
          itemType="APOD"
          itemDate={apodData.date}
          itemData={{
            title: apodData.title,
            url: apodData.url,
            hd_url: apodData.hdurl,
            media_type: apodData.media_type,
            description: apodData.explanation,
            copyright: apodData.copyright,
            date: apodData.date,
          }}
          size="small"
          onError={(msg) => console.error(msg)}
        />
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
