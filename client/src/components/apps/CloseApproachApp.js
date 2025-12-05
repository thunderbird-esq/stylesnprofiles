import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getCloseApproaches } from '../../services/nasaApi';

/**
 * Close Approach Tracker - SSD/CNEOS API
 * @component
 */
export default function CloseApproachApp({ windowId: _windowId }) {
    const [approaches, setApproaches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedApproach, setSelectedApproach] = useState(null);
    const [distMax, setDistMax] = useState(0.1); // Default 0.1 AU

    const getDateRange = () => {
        const today = new Date();
        const future = new Date();
        future.setDate(future.getDate() + 60); // Next 60 days
        return {
            dateMin: today.toISOString().split('T')[0],
            dateMax: future.toISOString().split('T')[0],
        };
    };

    const fetchApproaches = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { dateMin, dateMax } = getDateRange();
            const response = await getCloseApproaches({ dateMin, dateMax, distMax });

            const data = response.data?.data || [];
            const fields = response.data?.fields || [];

            // Convert array data to objects
            const parsed = data.map(row => {
                const obj = {};
                fields.forEach((field, idx) => {
                    obj[field] = row[idx];
                });
                return obj;
            });

            // Sort by date
            parsed.sort((a, b) => new Date(a.cd).getTime() - new Date(b.cd).getTime());

            setApproaches(parsed.slice(0, 100)); // Limit to 100
            if (parsed.length === 0) {
                setError('No close approaches found in this range.');
            }
        } catch (err) {
            console.error('Close approach fetch error:', err);
            setError('Failed to load close approach data');
        } finally {
            setLoading(false);
        }
    }, [distMax]);

    useEffect(() => {
        fetchApproaches();
    }, [fetchApproaches]);

    const formatDistance = (distAU) => {
        const au = parseFloat(distAU);
        if (isNaN(au)) return 'Unknown';
        const km = au * 149597870.7;
        if (km > 1000000) return `${(km / 1000000).toFixed(2)} million km`;
        return `${km.toFixed(0).toLocaleString()} km`;
    };

    const formatVelocity = (v) => {
        const vel = parseFloat(v);
        if (isNaN(vel)) return 'Unknown';
        return `${vel.toFixed(2)} km/s`;
    };

    const getThreatLevel = (distAU) => {
        const dist = parseFloat(distAU);
        if (dist < 0.01) return { label: 'Very Close', color: '#f44336', icon: '🔴' };
        if (dist < 0.02) return { label: 'Close', color: '#ff9800', icon: '🟠' };
        if (dist < 0.05) return { label: 'Nearby', color: '#ffc107', icon: '🟡' };
        return { label: 'Distant', color: '#4caf50', icon: '🟢' };
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>☄️ Close Approach Tracker</div>
            <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8 }}>
                Asteroid flybys from JPL SSD/CNEOS
            </div>

            {/* Distance Filter */}
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <label style={{ fontSize: '16px' }}>Max Distance:</label>
                <select
                    value={distMax}
                    onChange={(e) => setDistMax(parseFloat(e.target.value))}
                    style={{ fontSize: '16px', padding: '6px' }}
                >
                    <option value="0.01">0.01 AU (~1.5M km)</option>
                    <option value="0.05">0.05 AU (~7.5M km)</option>
                    <option value="0.1">0.1 AU (~15M km)</option>
                    <option value="0.2">0.2 AU (~30M km)</option>
                </select>
            </div>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>}

            {/* Approaches List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px' }}>Scanning for asteroids...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {approaches.map((approach, idx) => {
                            const threat = getThreatLevel(approach.dist);
                            return (
                                <div
                                    key={`${approach.des}-${idx}`}
                                    onClick={() => setSelectedApproach(approach)}
                                    style={{
                                        padding: '12px',
                                        border: `2px solid ${threat.color}`,
                                        background: 'var(--primary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                    }}
                                >
                                    <span style={{ fontSize: '28px' }}>{threat.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                                            {approach.des}
                                        </div>
                                        <div style={{ fontSize: '15px', opacity: 0.8 }}>
                                            {approach.cd} • {formatDistance(approach.dist)}
                                        </div>
                                    </div>
                                    <div style={{
                                        padding: '4px 10px',
                                        background: threat.color,
                                        color: 'white',
                                        borderRadius: '12px',
                                        fontSize: '14px',
                                    }}>
                                        {threat.label}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selectedApproach && (
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
                    onClick={() => setSelectedApproach(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            padding: '20px',
                            border: `3px solid ${getThreatLevel(selectedApproach.dist).color}`,
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ fontSize: '72px' }}>☄️</div>
                            <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>{selectedApproach.des}</h3>
                        </div>

                        <div style={{ fontSize: '16px', lineHeight: 1.8 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <strong>📅 Date:</strong>
                                    <div>{selectedApproach.cd}</div>
                                </div>
                                <div>
                                    <strong>📏 Distance:</strong>
                                    <div>{formatDistance(selectedApproach.dist)}</div>
                                </div>
                                <div>
                                    <strong>⚡ Velocity:</strong>
                                    <div>{formatVelocity(selectedApproach.v_rel)}</div>
                                </div>
                                <div>
                                    <strong>💫 Absolute Mag:</strong>
                                    <div>{selectedApproach.h || 'Unknown'}</div>
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <strong>📊 Distance Range:</strong>
                                    <div>{formatDistance(selectedApproach.dist_min)} - {formatDistance(selectedApproach.dist_max)}</div>
                                </div>
                            </div>
                        </div>

                        <button className="btn" onClick={() => setSelectedApproach(null)} style={{ marginTop: '16px', fontSize: '16px', width: '100%' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

CloseApproachApp.propTypes = {
    windowId: PropTypes.string,
};

CloseApproachApp.defaultProps = {
    windowId: null,
};
