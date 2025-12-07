/**
 * DrapViewer.js
 * D-RAP (D Region Absorption Prediction) HF Radio Propagation Viewer
 * Shows global HF radio absorption at multiple frequencies
 * Apple System 6 HIG styling
 */

import React, { useState } from 'react';
import { getDrapImageUrls } from '../../services/noaaSwpcApi';

// Frequency options
const FREQUENCIES = [
    { value: 'current', label: 'Current' },
    { value: '5MHz', label: '5 MHz' },
    { value: '10MHz', label: '10 MHz' },
    { value: '15MHz', label: '15 MHz' },
    { value: '20MHz', label: '20 MHz' },
    { value: '30MHz', label: '30 MHz' },
];

// View options
const VIEWS = [
    { value: 'global', label: 'Global' },
    { value: 'nPole', label: 'N. Pole' },
    { value: 'sPole', label: 'S. Pole' },
];

/**
 * Main D-RAP Viewer Component
 */
export default function DrapViewer() {
    const [frequency, setFrequency] = useState('current');
    const [view, setView] = useState('global');
    const [imageError, setImageError] = useState(false);
    const [loading, setLoading] = useState(true);

    const drapUrls = getDrapImageUrls();

    // Get current image URL based on selections
    const getImageUrl = () => {
        if (frequency === 'current') {
            return drapUrls.current[view];
        }
        return drapUrls.byFrequency[frequency]?.[view];
    };

    const imageUrl = getImageUrl();

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
                📻 D-RAP HF Radio Absorption
            </div>

            {/* Description */}
            <div style={{
                fontSize: '9px',
                marginBottom: '8px',
                padding: '4px',
                background: 'var(--tertiary)',
                lineHeight: '1.4',
            }}>
                D-RAP shows predicted HF radio signal absorption caused by solar X-rays and energetic particles.
                Higher absorption (red/yellow) = degraded HF communications.
            </div>

            {/* Frequency Selector */}
            <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>Frequency:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                    {FREQUENCIES.map(f => (
                        <button
                            key={f.value}
                            onClick={() => {
                                setFrequency(f.value);
                                setImageError(false);
                                setLoading(true);
                            }}
                            className={frequency === f.value ? 'btn btn-active' : 'btn'}
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* View Selector */}
            <div style={{ marginBottom: '8px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>View:</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {VIEWS.map(v => (
                        <button
                            key={v.value}
                            onClick={() => {
                                setView(v.value);
                                setImageError(false);
                                setLoading(true);
                            }}
                            className={view === v.value ? 'btn btn-active' : 'btn'}
                            style={{ padding: '2px 8px', fontSize: '9px' }}
                        >
                            {v.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Image Display */}
            <div style={{
                border: '2px solid var(--secondary)',
                background: '#000',
                textAlign: 'center',
                minHeight: '180px',
                position: 'relative',
            }}>
                {loading && !imageError && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: '#fff',
                        fontSize: '10px',
                    }}>
                        Loading...
                    </div>
                )}

                {imageError ? (
                    <div style={{
                        padding: '40px',
                        color: '#fff',
                        fontSize: '10px'
                    }}>
                        Image unavailable
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        alt={`D-RAP ${frequency} ${view}`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
                            display: loading ? 'none' : 'block',
                            margin: '0 auto',
                        }}
                        onLoad={() => setLoading(false)}
                        onError={() => {
                            setImageError(true);
                            setLoading(false);
                        }}
                    />
                )}
            </div>

            {/* Legend */}
            <div style={{
                marginTop: '8px',
                padding: '6px',
                border: '1px solid var(--tertiary)',
                fontSize: '9px',
            }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Absorption Legend (dB):</div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#00f' }}>■ 0-1 (None)</span>
                    <span style={{ color: '#0f0' }}>■ 1-3 (Minor)</span>
                    <span style={{ color: '#ff0' }}>■ 3-6 (Moderate)</span>
                    <span style={{ color: '#f90' }}>■ 6-10 (Strong)</span>
                    <span style={{ color: '#f00' }}>■ &gt;10 (Severe)</span>
                </div>
            </div>

            {/* R-Scale Context */}
            <div style={{
                marginTop: '6px',
                fontSize: '8px',
                opacity: 0.6,
                textAlign: 'center',
            }}>
                Related to NOAA R-Scale (Radio Blackouts): R1-R5
            </div>
        </div>
    );
}

DrapViewer.propTypes = {};
