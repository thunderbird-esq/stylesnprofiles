/**
 * GoesDataPanel.js
 * GOES Satellite Data Visualization
 * Displays X-ray flux, proton/electron storms, and magnetometer data
 * Apple System 6 HIG styling
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    getGoesXrays,
    getGoesXrayFlares,
    getGoesXrayFlaresLatest,
    getGoesProtons,
    getGoesElectrons,
    getFlareClass,
} from '../../services/noaaSwpcApi';

// Time period options
const PERIODS = [
    { value: '6-hour', label: '6hr' },
    { value: '1-day', label: '1d' },
    { value: '3-day', label: '3d' },
    { value: '7-day', label: '7d' },
];

/**
 * Mini sparkline chart for time series data
 */
function Sparkline({ data, height = 40, color = '#000', logScale = false, thresholds = [] }) {
    if (!data || data.length === 0) return null;

    const width = 200;
    const padding = 2;

    // Filter valid values
    const values = data.map(d => d.flux || d.value || 0).filter(v => v > 0);
    if (values.length === 0) return null;

    // Calculate bounds (log scale for X-rays)
    let minVal, maxVal;
    if (logScale) {
        minVal = Math.log10(Math.min(...values));
        maxVal = Math.log10(Math.max(...values));
    } else {
        minVal = Math.min(...values);
        maxVal = Math.max(...values);
    }

    const range = maxVal - minVal || 1;

    // Build path
    const points = values.map((v, i) => {
        const x = padding + (i / (values.length - 1)) * (width - 2 * padding);
        const normalized = logScale ? Math.log10(v) : v;
        const y = height - padding - ((normalized - minVal) / range) * (height - 2 * padding);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {/* Threshold lines */}
            {thresholds.map((t, i) => {
                const normalized = logScale ? Math.log10(t.value) : t.value;
                const y = height - padding - ((normalized - minVal) / range) * (height - 2 * padding);
                if (y < 0 || y > height) return null;
                return (
                    <line
                        key={i}
                        x1={0}
                        y1={y}
                        x2={width}
                        y2={y}
                        stroke={t.color}
                        strokeWidth={1}
                        strokeDasharray="2,2"
                        opacity={0.7}
                    />
                );
            })}
            {/* Data line */}
            <path d={points} fill="none" stroke={color} strokeWidth={1.5} />
        </svg>
    );
}

Sparkline.propTypes = {
    data: PropTypes.array,
    height: PropTypes.number,
    color: PropTypes.string,
    logScale: PropTypes.bool,
    thresholds: PropTypes.array,
};

/**
 * Latest flare display badge
 */
function FlareBadge({ flare }) {
    if (!flare) {
        return (
            <div style={{
                padding: '4px 8px',
                background: 'var(--tertiary)',
                fontSize: '10px',
                textAlign: 'center',
            }}>
                No recent flares
            </div>
        );
    }

    const flareInfo = getFlareClass(flare.max_class ? parseFloat(flare.max_class.slice(1)) *
        (flare.max_class[0] === 'X' ? 1e-4 : flare.max_class[0] === 'M' ? 1e-5 : 1e-6) : 0);

    return (
        <div style={{
            padding: '6px 10px',
            background: flareInfo.color,
            color: '#fff',
            fontSize: '11px',
            textAlign: 'center',
            fontWeight: 'bold',
        }}>
            Latest: {flare.max_class || 'Unknown'} @ {flare.max_time?.split('T')[1]?.slice(0, 5) || 'N/A'} UTC
        </div>
    );
}

FlareBadge.propTypes = {
    flare: PropTypes.object,
};

/**
 * Main GOES Data Panel Component
 */
export default function GoesDataPanel({ onError }) {
    const [period, setPeriod] = useState('1-day');
    const [xrayData, setXrayData] = useState([]);
    const [protonData, setProtonData] = useState([]);
    const [electronData, setElectronData] = useState([]);
    const [latestFlare, setLatestFlare] = useState(null);
    const [flareHistory, setFlareHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [xrays, protons, electrons, flareLatest, flares] = await Promise.all([
                getGoesXrays(period),
                getGoesProtons(period),
                getGoesElectrons(period),
                getGoesXrayFlaresLatest(),
                getGoesXrayFlares(),
            ]);

            // Process X-ray data (extract flux values)
            setXrayData(xrays.slice(-200).map(d => ({
                time: d.time_tag,
                flux: parseFloat(d.flux) || 0,
            })));

            // Process proton data
            setProtonData(protons.slice(-200).map(d => ({
                time: d.time_tag,
                value: parseFloat(d.flux) || 0,
            })));

            // Process electron data
            setElectronData(electrons.slice(-200).map(d => ({
                time: d.time_tag,
                value: parseFloat(d.flux) || 0,
            })));

            setLatestFlare(flareLatest);
            setFlareHistory(flares.slice(0, 10));
        } catch (err) {
            console.error('GOES data error:', err);
            setError(err.message);
            onError?.(err.message);
        } finally {
            setLoading(false);
        }
    }, [period, onError]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [fetchData]);

    // X-ray thresholds (C, M, X class boundaries)
    const xrayThresholds = useMemo(() => [
        { value: 1e-6, color: '#f90', label: 'C' },
        { value: 1e-5, color: '#f00', label: 'M' },
        { value: 1e-4, color: '#f0f', label: 'X' },
    ], []);

    if (loading && xrayData.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading GOES satellite data...
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', color: '#c00' }}>
                Error: {error}
                <button onClick={fetchData} style={{ marginLeft: '8px' }}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '8px' }}>
            {/* Period Selector */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '4px',
                background: 'var(--secondary)',
            }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>📡 GOES Satellite</span>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {PERIODS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value)}
                            className={period === p.value ? 'btn btn-active' : 'btn'}
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Latest Flare Badge */}
            <FlareBadge flare={latestFlare} />

            {/* X-ray Flux Chart */}
            <div style={{ marginTop: '8px', border: '1px solid var(--tertiary)', padding: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    ☀️ X-ray Flux (W/m²)
                </div>
                <Sparkline
                    data={xrayData}
                    height={50}
                    color="#f90"
                    logScale={true}
                    thresholds={xrayThresholds}
                />
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    C-class (yellow) | M-class (red) | X-class (magenta)
                </div>
            </div>

            {/* Proton Flux Chart */}
            <div style={{ marginTop: '6px', border: '1px solid var(--tertiary)', padding: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚡ Proton Flux (pfu)
                </div>
                <Sparkline
                    data={protonData}
                    height={40}
                    color="#00f"
                    logScale={true}
                />
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    &gt;10 MeV protons | S1+ storm if &gt;10 pfu
                </div>
            </div>

            {/* Electron Flux Chart */}
            <div style={{ marginTop: '6px', border: '1px solid var(--tertiary)', padding: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚛️ Electron Flux
                </div>
                <Sparkline
                    data={electronData}
                    height={40}
                    color="#080"
                    logScale={true}
                />
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    &gt;2 MeV electrons | Satellite charging hazard
                </div>
            </div>

            {/* Recent Flares List */}
            {flareHistory.length > 0 && (
                <div style={{ marginTop: '8px', border: '1px solid var(--tertiary)', padding: '6px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                        🔥 Recent Flares (7 days)
                    </div>
                    <div style={{ maxHeight: '80px', overflowY: 'auto', fontSize: '9px' }}>
                        {flareHistory.map((f, i) => (
                            <div key={i} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '2px 0',
                                borderBottom: '1px dotted var(--tertiary)',
                            }}>
                                <span style={{
                                    fontWeight: 'bold', color:
                                        f.max_class?.startsWith('X') ? '#f0f' :
                                            f.max_class?.startsWith('M') ? '#f00' : '#f90'
                                }}>
                                    {f.max_class}
                                </span>
                                <span>{f.begin_time?.split('T')[0]}</span>
                                <span>{f.begin_time?.split('T')[1]?.slice(0, 5)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Data freshness indicator */}
            <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'right', marginTop: '6px' }}>
                {loading ? 'Updating...' : `Last update: ${new Date().toLocaleTimeString()}`}
            </div>
        </div>
    );
}

GoesDataPanel.propTypes = {
    onError: PropTypes.func,
};

GoesDataPanel.defaultProps = {
    onError: null,
};
