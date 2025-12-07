import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getNeoFeed } from '../../services/nasaApi';
import { SaveButton } from '../favorites';
import NeoDetailPanel from './NeoDetailPanel';
import '../favorites/favorites.css';

/**
 * Formats a date object into YYYY-MM-DD format
 */
const getFormattedDate = date => date.toISOString().split('T')[0];

/**
 * Near Earth Object Web Service (NeoWs) application component
 * Apple System 6 HIG with dense visual indicators
 * @component
 */
export default function NeoWsApp({ windowId: _windowId }) {
  const [neoData, setNeoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNeo, setSelectedNeo] = useState(null);

  useEffect(() => {
    const today = new Date();
    const startDate = getFormattedDate(today);
    const endDate = getFormattedDate(today);

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
      .finally(() => setLoading(false));
  }, []);

  // Show detail panel if NEO is selected
  if (selectedNeo) {
    return <NeoDetailPanel neo={selectedNeo} onClose={() => setSelectedNeo(null)} />;
  }

  if (loading) return <div className="nasa-loading">Loading Near Earth Objects...</div>;
  if (error) return <div className="nasa-error">Error: {error}</div>;
  if (!neoData) return null;

  const todayStr = getFormattedDate(new Date());
  const neos = neoData.near_earth_objects[todayStr] || [];

  // Stats calculations
  const hazardousCount = neos.filter(n => n.is_potentially_hazardous_asteroid).length;
  const avgSize = neos.length > 0
    ? Math.round(neos.reduce((sum, n) => sum + n.estimated_diameter.meters.estimated_diameter_max, 0) / neos.length)
    : 0;
  const closestNeo = neos.reduce((min, n) => {
    const dist = parseFloat(n.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity);
    return dist < min.dist ? { dist, name: n.name } : min;
  }, { dist: Infinity, name: '' });

  return (
    <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div className="nasa-data-title" style={{ fontSize: 'var(--font-size-lg)' }}>☄️ Near Earth Objects ({todayStr})</div>
      <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: '6px', opacity: 0.8 }}>
        Tracking {neoData.element_count} objects today
      </div>

      {/* Stats Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        marginBottom: '8px',
        fontSize: 'var(--font-size-base)',
      }}>
        <div style={{
          padding: '6px',
          border: '1px solid var(--secondary)',
          textAlign: 'center',
          background: hazardousCount > 0 ? '#fcc' : 'var(--primary)',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
            {hazardousCount > 0 ? '⚠️' : '✓'} {hazardousCount}
          </div>
          <div>Hazardous</div>
        </div>
        <div style={{ padding: '6px', border: '1px solid var(--secondary)', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>📏 {avgSize}m</div>
          <div>Avg Size</div>
        </div>
        <div style={{ padding: '6px', border: '1px solid var(--secondary)', textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>📍 {Math.round(closestNeo.dist).toLocaleString()}</div>
          <div>Closest (km)</div>
        </div>
      </div>

      {/* NEO List with Visual Indicators */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {neos.length > 0 ? (
          neos.map(neo => <NeoListItem key={neo.id} neo={neo} onSelect={setSelectedNeo} />)
        ) : (
          <div className="nasa-data-content">No objects tracked for today.</div>
        )}
      </div>
    </div>
  );
}

/**
 * Individual NEO list item with visual indicators
 */
function NeoListItem({ neo, onSelect }) {
  const diameter = neo.estimated_diameter?.meters?.estimated_diameter_max || 0;
  const missDistanceKm = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.kilometers || 0);
  const velocity = parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_hour || 0);
  const isHazardous = neo.is_potentially_hazardous_asteroid;

  // Size comparison (max bar = 1000m)
  const sizeBar = Math.min(diameter / 500 * 100, 100);

  // Distance indicator (closer = more dangerous, max bar at 1M km)
  const distBar = Math.max(0, 100 - (missDistanceKm / 1000000 * 100));

  // Velocity indicator (max bar at 100,000 km/h)
  const velBar = Math.min(velocity / 80000 * 100, 100);

  return (
    <div
      style={{
        padding: '8px',
        marginBottom: '4px',
        border: isHazardous ? '2px solid #c00' : '1px solid var(--secondary)',
        background: isHazardous ? '#fee' : 'var(--primary)',
      }}
    >
      {/* Header Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <span style={{ fontSize: '18px' }}>☄️</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{neo.name}</div>
          {isHazardous && (
            <div style={{ fontSize: '10px', color: '#c00', fontWeight: 'bold' }}>⚠️ POTENTIALLY HAZARDOUS</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button className="btn" onClick={() => onSelect(neo)} style={{ fontSize: 'var(--font-size-base)', padding: '2px 8px' }}>
            Details
          </button>
          <SaveButton
            itemType="NEO"
            itemId={neo.id}
            itemDate={neo.close_approach_data?.[0]?.close_approach_date}
            itemData={neo}
            size="small"
          />
        </div>
      </div>

      {/* Visual Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: '3px', fontSize: '10px' }}>
        {/* Size */}
        <div style={{ opacity: 0.7 }}>Size:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ flex: 1, background: 'var(--tertiary)', height: '8px' }}>
            <div style={{ width: `${sizeBar}%`, background: '#666', height: '100%' }} />
          </div>
          <span style={{ minWidth: '50px' }}>{Math.round(diameter)}m</span>
        </div>

        {/* Distance */}
        <div style={{ opacity: 0.7 }}>Distance:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ flex: 1, background: 'var(--tertiary)', height: '8px' }}>
            <div style={{
              width: `${distBar}%`,
              background: distBar > 50 ? '#c00' : '#666',
              height: '100%'
            }} />
          </div>
          <span style={{ minWidth: '50px' }}>{Math.round(missDistanceKm).toLocaleString()} km</span>
        </div>

        {/* Velocity */}
        <div style={{ opacity: 0.7 }}>Velocity:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ flex: 1, background: 'var(--tertiary)', height: '8px' }}>
            <div style={{ width: `${velBar}%`, background: '#369', height: '100%' }} />
          </div>
          <span style={{ minWidth: '50px' }}>{Math.round(velocity).toLocaleString()} km/h</span>
        </div>
      </div>
    </div>
  );
}

NeoListItem.propTypes = {
  neo: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

NeoWsApp.propTypes = {
  windowId: PropTypes.string,
};

NeoWsApp.defaultProps = {
  windowId: null,
};
