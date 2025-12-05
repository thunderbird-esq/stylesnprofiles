import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Earth Viewer App - NASA GIBS satellite imagery
 * Proper WMTS tile implementation
 * @component
 */
export default function EarthViewerApp({ windowId: _windowId }) {
    const [selectedLayer, setSelectedLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
    const [selectedDate, setSelectedDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // GIBS layers that work reliably
    // Using "best" endpoint with proper layer identifiers
    const LAYERS = [
        {
            id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
            name: '🌍 Terra True Color (Daily)',
            format: 'jpg',
            matrix: '250m',
        },
        {
            id: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
            name: '🌊 Aqua True Color (Daily)',
            format: 'jpg',
            matrix: '250m',
        },
        {
            id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
            name: '🛰️ VIIRS True Color (Daily)',
            format: 'jpg',
            matrix: '250m',
        },
        {
            id: 'BlueMarble_NextGeneration',
            name: '🌏 Blue Marble (Static)',
            format: 'jpg',
            matrix: '500m',
            staticDate: '2004-08', // Blue Marble uses fixed date
        },
        {
            id: 'VIIRS_Black_Marble',
            name: '🌃 Black Marble (Night)',
            format: 'png',
            matrix: '500m',
            staticDate: '2016-01-01',
        },
    ];

    // Set default date to 2 days ago (GIBS data has 1-2 day lag)
    useEffect(() => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        setSelectedDate(twoDaysAgo.toISOString().split('T')[0]);
    }, []);

    // Build full image URL using WMS (simpler than WMTS for single image)
    const currentLayer = useMemo(() =>
        LAYERS.find(l => l.id === selectedLayer),
        [selectedLayer]);

    useEffect(() => {
        if (!selectedDate || !currentLayer) return;
        setLoading(true);
        setError(null);

        // Use the layer's static date if it has one, otherwise use selected date
        const dateToUse = currentLayer.staticDate || selectedDate;

        // Build a WMS GetMap URL for a full Earth view
        // GIBS WMS endpoint provides full Earth images
        const wmsUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${selectedLayer}&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=800&HEIGHT=400&FORMAT=image/${currentLayer.format === 'jpg' ? 'jpeg' : 'png'}&TIME=${dateToUse}`;

        setImageUrl(wmsUrl);
        setLoading(false);
    }, [selectedLayer, selectedDate, currentLayer]);

    const handleDateChange = (offset) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        const today = new Date();
        today.setDate(today.getDate() - 1);
        if (date <= today) {
            setSelectedDate(date.toISOString().split('T')[0]);
        }
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a1a',
            color: '#fff',
            fontFamily: 'Chicago_12, Geneva_9, sans-serif',
        }}>
            {/* Header */}
            <div style={{
                padding: '10px 12px',
                background: '#1a1a2e',
                borderBottom: '1px solid #333',
                fontSize: '20px',
            }}>
                🌐 Earth Viewer (GIBS)
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: '10px',
                padding: '10px 12px',
                flexWrap: 'wrap',
                alignItems: 'center',
                background: '#151528',
                borderBottom: '1px solid #333',
            }}>
                <select
                    value={selectedLayer}
                    onChange={(e) => setSelectedLayer(e.target.value)}
                    style={{
                        fontSize: '16px',
                        padding: '6px 10px',
                        flex: 1,
                        minWidth: '200px',
                        background: '#252540',
                        color: '#fff',
                        border: '1px solid #444',
                    }}
                >
                    {LAYERS.map(layer => (
                        <option key={layer.id} value={layer.id}>{layer.name}</option>
                    ))}
                </select>

                {/* Date Controls - only show for non-static layers */}
                {!currentLayer?.staticDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                            onClick={() => handleDateChange(-1)}
                            style={btnStyle}
                        >
                            ◀
                        </button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                            style={{
                                fontSize: '16px',
                                padding: '6px',
                                background: '#252540',
                                color: '#fff',
                                border: '1px solid #444',
                            }}
                        />
                        <button
                            onClick={() => handleDateChange(1)}
                            style={btnStyle}
                        >
                            ▶
                        </button>
                    </div>
                )}
            </div>

            {/* Layer Info */}
            <div style={{
                padding: '6px 12px',
                fontSize: '14px',
                opacity: 0.7,
                background: '#0d0d1a',
            }}>
                {currentLayer?.name} • {currentLayer?.staticDate ? 'Static composite' : selectedDate}
                {currentLayer?.staticDate && <span style={{ marginLeft: '8px', color: '#888' }}>(This layer doesn't change by date)</span>}
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '10px', background: '#550000', fontSize: '16px' }}>
                    {error}
                </div>
            )}

            {/* Main Image */}
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '12px',
                background: '#000',
                minHeight: 0,
                overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ fontSize: '20px' }}>🌍 Loading satellite imagery...</div>
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={`${currentLayer?.name} - ${selectedDate}`}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            border: '2px solid #333',
                        }}
                        onError={() => setError('Failed to load image. Try a different date or layer.')}
                        onLoad={() => setError(null)}
                    />
                ) : (
                    <div style={{ fontSize: '20px' }}>Select a layer and date</div>
                )}
            </div>

            {/* Footer with Worldview link */}
            <div style={{
                padding: '10px 12px',
                textAlign: 'center',
                background: '#1a1a2e',
                borderTop: '1px solid #333',
            }}>
                <a
                    href={`https://worldview.earthdata.nasa.gov/?v=-180,-90,180,90&t=${selectedDate}&l=${selectedLayer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: '#4a9eff',
                        fontSize: '16px',
                        textDecoration: 'none',
                    }}
                >
                    🔗 Open in NASA Worldview for full interactivity →
                </a>
            </div>
        </div>
    );
}

const btnStyle = {
    fontSize: '18px',
    padding: '6px 12px',
    background: '#252540',
    color: '#fff',
    border: '1px solid #444',
    cursor: 'pointer',
};

EarthViewerApp.propTypes = {
    windowId: PropTypes.string,
};

EarthViewerApp.defaultProps = {
    windowId: null,
};
