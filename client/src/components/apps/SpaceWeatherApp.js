import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getDonkiCME, getDonkiFLR, getDonkiGST } from '../../services/nasaApi';
import SunVisualization from './SunVisualization';

/**
 * Space Weather App - DONKI API for solar events
 * Apple System 6 HIG with dense data visualization + 3D Sun
 * @component
 */
export default function SpaceWeatherApp({ windowId: _windowId }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eventType, setEventType] = useState('CME');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [showSunViz, setShowSunViz] = useState(false);

    const EVENT_INFO = {
        CME: { icon: '☀️', name: 'Coronal Mass Ejections', desc: 'Plasma eruptions from Sun' },
        FLR: { icon: '⚡', name: 'Solar Flares', desc: 'Electromagnetic bursts' },
        GST: { icon: '🌀', name: 'Geomagnetic Storms', desc: 'Earth magnetic disturbance' },
    };

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
                case 'CME': response = await getDonkiCME(startDate, endDate); break;
                case 'FLR': response = await getDonkiFLR(startDate, endDate); break;
                case 'GST': response = await getDonkiGST(startDate, endDate); break;
                default: response = await getDonkiCME(startDate, endDate);
            }

            const data = Array.isArray(response.data) ? response.data : [];
            setEvents(data.slice(0, 50));
            if (data.length === 0) setError('No events in the last 30 days.');
        } catch (err) {
            console.error('DONKI fetch error:', err);
            setError('Failed to load space weather data');
        } finally {
            setLoading(false);
        }
    }, [eventType]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    // 30-day activity timeline
    const timeline = useMemo(() => {
        const days = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            days.push({ date: date.toISOString().split('T')[0], count: 0 });
        }
        events.forEach(event => {
            const eventDate = (event.startTime || event.beginTime || event.startDate || '').split('T')[0];
            const dayIndex = days.findIndex(d => d.date === eventDate);
            if (dayIndex >= 0) days[dayIndex].count++;
        });
        return days;
    }, [events]);

    const maxDayCount = Math.max(...timeline.map(d => d.count), 1);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    const getEventSummary = (event) => {
        if (eventType === 'CME') return event.note?.substring(0, 60) || 'CME detected';
        if (eventType === 'FLR') return `Class ${event.classType || '?'} - ${event.sourceLocation || 'Unknown'}`;
        if (eventType === 'GST') return `Kp Index: ${event.allKpIndex?.[0]?.kpIndex || 'Unknown'}`;
        return 'Space weather event';
    };

    // If showing 3D visualization
    if (showSunViz) {
        return <SunVisualization events={events} onClose={() => setShowSunViz(false)} />;
    }

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">🌞 Space Weather Monitor</div>
            <div style={{ fontSize: '11px', marginBottom: '6px', opacity: 0.8 }}>
                DONKI Solar Events • {events.length} events
            </div>

            {/* 3D Visualization Button */}
            <button
                className="btn"
                onClick={() => setShowSunViz(true)}
                style={{
                    marginBottom: '8px',
                    fontSize: '11px',
                    background: '#fc6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                }}
            >
                ☀️ View 3D Sun & CME Activity
            </button>

            {/* Event Type Selector */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                {Object.entries(EVENT_INFO).map(([type, info]) => (
                    <button
                        key={type}
                        className={`btn ${eventType === type ? 'btn-default' : ''}`}
                        onClick={() => setEventType(type)}
                        style={{ fontSize: '10px', padding: '3px 6px' }}
                        title={info.desc}
                    >
                        {info.icon} {type}
                    </button>
                ))}
            </div>

            {/* 30-Day Activity Timeline */}
            <div style={{ marginBottom: '8px', padding: '6px', border: '1px solid var(--tertiary)' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    {EVENT_INFO[eventType].name} - Last 30 Days
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '24px', gap: '1px' }}>
                    {timeline.map((day) => (
                        <div
                            key={day.date}
                            title={`${day.date}: ${day.count} events`}
                            style={{
                                flex: 1,
                                background: day.count > 0 ? 'var(--secondary)' : 'var(--tertiary)',
                                height: day.count > 0 ? `${(day.count / maxDayCount) * 100}%` : '2px',
                                minHeight: '2px',
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>
                    <span>30d ago</span>
                    <span>Today</span>
                </div>
            </div>

            {/* Stats Summary */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', fontSize: '10px' }}>
                <div style={{ padding: '3px 6px', border: '1px solid var(--tertiary)' }}>
                    <strong>Total:</strong> {events.length}
                </div>
                <div style={{ padding: '3px 6px', border: '1px solid var(--tertiary)' }}>
                    <strong>Peak:</strong> {maxDayCount}/day
                </div>
                <div style={{ padding: '3px 6px', border: '1px solid var(--tertiary)' }}>
                    <strong>Avg:</strong> {(events.length / 30).toFixed(1)}/day
                </div>
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '11px', marginBottom: '6px' }}>{error}</div>}

            {/* Events List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading">Loading space weather data...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {events.map((event, idx) => (
                            <div
                                key={event.activityID || event.flrID || event.gstID || idx}
                                onClick={() => setSelectedEvent(event)}
                                style={{
                                    padding: '6px 8px',
                                    border: '1px solid var(--secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>{EVENT_INFO[eventType].icon}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: 'bold' }}>
                                        {formatDate(event.startTime || event.beginTime)}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                        {getEventSummary(event)}
                                    </div>
                                </div>
                            </div>
                        ))}
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
                            maxWidth: '450px', maxHeight: '70vh', overflow: 'auto', width: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            background: 'var(--secondary)', color: 'var(--primary)',
                            padding: '4px 8px', fontSize: '12px', fontWeight: 'bold',
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span>{EVENT_INFO[eventType].icon} {EVENT_INFO[eventType].name}</span>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'var(--primary)', color: 'var(--secondary)', border: '1px solid var(--primary)', padding: '0 6px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                        </div>

                        <div style={{ padding: '12px', fontSize: '12px', lineHeight: 1.5 }}>
                            <div style={{ marginBottom: '8px' }}><strong>Start:</strong> {formatDate(selectedEvent.startTime || selectedEvent.beginTime)}</div>
                            {selectedEvent.peakTime && <div style={{ marginBottom: '8px' }}><strong>Peak:</strong> {formatDate(selectedEvent.peakTime)}</div>}
                            {selectedEvent.endTime && <div style={{ marginBottom: '8px' }}><strong>End:</strong> {formatDate(selectedEvent.endTime)}</div>}
                            {selectedEvent.classType && <div style={{ marginBottom: '8px' }}><strong>Class:</strong> {selectedEvent.classType}</div>}
                            {selectedEvent.sourceLocation && <div style={{ marginBottom: '8px' }}><strong>Location:</strong> {selectedEvent.sourceLocation}</div>}
                            {selectedEvent.note && <div style={{ marginBottom: '8px' }}><strong>Notes:</strong> {selectedEvent.note}</div>}
                            {selectedEvent.link && (
                                <div style={{ marginBottom: '8px' }}>
                                    <a href={selectedEvent.link} target="_blank" rel="noopener noreferrer" style={{ color: '#00c' }}>View Full Details →</a>
                                </div>
                            )}
                            <button className="btn" onClick={() => setSelectedEvent(null)} style={{ width: '100%', marginTop: '8px' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

SpaceWeatherApp.propTypes = { windowId: PropTypes.string };
SpaceWeatherApp.defaultProps = { windowId: null };
