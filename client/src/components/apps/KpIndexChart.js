/**
 * KpIndexChart.js
 * Bar chart showing 7-day Kp index history
 * Apple System 6 HIG styling with interactive tooltips
 */

import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Get color for Kp value
 */
function getKpColor(kp) {
    if (kp >= 7) return '#f0f'; // Extreme - magenta
    if (kp >= 6) return '#f00'; // Severe - red
    if (kp >= 5) return '#f90'; // Minor storm - orange
    if (kp >= 4) return '#cc0'; // Active - yellow
    if (kp >= 3) return '#8c8'; // Unsettled - light green
    return '#4a4'; // Quiet - green
}

/**
 * Get Kp description
 */
function getKpDescription(kp) {
    if (kp >= 9) return 'G5 Extreme Storm';
    if (kp >= 8) return 'G4 Severe Storm';
    if (kp >= 7) return 'G3 Strong Storm';
    if (kp >= 6) return 'G2 Moderate Storm';
    if (kp >= 5) return 'G1 Minor Storm';
    if (kp >= 4) return 'Active';
    if (kp >= 3) return 'Unsettled';
    return 'Quiet';
}

/**
 * Kp Index Bar Chart with storm thresholds
 */
export default function KpIndexChart({ data, loading, height = 120 }) {
    const [hoveredBar, setHoveredBar] = useState(null);

    // Group by day, take max Kp per 3-hour window
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return [];

        // Last 7 days, 8 readings per day (3-hour intervals)
        // Show last 56 readings max
        return data.slice(-56).map(reading => ({
            time: reading.time,
            kp: reading.kp,
            color: getKpColor(reading.kp),
        }));
    }, [data]);

    const maxKp = useMemo(() => {
        if (chartData.length === 0) return 9;
        return Math.max(...chartData.map(d => d.kp), 5);
    }, [chartData]);

    const currentKp = chartData.length > 0 ? chartData[chartData.length - 1].kp : 0;

    if (loading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-base)' }}>
                Loading Kp index...
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-base)', opacity: 0.6 }}>
                Kp data unavailable
            </div>
        );
    }

    // Storm threshold levels
    const thresholds = [
        { kp: 5, label: 'G1', color: '#f90' },
        { kp: 6, label: 'G2', color: '#f00' },
        { kp: 7, label: 'G3', color: '#f0f' },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                marginBottom: '6px',
                padding: '4px 6px',
                background: 'var(--secondary)',
                color: 'var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <span>📊 Planetary Kp Index (7 Days)</span>
                <span style={{ color: getKpColor(currentKp), background: '#fff', padding: '0 4px' }}>
                    Current: Kp {currentKp.toFixed(1)} - {getKpDescription(currentKp)}
                </span>
            </div>

            {/* Chart with threshold lines */}
            <div style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-end',
                height: `${height}px`,
                gap: '1px',
                padding: '4px',
                border: '1px solid var(--tertiary)',
                background: '#f8f8f8',
            }}>
                {/* Storm threshold lines */}
                {thresholds.map(t => (
                    <div
                        key={t.kp}
                        style={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            bottom: `${(t.kp / maxKp) * 100}%`,
                            borderTop: `2px dashed ${t.color}`,
                            opacity: 0.6,
                            pointerEvents: 'none',
                        }}
                    >
                        <span style={{
                            position: 'absolute',
                            right: '2px',
                            top: '-12px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            color: t.color,
                            background: '#f8f8f8',
                            padding: '0 2px',
                        }}>
                            {t.label}
                        </span>
                    </div>
                ))}

                {/* Bars */}
                {chartData.map((bar, idx) => (
                    <div
                        key={idx}
                        onMouseEnter={() => setHoveredBar(bar)}
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{
                            flex: 1,
                            height: `${(bar.kp / maxKp) * 100}%`,
                            minHeight: '3px',
                            background: bar.color,
                            border: bar.kp >= 5 ? '1px solid #000' : 'none',
                            cursor: 'pointer',
                            transition: 'transform 0.1s',
                            transform: hoveredBar === bar ? 'scaleY(1.05)' : 'none',
                        }}
                    />
                ))}
            </div>

            {/* Hover Tooltip */}
            {hoveredBar && (
                <div style={{
                    padding: '6px 10px',
                    background: 'var(--secondary)',
                    color: 'var(--primary)',
                    fontSize: 'var(--font-size-base)',
                    textAlign: 'center',
                    marginTop: '4px',
                }}>
                    <strong>{hoveredBar.time}</strong> | Kp: {hoveredBar.kp.toFixed(1)} | {getKpDescription(hoveredBar.kp)}
                </div>
            )}

            {/* Scale reference */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                opacity: 0.6,
                marginTop: '4px',
            }}>
                <span>7 days ago</span>
                <span>|</span>
                <span>Now</span>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '10px',
                fontSize: '10px',
                marginTop: '6px',
                flexWrap: 'wrap',
                justifyContent: 'center',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#4a4', border: '1px solid #333' }} /> Quiet
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#cc0', border: '1px solid #333' }} /> Active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#f90', border: '1px solid #333' }} /> G1 Storm
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '10px', height: '10px', background: '#f00', border: '1px solid #333' }} /> G2+ Storm
                </span>
            </div>
        </div>
    );
}

KpIndexChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        time: PropTypes.string,
        kp: PropTypes.number,
    })),
    loading: PropTypes.bool,
    height: PropTypes.number,
};

KpIndexChart.defaultProps = {
    data: [],
    loading: false,
    height: 80,
};
