/**
 * SolarWindCharts.js
 * Enhanced Solar Wind Visualization with IMF Bz and Dst
 * Apple System 6 HIG styling
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    getSolarWindMag,
    getSolarWindPlasma,
    getKyotoDst,
    getSolarWindSummary,
    getSolarWindMagSummary,
    getDstClassification,
} from '../../services/noaaSwpcApi';

// Time period options
const PERIODS = [
    { value: '2-hour', label: '2hr' },
    { value: '6-hour', label: '6hr' },
    { value: '1-day', label: '1d' },
    { value: '3-day', label: '3d' },
];

/**
 * Chart component for time series with background zones
 */
function TimeSeriesChart({
    data,
    yKey,
    height = 60,
    color = '#000',
    zones = [],
    yRange = null,
    unit = '',
    invertY = false,
}) {
    if (!data || data.length === 0) return null;

    const width = 280;
    const padding = { left: 30, right: 5, top: 5, bottom: 15 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => parseFloat(d[yKey]) || 0);
    const minVal = yRange ? yRange[0] : Math.min(...values);
    const maxVal = yRange ? yRange[1] : Math.max(...values);
    const range = maxVal - minVal || 1;

    const getY = (val) => {
        const normalized = (val - minVal) / range;
        return invertY
            ? padding.top + normalized * chartHeight
            : padding.top + chartHeight - normalized * chartHeight;
    };

    // Build path
    const points = values.map((v, i) => {
        const x = padding.left + (i / (values.length - 1)) * chartWidth;
        const y = getY(v);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Zero line for Bz
    const zeroY = getY(0);

    return (
        <svg width={width} height={height} style={{ display: 'block' }}>
            {/* Background zones */}
            {zones.map((zone, i) => {
                const y1 = getY(zone.from);
                const y2 = getY(zone.to);
                return (
                    <rect
                        key={i}
                        x={padding.left}
                        y={Math.min(y1, y2)}
                        width={chartWidth}
                        height={Math.abs(y2 - y1)}
                        fill={zone.color}
                        opacity={0.2}
                    />
                );
            })}

            {/* Zero line */}
            {minVal < 0 && maxVal > 0 && (
                <line
                    x1={padding.left}
                    y1={zeroY}
                    x2={width - padding.right}
                    y2={zeroY}
                    stroke="#666"
                    strokeWidth={1}
                    strokeDasharray="2,2"
                />
            )}

            {/* Data line */}
            <path d={points} fill="none" stroke={color} strokeWidth={1.5} />

            {/* Y-axis labels */}
            <text x={padding.left - 3} y={padding.top + 8} fontSize="8" textAnchor="end">
                {maxVal.toFixed(0)}{unit}
            </text>
            <text x={padding.left - 3} y={height - padding.bottom} fontSize="8" textAnchor="end">
                {minVal.toFixed(0)}{unit}
            </text>

            {/* Current value badge */}
            <rect
                x={width - 45}
                y={2}
                width={42}
                height={14}
                fill={color}
                rx={2}
            />
            <text x={width - 24} y={12} fontSize="9" fill="#fff" textAnchor="middle" fontWeight="bold">
                {values[values.length - 1]?.toFixed(1)}{unit}
            </text>
        </svg>
    );
}

TimeSeriesChart.propTypes = {
    data: PropTypes.array,
    yKey: PropTypes.string.isRequired,
    height: PropTypes.number,
    color: PropTypes.string,
    zones: PropTypes.array,
    yRange: PropTypes.array,
    unit: PropTypes.string,
    invertY: PropTypes.bool,
};

/**
 * Current conditions summary badges
 */
function ConditionsBadge({ label, value, unit, severity }) {
    return (
        <div style={{
            flex: 1,
            padding: '6px',
            textAlign: 'center',
            background: severity?.color || 'var(--tertiary)',
            color: severity?.color ? '#fff' : 'inherit',
        }}>
            <div style={{ fontSize: '9px', opacity: 0.9 }}>{label}</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                {value}{unit}
            </div>
            {severity?.text && (
                <div style={{ fontSize: '8px' }}>{severity.text}</div>
            )}
        </div>
    );
}

ConditionsBadge.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    unit: PropTypes.string,
    severity: PropTypes.object, // Optional
};

/**
 * Main Solar Wind Charts Component
 */
export default function SolarWindCharts({ onError }) {
    const [period, setPeriod] = useState('1-day');
    const [magData, setMagData] = useState([]);
    const [plasmaData, setPlasmaData] = useState([]);
    const [dstData, setDstData] = useState([]);
    const [summary, setSummary] = useState({ speed: null, bz: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [mag, plasma, dst, speedSum, bzSum] = await Promise.all([
                getSolarWindMag(period),
                getSolarWindPlasma(period),
                getKyotoDst(),
                getSolarWindSummary().catch(() => null),
                getSolarWindMagSummary().catch(() => null),
            ]);

            setMagData(mag.slice(-200));
            setPlasmaData(plasma.slice(-200));
            setDstData(dst.slice(-100));
            setSummary({
                speed: speedSum?.WindSpeed || plasma[plasma.length - 1]?.speed,
                bz: bzSum?.Bz || mag[mag.length - 1]?.bz,
            });
        } catch (err) {
            console.error('Solar wind error:', err);
            setError(err.message);
            onError?.(err.message);
        } finally {
            setLoading(false);
        }
    }, [period, onError]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Bz zones (southward = geomagnetic storm likely)
    const bzZones = useMemo(() => [
        { from: -50, to: -10, color: '#f00' }, // Strong southward
        { from: -10, to: 0, color: '#f90' },   // Moderate southward
        { from: 0, to: 50, color: '#4a4' },    // Northward (quiet)
    ], []);

    // Dst classification for current value
    const currentDst = dstData[dstData.length - 1]?.dst;
    const dstSeverity = currentDst !== undefined ? getDstClassification(currentDst) : null;

    if (loading && magData.length === 0) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading solar wind data...
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
            {/* Header with period selector */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '4px',
                background: 'var(--secondary)',
            }}>
                <span style={{ fontSize: '10px', fontWeight: 'bold' }}>🌬️ Solar Wind</span>
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

            {/* Current Conditions Badges */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <ConditionsBadge
                    label="Speed"
                    value={summary.speed?.toFixed(0) || '—'}
                    unit=" km/s"
                />
                <ConditionsBadge
                    label="Bz"
                    value={summary.bz?.toFixed(1) || '—'}
                    unit=" nT"
                    severity={summary.bz < -10 ? { color: '#f00', text: '⚠️ Southward' } :
                        summary.bz < 0 ? { color: '#f90', text: 'Slightly South' } : null}
                />
                <ConditionsBadge
                    label="Dst"
                    value={currentDst?.toFixed(0) || '—'}
                    unit=" nT"
                    severity={dstSeverity}
                />
            </div>

            {/* IMF Bz Chart */}
            <div style={{ border: '1px solid var(--tertiary)', padding: '6px', marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    🧲 IMF Bz (Interplanetary Magnetic Field)
                </div>
                <TimeSeriesChart
                    data={magData}
                    yKey="bz"
                    height={70}
                    color="#00f"
                    zones={bzZones}
                    yRange={[-20, 20]}
                    unit="nT"
                />
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    Southward (negative) Bz → Geomagnetic storms likely
                </div>
            </div>

            {/* Solar Wind Speed Chart */}
            <div style={{ border: '1px solid var(--tertiary)', padding: '6px', marginBottom: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    💨 Solar Wind Speed
                </div>
                <TimeSeriesChart
                    data={plasmaData}
                    yKey="speed"
                    height={60}
                    color="#f60"
                    unit="km/s"
                />
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    Normal: 300-500 km/s | High-speed stream: &gt;600 km/s
                </div>
            </div>

            {/* Dst Index Chart */}
            <div style={{ border: '1px solid var(--tertiary)', padding: '6px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    🌍 Dst Index (Storm Intensity)
                </div>
                <TimeSeriesChart
                    data={dstData}
                    yKey="dst"
                    height={60}
                    color="#800"
                    yRange={[-200, 50]}
                    unit="nT"
                    invertY={true}
                />
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    Quiet: &gt;-30 | Moderate: -50 to -100 | Intense: &lt;-100 nT
                </div>
            </div>

            {/* Refresh indicator */}
            <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'right', marginTop: '6px' }}>
                {loading ? 'Updating...' : `Last update: ${new Date().toLocaleTimeString()}`}
            </div>
        </div>
    );
}

SolarWindCharts.propTypes = {
    onError: PropTypes.func,
};

SolarWindCharts.defaultProps = {
    onError: null,
};
