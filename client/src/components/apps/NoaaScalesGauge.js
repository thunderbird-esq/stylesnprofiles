/**
 * NoaaScalesGauge.js
 * Visual gauge for NOAA R/S/G Space Weather Scales
 * Apple System 6 HIG styling
 */

import React from 'react';
import PropTypes from 'prop-types';
import { getScaleSeverity } from '../../services/noaaSwpcApi';

/**
 * Single scale gauge (0-5)
 */
function ScaleGauge({ type, label, value, description }) {
    const severity = getScaleSeverity(value, type);

    return (
        <div style={{
            flex: 1,
            padding: '6px',
            border: '1px solid var(--tertiary)',
            textAlign: 'center',
            minWidth: '80px',
        }}>
            {/* Label */}
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                {label}
            </div>

            {/* Gauge visual */}
            <div style={{
                display: 'flex',
                gap: '2px',
                justifyContent: 'center',
                marginBottom: '4px',
            }}>
                {[0, 1, 2, 3, 4, 5].map(level => (
                    <div
                        key={level}
                        style={{
                            width: '10px',
                            height: '16px',
                            background: level <= severity.level ? severity.color : '#ddd',
                            border: '1px solid var(--secondary)',
                        }}
                        title={`${type}${level}`}
                    />
                ))}
            </div>

            {/* Value */}
            <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: severity.color,
            }}>
                {severity.level > 0 ? `${type}${severity.level}` : '—'}
            </div>

            {/* Severity text */}
            <div style={{ fontSize: '9px', opacity: 0.8 }}>
                {severity.text}
            </div>

            {/* Description */}
            <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
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
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading NOAA scales...
            </div>
        );
    }

    if (!scales?.current) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px', opacity: 0.6 }}>
                NOAA scales unavailable
            </div>
        );
    }

    const { current, today } = scales;

    return (
        <div>
            {/* Current Conditions */}
            <div style={{
                fontSize: '10px',
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
                    fontSize: '9px',
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
            <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'right' }}>
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
