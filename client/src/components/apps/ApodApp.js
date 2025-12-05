import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getApod } from '../../services/nasaApi';
import { SaveButton } from '../favorites';

/**
 * Get date string in YYYY-MM-DD format using LOCAL timezone (not UTC)
 * This prevents 404s when it's late evening EST but already next day in UTC
 */
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Add days to a date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

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
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const isToday = formatDate(currentDate) === formatDate(today);
  // APOD started June 16, 1995
  const earliestDate = new Date('1995-06-16');
  const isEarliest = formatDate(currentDate) <= formatDate(earliestDate);

  const fetchApod = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApod({ date: formatDate(date) });
      setApodData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApod(currentDate);
  }, [currentDate, fetchApod]);

  const handlePrevDay = () => {
    if (!isEarliest) {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const handleNextDay = () => {
    if (!isToday) {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateChange = (e) => {
    const newDate = new Date(e.target.value + 'T12:00:00');
    if (newDate >= earliestDate && newDate <= today) {
      setCurrentDate(newDate);
    }
  };

  if (loading) return <div className="nasa-loading">Loading APOD...</div>;
  if (error) return <div className="nasa-error">Error: {error}</div>;
  if (!apodData) return null;

  return (
    <div className="nasa-app-content" style={{ padding: '10px' }}>
      {/* Date Navigation */}
      <div
        className="apod-nav mb-2"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            className="btn"
            onClick={handlePrevDay}
            disabled={isEarliest}
            title="Previous day"
          >
            ◀ Prev
          </button>
          <button
            className="btn"
            onClick={handleNextDay}
            disabled={isToday}
            title="Next day"
          >
            Next ▶
          </button>
          {!isToday && (
            <button className="btn" onClick={handleToday} title="Go to today">
              Today
            </button>
          )}
        </div>
        <input
          type="date"
          value={formatDate(currentDate)}
          min="1995-06-16"
          max={formatDate(today)}
          onChange={handleDateChange}
          style={{ fontFamily: 'Chicago_12', fontSize: '14px' }}
        />
      </div>

      {/* Title */}
      <h2 className="nasa-data-title" style={{ marginBottom: '8px', fontSize: '16px' }}>
        {apodData.title}
      </h2>

      {/* Image with proper sizing */}
      {apodData.media_type === 'image' ? (
        <div
          className="apod-image-container mb-2"
          style={{
            margin: '0 -10px',
            padding: '10px',
            background: '#000',
            textAlign: 'center',
          }}
        >
          <img
            src={apodData.url}
            alt={apodData.title}
            style={{
              maxWidth: '100%',
              height: 'auto',
              border: '1px solid var(--secondary)',
            }}
          />
          {/* HD View Button */}
          {apodData.hdurl && (
            <div style={{ marginTop: '8px' }}>
              <a
                href={apodData.hdurl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn"
                style={{
                  display: 'inline-block',
                  background: '#fff',
                  textDecoration: 'none',
                }}
              >
                🔍 View HD Quality
              </a>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-2" style={{ textAlign: 'center', padding: '20px' }}>
          <a
            href={apodData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            ▶ Watch Video
          </a>
        </div>
      )}

      {/* Actions */}
      <div
        className="apod-actions mb-2"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <small style={{ fontSize: '12px' }}>Date: {apodData.date}</small>
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

      {/* Explanation */}
      <div className="nasa-data-content">
        <div className="nasa-data-title mb-1" style={{ fontSize: '14px' }}>
          Explanation:
        </div>
        <p style={{ lineHeight: '1.4', fontSize: '13px' }}>{apodData.explanation}</p>
      </div>

      {/* Copyright */}
      {apodData.copyright && (
        <div className="mt-2" style={{ fontSize: '11px', opacity: 0.7 }}>
          © {apodData.copyright}
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

