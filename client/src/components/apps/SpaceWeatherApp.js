import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getDonkiCME, getDonkiFLR, getDonkiGST } from '../../services/nasaApi';

/**
 * Space Weather App - DONKI API for solar events
 * @component
 */
export default function SpaceWeatherApp({ windowId: _windowId }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventType, setEventType] = useState('CME');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // Get date range (last 30 days)
    const getDateRange = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return {
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0],
        };
    };

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { startDate, endDate } = getDateRange();

        try {
            let response;
            switch (eventType) {
                case 'CME':
                    response = await getDonkiCME(startDate, endDate);
                    break;
                case 'FLR':
                    response = await getDonkiFLR(startDate, endDate);
                    break;
                case 'GST':
                    response = await getDonkiGST(startDate, endDate);
                    break;
                default:
                    response = await getDonkiCME(startDate, endDate);
            }

            const data = Array.isArray(response.data) ? response.data : [];
            setEvents(data.slice(0, 50)); // Limit to 50 events
            if (data.length === 0) {
                setError('No events found in the last 30 days.');
            }
        } catch (err) {
            console.error('DONKI fetch error:', err);
            setError(err.response?.data?.error?.message || 'Failed to load space weather data');
        } finally {
            setLoading(false);
        }
    }, [eventType]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const EVENT_INFO = {
        CME: { icon: '☀️', name: 'Coronal Mass Ejections', color: '#ff6b35' },
        FLR: { icon: '⚡', name: 'Solar Flares', color: '#ffc107' },
        GST: { icon: '🌀', name: 'Geomagnetic Storms', color: '#9c27b0' },
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleString();
    };

    const getEventSummary = (event) => {
        if (eventType === 'CME') {
            return event.note || 'Coronal Mass Ejection detected';
        } else if (eventType === 'FLR') {
            return `Class ${event.classType || 'Unknown'} - ${event.sourceLocation || 'Unknown location'}`;
        } else if (eventType === 'GST') {
            return `Kp Index: ${event.allKpIndex?.[0]?.kpIndex || 'Unknown'}`;
        }
        return 'Space weather event';
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>🌞 Space Weather Monitor</div>
            <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8 }}>
                Real-time solar events from DONKI
            </div>

            {/* Event Type Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {Object.entries(EVENT_INFO).map(([type, info]) => (
                    <button
                        key={type}
                        className={`btn ${eventType === type ? 'nasa-btn-primary' : ''}`}
                        onClick={() => setEventType(type)}
                        style={{
                            fontSize: '16px',
                            background: eventType === type ? info.color : undefined,
                            color: eventType === type ? 'white' : undefined,
                        }}
                    >
                        {info.icon} {info.name}
                    </button>
                ))}
            </div>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>}

            {/* Events List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px' }}>Loading space weather data...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {events.map((event, idx) => {
                            const info = EVENT_INFO[eventType];
                            return (
                                <div
                                    key={event.activityID || event.flrID || event.gstID || idx}
                                    onClick={() => setSelectedEvent(event)}
                                    style={{
                                        padding: '12px',
                                        border: `2px solid ${info.color}`,
                                        background: 'var(--primary)',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '24px' }}>{info.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                                {formatDate(event.startTime || event.beginTime || event.startDate)}
                                            </div>
                                            <div style={{ fontSize: '15px', opacity: 0.8 }}>
                                                {getEventSummary(event)}
                                            </div>
                                        </div>
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
                            border: `3px solid ${EVENT_INFO[eventType].color}`,
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>
                            {EVENT_INFO[eventType].icon} {EVENT_INFO[eventType].name}
                        </h3>
                        <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
                            <p><strong>Start:</strong> {formatDate(selectedEvent.startTime || selectedEvent.beginTime)}</p>
                            {selectedEvent.peakTime && <p><strong>Peak:</strong> {formatDate(selectedEvent.peakTime)}</p>}
                            {selectedEvent.endTime && <p><strong>End:</strong> {formatDate(selectedEvent.endTime)}</p>}
                            {selectedEvent.classType && <p><strong>Class:</strong> {selectedEvent.classType}</p>}
                            {selectedEvent.sourceLocation && <p><strong>Location:</strong> {selectedEvent.sourceLocation}</p>}
                            {selectedEvent.note && <p><strong>Notes:</strong> {selectedEvent.note}</p>}
                            {selectedEvent.link && (
                                <p>
                                    <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" style={{ color: EVENT_INFO[eventType].color }}>
                                        View Full Details →
                                    </a>
                                </p>
                            )}
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

SpaceWeatherApp.propTypes = {
    windowId: PropTypes.string,
};

SpaceWeatherApp.defaultProps = {
    windowId: null,
};
