/**
 * NoaaScalesGauge.js
 * Visual gauge for NOAA R/S/G Space Weather Scales
 * Apple System 6 HIG styling
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getScaleSeverity } from '../../services/noaaSwpcApi';

/**
 * Single scale gauge (0-5) with enhanced visual effects
 */
function ScaleGauge({ type, label, value, description }) {
    const severity = getScaleSeverity(value, type);
    const isActive = severity.level > 0;
    const isCritical = severity.level >= 4;
    const isWarning = severity.level >= 2;

    // Determine glow class based on severity
    const getGlowClass = () => {
        if (isCritical) return 'animate-heartbeat';
        if (isWarning) return 'animate-pulse';
        if (isActive) return '';
        return '';
    };

    return (
        <div style={{
            flex: 1,
            padding: '6px',
            border: `1px solid ${isActive ? severity.color : 'var(--tertiary)'}`,
            textAlign: 'center',
            minWidth: '80px',
            background: isActive ? `rgba(${severity.level >= 3 ? '255,0,0' : severity.level >= 2 ? '255,153,0' : '255,255,0'}, 0.05)` : 'transparent',
            transition: 'all 0.3s ease',
        }}>
            {/* Label with live indicator for active scales */}
            <div style={{
                fontSize: 'var(--font-size-label)',
                fontWeight: 'bold',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
            }}>
                {isActive && (
                    <span
                        style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: severity.color,
                            boxShadow: `0 0 6px ${severity.color}`,
                        }}
                        className="animate-pulse"
                    />
                )}
                {label}
            </div>

            {/* Gauge visual with glow effect on active bars */}
            <div style={{
                display: 'flex',
                gap: '2px',
                justifyContent: 'center',
                marginBottom: '4px',
            }}>
                {[0, 1, 2, 3, 4, 5].map(level => {
                    const isLit = level <= severity.level && level > 0;
                    return (
                        <div
                            key={level}
                            style={{
                                width: '10px',
                                height: '16px',
                                background: isLit ? severity.color : '#ddd',
                                border: '1px solid var(--secondary)',
                                boxShadow: isLit ? `0 0 4px ${severity.color}` : 'none',
                                transition: 'all 0.3s ease',
                            }}
                            title={`${type}${level}`}
                        />
                    );
                })}
            </div>

            {/* Value with glow and animation */}
            <div
                className={getGlowClass()}
                style={{
                    fontSize: 'var(--font-size-body)',
                    fontWeight: 'bold',
                    color: severity.color,
                    textShadow: isActive ? `0 0 8px ${severity.color}` : 'none',
                }}
            >
                {severity.level > 0 ? `${type}${severity.level}` : '—'}
            </div>

            {/* Severity text */}
            <div style={{
                fontSize: 'var(--font-size-caption)',
                opacity: 0.8,
                fontWeight: isWarning ? 'bold' : 'normal',
            }}>
                {severity.text}
            </div>

            {/* Description */}
            <div style={{ fontSize: 'var(--font-size-chart)', opacity: 0.6, marginTop: '2px' }}>
                {description}
            </div>
        </div>
    );
}

ScaleGauge.propTypes = {
    type: PropTypes.oneOf(['R', 'S', 'G']).isRequired,
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
};

ScaleGauge.defaultProps = {
    value: 0,
    description: '',
};

/**
 * NOAA Scales Dashboard
 * Shows current R/S/G scales with forecasts
 */
export default function NoaaScalesGauge({ scales, loading }) {
    if (loading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-label)' }}>
                Loading NOAA scales...
            </div>
        );
    }

    if (!scales?.current) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-label)', opacity: 0.6 }}>
                NOAA scales unavailable
            </div>
        );
    }

    const { current, today } = scales;

    return (
        <div>
            {/* Current Conditions */}
            <div style={{
                fontSize: 'var(--font-size-label)',
                fontWeight: 'bold',
                marginBottom: '6px',
                padding: '2px 4px',
                background: 'var(--secondary)',
                color: 'var(--primary)',
            }}>
                📡 Current Space Weather Conditions
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <ScaleGauge
                    type="R"
                    label="Radio Blackouts"
                    value={current.R?.Scale}
                    description="HF propagation"
                />
                <ScaleGauge
                    type="S"
                    label="Solar Radiation"
                    value={current.S?.Scale}
                    description="Energetic particles"
                />
                <ScaleGauge
                    type="G"
                    label="Geomagnetic"
                    value={current.G?.Scale}
                    description="Aurora possible"
                />
            </div>

            {/* Today's Probabilities */}
            {today && (
                <div style={{
                    fontSize: 'var(--font-size-caption)',
                    padding: '4px',
                    border: '1px solid var(--tertiary)',
                    marginBottom: '4px',
                }}>
                    <strong>Today's Probabilities:</strong>
                    {today.R?.MinorProb && ` R1+ ${today.R.MinorProb}%`}
                    {today.R?.MajorProb && ` R3+ ${today.R.MajorProb}%`}
                    {today.S?.Prob && ` | S1+ ${today.S.Prob}%`}
                    {today.G?.Scale !== '0' && ` | G${today.G.Scale} expected`}
                </div>
            )}

            {/* Timestamp */}
            <div style={{ fontSize: 'var(--font-size-chart)', opacity: 0.5, textAlign: 'right' }}>
                Updated: {current.DateStamp} {current.TimeStamp} UTC
            </div>
        </div>
    );
}

NoaaScalesGauge.propTypes = {
    scales: PropTypes.shape({
        current: PropTypes.object,
        today: PropTypes.object,
        tomorrow: PropTypes.object,
    }),
    loading: PropTypes.bool,
};

NoaaScalesGauge.defaultProps = {
    scales: null,
    loading: false,
};
