/**
 * NeoDetailPanel.js
 * Detail view for a Near Earth Object showing full orbital data and close approach info
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import NeoOrbitViewer from './NeoOrbitViewer';
import { CountdownTimer } from '../shared/DataVisuals';

/**
 * Format a number with thousands separators
 */
const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return Number(num).toLocaleString();
};

/**
 * Get size comparison to familiar objects
 */
const getSizeComparison = (meters) => {
    if (!meters) return null;
    const comparisons = [
        { name: 'car', size: 4.5, emoji: '🚗' },
        { name: 'bus', size: 12, emoji: '🚌' },
        { name: 'Boeing 747', size: 70.7, emoji: '✈️' },
        { name: 'Statue of Liberty', size: 93, emoji: '🗽' },
        { name: 'football field', size: 109, emoji: '🏈' },
        { name: 'Eiffel Tower', size: 330, emoji: '🗼' },
        { name: 'Empire State Building', size: 443, emoji: '🏙️' },
    ];

    for (const item of comparisons) {
        if (meters <= item.size * 1.5) {
            const ratio = (meters / item.size).toFixed(1);
            return `${item.emoji} ~${ratio}x ${item.name}`;
        }
    }

    // Larger than all comparisons
    const ratio = (meters / 443).toFixed(1);
    return `🏙️ ${ratio}x Empire State Building`;
};

/**
 * NeoDetailPanel component
 * @param {Object} props - Component props
 * @param {Object} props.neo - NEO data object
 * @param {Function} props.onClose - Close handler
 * @returns {JSX.Element} NEO detail panel
 */
