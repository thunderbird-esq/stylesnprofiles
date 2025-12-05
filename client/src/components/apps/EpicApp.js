import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getEpicImages, buildEpicImageUrl } from '../../services/nasaApi';
import SaveButton from '../favorites/SaveButton';

/**
 * EPIC Earth App - Beautifully redesigned image-focused viewer
 * Features spinning Earth animation, large imagery, minimal UI
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
    const [showInfo, setShowInfo] = useState(false);
    const animationRef = useRef(null);

    // Fetch images
    const fetchImages = useCallback(() => {
        setLoading(true);
        setError(null);
        setIsPlaying(false);

        getEpicImages({ date: date || undefined, collection })
            .then(res => {
                if (res.data?.error) {
                    if (res.data.error.code === 'OVER_RATE_LIMIT') {
                        setError('⚠️ Rate limit. Enter your API key in Settings.');
                    } else {
                        setError(res.data.error.message || 'API error');
                    }
                    return;
                }
                const data = Array.isArray(res.data) ? res.data : [];
                setImages(data);
                setSelectedIndex(0);
                if (data.length === 0) {
                    setError('No images for this date.');
                }
            })
            .catch(err => {
                console.error('EPIC fetch failed:', err);
                setError('Failed to load. Check connection.');
            })
            .finally(() => setLoading(false));
    }, [date, collection]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    // Animation loop
    useEffect(() => {
        if (isPlaying && images.length > 1) {
            animationRef.current = setInterval(() => {
                setSelectedIndex(i => (i + 1) % images.length);
            }, 400); // Fast animation for smooth spin
        }
        return () => {
            if (animationRef.current) {
                clearInterval(animationRef.current);
            }
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

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#000',
            color: '#fff',
            fontFamily: 'Chicago_12, Geneva_9, sans-serif',
        }}>
            {/* Minimal Header Bar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: '#1a1a1a',
                borderBottom: '1px solid #333',
                fontSize: '18px',
            }}>
                <span>🌍 EPIC Earth</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {/* Color Mode */}
                    <select
                        value={collection}
                        onChange={(e) => setCollection(e.target.value)}
                        style={{
                            fontSize: '16px',
                            padding: '4px 8px',
                            background: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                        }}
                    >
                        <option value="natural">Natural</option>
                        <option value="enhanced">Enhanced</option>
                    </select>

                    {/* Date */}
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        style={{
                            fontSize: '16px',
                            padding: '4px 8px',
                            background: '#333',
                            color: '#fff',
                            border: '1px solid #555',
                        }}
                    />

                    <button
                        onClick={fetchImages}
                        disabled={loading}
                        style={{
                            fontSize: '16px',
                            padding: '4px 12px',
                            background: loading ? '#555' : '#0066cc',
                            color: '#fff',
                            border: 'none',
                            cursor: loading ? 'wait' : 'pointer',
                        }}
                    >
                        {loading ? '...' : 'Go'}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{
                    padding: '12px',
                    background: '#550000',
                    textAlign: 'center',
                    fontSize: '16px',
                }}>
                    {error}
                </div>
            )}

            {/* Main Image Area */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: 0,
                overflow: 'hidden',
            }}>
                {loading ? (
                    <div style={{ fontSize: '24px' }}>🌍 Loading...</div>
                ) : currentImage ? (
                    <>
                        {/* Main Earth Image */}
                        <img
                            src={buildEpicImageUrl(currentImage, collection)}
                            alt={`Earth - ${currentImage.date}`}
                            style={{
                                maxWidth: '95%',
                                maxHeight: '95%',
                                objectFit: 'contain',
                                borderRadius: '50%',
                                boxShadow: '0 0 60px rgba(100, 180, 255, 0.3)',
                            }}
                            onClick={() => setShowInfo(!showInfo)}
                        />

                        {/* Floating Controls */}
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            gap: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                        }}>
                            <button onClick={handlePrev} style={btnStyle}>⏮️</button>
                            <button onClick={togglePlay} style={btnStyle}>
                                {isPlaying ? '⏸️' : '▶️'}
                            </button>
                            <button onClick={handleNext} style={btnStyle}>⏭️</button>
                            <span style={{
                                fontSize: '16px',
                                minWidth: '70px',
                                textAlign: 'center',
                                lineHeight: '32px',
                            }}>
                                {selectedIndex + 1}/{images.length}
                            </span>
                        </div>

                        {/* Info Overlay */}
                        {showInfo && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                left: '20px',
                                background: 'rgba(0,0,0,0.85)',
                                padding: '16px',
                                fontSize: '16px',
                                maxWidth: '300px',
                                border: '1px solid #444',
                            }}>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
                                    {formatDate(currentImage.date)}
                                </div>
                                <div style={{ marginBottom: '6px' }}>
                                    <strong>Center:</strong> {currentImage.centroid_coordinates?.lat?.toFixed(1)}°N, {currentImage.centroid_coordinates?.lon?.toFixed(1)}°E
                                </div>
                                <div style={{ marginBottom: '8px', opacity: 0.8 }}>
                                    {currentImage.caption}
                                </div>
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
                                <button
                                    onClick={() => setShowInfo(false)}
                                    style={{ marginTop: '8px', ...btnStyle }}
                                >
                                    × Close
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '80px', marginBottom: '16px' }}>🌍</div>
                        <div style={{ fontSize: '20px' }}>Select a date to view Earth</div>
                    </div>
                )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
                <div style={{
                    display: 'flex',
                    gap: '4px',
                    padding: '8px',
                    overflowX: 'auto',
                    background: '#111',
                    borderTop: '1px solid #333',
                }}>
                    {images.map((img, idx) => (
                        <img
                            key={img.identifier}
                            src={buildEpicImageUrl(img, collection)}
                            alt={`Frame ${idx + 1}`}
                            onClick={() => {
                                setIsPlaying(false);
                                setSelectedIndex(idx);
                            }}
                            style={{
                                width: '60px',
                                height: '60px',
                                objectFit: 'cover',
                                cursor: 'pointer',
                                borderRadius: '50%',
                                border: idx === selectedIndex ? '3px solid #0066cc' : '3px solid transparent',
                                opacity: idx === selectedIndex ? 1 : 0.6,
                                transition: 'all 0.2s',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Button style
const btnStyle = {
    fontSize: '20px',
    padding: '4px 12px',
    background: 'transparent',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
};

EpicApp.propTypes = {
    windowId: PropTypes.string,
};

EpicApp.defaultProps = {
    windowId: null,
};
