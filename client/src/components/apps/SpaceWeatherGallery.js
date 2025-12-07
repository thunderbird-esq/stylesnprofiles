/**
 * SpaceWeatherGallery.js
 * Image Gallery for Space Weather Visualizations
 * Shows synoptic maps, ACE plots, electron fluence, and more
 * Apple System 6 HIG styling
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    getSynopticMapUrl,
    getAceImageUrls,
    getElectronFluenceImageUrls,
    getStationKIndexUrl,
    getGeospaceImageUrls,
    getNotificationsTimelineUrl,
} from '../../services/noaaSwpcApi';

// Gallery categories
const CATEGORIES = [
    { value: 'solar', label: '☀️ Solar' },
    { value: 'ace', label: '🛰️ ACE' },
    { value: 'geo', label: '🌍 Geo' },
    { value: 'alerts', label: '⚠️ Alerts' },
];

// ACE instrument options
const ACE_INSTRUMENTS = [
    { value: 'mag', label: 'MAG' },
    { value: 'swepam', label: 'SWEPAM' },
    { value: 'epam', label: 'EPAM' },
];

// ACE period options
const ACE_PERIODS = ['2-hour', '6-hour', '24-hour', '3-day', '7-day'];

/**
 * Image viewer with loading state
 */
function ImageViewer({ src, alt, maxHeight = 180 }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    return (
        <div style={{
            border: '2px solid var(--secondary)',
            background: '#000',
            textAlign: 'center',
            minHeight: '150px',
            position: 'relative',
        }}>
            {loading && !error && (
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

            {error ? (
                <div style={{ padding: '40px', color: '#fff', fontSize: '10px' }}>
                    Image unavailable
                </div>
            ) : (
                <img
                    src={src}
                    alt={alt}
                    style={{
                        maxWidth: '100%',
                        maxHeight: `${maxHeight}px`,
                        display: loading ? 'none' : 'block',
                        margin: '0 auto',
                    }}
                    onLoad={() => setLoading(false)}
                    onError={() => {
                        setError(true);
                        setLoading(false);
                    }}
                />
            )}
        </div>
    );
}

ImageViewer.propTypes = {
    src: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    maxHeight: PropTypes.number,
};

/**
 * Main Space Weather Gallery Component
 */
export default function SpaceWeatherGallery() {
    const [category, setCategory] = useState('solar');
    const [aceInstrument, setAceInstrument] = useState('mag');
    const [acePeriod, setAcePeriod] = useState('24-hour');
    const [geoPeriod, setGeoPeriod] = useState('1-day');

    const aceUrls = getAceImageUrls();
    const electronUrls = getElectronFluenceImageUrls();
    const geoUrls = getGeospaceImageUrls();

    const renderSolarContent = () => (
        <>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
                Synoptic Map (Solar Disk)
            </div>
            <ImageViewer
                src={getSynopticMapUrl()}
                alt="Solar Synoptic Map"
                maxHeight={200}
            />
            <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '4px', textAlign: 'center' }}>
                Shows active regions, filaments, and coronal holes
            </div>
        </>
    );

    const renderAceContent = () => (
        <>
            {/* Instrument selector */}
            <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>Instrument:</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {ACE_INSTRUMENTS.map(inst => (
                        <button
                            key={inst.value}
                            onClick={() => setAceInstrument(inst.value)}
                            className={aceInstrument === inst.value ? 'btn btn-active' : 'btn'}
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                        >
                            {inst.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Period selector */}
            <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>Period:</div>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                    {ACE_PERIODS.map(p => (
                        <button
                            key={p}
                            onClick={() => setAcePeriod(p)}
                            className={acePeriod === p ? 'btn btn-active' : 'btn'}
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <ImageViewer
                src={aceUrls[aceInstrument]?.[acePeriod] || ''}
                alt={`ACE ${aceInstrument} ${acePeriod}`}
                maxHeight={180}
            />
            <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '4px', textAlign: 'center' }}>
                ACE satellite at L1 point (1.5M km from Earth)
            </div>
        </>
    );

    const renderGeoContent = () => (
        <>
            {/* Geospace period selector */}
            <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '4px' }}>Period:</div>
                <div style={{ display: 'flex', gap: '2px' }}>
                    {['3-hour', '1-day', '3-day', '7-day'].map(p => (
                        <button
                            key={p}
                            onClick={() => setGeoPeriod(p)}
                            className={geoPeriod === p ? 'btn btn-active' : 'btn'}
                            style={{ padding: '2px 6px', fontSize: '9px' }}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <ImageViewer
                src={geoUrls[geoPeriod] || ''}
                alt={`Geospace ${geoPeriod}`}
                maxHeight={150}
            />

            <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Electron Fluence Forecast
                </div>
                <ImageViewer
                    src={electronUrls.current}
                    alt="Electron Fluence"
                    maxHeight={120}
                />
            </div>
        </>
    );

    const renderAlertsContent = () => (
        <>
            <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '6px' }}>
                Notifications Timeline
            </div>
            <ImageViewer
                src={getNotificationsTimelineUrl()}
                alt="Notifications Timeline"
                maxHeight={150}
            />

            <div style={{ marginTop: '8px' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '4px' }}>
                    Station K-Index
                </div>
                <ImageViewer
                    src={getStationKIndexUrl()}
                    alt="Station K-Index"
                    maxHeight={120}
                />
            </div>
        </>
    );

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
                🖼️ Space Weather Gallery
            </div>

            {/* Category Selector */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '8px' }}>
                {CATEGORIES.map(c => (
                    <button
                        key={c.value}
                        onClick={() => setCategory(c.value)}
                        className={category === c.value ? 'btn btn-active' : 'btn'}
                        style={{ flex: 1, padding: '4px', fontSize: '9px' }}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div style={{ minHeight: '250px' }}>
                {category === 'solar' && renderSolarContent()}
                {category === 'ace' && renderAceContent()}
                {category === 'geo' && renderGeoContent()}
                {category === 'alerts' && renderAlertsContent()}
            </div>

            {/* Footer */}
            <div style={{ fontSize: '8px', opacity: 0.5, textAlign: 'center', marginTop: '8px' }}>
                Images from NOAA Space Weather Prediction Center
            </div>
        </div>
    );
}

SpaceWeatherGallery.propTypes = {};
