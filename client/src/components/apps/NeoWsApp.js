import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getNeoFeed } from '../../services/nasaApi';
import { SaveButton } from '../favorites';
import '../favorites/favorites.css';

/**
 * Formats a date object into YYYY-MM-DD format
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
const getFormattedDate = date => {
  return date.toISOString().split('T')[0];
};

/**
 * Near Earth Object Web Service (NeoWs) application component
 * @component
 * @param {Object} props - Component props
 * @param {string} [props.windowId] - Optional window ID for window management
 * @returns {JSX.Element} NEO tracker interface
 */
export default function NeoWsApp({ windowId: _windowId }) {
  const [neoData, setNeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const today = new Date();
    const startDate = getFormattedDate(today);
    const endDate = getFormattedDate(today); // Just get today's data

    setLoading(true);
    getNeoFeed(startDate, endDate)
      .then(res => {
        setNeoData(res.data);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch NEO data:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="nasa-loading">Loading Near Earth Objects...</div>;
  if (error) return <div className="nasa-error">Error: {error}</div>;
  if (!neoData) return null;

  const todayStr = getFormattedDate(new Date());
  const neos = neoData.near_earth_objects[todayStr] || [];

  return (
    <div className="nasa-data-section">
      <div className="nasa-data-title">Near Earth Objects ({todayStr})</div>

      <div className="mb-1">
        <small>Found {neoData.element_count} objects today.</small>
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {neos.length > 0 ? (
          neos.map(neo => (
            <div
              key={neo.id}
              className="mb-1"
              style={{
                border: '1px solid var(--tertiary)',
                padding: '8px',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div className="nasa-data-title" style={{ flex: 1 }}>{neo.name}</div>
                <div className="asteroid-actions">
                  <button className="nasa-btn" onClick={() => console.log('View details', neo)}>
                    View Details
                  </button>
                  <SaveButton
                    itemType="NEO"
                    itemId={neo.id}
                    itemDate={neo.close_approach_data[0]?.close_approach_date}
                    itemData={neo}
                    size="small"
                  />
                </div>
              </div>
              <div className="nasa-data-content">
                <div>
                  <strong>Potentially Hazardous:</strong>{' '}
                  {neo.is_potentially_hazardous_asteroid ? (
                    <span style={{ color: '#ff0000' }}>YES</span>
                  ) : (
                    'No'
                  )}
                </div>
                <div>
                  <strong>Est. Diameter:</strong>{' '}
                  {Math.round(neo.estimated_diameter.meters.estimated_diameter_max)} meters
                </div>
                {neo.close_approach_data && neo.close_approach_data.length > 0 && (
                  <div>
                    <strong>Miss Distance:</strong>{' '}
                    {Math.round(
                      neo.close_approach_data[0].miss_distance.kilometers,
                    ).toLocaleString()}{' '}
                    km
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="nasa-data-content">No objects tracked for today.</div>
        )}
      </div>
    </div>
  );
}

NeoWsApp.propTypes = {
  windowId: PropTypes.string,
};

NeoWsApp.defaultProps = {
  windowId: null,
};
