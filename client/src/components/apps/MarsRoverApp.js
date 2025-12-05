import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getMarsPhotos, getMarsRoverManifest } from '../../services/nasaApi';
import SaveButton from '../favorites/SaveButton';

/**
 * Mars Rover Photos application - Browse Mars Rover imagery
 * @component
 */
export default function MarsRoverApp({ windowId: _windowId }) {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPhoto, setSelectedPhoto] = useState(null);

    // Rover selection
    const [rover, setRover] = useState('curiosity');
    const [sol, setSol] = useState(1000);
    const [camera, setCamera] = useState('');
    const [page, setPage] = useState(1);
    const [manifest, setManifest] = useState(null);

    // Rover cameras
    const CAMERAS = {
        curiosity: ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM'],
        opportunity: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
        spirit: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
        perseverance: ['EDL_RUCAM', 'EDL_RDCAM', 'EDL_DDCAM', 'EDL_PUCAM1', 'EDL_PUCAM2', 'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_LEFT', 'MCZ_RIGHT', 'FRONT_HAZCAM_LEFT_A', 'FRONT_HAZCAM_RIGHT_A', 'REAR_HAZCAM_LEFT', 'REAR_HAZCAM_RIGHT', 'SKYCAM', 'SHERLOC_WATSON'],
    };

    // Fetch rover manifest
    useEffect(() => {
        getMarsRoverManifest(rover)
            .then(res => {
                setManifest(res.data.photo_manifest);
                setSol(res.data.photo_manifest.max_sol > 100 ? 100 : res.data.photo_manifest.max_sol);
            })
            .catch(err => console.error('Failed to fetch manifest:', err));
    }, [rover]);

    // Fetch photos
    const fetchPhotos = useCallback(() => {
        setLoading(true);
        setError(null);

        getMarsPhotos({ rover, sol, camera: camera || undefined, page })
            .then(res => {
                // Check for API error response
                if (res.data.error) {
                    if (res.data.error.code === 'OVER_RATE_LIMIT') {
                        setError('⚠️ API rate limit exceeded. Get your FREE API key at api.nasa.gov and enter it in Settings (⚙️ menu).');
                    } else {
                        setError(res.data.error.message || 'API error occurred');
                    }
                    return;
                }
                setPhotos(res.data.photos || []);
                if (res.data.photos?.length === 0) {
                    setError('No photos found for this sol/camera combination. Try a different sol or camera.');
                }
            })
            .catch(err => {
                console.error('Failed to fetch Mars photos:', err);
                const errMsg = err.response?.data?.error?.message || err.message;
                if (errMsg?.includes('rate limit') || errMsg?.includes('OVER_RATE_LIMIT')) {
                    setError('⚠️ API rate limit exceeded. Get your FREE API key at api.nasa.gov and enter it in Settings (⚙️ menu).');
                } else {
                    setError(errMsg || 'Failed to load Mars photos. Check your API key in Settings.');
                }
            })
            .finally(() => setLoading(false));
    }, [rover, sol, camera, page]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleRoverChange = (e) => {
        setRover(e.target.value);
        setCamera('');
        setPage(1);
    };

    const handleSolChange = (e) => {
        const newSol = parseInt(e.target.value) || 0;
        setSol(Math.max(0, newSol));
        setPage(1);
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">🔴 Mars Rover Photos</div>

            {/* Controls */}
            <div style={{ marginBottom: '12px', padding: '8px', border: '1px solid var(--tertiary)', background: 'var(--primary)' }}>
                {/* Rover Selection */}
                <div className="field-row" style={{ marginBottom: '8px' }}>
                    <label>Rover:</label>
                    <select value={rover} onChange={handleRoverChange} style={{ marginLeft: '8px' }}>
                        <option value="curiosity">Curiosity</option>
                        <option value="opportunity">Opportunity</option>
                        <option value="spirit">Spirit</option>
                        <option value="perseverance">Perseverance</option>
                    </select>
                </div>

                {/* Sol Input */}
                <div className="field-row" style={{ marginBottom: '8px' }}>
                    <label>Sol (Mars day):</label>
                    <input
                        type="number"
                        value={sol}
                        onChange={handleSolChange}
                        min="0"
                        max={manifest?.max_sol || 5000}
                        style={{ width: '80px', marginLeft: '8px' }}
                    />
                    {manifest && (
                        <span style={{ marginLeft: '8px', fontSize: '12px', opacity: 0.7 }}>
                            (max: {manifest.max_sol})
                        </span>
                    )}
                </div>

                {/* Camera Filter */}
                <div className="field-row" style={{ marginBottom: '8px' }}>
                    <label>Camera:</label>
                    <select value={camera} onChange={(e) => { setCamera(e.target.value); setPage(1); }} style={{ marginLeft: '8px' }}>
                        <option value="">All Cameras</option>
                        {CAMERAS[rover]?.map(cam => (
                            <option key={cam} value={cam}>{cam}</option>
                        ))}
                    </select>
                </div>

                {/* Fetch Button */}
                <button className="btn" onClick={fetchPhotos} disabled={loading}>
                    {loading ? 'Loading...' : 'Load Photos'}
                </button>
            </div>

            {/* Mission Info */}
            {manifest && (
                <div style={{ fontSize: '13px', marginBottom: '8px', opacity: 0.8 }}>
                    <strong>{manifest.name}</strong> |
                    Launch: {manifest.launch_date} |
                    Landing: {manifest.landing_date} |
                    Status: {manifest.status} |
                    Total Photos: {manifest.total_photos?.toLocaleString()}
                </div>
            )}

            {/* Error State */}
            {error && <div className="nasa-error" style={{ marginBottom: '8px' }}>{error}</div>}

            {/* Photo Grid */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '8px',
                padding: '4px'
            }}>
                {loading && photos.length === 0 ? (
                    <div className="nasa-loading">Loading Mars photos...</div>
                ) : (
                    photos.map(photo => (
                        <div
                            key={photo.id}
                            onClick={() => setSelectedPhoto(photo)}
                            style={{
                                cursor: 'pointer',
                                border: '2px solid var(--secondary)',
                                padding: '4px',
                                background: 'var(--primary)',
                            }}
                        >
                            <img
                                src={photo.img_src}
                                alt={`Mars ${photo.camera.full_name}`}
                                style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                loading="lazy"
                            />
                            <div style={{ fontSize: '11px', marginTop: '4px' }}>
                                {photo.camera.name}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {photos.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <button
                        className="btn"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ◀ Prev
                    </button>
                    <span style={{ padding: '6px 12px' }}>Page {page}</span>
                    <button
                        className="btn"
                        onClick={() => setPage(p => p + 1)}
                        disabled={photos.length < 25}
                    >
                        Next ▶
                    </button>
                </div>
            )}

            {/* Photo Modal */}
            {selectedPhoto && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                    }}
                    onClick={() => setSelectedPhoto(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            padding: '12px',
                            border: '3px solid var(--secondary)',
                            maxWidth: '90vw',
                            maxHeight: '85vh',
                            overflow: 'auto'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={selectedPhoto.img_src}
                            alt={`Mars ${selectedPhoto.camera.full_name}`}
                            style={{ maxWidth: '100%', maxHeight: '60vh' }}
                        />
                        <div style={{ marginTop: '12px', fontSize: '14px' }}>
                            <strong>{selectedPhoto.camera.full_name}</strong>
                            <div>Rover: {selectedPhoto.rover.name}</div>
                            <div>Sol: {selectedPhoto.sol} | Earth Date: {selectedPhoto.earth_date}</div>
                        </div>
                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                            <SaveButton
                                itemType="mars"
                                itemId={`mars-${selectedPhoto.id}`}
                                itemDate={selectedPhoto.earth_date}
                                itemData={{
                                    title: `Mars - ${selectedPhoto.camera.full_name}`,
                                    description: `${selectedPhoto.rover.name} rover, Sol ${selectedPhoto.sol}`,
                                    url: selectedPhoto.img_src,
                                    date: selectedPhoto.earth_date,
                                }}
                            />
                            <a
                                href={selectedPhoto.img_src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn"
                            >
                                Open Full Size
                            </a>
                            <button className="btn" onClick={() => setSelectedPhoto(null)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

MarsRoverApp.propTypes = {
    windowId: PropTypes.string,
};

MarsRoverApp.defaultProps = {
    windowId: null,
};
