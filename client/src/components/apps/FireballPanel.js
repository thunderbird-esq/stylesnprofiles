/**
 * FireballPanel.js
 * Displays recent fireball/bolide events (meteoroid impacts)
 * Shows on a world map with energy visualization
 * Apple System 6 HIG styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getFireballEvents } from '../../services/nasaApi';

/**
 * Convert latitude/longitude to map position (Mercator projection)
 */
const coordToPos = (lat, latDir, lon, lonDir, width, height) => {
    const latNum = parseFloat(lat) * (latDir === 'S' ? -1 : 1);
    const lonNum = parseFloat(lon) * (lonDir === 'W' ? -1 : 1);

    const x = ((lonNum + 180) / 360) * width;
    const y = ((90 - latNum) / 180) * height;

    return { x, y };
};

/**
 * Get energy color (green to red scale)
 */
const getEnergyColor = (energy) => {
    const e = parseFloat(energy) || 0;
    if (e >= 10) return '#ff0000'; // Major event
    if (e >= 1) return '#ff6600';
    if (e >= 0.1) return '#ff9900';
    return '#ffcc00';
};

/**
 * Get size based on energy (0.1 kt = small, 10+ kt = large)
 */
const getMarkerSize = (energy) => {
    const e = parseFloat(energy) || 0.1;
    return Math.max(4, Math.min(16, Math.log10(e + 1) * 8 + 6));
};

/**
 * Format date for display
 */
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr.replace(' ', 'T') + 'Z');
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

/**
 * FireballPanel Component
 */
