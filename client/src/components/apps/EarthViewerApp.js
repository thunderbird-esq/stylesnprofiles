import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

/**
 * Earth Viewer App - NASA GIBS satellite imagery
 * Apple System 6 HIG styling
 * @component
 */
export default function EarthViewerApp({ windowId: _windowId }) {
    const [selectedLayer, setSelectedLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
    const [selectedDate, setSelectedDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // GIBS layers
    const LAYERS = [
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', name: 'Terra True Color', format: 'jpg' },
        { id: 'MODIS_Aqua_CorrectedReflectance_TrueColor', name: 'Aqua True Color', format: 'jpg' },
        { id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', name: 'VIIRS True Color', format: 'jpg' },
        { id: 'BlueMarble_NextGeneration', name: 'Blue Marble', format: 'jpg', static: '2004-08' },
        { id: 'VIIRS_Black_Marble', name: 'Black Marble (Night)', format: 'png', static: '2016-01-01' },
    ];

    // Default to 2 days ago (GIBS data lag)
    useEffect(() => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        setSelectedDate(twoDaysAgo.toISOString().split('T')[0]);
    }, []);

    const currentLayer = useMemo(() =>
        LAYERS.find(l => l.id === selectedLayer),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [selectedLayer]);

    useEffect(() => {
        if (!selectedDate || !currentLayer) return;
        setLoading(true);
        setError(null);

        const dateToUse = currentLayer.static || selectedDate;
        const format = currentLayer.format === 'jpg' ? 'jpeg' : 'png';

        // WMS request for full Earth view
        const wmsUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${selectedLayer}&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=560&HEIGHT=280&FORMAT=image/${format}&TIME=${dateToUse}`;

        setImageUrl(wmsUrl);
        setLoading(false);
    }, [selectedLayer, selectedDate, currentLayer]);

    const handleDateChange = (offset) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() - 1);
        if (date <= maxDate) {
            setSelectedDate(date.toISOString().split('T')[0]);
        }
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="nasa-data-title">🌐 Earth Viewer (GIBS)</div>
            <div style={{ fontSize: '11px', marginBottom: '6px', opacity: 0.8 }}>
                NASA Global Imagery Browse Services
            </div>

            {/* Controls */}
            <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '8px',
                padding: '6px',
                border: '1px solid var(--tertiary)',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                <div className="field-row">
                    <label style={{ fontSize: '11px' }}>Layer:</label>
                    <select
                        value={selectedLayer}
                        onChange={(e) => setSelectedLayer(e.target.value)}
                        style={{ fontSize: '11px', maxWidth: '150px' }}
                    >
                        {LAYERS.map(layer => (
                            <option key={layer.id} value={layer.id}>{layer.name}</option>
                        ))}
                    </select>
                </div>

                {/* Date controls (only for non-static layers) */}
                {!currentLayer?.static && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <button className="btn" onClick={() => handleDateChange(-1)} style={{ fontSize: '10px', padding: '2px 6px' }}>◀</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                            style={{ fontSize: '11px' }}
                        />
                        <button className="btn" onClick={() => handleDateChange(1)} style={{ fontSize: '10px', padding: '2px 6px' }}>▶</button>
                    </div>
                )}
            </div>

            {/* Layer Info */}
            <div style={{ fontSize: '10px', marginBottom: '6px', opacity: 0.7 }}>
                {currentLayer?.name} • {currentLayer?.static ? 'Static composite' : selectedDate}
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '11px', marginBottom: '6px' }}>{error}</div>}

            {/* Main Image */}
            <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '8px',
                minHeight: 0,
            }}>
                {loading ? (
                    <div className="nasa-loading">Loading satellite imagery...</div>
                ) : imageUrl ? (
                    <div style={{
                        border: '2px solid var(--secondary)',
                        padding: '2px',
                        background: '#ccc',
                    }}>
                        <img
                            src={imageUrl}
                            alt={`${currentLayer?.name} - ${selectedDate}`}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                display: 'block',
                            }}
                            onError={() => setError('Failed to load image.')}
                            onLoad={() => setError(null)}
                        />
                    </div>
                ) : (
                    <div style={{ fontSize: '12px' }}>Select a layer and date</div>
                )}
            </div>

            {/* Worldview Link */}
            <div style={{
                padding: '6px',
                textAlign: 'center',
                borderTop: '1px solid var(--tertiary)',
                marginTop: '6px',
            }}>
                <a
                    href={`https://worldview.earthdata.nasa.gov/?v=-180,-90,180,90&t=${selectedDate}&l=${selectedLayer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '11px', color: '#00c' }}
                >
                    🔗 Open in NASA Worldview
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
