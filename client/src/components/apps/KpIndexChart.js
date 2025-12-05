/**
 * KpIndexChart.js
 * Bar chart showing 7-day Kp index history
 * Apple System 6 HIG styling
 */

import React, { useMemo } from 'react';
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
 * Kp Index Bar Chart
 */
export default function KpIndexChart({ data, loading, height = 80 }) {
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
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading Kp index...
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', opacity: 0.6 }}>
                Kp data unavailable
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                fontSize: '10px',
                fontWeight: 'bold',
                marginBottom: '6px',
                padding: '2px 4px',
                background: 'var(--secondary)',
                color: 'var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <span>📊 Planetary Kp Index (7 Days)</span>
                <span style={{ color: getKpColor(currentKp) }}>
                    Current: Kp {currentKp.toFixed(1)}
                </span>
            </div>

            {/* Chart */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                height: `${height}px`,
                gap: '1px',
                padding: '4px',
                border: '1px solid var(--tertiary)',
                background: '#f8f8f8',
            }}>
                {chartData.map((bar, idx) => (
                    <div
                        key={idx}
                        title={`${bar.time}\nKp: ${bar.kp.toFixed(1)}\n${getKpDescription(bar.kp)}`}
                        style={{
                            flex: 1,
                            height: `${(bar.kp / maxKp) * 100}%`,
                            minHeight: '2px',
                            background: bar.color,
                            border: bar.kp >= 5 ? '1px solid #000' : 'none',
                        }}
                    />
                ))}
            </div>

            {/* Scale reference */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '8px',
                opacity: 0.6,
                marginTop: '2px',
            }}>
                <span>7 days ago</span>
                <span>|</span>
                <span>Now</span>
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '8px',
                fontSize: '8px',
                marginTop: '4px',
                flexWrap: 'wrap',
            }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#4a4' }} /> Quiet
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#cc0' }} /> Active
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#f90' }} /> G1 Storm
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span style={{ width: '8px', height: '8px', background: '#f00' }} /> G2+ Storm
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
