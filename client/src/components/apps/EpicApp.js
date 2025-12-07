import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getEpicImages, buildEpicImageUrl } from '../../services/nasaApi';
import SaveButton from '../favorites/SaveButton';

/**
 * EPIC Earth App - Apple System 6 HIG styling
 * Features Earth animation, image gallery, proper retro UI
 * @component
 */
export default function EpicApp({ windowId: _windowId }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [collection, setCollection] = useState('natural');
    const [date, setDate] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const animationRef = useRef(null);

    const fetchImages = useCallback(() => {
        setLoading(true);
        setError(null);
        setIsPlaying(false);

        getEpicImages({ date: date || undefined, collection })
            .then(res => {
                if (res.data?.error) {
                    setError(res.data.error.message || 'API error');
                    return;
                }
                const data = Array.isArray(res.data) ? res.data : [];
                setImages(data);
                setSelectedIndex(0);
                if (data.length === 0) setError('No images for this date.');
            })
            .catch(err => {
                console.error('EPIC fetch failed:', err);
                setError('Failed to load images.');
            })
            .finally(() => setLoading(false));
    }, [date, collection]);

    useEffect(() => { fetchImages(); }, [fetchImages]);

    // Animation loop for spinning Earth effect
    useEffect(() => {
        if (isPlaying && images.length > 1) {
            animationRef.current = setInterval(() => {
                setSelectedIndex(i => (i + 1) % images.length);
            }, 350);
        }
        return () => {
            if (animationRef.current) clearInterval(animationRef.current);
        };
    }, [isPlaying, images.length]);

    const currentImage = images[selectedIndex];

    const handlePrev = () => {
        setIsPlaying(false);
        setSelectedIndex(i => (i > 0 ? i - 1 : images.length - 1));
    };

    const handleNext = () => {
        setIsPlaying(false);
        setSelectedIndex(i => (i < images.length - 1 ? i + 1 : 0));
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="nasa-data-title" style={{ fontSize: 'var(--font-size-lg)' }}>🌍 EPIC Earth Camera</div>
            <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: '6px', opacity: 0.8 }}>
                Deep Space Climate Observatory (DSCOVR)
            </div>

            {/* Controls Row */}
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
                    <label style={{ fontSize: 'var(--font-size-lg)' }}>Color:</label>
                    <select
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                        style={{ fontSize: 'var(--font-size-lg)' }}
                    >
                        <option value="natural">Natural</option>
                        <option value="enhanced">Enhanced</option>
                    </select>
                </div>

                <div className="field-row">
                    <label style={{ fontSize: 'var(--font-size-lg)' }}>Date:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        style={{ fontSize: 'var(--font-size-lg)' }}
                    />
                </div>

                <button className="btn" onClick={fetchImages} disabled={loading} style={{ fontSize: 'var(--font-size-lg)' }}>
                    {loading ? '...' : 'Load'}
                </button>
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '11px', marginBottom: '6px' }}>{error}</div>}

            {/* Main Image Display */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: 0 }}>
                {loading ? (
                    <div className="nasa-loading">Loading Earth images...</div>
                ) : currentImage ? (
                    <>
                        {/* Earth Image */}
                        <div style={{
                            border: '2px solid var(--secondary)',
                            padding: '4px',
                            marginBottom: '8px',
                            background: '#000', /* Black background for Earth */
                        }}>
                            <img
                                src={buildEpicImageUrl(currentImage, collection)}
                                alt={`Earth - ${currentImage.date}`}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '240px',
                                    display: 'block',
                                }}
                            />
                        </div>

                        {/* Playback Controls */}
                        <div style={{
                            display: 'flex',
                            gap: '4px',
                            alignItems: 'center',
                            marginBottom: '6px',
                            padding: '4px 8px',
                            border: '1px solid var(--tertiary)',
                        }}>
                            <button className="btn" onClick={handlePrev} style={{ fontSize: '11px', padding: '2px 8px' }}>
                                ◀ Prev
                            </button>
                            <button
                                className="btn"
                                onClick={() => setIsPlaying(!isPlaying)}
                                style={{ fontSize: '11px', padding: '2px 8px', minWidth: '50px' }}
                            >
                                {isPlaying ? '⏸ Stop' : '▶ Play'}
                            </button>
                            <button className="btn" onClick={handleNext} style={{ fontSize: '11px', padding: '2px 8px' }}>
                                Next ▶
                            </button>
                            <span style={{ fontSize: '11px', marginLeft: '8px' }}>
                                {selectedIndex + 1} / {images.length}
                            </span>
                        </div>

                        {/* Image Info */}
                        <div style={{
                            fontSize: '11px',
                            padding: '6px',
                            border: '1px solid var(--tertiary)',
                            width: '100%',
                            maxWidth: '280px',
                        }}>
                            <div><strong>Date:</strong> {formatDate(currentImage.date)}</div>
                            <div><strong>Center:</strong> {currentImage.centroid_coordinates?.lat?.toFixed(1)}°N, {currentImage.centroid_coordinates?.lon?.toFixed(1)}°E</div>
                            <div style={{ marginTop: '4px' }}>
                                <SaveButton
                                    itemType="epic"
                                    itemId={`epic-${currentImage.identifier}`}
                                    itemDate={currentImage.date}
                                    itemData={{
                                        title: `Earth - ${formatDate(currentImage.date)}`,
                                        description: currentImage.caption,
                                        url: buildEpicImageUrl(currentImage, collection),
                                        date: currentImage.date,
                                    }}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌍</div>
                        <div style={{ fontSize: '12px' }}>Select a date and click Load</div>
                    </div>
                )}
            </div>

            {/* Thumbnail Filmstrip */}
            {images.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '8px',
                    overflowX: 'auto',
                    borderTop: '2px solid var(--secondary)',
                    marginTop: '8px',
                    background: '#333', /* Dark filmstrip background */
                }}>
                    {images.map((img, idx) => (
                        <div
                            key={img.identifier}
                            onClick={() => {
                                setIsPlaying(false);
                                setSelectedIndex(idx);
                            }}
                            style={{
                                position: 'relative',
                                cursor: 'pointer',
                                border: idx === selectedIndex ? '3px solid #fff' : '2px solid #666',
                                borderRadius: '2px',
                            }}
                        >
                            <img
                                src={buildEpicImageUrl(img, collection)}
                                alt={`Frame ${idx + 1}`}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    objectFit: 'cover',
                                    display: 'block',
                                    opacity: idx === selectedIndex ? 1 : 0.7,
                                }}
                            />
                            <span style={{
                                position: 'absolute',
                                bottom: '2px',
                                right: '2px',
                                background: 'rgba(0,0,0,0.7)',
                                color: '#fff',
                                fontSize: '9px',
                                padding: '1px 3px',
                            }}>
                                {idx + 1}
                            </span>
                        </div>
                    ))}
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
