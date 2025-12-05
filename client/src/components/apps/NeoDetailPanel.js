/**
 * NeoDetailPanel.js
 * Detail view for a Near Earth Object showing full orbital data and close approach info
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import NeoOrbitViewer from './NeoOrbitViewer';

/**
 * Format a number with thousands separators
 */
const formatNumber = (num) => {
    if (num === undefined || num === null) return 'N/A';
    return Number(num).toLocaleString();
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

