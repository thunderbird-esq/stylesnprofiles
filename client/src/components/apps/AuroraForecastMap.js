/**
 * AuroraForecastMap.js
 * Enhanced aurora forecast visualization with Kp correlation and viewing estimates
 * Apple System 6 HIG styling
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getAuroraImageUrls, getKpIndex, getKpForecast, getAuroraForecast } from '../../services/noaaSwpcApi';

// Refresh interval constant
const REFRESH_INTERVAL_MS = 300000;  // 5 minutes

// Kp to aurora visibility latitude mapping
const KP_LATITUDE_MAP = [
    { kp: 0, lat: 66, label: 'Arctic Circle only' },
    { kp: 1, lat: 64, label: 'Far north (Iceland, N. Norway)' },
    { kp: 2, lat: 62, label: 'Alaska, N. Scandinavia' },
    { kp: 3, lat: 60, label: 'S. Alaska, Helsinki' },
    { kp: 4, lat: 58, label: 'Edmonton, Stockholm' },
    { kp: 5, lat: 55, label: 'Seattle, Edinburgh' },
    { kp: 6, lat: 52, label: 'London, Calgary' },
    { kp: 7, lat: 48, label: 'Portland, Amsterdam' },
    { kp: 8, lat: 45, label: 'Minneapolis, Paris' },
    { kp: 9, lat: 40, label: 'Denver, Rome' },
];

/**
 * Get aurora visibility info based on Kp
 */
function getVisibilityInfo(kp) {
    const kpInt = Math.min(9, Math.max(0, Math.round(kp)));
    return KP_LATITUDE_MAP[kpInt];
}

/**
 * Kp Badge Component
 */
function KpBadge({ kp, loading }) {
    if (loading || kp === null) {
        return (
            <div style={{ fontSize: 'var(--font-size-caption)', opacity: 0.6, textAlign: 'center', padding: '4px' }}>
                Loading Kp...
            </div>
        );
    }

    const visibility = getVisibilityInfo(kp);
    const color = kp >= 5 ? '#0f0' : kp >= 3 ? '#ff0' : '#888';

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px',
            background: 'var(--tertiary)',
            marginBottom: '6px',
            fontSize: 'var(--font-size-caption)',
        }}>
            <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: 'var(--font-size-body)',
                color: '#000',
            }}>
                {kp.toFixed(1)}
            </div>
            <div>
                <div style={{ fontWeight: 'bold' }}>Current Kp Index</div>
                <div>📍 Visible at {visibility.lat}°+ latitude</div>
                <div style={{ opacity: 0.7 }}>{visibility.label}</div>
            </div>
        </div>
    );
}

KpBadge.propTypes = {
    kp: PropTypes.number,
    loading: PropTypes.bool,
};

/**
 * Best Viewing Time Component
 */
function BestViewingTime({ forecast }) {
    const peakForecast = useMemo(() => {
        if (!forecast || forecast.length === 0) return null;

        // Find highest Kp in forecast
        let peak = forecast[0];
        forecast.forEach(f => {
            if (f.kp > peak.kp) peak = f;
        });

        return peak;
    }, [forecast]);

    if (!peakForecast) return null;

    const peakDate = new Date(peakForecast.time);
    const formattedDate = peakDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
    const formattedTime = peakDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });

    const isGood = peakForecast.kp >= 4;

    return (
        <div style={{
            fontSize: 'var(--font-size-caption)',
            padding: '4px 6px',
            background: isGood ? 'rgba(0,255,0,0.1)' : 'var(--tertiary)',
            border: isGood ? '1px solid #0f0' : '1px solid var(--tertiary)',
            marginBottom: '6px',
            textAlign: 'center',
        }}>
            🌙 <strong>Best viewing:</strong> {formattedDate} ~{formattedTime} (Kp {peakForecast.kp.toFixed(0)})
            {isGood && <span style={{ marginLeft: '6px' }}>✨ Good conditions!</span>}
        </div>
    );
}

BestViewingTime.propTypes = {
    forecast: PropTypes.array,
};

/**
 * Viewline Probability Component - shows aurora viewing probability by latitude
 * Fetches OVATION aurora forecast data
 */