export default function NeoDetailPanel({ neo, onClose }) {
    const [showOrbitViewer, setShowOrbitViewer] = useState(false);

    if (!neo) return null;

    // Show 3D orbit viewer if selected
    if (showOrbitViewer) {
        return (
            <NeoOrbitViewer
                neo={neo}
                onClose={() => setShowOrbitViewer(false)}
            />
        );
    }

    const closeApproach = neo.close_approach_data?.[0];
    const diameter = neo.estimated_diameter?.meters || {};

    return (
        <div className="neo-detail-panel">
            {/* Header */}
            <div className="neo-detail-header">
                <h2 className="neo-detail-title">{neo.name}</h2>
                <button className="btn" onClick={onClose}>
                    ← Back
                </button>
            </div>

            {/* Hazard Warning */}
            {neo.is_potentially_hazardous_asteroid && (
                <div
                    className="neo-hazard-warning"
                    style={{
                        background: '#ff0000',
                        color: '#fff',
                        padding: '8px',
                        marginBottom: '12px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                    }}
                >
                    ⚠️ POTENTIALLY HAZARDOUS ASTEROID
                </div>
            )}

            {/* 3D Visualization Button */}
            <div style={{ marginBottom: '12px', textAlign: 'center' }}>
                <button
                    className="btn btn-default"
                    onClick={() => setShowOrbitViewer(true)}
                    style={{ fontSize: '14px', padding: '8px 16px' }}
                >
                    🌍 View 3D Orbit Trajectory
                </button>
            </div>

            {/* Countdown Timer for Future Approaches */}
            {closeApproach && closeApproach.close_approach_date && (
                <div style={{
                    padding: '12px',
                    border: '2px solid var(--secondary)',
                    marginBottom: '12px',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.05)',
                }}>
                    <div style={{ fontSize: 'var(--font-size-caption)', marginBottom: '4px' }}>
                        ⏱️ Time to Closest Approach
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xxl)', fontFamily: 'Monaco, monospace' }}>
                        <CountdownTimer
                            targetDate={closeApproach.close_approach_date_full || closeApproach.close_approach_date}
                            label=""
                        />
                    </div>
                </div>
            )}

            {/* Size Comparison - makes it tangible */}
            {diameter.estimated_diameter_max && (
                <div style={{
                    padding: '10px',
                    border: '1px solid var(--tertiary)',
                    marginBottom: '12px',
                    textAlign: 'center',
                    background: 'rgba(255,200,0,0.1)',
                }}>
                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                        📏 Size Comparison
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xl)', marginTop: '4px' }}>
                        {getSizeComparison(diameter.estimated_diameter_max)}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-base)', opacity: 0.7, marginTop: '4px' }}>
                        ({formatNumber(diameter.estimated_diameter_min?.toFixed(0))} - {formatNumber(diameter.estimated_diameter_max?.toFixed(0))} meters)
                    </div>
                </div>
            )}

            {/* Basic Info */}
            <div className="nasa-data-section">
                <div className="nasa-data-title">Object Information</div>
                <div className="nasa-data-content">
                    <div className="neo-detail-row">
                        <span className="label">NASA JPL ID:</span>
                        <span className="value">{neo.id}</span>
                    </div>
                    <div className="neo-detail-row">
                        <span className="label">NEO Reference ID:</span>
                        <span className="value">{neo.neo_reference_id || neo.id}</span>
                    </div>
                    <div className="neo-detail-row">
                        <span className="label">Absolute Magnitude (H):</span>
                        <span className="value">{neo.absolute_magnitude_h?.toFixed(2) || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Size Estimates */}
            <div className="nasa-data-section">
                <div className="nasa-data-title">Estimated Diameter</div>
                <div className="nasa-data-content">
                    <div className="neo-detail-row">
                        <span className="label">Min (meters):</span>
                        <span className="value">{formatNumber(diameter.estimated_diameter_min?.toFixed(1))}</span>
                    </div>
                    <div className="neo-detail-row">
                        <span className="label">Max (meters):</span>
                        <span className="value">{formatNumber(diameter.estimated_diameter_max?.toFixed(1))}</span>
                    </div>
                    <div className="neo-detail-row">
                        <span className="label">Min (feet):</span>
                        <span className="value">
                            {formatNumber(neo.estimated_diameter?.feet?.estimated_diameter_min?.toFixed(1))}
                        </span>
                    </div>
                    <div className="neo-detail-row">
                        <span className="label">Max (feet):</span>
                        <span className="value">
                            {formatNumber(neo.estimated_diameter?.feet?.estimated_diameter_max?.toFixed(1))}
                        </span>
                    </div>
                </div>
            </div>

            {/* Close Approach Data */}
            {closeApproach && (
                <div className="nasa-data-section">
                    <div className="nasa-data-title">Close Approach Data</div>
                    <div className="nasa-data-content">
                        <div className="neo-detail-row">
                            <span className="label">Approach Date:</span>
                            <span className="value">{closeApproach.close_approach_date_full || closeApproach.close_approach_date}</span>
                        </div>
                        <div className="neo-detail-row">
                            <span className="label">Relative Velocity (km/h):</span>
                            <span className="value">
                                {formatNumber(Math.round(closeApproach.relative_velocity?.kilometers_per_hour))}
                            </span>
                        </div>
                        <div className="neo-detail-row">
                            <span className="label">Relative Velocity (mph):</span>
                            <span className="value">
                                {formatNumber(Math.round(closeApproach.relative_velocity?.miles_per_hour))}
                            </span>
                        </div>
                        <div className="neo-detail-row">
                            <span className="label">Miss Distance (km):</span>
                            <span className="value">
                                {formatNumber(Math.round(closeApproach.miss_distance?.kilometers))}
                            </span>
                        </div>
                        <div className="neo-detail-row">
                            <span className="label">Miss Distance (lunar):</span>
                            <span className="value">
                                {Number(closeApproach.miss_distance?.lunar).toFixed(2)} lunar distances
                            </span>
                        </div>
                        <div className="neo-detail-row">
                            <span className="label">Orbiting Body:</span>
                            <span className="value">{closeApproach.orbiting_body || 'Earth'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* External Links */}
            <div className="nasa-data-section">
                <div className="nasa-data-title">External Resources</div>
                <div className="nasa-data-content">
                    {neo.nasa_jpl_url && (
                        <div className="neo-detail-row">
                            <a
                                href={neo.nasa_jpl_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="nasa-link"
                            >
                                View on NASA JPL →
                            </a>
                        </div>
                    )}
                </div>
            </div>

            {/* All Close Approaches */}
            {neo.close_approach_data?.length > 1 && (
                <div className="nasa-data-section">
                    <div className="nasa-data-title">All Close Approaches ({neo.close_approach_data.length})</div>
                    <div
                        className="neo-approaches-list"
                        style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '11px' }}
                    >
                        {neo.close_approach_data.map((approach, idx) => (
                            <div
                                key={idx}
                                style={{
                                    borderBottom: '1px solid var(--tertiary)',
                                    padding: '4px 0',
                                    marginBottom: '4px',
                                }}
                            >
                                <strong>{approach.close_approach_date}</strong>
                                {' - '}
                                {formatNumber(Math.round(approach.miss_distance?.kilometers))} km
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

NeoDetailPanel.propTypes = {
    neo: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
};

