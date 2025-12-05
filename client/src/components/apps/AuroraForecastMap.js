/**
 * AuroraForecastMap.js
 * Aurora forecast visualization using NOAA images
 * Apple System 6 HIG styling
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { getAuroraImageUrls } from '../../services/noaaSwpcApi';

/**
 * Aurora Forecast Map Component
 */
export default function AuroraForecastMap({ loading }) {
    const [hemisphere, setHemisphere] = useState('northern');
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);

    const imageUrls = getAuroraImageUrls();
    const currentUrl = hemisphere === 'northern' ? imageUrls.northern : imageUrls.southern;

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    if (loading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading aurora forecast...
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
                alignItems: 'center',
            }}>
                <span>🌌 Aurora Forecast</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={`btn ${hemisphere === 'northern' ? 'btn-default' : ''}`}
                        onClick={() => { setHemisphere('northern'); setImageLoading(true); }}
                        style={{ fontSize: '9px', padding: '1px 6px' }}
                    >
                        🌍 North
                    </button>
                    <button
                        className={`btn ${hemisphere === 'southern' ? 'btn-default' : ''}`}
                        onClick={() => { setHemisphere('southern'); setImageLoading(true); }}
                        style={{ fontSize: '9px', padding: '1px 6px' }}
                    >
                        🌏 South
                    </button>
                </div>
            </div>

            {/* Map container */}
            <div style={{
                position: 'relative',
                border: '1px solid var(--tertiary)',
                background: '#001',
                minHeight: '180px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {imageLoading && !imageError && (
                    <div style={{
                        position: 'absolute',
                        color: '#fff',
                        fontSize: '11px',
                        zIndex: 1,
                    }}>
                        Loading aurora map...
                    </div>
                )}

                {imageError ? (
                    <div style={{ color: '#fff', fontSize: '11px', padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌌</div>
                        <div>Aurora image unavailable</div>
                        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
                            Check NOAA SWPC for latest forecast
                        </div>
                    </div>
                ) : (
                    <img
                        src={currentUrl}
                        alt={`Aurora forecast ${hemisphere} hemisphere`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '250px',
                            display: imageLoading ? 'none' : 'block',
                        }}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                    />
                )}
            </div>

            {/* Legend */}
            <div style={{
                display: 'flex',
                gap: '8px',
                fontSize: '8px',
                marginTop: '4px',
                padding: '4px',
                border: '1px solid var(--tertiary)',
                justifyContent: 'center',
            }}>
                <span>Aurora Probability:</span>
                <span style={{ color: '#090' }}>■ Low</span>
                <span style={{ color: '#0c0' }}>■ Moderate</span>
                <span style={{ color: '#ff0' }}>■ High</span>
                <span style={{ color: '#f00' }}>■ Very High</span>
            </div>

            {/* Info */}
            <div style={{
                fontSize: '9px',
                opacity: 0.6,
                marginTop: '4px',
                textAlign: 'center',
            }}>
                {hemisphere === 'northern'
                    ? 'Viewable latitudes: Northern U.S., Canada, Scandinavia'
                    : 'Viewable latitudes: Southern Australia, New Zealand, Antarctica'}
            </div>

            {/* Link */}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <a
                    href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '9px', color: '#00c' }}
                >
                    🔗 View on NOAA SWPC
                </a>
            </div>
        </div>
    );
}

AuroraForecastMap.propTypes = {
    loading: PropTypes.bool,
};

AuroraForecastMap.defaultProps = {
    loading: false,
};
