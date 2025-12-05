import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getEonetEvents, getEonetCategories } from '../../services/nasaApi';

/**
 * Earth Events App - EONET API for natural events
 * @component
 */
export default function EarthEventsApp({ windowId: _windowId }) {
    const [events, setEvents] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Category icons and colors
    const CATEGORY_STYLES = {
        wildfires: { icon: '🔥', color: '#ff5722' },
        severeStorms: { icon: '🌀', color: '#2196f3' },
        volcanoes: { icon: '🌋', color: '#9c27b0' },
        earthquakes: { icon: '🌍', color: '#795548' },
        floods: { icon: '🌊', color: '#00bcd4' },
        landslides: { icon: '⛰️', color: '#607d8b' },
        seaLakeIce: { icon: '🧊', color: '#90caf9' },
        snow: { icon: '❄️', color: '#e1f5fe' },
        dustHaze: { icon: '🌫️', color: '#bcaaa4' },
        drought: { icon: '☀️', color: '#ffb74d' },
        tempExtremes: { icon: '🌡️', color: '#f44336' },
        manmade: { icon: '⚠️', color: '#ffc107' },
    };

    const getCategoryStyle = (categoryId) => {
        return CATEGORY_STYLES[categoryId] || { icon: '📍', color: '#4caf50' };
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
            const options = { limit: 50, status: 'open' };
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

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleDateString();
    };

    const getEventLocation = (event) => {
        const geo = event.geometry?.[0];
        if (!geo) return 'Unknown location';
        const coords = geo.coordinates;
        if (!coords) return 'Unknown location';
        return `${coords[1]?.toFixed(2)}°, ${coords[0]?.toFixed(2)}°`;
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>🌍 Earth Events Tracker</div>
            <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8 }}>
                Natural events from NASA EONET
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '12px' }}>
                <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{ fontSize: '16px', padding: '6px 10px', width: '100%' }}
                >
                    <option value="">All Categories</option>
                    {categories.map((cat) => {
                        const style = getCategoryStyle(cat.id);
                        return (
                            <option key={cat.id} value={cat.id}>
                                {style.icon} {cat.title}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>}

            {/* Events Grid */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px' }}>Loading earth events...</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px',
                    }}>
                        {events.map((event) => {
                            const categoryId = event.categories?.[0]?.id;
                            const style = getCategoryStyle(categoryId);
                            return (
                                <div
                                    key={event.id}
                                    onClick={() => setSelectedEvent(event)}
                                    style={{
                                        padding: '12px',
                                        border: `2px solid ${style.color}`,
                                        background: 'var(--primary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ fontSize: '32px', marginBottom: '6px' }}>{style.icon}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {event.title?.substring(0, 40) || 'Unnamed Event'}
                                        {event.title?.length > 40 ? '...' : ''}
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                        {event.categories?.[0]?.title || 'Unknown'}
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.7, marginTop: '4px' }}>
                                        📍 {getEventLocation(event)}
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
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
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
                            border: `3px solid ${getCategoryStyle(selectedEvent.categories?.[0]?.id).color}`,
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>
                            {getCategoryStyle(selectedEvent.categories?.[0]?.id).icon} {selectedEvent.title}
                        </h3>
                        <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
                            <p><strong>Category:</strong> {selectedEvent.categories?.[0]?.title || 'Unknown'}</p>
                            <p><strong>Status:</strong> {selectedEvent.closed ? `Closed ${formatDate(selectedEvent.closed)}` : '🔴 Active'}</p>
                            {selectedEvent.geometry?.map((geo, idx) => (
                                <p key={idx}>
                                    <strong>Location {idx + 1}:</strong> {geo.coordinates?.[1]?.toFixed(4)}°, {geo.coordinates?.[0]?.toFixed(4)}°
                                    <br />
                                    <strong>Date:</strong> {formatDate(geo.date)}
                                </p>
                            ))}
                            {selectedEvent.sources?.map((source, idx) => (
                                <p key={idx}>
                                    <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4a90d9' }}>
                                        Source: {source.id} →
                                    </a>
                                </p>
                            ))}
                        </div>
                        <button className="btn" onClick={() => setSelectedEvent(null)} style={{ marginTop: '12px', fontSize: '16px' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

EarthEventsApp.propTypes = {
    windowId: PropTypes.string,
};

EarthEventsApp.defaultProps = {
    windowId: null,
};