export default function FireballPanel({ embedded = false }) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [mapWidth] = useState(320);
    const [mapHeight] = useState(160);

    const fetchFireballs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getFireballEvents({ limit: 30 });
            const evts = response.data?.events || [];
            setEvents(evts);
            if (evts.length === 0) {
                setError('No fireball events found.');
            }
        } catch (err) {
            console.error('Fireball fetch error:', err);
            setError('Failed to load fireball data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchFireballs();
    }, [fetchFireballs]);

    // Stats
    const totalEnergy = events.reduce((sum, e) => sum + (parseFloat(e.energy) || 0), 0);
    const largestEvent = events.reduce((max, e) =>
        (parseFloat(e.energy) || 0) > (parseFloat(max?.energy) || 0) ? e : max, events[0]);

    if (loading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-lg)' }}>
                <span className="animate-pulse">☄️ Loading fireball data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-lg)', color: '#c00' }}>
                {error}
                <button className="btn" onClick={fetchFireballs} style={{ marginLeft: '8px' }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{
            padding: embedded ? '0' : '8px',
            border: embedded ? 'none' : '1px solid var(--secondary)',
        }}>
            {/* Header */}
            <div style={{
                padding: '4px 8px',
                background: 'var(--secondary)',
                color: 'var(--primary)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'bold',
                marginBottom: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span>
                    <span className="animate-pulse" style={{ marginRight: '6px' }}>🔥</span>
                    Fireball Events ({events.length})
                </span>
                <button
                    className="btn"
                    onClick={fetchFireballs}
                    style={{ fontSize: 'var(--font-size-base)', padding: '1px 6px' }}
                >
                    🔄
                </button>
            </div>

            {/* Stats Row */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '4px',
                marginBottom: '8px',
                fontSize: 'var(--font-size-base)',
            }}>
                <div style={{
                    padding: '4px',
                    border: '1px solid var(--tertiary)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)' }}>
                        {events.length}
                    </div>
                    <div style={{ opacity: 0.7 }}>Events</div>
                </div>
                <div style={{
                    padding: '4px',
                    border: '1px solid var(--tertiary)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', color: '#f60' }}>
                        {totalEnergy.toFixed(1)} kt
                    </div>
                    <div style={{ opacity: 0.7 }}>Total Energy</div>
                </div>
                <div style={{
                    padding: '4px',
                    border: '1px solid var(--tertiary)',
                    textAlign: 'center',
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: 'var(--font-size-lg)', color: '#f00' }}>
                        {parseFloat(largestEvent?.energy || 0).toFixed(1)} kt
                    </div>
                    <div style={{ opacity: 0.7 }}>Largest</div>
                </div>
            </div>

            {/* World Map */}
            <div style={{
                position: 'relative',
                width: `${mapWidth}px`,
                height: `${mapHeight}px`,
                border: '1px solid var(--secondary)',
                background: '#001a33',
                marginBottom: '8px',
                overflow: 'hidden',
            }}>
                {/* Simple world outline */}
                <svg width={mapWidth} height={mapHeight} style={{ position: 'absolute' }}>
                    {/* Grid lines */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330, 360].map(lon => (
                        <line
                            key={`lon-${lon}`}
                            x1={(lon / 360) * mapWidth}
                            y1="0"
                            x2={(lon / 360) * mapWidth}
                            y2={mapHeight}
                            stroke="#113355"
                            strokeWidth="0.5"
                        />
                    ))}
                    {[0, 30, 60, 90, 120, 150, 180].map(lat => (
                        <line
                            key={`lat-${lat}`}
                            x1="0"
                            y1={(lat / 180) * mapHeight}
                            x2={mapWidth}
                            y2={(lat / 180) * mapHeight}
                            stroke="#113355"
                            strokeWidth="0.5"
                        />
                    ))}
                    {/* Equator */}
                    <line x1="0" y1={mapHeight / 2} x2={mapWidth} y2={mapHeight / 2} stroke="#336699" strokeWidth="1" />
                </svg>

                {/* Fireball markers */}
                {events.map((event, idx) => {
                    if (!event.lat || !event.lon) return null;
                    const pos = coordToPos(event.lat, event['lat-dir'], event.lon, event['lon-dir'], mapWidth, mapHeight);
                    const color = getEnergyColor(event.energy);
                    const size = getMarkerSize(event.energy);

                    return (
                        <div
                            key={idx}
                            onClick={() => setSelectedEvent(selectedEvent === event ? null : event)}
                            style={{
                                position: 'absolute',
                                left: `${pos.x}px`,
                                top: `${pos.y}px`,
                                width: `${size}px`,
                                height: `${size}px`,
                                borderRadius: '50%',
                                background: color,
                                border: selectedEvent === event ? '2px solid #fff' : '1px solid #000',
                                boxShadow: `0 0 ${size}px ${color}`,
                                cursor: 'pointer',
                                transform: 'translate(-50%, -50%)',
                                zIndex: selectedEvent === event ? 10 : 1,
                            }}
                            className="animate-pulse"
                            title={`${formatDate(event.date)} - ${event.energy || '?'} kt`}
                        />
                    );
                })}
            </div>

            {/* Selected Event Details */}
            {selectedEvent && (
                <div style={{
                    padding: '8px',
                    border: '1px solid var(--secondary)',
                    background: 'rgba(255,102,0,0.1)',
                    marginBottom: '8px',
                    fontSize: 'var(--font-size-base)',
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        ☄️ {formatDate(selectedEvent.date)}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                        <div>Energy: <strong style={{ color: '#f60' }}>{selectedEvent.energy || '?'} kt</strong></div>
                        <div>Impact: <strong>{selectedEvent['impact-e'] || '?'} kt</strong></div>
                        <div>Altitude: {selectedEvent.alt || '?'} km</div>
                        <div>Velocity: {selectedEvent.vel || '?'} km/s</div>
                        <div style={{ gridColumn: 'span 2' }}>
                            Location: {selectedEvent.lat}°{selectedEvent['lat-dir']}, {selectedEvent.lon}°{selectedEvent['lon-dir']}
                        </div>
                    </div>
                </div>
            )}

            {/* Event List */}
            <div style={{
                maxHeight: embedded ? '150px' : '200px',
                overflow: 'auto',
                border: '1px solid var(--tertiary)',
            }}>
                {events.slice(0, 10).map((event, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSelectedEvent(event)}
                        className="interactive-card"
                        style={{
                            padding: '4px 8px',
                            borderBottom: '1px solid var(--tertiary)',
                            cursor: 'pointer',
                            background: selectedEvent === event ? 'rgba(255,102,0,0.2)' : 'transparent',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: 'var(--font-size-base)',
                        }}
                    >
                        <div>
                            <span style={{ color: getEnergyColor(event.energy), marginRight: '4px' }}>●</span>
                            {formatDate(event.date)}
                        </div>
                        <div style={{
                            fontWeight: 'bold',
                            color: getEnergyColor(event.energy),
                        }}>
                            {parseFloat(event.energy || 0).toFixed(2)} kt
                        </div>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div style={{
                marginTop: '6px',
                fontSize: 'var(--font-size-caption)',
                display: 'flex',
                justifyContent: 'space-between',
                opacity: 0.7,
            }}>
                <span>🟡 &lt;0.1kt</span>
                <span>🟠 0.1-1kt</span>
                <span>🔴 1-10kt</span>
                <span>⭕ &gt;10kt</span>
            </div>
        </div>
    );
}

FireballPanel.propTypes = {
    embedded: PropTypes.bool,
};

FireballPanel.defaultProps = {
    embedded: false,
};
