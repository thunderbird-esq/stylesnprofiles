/**
 * SolarCycleDashboard.js
 * Solar Cycle 25 Progress and Predictions
 * Apple System 6 HIG styling
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    getSunspotReport,
    getPredictedSunspotNumber,
    get10cmFlux,
} from '../../services/noaaSwpcApi';

/**
 * Progress bar for cycle position
 */
function CycleProgress({ current, peak, cycleStart, peakDate }) {
    const progress = Math.min(100, (current / peak) * 100);

    return (
        <div style={{ padding: '8px', border: '1px solid var(--tertiary)' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
                ☀️ Solar Cycle 25 Progress
            </div>

            {/* Progress bar */}
            <div style={{
                height: '20px',
                background: 'var(--primary)',
                border: '2px solid var(--secondary)',
                position: 'relative',
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: `linear-gradient(90deg, #f90 0%, #f00 100%)`,
                    transition: 'width 0.5s ease',
                }} />

                {/* Current value marker */}
                <div style={{
                    position: 'absolute',
                    top: '-18px',
                    left: `${progress}%`,
                    transform: 'translateX(-50%)',
                    fontSize: '9px',
                    fontWeight: 'bold',
                }}>
                    {current?.toFixed(0) || '—'}
                </div>
            </div>

            {/* Labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '8px' }}>
                <span>{cycleStart || 'Dec 2019'}</span>
                <span style={{ fontWeight: 'bold' }}>Peak: {peak} ({peakDate || '2024-2025'})</span>
            </div>
        </div>
    );
}

CycleProgress.propTypes = {
    current: PropTypes.number,
    peak: PropTypes.number,
    cycleStart: PropTypes.string,
    peakDate: PropTypes.string,
};

/**
 * Mini chart for sunspot/flux trends
 */
function TrendChart({ data, valueKey, height = 50, color = '#f90', label }) {
    if (!data || data.length === 0) return null;

    const width = 260;
    const padding = 5;

    const values = data.map(d => parseFloat(d[valueKey]) || 0);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const points = values.map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((v - minVal) / range) * (height - 2 * padding);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <div style={{ border: '1px solid var(--tertiary)', padding: '6px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                {label}
            </div>
            <svg width={width} height={height} style={{ display: 'block' }}>
                <path d={points} fill="none" stroke={color} strokeWidth={1.5} />
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8px', opacity: 0.6 }}>
                <span>Min: {minVal.toFixed(0)}</span>
                <span>Current: {values[values.length - 1]?.toFixed(0)}</span>
                <span>Max: {maxVal.toFixed(0)}</span>
            </div>
        </div>
    );
}

TrendChart.propTypes = {
    data: PropTypes.array,
    valueKey: PropTypes.string.isRequired,
    height: PropTypes.number,
    color: PropTypes.string,
    label: PropTypes.string,
};

/**
 * Active regions summary
 */
function ActiveRegions({ sunspots }) {
    if (!sunspots || sunspots.length === 0) {
        return (
            <div style={{ padding: '8px', border: '1px solid var(--tertiary)', fontSize: '10px', textAlign: 'center' }}>
                No active sunspot regions
            </div>
        );
    }

    // Get unique regions by latest observation
    const uniqueRegions = {};
    sunspots.forEach(s => {
        if (!uniqueRegions[s.Region] || new Date(s.Obsdate) > new Date(uniqueRegions[s.Region].Obsdate)) {
            uniqueRegions[s.Region] = s;
        }
    });
    const regions = Object.values(uniqueRegions).slice(0, 8);

    return (
        <div style={{ border: '1px solid var(--tertiary)', padding: '6px' }}>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
                🔴 Active Sunspot Regions ({Object.keys(uniqueRegions).length})
            </div>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '4px',
                fontSize: '9px',
            }}>
                {regions.map((r, i) => (
                    <div key={i} style={{
                        padding: '4px',
                        background: 'var(--tertiary)',
                        textAlign: 'center',
                    }}>
                        <div style={{ fontWeight: 'bold' }}>AR{r.Region}</div>
                        <div style={{ fontSize: '8px', opacity: 0.7 }}>
                            {r.Numspot || '?'} spots
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

ActiveRegions.propTypes = {
    sunspots: PropTypes.array,
};

/**
 * Main Solar Cycle Dashboard Component
 */
export default function SolarCycleDashboard({ onError }) {
    const [sunspots, setSunspots] = useState([]);
    const [predictions, setPredictions] = useState([]);
    const [flux10cm, setFlux10cm] = useState([]);
    // const [cycle25, setCycle25] = useState([]); // Reserved for future use
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [spots, predicted, flux] = await Promise.all([
                getSunspotReport(),
                getPredictedSunspotNumber(),
                get10cmFlux(),
                // getSolarCycle25SSN().catch(() => []), // Removed as cycle25 is commented out
            ]);

            setSunspots(spots);
            setPredictions(predicted);
            setFlux10cm(flux);
            // setCycle25(c25); // Removed as cycle25 is commented out
        } catch (err) {
            console.error('Solar cycle error:', err);
            setError(err.message);
            onError?.(err.message);
        } finally {
            setLoading(false);
        }
    }, [onError]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Get current SSN from predictions (most recent)
    const currentSSN = predictions.length > 0
        ? parseFloat(predictions[predictions.length - 1]?.predicted_ssn || 0)
        : null;

    // Cycle 25 predicted peak
    const peakSSN = 180; // NOAA prediction
    const peakDate = '2024-2025';

    if (loading && sunspots.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading solar cycle data...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#c00' }}>
                Error: {error}
                <button onClick={fetchData} style={{ marginLeft: '8px' }}>Retry</button>
            </div>
        );
    }

    return (
        <div style={{ padding: '8px' }}>
            {/* Header */}
            <div style={{
                padding: '4px',
                marginBottom: '8px',
                background: 'var(--secondary)',
                fontSize: '10px',
                fontWeight: 'bold',
            }}>
                🌟 Solar Cycle 25 Dashboard
            </div>

            {/* Cycle Progress */}
            <CycleProgress
                current={currentSSN}
                peak={peakSSN}
                cycleStart="Dec 2019"
                peakDate={peakDate}
            />

            {/* F10.7 Trend */}
            <div style={{ marginTop: '8px' }}>
                <TrendChart
                    data={flux10cm}
                    valueKey="flux"
                    height={50}
                    color="#f90"
                    label="📻 10.7cm Radio Flux (30 days)"
                />
            </div>

            {/* Active Regions */}
            <div style={{ marginTop: '8px' }}>
                <ActiveRegions sunspots={sunspots} />
            </div>

            {/* Statistics */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginTop: '8px',
                fontSize: '9px',
            }}>
                <div style={{ flex: 1, padding: '6px', background: 'var(--tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentSSN?.toFixed(0) || '—'}</div>
                    <div>Current SSN</div>
                </div>
                <div style={{ flex: 1, padding: '6px', background: 'var(--tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{flux10cm[flux10cm.length - 1]?.flux?.toFixed(0) || '—'}</div>
                    <div>F10.7 Flux</div>
                </div>
                <div style={{ flex: 1, padding: '6px', background: 'var(--tertiary)', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{Object.keys(sunspots.reduce((acc, s) => { acc[s.Region] = true; return acc; }, {})).length}</div>
                    <div>Active Regions</div>
                </div>
            </div>

            {/* Refresh indicator */}
            <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'right', marginTop: '6px' }}>
                {loading ? 'Updating...' : `Last update: ${new Date().toLocaleTimeString()}`}
            </div>
        </div>
    );
}

SolarCycleDashboard.propTypes = {
    onError: PropTypes.func,
};

SolarCycleDashboard.defaultProps = {
    onError: null,
};
