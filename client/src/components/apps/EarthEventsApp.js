import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getEonetEvents, getEonetCategories } from '../../services/nasaApi';

/**
 * Earth Events App - EONET API with Map Visualization
 * Shows natural events on a world map with comprehensive details
 * @component
 */
export default function EarthEventsApp({ windowId: _windowId }) {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'

    // Category icons, colors and descriptions
    const CATEGORY_INFO = {
        wildfires: {
            icon: '🔥',
            color: '#ff5722',
            what: 'Wildfire/Vegetation Fire',
            why: 'Caused by lightning, human activity, or extreme heat/drought conditions',
            how: 'Detected via thermal satellite imagery (MODIS, VIIRS)',
        },
        severeStorms: {
            icon: '🌀',
            color: '#2196f3',
            what: 'Tropical Cyclone/Hurricane/Typhoon',
            why: 'Warm ocean temperatures fuel storm development',
            how: 'Tracked by weather satellites (GOES, Himawari) and recon aircraft',
        },
        volcanoes: {
            icon: '🌋',
            color: '#9c27b0',
            what: 'Volcanic Activity/Eruption',
            why: 'Magma pressure and tectonic plate movement',
            how: 'Monitored via seismic sensors, SO2 detection, and thermal imaging',
        },
        earthquakes: {
            icon: '🌍',
            color: '#795548',
            what: 'Seismic Event',
            why: 'Tectonic plate shifts, fault line stress release',
            how: 'Detected by global seismometer network (USGS)',
        },
        floods: {
            icon: '🌊',
            color: '#00bcd4',
            what: 'Flood Event',
            why: 'Heavy rainfall, dam failure, snowmelt, storm surge',
            how: 'Satellite flood mapping, river gauge networks',
        },
        landslides: {
            icon: '⛰️',
            color: '#607d8b',
            what: 'Landslide/Mudslide',
            why: 'Heavy rain, earthquakes, erosion, deforestation',
            how: 'Radar interferometry (InSAR), optical satellites',
        },
        seaLakeIce: {
            icon: '🧊',
            color: '#90caf9',
            what: 'Sea/Lake Ice Extent Change',
            why: 'Seasonal temperature changes, climate patterns',
            how: 'Microwave and optical satellite imagery',
        },
        snow: {
            icon: '❄️',
            color: '#e1f5fe',
            what: 'Significant Snowfall/Blizzard',
            why: 'Cold air masses, moisture convergence',
            how: 'Weather satellites, ground stations',
        },
        dustHaze: {
            icon: '🌫️',
            color: '#bcaaa4',
            what: 'Dust/Sandstorm or Smoke Haze',
            why: 'Strong winds over dry terrain, wildfires',
            how: 'Aerosol detection via satellite (MODIS AOD)',
        },
        drought: {
            icon: '☀️',
            color: '#ffb74d',
            what: 'Drought Conditions',
            why: 'Prolonged lack of precipitation, high evaporation',
            how: 'Vegetation indices (NDVI), soil moisture sensors',
        },
        tempExtremes: {
            icon: '🌡️',
            color: '#f44336',
            what: 'Temperature Extreme',
            why: 'Heat domes, polar vortex disruption',
            how: 'Weather stations, satellite thermal data',
        },
        manmade: {
            icon: '⚠️',
            color: '#ffc107',
            what: 'Human-caused Event',
            why: 'Industrial accidents, explosions, oil spills',
            how: 'Various detection methods depending on type',
        },
    };

    const getCategoryInfo = (categoryId) => {
        return CATEGORY_INFO[categoryId] || {
            icon: '📍',
            color: '#4caf50',
            what: 'Natural Event',
            why: 'Various natural causes',
            how: 'Satellite and ground-based detection',
        };
    };

    // Source information (more useful than just linking)
    const SOURCE_INFO = {
        'InciWeb': { name: 'InciWeb', org: 'US Interagency', desc: 'US wildfire incident information' },
        'EO': { name: 'Earth Observatory', org: 'NASA', desc: 'NASA natural event reports' },
        'GDACS': { name: 'GDACS', org: 'UN/EU', desc: 'Global Disaster Alert & Coordination' },
        'JTWC': { name: 'JTWC', org: 'US Navy', desc: 'Joint Typhoon Warning Center' },
        'NHC': { name: 'NHC', org: 'NOAA', desc: 'National Hurricane Center' },
        'CPHC': { name: 'CPHC', org: 'NOAA', desc: 'Central Pacific Hurricane Center' },
        'SIVolcano': { name: 'Smithsonian', org: 'Smithsonian', desc: 'Global Volcanism Program' },
        'AVO': { name: 'AVO', org: 'USGS', desc: 'Alaska Volcano Observatory' },
        'IRWIN': { name: 'IRWIN', org: 'US DOI', desc: 'Integrated Reporting of Wildland-Fire Info' },
        'USGS_CMT': { name: 'USGS', org: 'USGS', desc: 'US Geological Survey moment tensors' },
        'PDC': { name: 'PDC', org: 'Various', desc: 'Pacific Disaster Center' },
        'ReliefWeb': { name: 'ReliefWeb', org: 'UN OCHA', desc: 'UN humanitarian information' },
        'MRR': { name: 'MRR', org: 'NASA', desc: 'MODIS Rapid Response imagery' },
    };

    const getSourceInfo = (sourceId) => {
        return SOURCE_INFO[sourceId] || { name: sourceId, org: 'Unknown', desc: 'External data source' };
    };

    const fetchCategories = useCallback(async () => {
        try {
            const response = await getEonetCategories();
            setCategories(response.data?.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const options = { limit: 100, status: 'open' };
            if (selectedCategory) {
                options.category = selectedCategory;
            }

            const response = await getEonetEvents(options);
            const data = response.data?.events || [];
            setEvents(data);
            if (data.length === 0) {
                setError('No active events found.');
            }
        } catch (err) {
            console.error('EONET fetch error:', err);
            setError('Failed to load earth events');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    // Convert coordinates to map position (simple equirectangular projection)
    const coordToMapPos = (lon, lat, width, height) => {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        return { x, y };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCoords = (lat, lon) => {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        return `${Math.abs(lat).toFixed(3)}° ${latDir}, ${Math.abs(lon).toFixed(3)}° ${lonDir}`;
    };

    // Get yesterday's date for GIBS tiles
    const yesterday = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }, []);

    // Map dimensions
    const MAP_WIDTH = 580;
    const MAP_HEIGHT = 290;

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>🌍 Earth Events Tracker</div>
            <div style={{ fontSize: '16px', marginBottom: '8px', opacity: 0.8 }}>
                Active natural events from NASA EONET • {events.length} events
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ fontSize: '16px', padding: '6px', flex: 1, minWidth: '150px' }}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => {
                        const info = getCategoryInfo(cat.id);
                        return (
                            <option key={cat.id} value={cat.id}>
                                {info.icon} {cat.title}
                            </option>
                        );
                    })}
                </select>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={`btn ${viewMode === 'map' ? 'nasa-btn-primary' : ''}`}
                        onClick={() => setViewMode('map')}
                        style={{ fontSize: '14px' }}
                    >
                        🗺️ Map
                    </button>
                    <button
                        className={`btn ${viewMode === 'list' ? 'nasa-btn-primary' : ''}`}
                        onClick={() => setViewMode('list')}
                        style={{ fontSize: '14px' }}
                    >
                        📋 List
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>}

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px' }}>Loading earth events...</div>
                ) : viewMode === 'map' ? (
                    /* MAP VIEW */
                    <div style={{ position: 'relative', width: '100%', maxWidth: MAP_WIDTH, margin: '0 auto' }}>
                        {/* Base Map - GIBS Blue Marble */}
                        <div style={{
                            width: MAP_WIDTH,
                            height: MAP_HEIGHT,
                            background: '#1a1a2e',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '2px solid var(--secondary)',
                        }}>
                            {/* Use GIBS Blue Marble tiles as background */}
                            <img
                                src={`https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_NextGeneration/default/2004-08/500m/2/0/0.jpg`}
                                alt="Earth Left"
                                style={{ position: 'absolute', left: 0, top: 0, width: MAP_WIDTH / 2, height: MAP_HEIGHT }}
                            />
                            <img
                                src={`https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/BlueMarble_NextGeneration/default/2004-08/500m/2/0/1.jpg`}
                                alt="Earth Right"
                                style={{ position: 'absolute', left: MAP_WIDTH / 2, top: 0, width: MAP_WIDTH / 2, height: MAP_HEIGHT }}
                            />

                            {/* Event Markers */}
                            {events.map((event) => {
                                const geo = event.geometry?.[event.geometry.length - 1]; // Most recent location
                                if (!geo?.coordinates) return null;

                                const [lon, lat] = geo.coordinates;
                                const pos = coordToMapPos(lon, lat, MAP_WIDTH, MAP_HEIGHT);
                                const info = getCategoryInfo(event.categories?.[0]?.id);

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        style={{
                                            position: 'absolute',
                                            left: pos.x - 10,
                                            top: pos.y - 10,
                                            width: 20,
                                            height: 20,
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            textAlign: 'center',
                                            lineHeight: '20px',
                                            filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.8))',
                                            animation: 'pulse 2s infinite',
                                            zIndex: selectedEvent?.id === event.id ? 100 : 10,
                                        }}
                                        title={event.title}
                                    >
                                        {info.icon}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Map Legend */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '8px',
                            fontSize: '12px',
                            justifyContent: 'center',
                        }}>
                            {Object.entries(CATEGORY_INFO).slice(0, 6).map(([id, info]) => (
                                <span key={id} style={{ opacity: 0.8 }}>
                                    {info.icon} {id.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            ))}
                        </div>

                        {/* Event List Below Map */}
                        <div style={{ marginTop: '12px' }}>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                Click markers above or events below:
                            </div>
                            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                                {events.slice(0, 20).map((event) => {
                                    const info = getCategoryInfo(event.categories?.[0]?.id);
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={() => setSelectedEvent(event)}
                                            style={{
                                                padding: '6px 8px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid var(--tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                background: selectedEvent?.id === event.id ? info.color + '30' : 'transparent',
                                            }}
                                        >
                                            <span style={{ fontSize: '18px' }}>{info.icon}</span>
                                            <span style={{ fontSize: '14px', flex: 1 }}>
                                                {event.title?.substring(0, 45)}{event.title?.length > 45 ? '...' : ''}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px',
                    }}>
                        {events.map((event) => {
                            const categoryId = event.categories?.[0]?.id;
                            const info = getCategoryInfo(categoryId);
                            const geo = event.geometry?.[0];
                            return (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    style={{
                                        padding: '12px',
                                        border: `2px solid ${info.color}`,
                                        background: 'var(--primary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>{info.icon}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {event.title?.substring(0, 40) || 'Unnamed Event'}
                                        {event.title?.length > 40 ? '...' : ''}
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                        {event.categories?.[0]?.title || 'Unknown'}
                                    </div>
                                    {geo && (
                                        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '4px' }}>
                                            📍 {formatCoords(geo.coordinates[1], geo.coordinates[0])}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Comprehensive Event Detail Modal */}
            {selectedEvent && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                    }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            padding: '20px',
                            border: `3px solid ${getCategoryInfo(selectedEvent.categories?.[0]?.id).color}`,
                            maxWidth: '700px',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            width: '100%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '16px',
                            borderBottom: `2px solid ${getCategoryInfo(selectedEvent.categories?.[0]?.id).color}`,
                            paddingBottom: '12px',
                        }}>
                            <span style={{ fontSize: '48px' }}>
                                {getCategoryInfo(selectedEvent.categories?.[0]?.id).icon}
                            </span>
                            <div>
                                <h3 style={{ fontSize: '22px', margin: 0 }}>{selectedEvent.title}</h3>
                                <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
                                    {selectedEvent.closed ? `❌ Closed ${formatDate(selectedEvent.closed)}` : '🔴 Currently Active'}
                                </div>
                            </div>
                        </div>

                        {/* 5W1H Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '16px',
                            marginBottom: '16px',
                        }}>
                            {/* WHAT */}
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--tertiary)' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: getCategoryInfo(selectedEvent.categories?.[0]?.id).color }}>
                                    📌 WHAT
                                </div>
                                <div style={{ fontSize: '16px', marginTop: '4px' }}>
                                    {getCategoryInfo(selectedEvent.categories?.[0]?.id).what}
                                </div>
                                <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '2px' }}>
                                    Category: {selectedEvent.categories?.[0]?.title || 'Unknown'}
                                </div>
                            </div>

                            {/* WHERE */}
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--tertiary)' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: getCategoryInfo(selectedEvent.categories?.[0]?.id).color }}>
                                    📍 WHERE
                                </div>
                                {selectedEvent.geometry?.slice(-1).map((geo, idx) => (
                                    <div key={idx} style={{ fontSize: '16px', marginTop: '4px' }}>
                                        {formatCoords(geo.coordinates[1], geo.coordinates[0])}
                                    </div>
                                ))}
                                {selectedEvent.geometry?.length > 1 && (
                                    <div style={{ fontSize: '13px', opacity: 0.7 }}>
                                        +{selectedEvent.geometry.length - 1} more positions tracked
                                    </div>
                                )}
                            </div>

                            {/* WHEN */}
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--tertiary)' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: getCategoryInfo(selectedEvent.categories?.[0]?.id).color }}>
                                    📅 WHEN
                                </div>
                                <div style={{ fontSize: '16px', marginTop: '4px' }}>
                                    First detected: {formatDate(selectedEvent.geometry?.[0]?.date)}
                                </div>
                                {selectedEvent.geometry?.length > 1 && (
                                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                        Last update: {formatDate(selectedEvent.geometry?.[selectedEvent.geometry.length - 1]?.date)}
                                    </div>
                                )}
                            </div>

                            {/* WHY */}
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--tertiary)' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: getCategoryInfo(selectedEvent.categories?.[0]?.id).color }}>
                                    ❓ WHY
                                </div>
                                <div style={{ fontSize: '15px', marginTop: '4px' }}>
                                    {getCategoryInfo(selectedEvent.categories?.[0]?.id).why}
                                </div>
                            </div>

                            {/* HOW (Detection) */}
                            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.1)', border: '1px solid var(--tertiary)', gridColumn: '1 / -1' }}>
                                <div style={{ fontSize: '14px', fontWeight: 'bold', color: getCategoryInfo(selectedEvent.categories?.[0]?.id).color }}>
                                    🔬 HOW DETECTED
                                </div>
                                <div style={{ fontSize: '15px', marginTop: '4px' }}>
                                    {getCategoryInfo(selectedEvent.categories?.[0]?.id).how}
                                </div>
                            </div>
                        </div>

                        {/* Sources - More Helpful Info */}
                        {selectedEvent.sources?.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    🌐 Data Sources
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {selectedEvent.sources.map((source, idx) => {
                                        const srcInfo = getSourceInfo(source.id);
                                        return (
                                            <div key={idx} style={{
                                                padding: '8px 12px',
                                                background: 'rgba(0,0,0,0.1)',
                                                border: '1px solid var(--tertiary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                            }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 'bold' }}>
                                                        {srcInfo.name}
                                                    </div>
                                                    <div style={{ fontSize: '13px', opacity: 0.8 }}>
                                                        {srcInfo.org} • {srcInfo.desc}
                                                    </div>
                                                </div>
                                                <a
                                                    href={source.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: '#4a90d9',
                                                        fontSize: '14px',
                                                        textDecoration: 'none',
                                                    }}
                                                >
                                                    Open →
                                                </a>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Tracking History */}
                        {selectedEvent.geometry?.length > 1 && (
                            <div style={{ marginBottom: '16px' }}>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    📊 Position History ({selectedEvent.geometry.length} points)
                                </div>
                                <div style={{ maxHeight: '120px', overflow: 'auto', fontSize: '13px' }}>
                                    {selectedEvent.geometry.map((geo, idx) => (
                                        <div key={idx} style={{
                                            padding: '4px 0',
                                            borderBottom: '1px dotted var(--tertiary)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                        }}>
                                            <span>{formatCoords(geo.coordinates[1], geo.coordinates[0])}</span>
                                            <span style={{ opacity: 0.7 }}>{formatDate(geo.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* NASA Worldview Link */}
                        <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                            <a
                                href={`https://worldview.earthdata.nasa.gov/?v=${selectedEvent.geometry?.[0]?.coordinates[0] - 10},${selectedEvent.geometry?.[0]?.coordinates[1] - 10},${selectedEvent.geometry?.[0]?.coordinates[0] + 10},${selectedEvent.geometry?.[0]?.coordinates[1] + 10}&t=${yesterday}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    color: '#4a90d9',
                                    fontSize: '16px',
                                    display: 'inline-block',
                                    padding: '8px 16px',
                                    border: '1px solid #4a90d9',
                                    textDecoration: 'none',
                                }}
                            >
                                🛰️ View Location in NASA Worldview
                            </a>
                        </div>

                        <button
                            className="btn"
                            onClick={() => setSelectedEvent(null)}
                            style={{ width: '100%', fontSize: '16px', padding: '10px' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* CSS for pulse animation */}
            <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
        </div>
    );
}

EarthEventsApp.propTypes = {
    windowId: PropTypes.string,
};

EarthEventsApp.defaultProps = {
    windowId: null,
};
