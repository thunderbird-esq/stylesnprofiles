import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Earth Viewer App - NASA GIBS satellite imagery
 * Uses WMTS tiles without external map library
 * @component
 */
export default function EarthViewerApp({ windowId: _windowId }) {
    const [selectedLayer, setSelectedLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
    const [selectedDate, setSelectedDate] = useState('');
    const [zoom, setZoom] = useState(2);
    const [loading, setLoading] = useState(false);
    const [tileUrls, setTileUrls] = useState([]);

    // Available GIBS layers
    const LAYERS = [
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', name: '🌍 Terra True Color', format: 'jpg' },
        { id: 'MODIS_Aqua_CorrectedReflectance_TrueColor', name: '🌊 Aqua True Color', format: 'jpg' },
        { id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', name: '🛰️ VIIRS True Color', format: 'jpg' },
        { id: 'MODIS_Terra_Aerosol', name: '💨 Aerosol Optical Depth', format: 'png' },
        { id: 'MODIS_Terra_Land_Surface_Temp_Day', name: '🌡️ Land Surface Temp', format: 'png' },
        { id: 'MODIS_Terra_Snow_Cover', name: '❄️ Snow Cover', format: 'png' },
        { id: 'MODIS_Terra_Chlorophyll_A', name: '🌿 Chlorophyll', format: 'png' },
    ];

    // Set default date to yesterday (GIBS data has ~1 day lag)
    useEffect(() => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        setSelectedDate(yesterday.toISOString().split('T')[0]);
    }, []);

    // Generate tile URLs for the selected layer and date
    useEffect(() => {
        if (!selectedDate) return;
        setLoading(true);

        const layer = LAYERS.find(l => l.id === selectedLayer);
        const format = layer?.format || 'jpg';

        // GIBS WMTS URL pattern for geographic projection
        // Zoom level 3 = 10 tiles wide x 5 tiles tall
        const tilesX = Math.pow(2, zoom + 1);
        const tilesY = Math.pow(2, zoom);

        const urls = [];
        // Just show a 4x2 grid of central tiles for performance
        const startRow = Math.floor(tilesY / 2) - 1;
        const startCol = Math.floor(tilesX / 2) - 2;

        for (let row = startRow; row < startRow + 2 && row < tilesY; row++) {
            for (let col = startCol; col < startCol + 4 && col < tilesX; col++) {
                // GIBS WMTS tile URL format
                const url = `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/${selectedLayer}/default/${selectedDate}/250m/${zoom}/${row}/${col}.${format}`;
                urls.push({ row, col, url });
            }
        }

        setTileUrls(urls);
        setLoading(false);
    }, [selectedLayer, selectedDate, zoom]);

    const handleDateChange = (offset) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        // Don't allow future dates
        if (date <= new Date()) {
            setSelectedDate(date.toISOString().split('T')[0]);
        }
    };

    const currentLayer = LAYERS.find(l => l.id === selectedLayer);

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>🌐 Earth Viewer (GIBS)</div>
            <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8 }}>
                NASA Global Imagery Browse Services
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Layer Selector */}
                <select
                    value={selectedLayer}
                    onChange={(e) => setSelectedLayer(e.target.value)}
                    style={{ fontSize: '16px', padding: '6px', flex: 1, minWidth: '200px' }}
                >
                    {LAYERS.map(layer => (
                        <option key={layer.id} value={layer.id}>{layer.name}</option>
                    ))}
                </select>

                {/* Date Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button className="btn" onClick={() => handleDateChange(-1)} style={{ fontSize: '16px' }}>◀</button>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        style={{ fontSize: '16px', padding: '4px' }}
                    />
                    <button className="btn" onClick={() => handleDateChange(1)} style={{ fontSize: '16px' }}>▶</button>
                </div>

                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                        className="btn"
                        onClick={() => setZoom(Math.max(0, zoom - 1))}
                        disabled={zoom <= 0}
                        style={{ fontSize: '16px' }}
                    >
                        −
                    </button>
                    <span style={{ fontSize: '16px', minWidth: '60px', textAlign: 'center' }}>
                        Zoom: {zoom}
                    </span>
                    <button
                        className="btn"
                        onClick={() => setZoom(Math.min(6, zoom + 1))}
                        disabled={zoom >= 6}
                        style={{ fontSize: '16px' }}
                    >
                        +
                    </button>
                </div>
            </div>

            {/* Layer Info */}
            <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.7 }}>
                {currentLayer?.name} • {selectedDate}
            </div>

            {/* Image Viewer */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                background: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
            }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px', color: 'white' }}>
                        Loading satellite imagery...
                    </div>
                ) : tileUrls.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '0px',
                        background: '#1a1a2e',
                    }}>
                        {tileUrls.map((tile, idx) => (
                            <img
                                key={`${tile.row}-${tile.col}-${idx}`}
                                src={tile.url}
                                alt={`Tile ${tile.row},${tile.col}`}
                                style={{
                                    width: '128px',
                                    height: '128px',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                                onError={(e) => {
                                    const img = e.target;
                                    img.style.background = '#333';
                                    img.style.opacity = '0.5';
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{ color: 'white', fontSize: '16px', textAlign: 'center' }}>
                        Select a layer and date to view satellite imagery
                    </div>
                )}
            </div>

            {/* Help Text */}
            <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7, textAlign: 'center' }}>
                ℹ️ Imagery has ~1 day lag. Use ◀ ▶ to browse dates.
            </div>

            {/* Full View Link */}
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
                <a
                    href={`https://worldview.earthdata.nasa.gov/?v=-180,-90,180,90&t=${selectedDate}&l=${selectedLayer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#4a90d9', fontSize: '16px' }}
                >
                    🔗 Open in NASA Worldview →
                </a>
            </div>
        </div>
    );
}

EarthViewerApp.propTypes = {
    windowId: PropTypes.string,
};

EarthViewerApp.defaultProps = {
    windowId: null,
};
