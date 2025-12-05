import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getEonetEvents, getEonetCategories } from '../../services/nasaApi';

/**
 * Earth Events App - EONET API with Map Visualization
 * Apple System 6 HIG styling with proper coordinate projection
 * @component
 */
export default function EarthEventsApp({ windowId: _windowId }) {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [viewMode, setViewMode] = useState('map');
    const [mapError, setMapError] = useState(false);

    // Category information
    const CATEGORY_INFO = {
        wildfires: { icon: '🔥', color: '#c00', what: 'Wildfire', why: 'Lightning, drought, human activity', how: 'MODIS/VIIRS thermal' },
        severeStorms: { icon: '🌀', color: '#36c', what: 'Tropical Cyclone', why: 'Warm ocean temps', how: 'GOES/Himawari satellites' },
        volcanoes: { icon: '🌋', color: '#909', what: 'Volcanic Activity', why: 'Magma pressure', how: 'Seismic + SO2 sensors' },
        earthquakes: { icon: '🌍', color: '#630', what: 'Earthquake', why: 'Tectonic plate shift', how: 'USGS seismometers' },
        floods: { icon: '🌊', color: '#099', what: 'Flood', why: 'Heavy rain/storm surge', how: 'Satellite flood mapping' },
        landslides: { icon: '⛰️', color: '#666', what: 'Landslide', why: 'Rain, quakes, erosion', how: 'InSAR radar' },
        seaLakeIce: { icon: '🧊', color: '#69c', what: 'Ice Event', why: 'Temperature change', how: 'Microwave imagery' },
        snow: { icon: '❄️', color: '#9cf', what: 'Blizzard', why: 'Cold air + moisture', how: 'Weather satellites' },
        dustHaze: { icon: '🌫️', color: '#996', what: 'Dust Storm', why: 'Strong winds', how: 'MODIS AOD' },
        drought: { icon: '☀️', color: '#c90', what: 'Drought', why: 'Lack of precipitation', how: 'NDVI vegetation index' },
        tempExtremes: { icon: '🌡️', color: '#c33', what: 'Heat/Cold Extreme', why: 'Weather patterns', how: 'Ground stations' },
        manmade: { icon: '⚠️', color: '#cc0', what: 'Human-caused', why: 'Industry/accidents', how: 'Various sensors' },
    };

    const SOURCE_INFO = {
        'InciWeb': { name: 'InciWeb', org: 'US Interagency', desc: 'Wildfire incidents' },
        'EO': { name: 'Earth Observatory', org: 'NASA', desc: 'Event reports' },
        'GDACS': { name: 'GDACS', org: 'UN/EU', desc: 'Disaster alerts' },
        'JTWC': { name: 'JTWC', org: 'US Navy', desc: 'Typhoon warnings' },
        'NHC': { name: 'NHC', org: 'NOAA', desc: 'Hurricane center' },
        'SIVolcano': { name: 'Smithsonian', org: 'Smithsonian', desc: 'Volcanism program' },
        'IRWIN': { name: 'IRWIN', org: 'DOI', desc: 'Fire reporting' },
        'USGS_CMT': { name: 'USGS', org: 'USGS', desc: 'Seismic data' },
        'PDC': { name: 'PDC', org: 'Various', desc: 'Pacific disasters' },
        'ReliefWeb': { name: 'ReliefWeb', org: 'UN OCHA', desc: 'Humanitarian info' },
    };

    const getCategoryInfo = (id) => CATEGORY_INFO[id] || { icon: '📍', color: '#4a4', what: 'Event', why: 'Natural causes', how: 'Satellite detection' };
    const getSourceInfo = (id) => SOURCE_INFO[id] || { name: id, org: 'External', desc: 'Data source' };

    const fetchCategories = useCallback(async () => {
        try {
            const response = await getEonetCategories();
            setCategories(response.data?.categories || []);
        } catch (err) {
            console.error('Categories fetch error:', err);
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const options = { limit: 100, status: 'open' };
            if (selectedCategory) options.category = selectedCategory;
            const response = await getEonetEvents(options);
            const data = response.data?.events || [];
            setEvents(data);
            if (data.length === 0) setError('No active events found.');
        } catch (err) {
            console.error('Events fetch error:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    }, [selectedCategory]);

    useEffect(() => { fetchCategories(); }, [fetchCategories]);
    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // Map dimensions
    const MAP_WIDTH = 560;
    const MAP_HEIGHT = 280;

    // Coordinate projection
    const coordToMapPos = (lon, lat) => {
        const x = ((lon + 180) / 360) * MAP_WIDTH;
        const y = ((90 - lat) / 180) * MAP_HEIGHT;
        return { x: Math.round(x), y: Math.round(y) };
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    };

    const formatCoords = (lat, lon) => {
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
    };

    const yesterday = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        return d.toISOString().split('T')[0];
    }, []);

    // Count events by category
    const categoryCounts = useMemo(() => {
        const counts = {};
        events.forEach(e => {
            const catId = e.categories?.[0]?.id || 'unknown';
            counts[catId] = (counts[catId] || 0) + 1;
        });
        return counts;
    }, [events]);

    // SVG fallback map when GIBS fails
    const FallbackMap = () => (
        <svg width={MAP_WIDTH} height={MAP_HEIGHT} style={{ position: 'absolute', top: 0, left: 0 }}>
            <rect width="100%" height="100%" fill="#9cf" />
            {/* Simple continent outlines */}
            <ellipse cx="140" cy="100" rx="80" ry="60" fill="#9c9" stroke="#696" /> {/* Americas */}
            <ellipse cx="310" cy="80" rx="50" ry="50" fill="#9c9" stroke="#696" /> {/* Europe/Africa */}
            <ellipse cx="420" cy="100" rx="70" ry="55" fill="#9c9" stroke="#696" /> {/* Asia */}
            <ellipse cx="450" cy="200" rx="40" ry="25" fill="#9c9" stroke="#696" /> {/* Australia */}
            <rect x="0" y={MAP_HEIGHT - 30} width={MAP_WIDTH} height="30" fill="#fff" opacity="0.7" /> {/* Antarctica */}
            <text x={MAP_WIDTH / 2} y={MAP_HEIGHT / 2} textAnchor="middle" fontSize="12" fill="#666">
                Map loading... Events shown below
            </text>
        </svg>
    );

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">🌍 Earth Events Tracker</div>
            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                EONET Active Natural Events • {events.length} tracked
            </div>

            {/* Category Summary */}
            <div style={{
                display: 'flex', gap: '8px', marginBottom: '8px', padding: '4px 6px',
                background: 'var(--tertiary)', fontSize: '11px', flexWrap: 'wrap',
            }}>
                {Object.entries(categoryCounts).slice(0, 6).map(([catId, count]) => (
                    <span key={catId}>{getCategoryInfo(catId).icon} {count}</span>
                ))}
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ fontSize: '12px', padding: '4px', flex: 1, minWidth: '120px' }}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{getCategoryInfo(cat.id).icon} {cat.title}</option>
                    ))}
                </select>
                <div style={{ display: 'flex' }}>
                    <button className={`btn ${viewMode === 'map' ? 'btn-default' : ''}`} onClick={() => setViewMode('map')} style={{ fontSize: '11px', padding: '4px 8px' }}>Map</button>
                    <button className={`btn ${viewMode === 'list' ? 'btn-default' : ''}`} onClick={() => setViewMode('list')} style={{ fontSize: '11px', padding: '4px 8px' }}>List</button>
                </div>
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '12px', marginBottom: '6px' }}>{error}</div>}

            {/* Main Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading">Loading earth events...</div>
                ) : viewMode === 'map' ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            position: 'relative',
                            width: MAP_WIDTH,
                            height: MAP_HEIGHT,
                            margin: '0 auto',
                            border: '2px solid var(--secondary)',
                            background: '#9cf',
                            overflow: 'hidden',
                        }}>
                            {/* Map Image or Fallback */}
                            {mapError ? <FallbackMap /> : (
                                <img
                                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Equirectangular-projection.jpg/2048px-Equirectangular-projection.jpg"
                                    alt="World Map"
                                    crossOrigin="anonymous"
                                    onError={() => setMapError(true)}
                                    style={{
                                        position: 'absolute', top: 0, left: 0,
                                        width: MAP_WIDTH, height: MAP_HEIGHT,
                                        objectFit: 'cover',
                                    }}
                                />
                            )}

                            {/* Event Markers */}
                            {events.map((event) => {
                                const geo = event.geometry?.[event.geometry.length - 1];
                                if (!geo?.coordinates) return null;
                                const [lon, lat] = geo.coordinates;
                                const pos = coordToMapPos(lon, lat);
                                const info = getCategoryInfo(event.categories?.[0]?.id);

                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        title={`${event.title}\n${formatCoords(lat, lon)}`}
                                        style={{
                                            position: 'absolute',
                                            left: pos.x - 8,
                                            top: pos.y - 8,
                                            width: 16,
                                            height: 16,
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            textAlign: 'center',
                                            lineHeight: '16px',
                                            textShadow: '0 0 2px #fff, 0 0 2px #fff',
                                            zIndex: selectedEvent?.id === event.id ? 100 : 10,
                                            animation: 'blink 1.5s infinite',
                                        }}
                                    >
                                        {info.icon}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px', fontSize: '10px', justifyContent: 'center' }}>
                            {Object.entries(CATEGORY_INFO).slice(0, 8).map(([id, info]) => (
                                <span key={id}>{info.icon} {info.what}</span>
                            ))}
                        </div>

                        {/* Event List */}
                        <div style={{ marginTop: '8px', textAlign: 'left', maxHeight: '120px', overflow: 'auto' }}>
                            {events.slice(0, 15).map((event) => {
                                const info = getCategoryInfo(event.categories?.[0]?.id);
                                const geo = event.geometry?.[event.geometry.length - 1];
                                return (
                                    <div
                                        key={event.id}
                                        onClick={() => setSelectedEvent(event)}
                                        style={{
                                            padding: '3px 6px', cursor: 'pointer',
                                            borderBottom: '1px dotted var(--tertiary)',
                                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px',
                                            background: selectedEvent?.id === event.id ? 'var(--tertiary)' : 'transparent',
                                        }}
                                    >
                                        <span>{info.icon}</span>
                                        <span style={{ flex: 1 }}>{event.title?.substring(0, 35)}{event.title?.length > 35 ? '…' : ''}</span>
                                        {geo && <span style={{ opacity: 0.6, fontSize: '10px' }}>{formatCoords(geo.coordinates[1], geo.coordinates[0])}</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    /* LIST VIEW */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {events.map((event) => {
                            const info = getCategoryInfo(event.categories?.[0]?.id);
                            const geo = event.geometry?.[0];
                            return (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    style={{
                                        padding: '8px', border: '1px solid var(--secondary)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>{info.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{event.title?.substring(0, 45)}{event.title?.length > 45 ? '…' : ''}</div>
                                        <div style={{ fontSize: '11px', opacity: 0.7 }}>{event.categories?.[0]?.title} • {geo ? formatCoords(geo.coordinates[1], geo.coordinates[0]) : ''}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(128,128,128,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)', border: '2px solid var(--secondary)',
                            boxShadow: '4px 4px 0 var(--secondary)',
                            maxWidth: '500px', maxHeight: '70vh', overflow: 'auto', width: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            background: 'var(--secondary)', color: 'var(--primary)',
                            padding: '4px 8px', fontSize: '12px', fontWeight: 'bold',
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span>{getCategoryInfo(selectedEvent.categories?.[0]?.id).icon} Event Details</span>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'var(--primary)', color: 'var(--secondary)', border: '1px solid var(--primary)', padding: '0 6px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                        </div>

                        <div style={{ padding: '12px', fontSize: '12px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{selectedEvent.title}</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>📌 WHAT</div>
                                    <div>{getCategoryInfo(selectedEvent.categories?.[0]?.id).what}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>📍 WHERE</div>
                                    {selectedEvent.geometry?.slice(-1).map((geo, i) => (
                                        <div key={i}>{formatCoords(geo.coordinates[1], geo.coordinates[0])}</div>
                                    ))}
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>📅 WHEN</div>
                                    <div>First: {formatDate(selectedEvent.geometry?.[0]?.date)}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>❓ WHY</div>
                                    <div>{getCategoryInfo(selectedEvent.categories?.[0]?.id).why}</div>
                                </div>
                            </div>

                            <div style={{ padding: '6px', border: '1px solid var(--tertiary)', marginBottom: '10px' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>🔬 HOW DETECTED</div>
                                <div>{getCategoryInfo(selectedEvent.categories?.[0]?.id).how}</div>
                            </div>

                            {selectedEvent.sources?.length > 0 && (
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🌐 Sources</div>
                                    {selectedEvent.sources.map((src, i) => {
                                        const srcInfo = getSourceInfo(src.id);
                                        return (
                                            <div key={i} style={{ fontSize: '11px', marginBottom: '2px' }}>
                                                <strong>{srcInfo.name}</strong> ({srcInfo.org}) <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: '#00c' }}>→</a>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div style={{ textAlign: 'center' }}>
                                <a
                                    href={`https://worldview.earthdata.nasa.gov/?v=${selectedEvent.geometry?.[0]?.coordinates[0] - 10},${selectedEvent.geometry?.[0]?.coordinates[1] - 10},${selectedEvent.geometry?.[0]?.coordinates[0] + 10},${selectedEvent.geometry?.[0]?.coordinates[1] + 10}&t=${yesterday}`}
                                    target="_blank" rel="noopener noreferrer" className="btn" style={{ fontSize: '11px' }}
                                >🛰️ View in NASA Worldview</a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </div>
    );
}

EarthEventsApp.propTypes = { windowId: PropTypes.string };
EarthEventsApp.defaultProps = { windowId: null };