function ViewlineProbability({ selectedLat, onLatChange }) {
    const [probability, setProbability] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Latitude band options
    const latitudes = [
        { lat: 65, label: '65°N (Iceland, N. Norway)' },
        { lat: 60, label: '60°N (Alaska, Helsinki)' },
        { lat: 55, label: '55°N (Seattle, Edinburgh)' },
        { lat: 50, label: '50°N (London, Calgary)' },
        { lat: 45, label: '45°N (Minneapolis, Paris)' },
    ];

    useEffect(() => {
        const fetchOvation = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getAuroraForecast();

                // OVATION data contains observation_time and aurora probabilities
                // Extract probability data for selected latitude
                if (data && data.coordinates) {
                    // Find average probability for the selected latitude band (+/- 2.5°)
                    const coords = data.coordinates.filter(c =>
                        Math.abs(c[1] - selectedLat) < 2.5
                    );

                    if (coords.length > 0) {
                        // Probability is in third position (aurora %)
                        const avgProb = coords.reduce((sum, c) => sum + (c[2] || 0), 0) / coords.length;
                        setProbability(Math.round(avgProb));
                    } else {
                        setProbability(null);
                    }
                }
            } catch (err) {
                console.error('OVATION fetch error:', err);
                setError('Could not load viewline data');
            } finally {
                setLoading(false);
            }
        };

        fetchOvation();
    }, [selectedLat]);

    return (
        <div style={{
            fontSize: 'var(--font-size-caption)',
            padding: '4px 6px',
            border: '1px solid var(--tertiary)',
            marginBottom: '6px',
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                📊 Viewline Probability
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                    value={selectedLat}
                    onChange={(e) => onLatChange(parseInt(e.target.value, 10))}
                    style={{ fontSize: 'var(--font-size-caption)', padding: '2px' }}
                >
                    {latitudes.map(l => (
                        <option key={l.lat} value={l.lat}>{l.label}</option>
                    ))}
                </select>

                {loading ? (
                    <span style={{ opacity: 0.6 }}>Loading...</span>
                ) : error ? (
                    <span style={{ color: '#c00' }}>{error}</span>
                ) : probability !== null ? (
                    <span style={{
                        fontWeight: 'bold',
                        color: probability > 50 ? '#0f0' : probability > 20 ? '#ff0' : '#888'
                    }}>
                        {probability}% chance visible
                    </span>
                ) : (
                    <span style={{ opacity: 0.6 }}>No data</span>
                )}
            </div>
        </div>
    );
}

ViewlineProbability.propTypes = {
    selectedLat: PropTypes.number.isRequired,
    onLatChange: PropTypes.func.isRequired,
};

/**
 * Aurora Forecast Map Component
 */
export default function AuroraForecastMap({ loading }) {
    const [hemisphere, setHemisphere] = useState('northern');
    const [imageError, setImageError] = useState(false);
    const [imageLoading, setImageLoading] = useState(true);
    const [currentKp, setCurrentKp] = useState(null);
    const [kpForecast, setKpForecast] = useState([]);
    const [kpLoading, setKpLoading] = useState(true);
    const [selectedLat, setSelectedLat] = useState(55);  // Default to 55°N

    const imageUrls = getAuroraImageUrls();
    const currentUrl = hemisphere === 'northern' ? imageUrls.northern : imageUrls.southern;

    // Fetch Kp data
    const fetchKpData = useCallback(async () => {
        setKpLoading(true);
        try {
            const [kpData, forecastData] = await Promise.all([
                getKpIndex().catch(() => []),
                getKpForecast().catch(() => []),
            ]);

            // Get most recent Kp
            if (kpData && kpData.length > 0) {
                setCurrentKp(kpData[kpData.length - 1].kp);
            }

            setKpForecast(forecastData);
        } catch (err) {
            console.error('Kp fetch error:', err);
        } finally {
            setKpLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKpData();
        const interval = setInterval(fetchKpData, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchKpData]);

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    if (loading && kpLoading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: 'var(--font-size-label)' }}>
                Loading aurora forecast...
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{
                fontSize: 'var(--font-size-label)',
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
                        className={`btn ${hemisphere === 'northern' ? 'btn-active' : ''}`}
                        onClick={() => { setHemisphere('northern'); setImageLoading(true); }}
                        style={{ fontSize: 'var(--font-size-caption)', padding: '1px 6px' }}
                    >
                        🌍 North
                    </button>
                    <button
                        className={`btn ${hemisphere === 'southern' ? 'btn-active' : ''}`}
                        onClick={() => { setHemisphere('southern'); setImageLoading(true); }}
                        style={{ fontSize: 'var(--font-size-caption)', padding: '1px 6px' }}
                    >
                        🌏 South
                    </button>
                </div>
            </div>

            {/* Kp Badge */}
            <KpBadge kp={currentKp} loading={kpLoading} />

            {/* Best Viewing Time */}
            <BestViewingTime forecast={kpForecast} />

            {/* Viewline Probability */}
            <ViewlineProbability
                selectedLat={selectedLat}
                onLatChange={setSelectedLat}
            />

            {/* Map container */}
            <div style={{
                position: 'relative',
                border: '1px solid var(--tertiary)',
                background: '#001',
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {imageLoading && !imageError && (
                    <div style={{
                        position: 'absolute',
                        color: '#fff',
                        fontSize: 'var(--font-size-label)',
                        zIndex: 1,
                    }}>
                        Loading aurora map...
                    </div>
                )}

                {imageError ? (
                    <div style={{ color: '#fff', fontSize: 'var(--font-size-label)', padding: '20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--font-size-xxl)', marginBottom: '8px' }}>🌌</div>
                        <div>Aurora image unavailable</div>
                        <div style={{ fontSize: 'var(--font-size-caption)', opacity: 0.6, marginTop: '4px' }}>
                            Check NOAA SWPC for latest forecast
                        </div>
                    </div>
                ) : (
                    <img
                        src={currentUrl}
                        alt={`Aurora forecast ${hemisphere} hemisphere`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '200px',
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
                fontSize: 'var(--font-size-chart)',
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

            {/* Info based on current Kp */}
            <div style={{
                fontSize: 'var(--font-size-caption)',
                opacity: 0.6,
                marginTop: '4px',
                textAlign: 'center',
            }}>
                {currentKp !== null && currentKp >= 5 && (
                    <span style={{ color: '#0f0' }}>🌟 Strong aurora activity! Best viewing tonight.</span>
                )}
                {currentKp !== null && currentKp < 5 && hemisphere === 'northern' && (
                    <span>Viewable latitudes: Northern U.S., Canada, Scandinavia</span>
                )}
                {currentKp !== null && currentKp < 5 && hemisphere === 'southern' && (
                    <span>Viewable latitudes: Southern Australia, New Zealand, Antarctica</span>
                )}
            </div>

            {/* Link */}
            <div style={{ textAlign: 'center', marginTop: '4px' }}>
                <a
                    href="https://www.swpc.noaa.gov/products/aurora-30-minute-forecast"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 'var(--font-size-caption)', color: '#00c' }}
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
