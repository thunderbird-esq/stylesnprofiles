import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getEpicImages, buildEpicImageUrl } from '../../services/nasaApi';
import SaveButton from '../favorites/SaveButton';

/**
 * EPIC Earth App - View Earth from DSCOVR satellite
 * Earth Polychromatic Imaging Camera images
 * @component
 */
export default function EpicApp({ windowId: _windowId }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [collection, setCollection] = useState('natural');
    const [date, setDate] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);

    // Fetch images
    const fetchImages = () => {
        setLoading(true);
        setError(null);

        getEpicImages({ date: date || undefined, collection })
            .then(res => {
                const data = Array.isArray(res.data) ? res.data : [];
                setImages(data);
                setSelectedIndex(0);
                if (data.length === 0) {
                    setError('No images available for this date. Try a different date or collection.');
                }
            })
            .catch(err => {
                console.error('Failed to fetch EPIC images:', err);
                setError(err.message || 'Failed to load Earth images');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchImages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collection]);

    const currentImage = images[selectedIndex];

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString();
    };

    const handlePrev = () => {
        setSelectedIndex(i => (i > 0 ? i - 1 : images.length - 1));
    };

    const handleNext = () => {
        setSelectedIndex(i => (i < images.length - 1 ? i + 1 : 0));
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">🌍 EPIC Earth Camera</div>
            <div style={{ fontSize: '13px', marginBottom: '8px', opacity: 0.8 }}>
                Deep Space Climate Observatory (DSCOVR) satellite view
            </div>

            {/* Controls */}
            <div style={{ marginBottom: '12px', padding: '8px', border: '1px solid var(--tertiary)', background: 'var(--primary)' }}>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Collection Toggle */}
                    <div className="field-row">
                        <label>Color:</label>
                        <select
                            value={collection}
                            onChange={(e) => setCollection(e.target.value)}
                            style={{ marginLeft: '4px' }}
                        >
                            <option value="natural">Natural</option>
                            <option value="enhanced">Enhanced</option>
                        </select>
                    </div>

                    {/* Date Picker */}
                    <div className="field-row">
                        <label>Date:</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            style={{ marginLeft: '4px' }}
                        />
                    </div>

                    <button className="btn" onClick={fetchImages} disabled={loading}>
                        {loading ? 'Loading...' : 'Load Images'}
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ marginBottom: '8px' }}>{error}</div>}

            {/* Main Image Display */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ marginTop: '40px' }}>Loading Earth images...</div>
                ) : currentImage ? (
                    <>
                        {/* Image */}
                        <div
                            style={{
                                cursor: 'pointer',
                                border: '3px solid var(--secondary)',
                                marginBottom: '12px'
                            }}
                            onClick={() => setSelectedImage(currentImage)}
                        >
                            <img
                                src={buildEpicImageUrl(currentImage, collection)}
                                alt={`Earth from EPIC - ${currentImage.date}`}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    display: 'block'
                                }}
                            />
                        </div>

                        {/* Navigation */}
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                            <button className="btn" onClick={handlePrev} disabled={images.length <= 1}>
                                ◀ Prev
                            </button>
                            <span style={{ minWidth: '80px', textAlign: 'center' }}>
                                {selectedIndex + 1} / {images.length}
                            </span>
                            <button className="btn" onClick={handleNext} disabled={images.length <= 1}>
                                Next ▶
                            </button>
                        </div>

                        {/* Image Info */}
                        <div style={{
                            fontSize: '13px',
                            textAlign: 'center',
                            padding: '8px',
                            background: 'var(--primary)',
                            border: '1px solid var(--tertiary)',
                            maxWidth: '400px',
                            width: '100%'
                        }}>
                            <div><strong>Date:</strong> {formatDate(currentImage.date)}</div>
                            <div style={{ marginTop: '4px' }}>
                                <strong>Coordinates:</strong> {currentImage.centroid_coordinates?.lat?.toFixed(2)}°, {currentImage.centroid_coordinates?.lon?.toFixed(2)}°
                            </div>
                            <div style={{ marginTop: '4px' }}>
                                <strong>Caption:</strong> {currentImage.caption}
                            </div>

                            <div style={{ marginTop: '8px' }}>
                                <SaveButton
                                    itemType="epic"
                                    itemId={`epic-${currentImage.identifier}`}
                                    itemDate={currentImage.date}
                                    itemData={{
                                        title: `Earth - ${formatDate(currentImage.date)}`,
                                        description: currentImage.caption,
                                        url: buildEpicImageUrl(currentImage, collection),
                                        date: currentImage.date,
                                        coordinates: currentImage.centroid_coordinates,
                                    }}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '12px' }}>🌍</div>
                        <div style={{ fontSize: '15px' }}>No Earth images loaded</div>
                        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>
                            Select a date and click Load Images
                        </div>
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    overflowX: 'auto',
                    padding: '8px 0',
                    marginTop: '8px',
                    borderTop: '1px solid var(--tertiary)'
                }}>
                    {images.map((img, idx) => (
                        <img
                            key={img.identifier}
                            src={buildEpicImageUrl(img, collection)}
                            alt={`Earth ${idx + 1}`}
                            onClick={() => setSelectedIndex(idx)}
                            style={{
                                width: '50px',
                                height: '50px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                border: idx === selectedIndex ? '2px solid #0066cc' : '2px solid var(--tertiary)',
                                opacity: idx === selectedIndex ? 1 : 0.7,
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Full Size Modal */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <div style={{ position: 'relative' }}>
                        <img
                            src={buildEpicImageUrl(selectedImage, collection)}
                            alt="Earth full size"
                            style={{ maxWidth: '90vw', maxHeight: '90vh' }}
                        />
                        <div style={{
                            position: 'absolute',
                            bottom: '-40px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <a
                                href={buildEpicImageUrl(selectedImage, collection)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn"
                                onClick={e => e.stopPropagation()}
                            >
                                Open Original
                            </a>
                            <button
                                className="btn"
                                onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

EpicApp.propTypes = {
    windowId: PropTypes.string,
};

EpicApp.defaultProps = {
    windowId: null,
};
