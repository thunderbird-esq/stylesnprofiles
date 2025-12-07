import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

// Organized layer categories - defined outside component for referential stability
const LAYER_CATEGORIES = {
    'True Color': [
        { id: 'MODIS_Terra_CorrectedReflectance_TrueColor', name: 'Terra True Color', format: 'jpg' },
        { id: 'MODIS_Aqua_CorrectedReflectance_TrueColor', name: 'Aqua True Color', format: 'jpg' },
        { id: 'VIIRS_SNPP_CorrectedReflectance_TrueColor', name: 'VIIRS SNPP', format: 'jpg' },
        { id: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', name: 'VIIRS NOAA-20', format: 'jpg' },
    ],
    'Fires & Thermal': [
        { id: 'MODIS_Terra_Thermal_Anomalies_Day', name: 'Fire/Thermal (Day)', format: 'png' },
        { id: 'MODIS_Terra_Thermal_Anomalies_Night', name: 'Fire/Thermal (Night)', format: 'png' },
        { id: 'VIIRS_SNPP_Thermal_Anomalies_375m_Day', name: 'VIIRS Fire Day', format: 'png' },
    ],
    'Atmosphere': [
        { id: 'MODIS_Terra_Aerosol', name: 'Aerosol Optical Depth', format: 'png' },
        { id: 'MODIS_Terra_Cloud_Top_Temp_Day', name: 'Cloud Top Temp', format: 'png' },
        { id: 'MODIS_Terra_Water_Vapor_5km_Day', name: 'Water Vapor', format: 'png' },
    ],
    'Land & Vegetation': [
        { id: 'MODIS_Terra_NDVI_8Day', name: 'Vegetation Index', format: 'png' },
        { id: 'MODIS_Terra_Land_Surface_Temp_Day', name: 'Land Surface Temp', format: 'png' },
        { id: 'MODIS_Terra_Snow_Cover', name: 'Snow Cover', format: 'png' },
    ],
    'Ocean': [
        { id: 'MODIS_Terra_Chlorophyll_A', name: 'Chlorophyll (Ocean)', format: 'png' },
        { id: 'GHRSST_L4_MUR_Sea_Surface_Temperature', name: 'Sea Surface Temp', format: 'png' },
    ],
    'Reference': [
        { id: 'BlueMarble_NextGeneration', name: 'Blue Marble', format: 'jpg', static: '2004-08' },
        { id: 'VIIRS_Black_Marble', name: 'Black Marble (Night)', format: 'png', static: '2016-01-01' },
    ],
};

// Flatten all layers for lookup - computed once at module level
const ALL_LAYERS = Object.values(LAYER_CATEGORIES).flat();

// Region presets - defined outside component for referential stability
const REGIONS = {
    global: { name: 'Global', bbox: [-90, -180, 90, 180] },
    northAmerica: { name: 'North America', bbox: [15, -130, 55, -60] },
    europe: { name: 'Europe', bbox: [35, -15, 70, 40] },
    asia: { name: 'Asia', bbox: [5, 60, 55, 140] },
    africa: { name: 'Africa', bbox: [-35, -20, 37, 55] },
    southAmerica: { name: 'South America', bbox: [-55, -80, 15, -35] },
    australia: { name: 'Australia', bbox: [-45, 110, -10, 155] },
    arctic: { name: 'Arctic', bbox: [60, -180, 90, 180] },
    antarctic: { name: 'Antarctic', bbox: [-90, -180, -60, 180] },
};

/**
 * Earth Viewer App - NASA GIBS/Worldview satellite imagery
 * Apple System 6 HIG with enhanced layer browsing and zoom
 * @component
 */
export default function EarthViewerApp({ windowId: _windowId }) {
    const [selectedLayer, setSelectedLayer] = useState('MODIS_Terra_CorrectedReflectance_TrueColor');
    const [selectedDate, setSelectedDate] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState('global');
    const [zoom, setZoom] = useState(1);

    // Default to 2 days ago
    useEffect(() => {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        setSelectedDate(twoDaysAgo.toISOString().split('T')[0]);
    }, []);

    const currentLayer = useMemo(() =>
        ALL_LAYERS.find(l => l.id === selectedLayer),
        [selectedLayer]);

    useEffect(() => {
        if (!selectedDate || !currentLayer) return;
        setLoading(true);
        setError(null);

        const dateToUse = currentLayer.static || selectedDate;
        const format = currentLayer.format === 'jpg' ? 'jpeg' : 'png';
        const region = REGIONS[selectedRegion];

        // Apply zoom to region
        const [minLat, minLon, maxLat, maxLon] = region.bbox;
        const centerLat = (minLat + maxLat) / 2;
        const centerLon = (minLon + maxLon) / 2;
        const halfHeight = (maxLat - minLat) / 2 / zoom;
        const halfWidth = (maxLon - minLon) / 2 / zoom;

        const zoomedBbox = [
            Math.max(-90, centerLat - halfHeight),
            Math.max(-180, centerLon - halfWidth),
            Math.min(90, centerLat + halfHeight),
            Math.min(180, centerLon + halfWidth),
        ];

        const wmsUrl = `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=${selectedLayer}&CRS=EPSG:4326&BBOX=${zoomedBbox.join(',')}&WIDTH=560&HEIGHT=280&FORMAT=image/${format}&TIME=${dateToUse}`;

        setImageUrl(wmsUrl);
        setLoading(false);
    }, [selectedLayer, selectedDate, currentLayer, selectedRegion, zoom]);

    const handleDateChange = (offset) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + offset);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() - 1);
        if (date <= maxDate && date >= new Date('2012-01-01')) {
            setSelectedDate(date.toISOString().split('T')[0]);
        }
    };

    return (
        <div className="nasa-data-section app-text-lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: 'var(--font-size-lg)' }}>🌐 Earth Viewer (GIBS)</div>
            <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: '6px', opacity: 0.8 }}>
                NASA Global Imagery Browse Services • {Object.keys(LAYER_CATEGORIES).length} categories
            </div>

            {/* Layer Selection */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <select
                    value={selectedLayer}
                    onChange={(e) => setSelectedLayer(e.target.value)}
                    style={{ fontSize: '10px', flex: 1, minWidth: '140px' }}
                >
                    {Object.entries(LAYER_CATEGORIES).map(([category, layers]) => (
                        <optgroup key={category} label={category}>
                            {layers.map(layer => (
                                <option key={layer.id} value={layer.id}>{layer.name}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>

                <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    style={{ fontSize: '10px', width: '100px' }}
                >
                    {Object.entries(REGIONS).map(([id, region]) => (
                        <option key={id} value={id}>{region.name}</option>
                    ))}
                </select>
            </div>

            {/* Date & Zoom Controls */}
            <div style={{
                display: 'flex',
                gap: '6px',
                marginBottom: '6px',
                padding: '4px',
                border: '1px solid var(--tertiary)',
                alignItems: 'center',
                flexWrap: 'wrap',
            }}>
                {!currentLayer?.static && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <button className="btn" onClick={() => handleDateChange(-7)} style={{ fontSize: '9px', padding: '1px 4px' }}>-7d</button>
                        <button className="btn" onClick={() => handleDateChange(-1)} style={{ fontSize: '9px', padding: '1px 4px' }}>◀</button>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date(Date.now() - 86400000).toISOString().split('T')[0]}
                            min="2012-01-01"
                            style={{ fontSize: '10px', width: '110px' }}
                        />
                        <button className="btn" onClick={() => handleDateChange(1)} style={{ fontSize: '9px', padding: '1px 4px' }}>▶</button>
                        <button className="btn" onClick={() => handleDateChange(7)} style={{ fontSize: '9px', padding: '1px 4px' }}>+7d</button>
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '9px' }}>Zoom:</span>
                    <button className="btn" onClick={() => setZoom(z => Math.max(1, z / 1.5))} style={{ fontSize: '9px', padding: '1px 6px' }}>−</button>
                    <span style={{ fontSize: '10px', minWidth: '30px', textAlign: 'center' }}>{zoom.toFixed(1)}x</span>
                    <button className="btn" onClick={() => setZoom(z => Math.min(8, z * 1.5))} style={{ fontSize: '9px', padding: '1px 6px' }}>+</button>
                    <button className="btn" onClick={() => setZoom(1)} style={{ fontSize: '9px', padding: '1px 6px' }}>Reset</button>
                </div>
            </div>

            {/* Info */}
            <div style={{ fontSize: '9px', marginBottom: '4px', opacity: 0.7 }}>
                {currentLayer?.name} • {REGIONS[selectedRegion].name} • {currentLayer?.static ? 'Static' : selectedDate} • {zoom}x zoom
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '10px', marginBottom: '4px' }}>{error}</div>}

            {/* Image Display */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div className="nasa-loading">Loading satellite imagery...</div>
                ) : imageUrl ? (
                    <div style={{ border: '2px solid var(--secondary)', background: '#333' }}>
                        <img
                            src={imageUrl}
                            alt={`${currentLayer?.name} - ${selectedDate}`}
                            style={{ maxWidth: '100%', maxHeight: '100%', display: 'block' }}
                            onError={() => setError('Failed to load. Try another layer/date.')}
                            onLoad={() => setError(null)}
                        />
                    </div>
                ) : (
                    <div style={{ fontSize: '11px' }}>Select a layer</div>
                )}
            </div>

            {/* Worldview Link */}
            <div style={{ padding: '4px', textAlign: 'center', borderTop: '1px solid var(--tertiary)', marginTop: '4px' }}>
                <a
                    href={`https://worldview.earthdata.nasa.gov/?v=${REGIONS[selectedRegion].bbox[1]},${REGIONS[selectedRegion].bbox[0]},${REGIONS[selectedRegion].bbox[3]},${REGIONS[selectedRegion].bbox[2]}&t=${selectedDate}&l=${selectedLayer}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '10px', color: '#00c' }}
                >
                    🔗 Open in NASA Worldview (full resolution)
                </a>
            </div>
        </div>
    );
}

EarthViewerApp.propTypes = { windowId: PropTypes.string };
EarthViewerApp.defaultProps = { windowId: null };
