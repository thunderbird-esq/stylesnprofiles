import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { searchNasaLibrary, getNasaLibraryAsset } from '../../services/nasaApi';
import SaveButton from '../favorites/SaveButton';

/**
 * NASA Image & Video Library application
 * Search NASA's media archive at images.nasa.gov
 * @component
 */
export default function NasaLibraryApp({ windowId: _windowId }) {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [mediaUrls, setMediaUrls] = useState(null);
    const [loadingMedia, setLoadingMedia] = useState(false);

    // Search parameters
    const [query, setQuery] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [page, setPage] = useState(1);
    const [totalHits, setTotalHits] = useState(0);

    // Media type icons and colors
    const MEDIA_STYLES = {
        image: { icon: '🖼️', color: '#4a90d9', label: 'Image' },
        video: { icon: '🎬', color: '#d94a4a', label: 'Video' },
        audio: { icon: '🔊', color: '#4ad97a', label: 'Audio' },
    };

    const handleSearch = useCallback((newPage = 1) => {
        if (!query.trim()) {
            setError('Please enter a search query');
            return;
        }

        setLoading(true);
        setError(null);
        setPage(newPage);
        setHasSearched(true);

        searchNasaLibrary({
            query: query.trim(),
            mediaType: mediaType || undefined,
            yearStart: yearStart ? parseInt(yearStart) : undefined,
            yearEnd: yearEnd ? parseInt(yearEnd) : undefined,
            page: newPage,
        })
            .then(res => {
                const collection = res.data.collection || {};
                const items = collection.items || [];
                setResults(items);
                setTotalHits(collection.metadata?.total_hits || items.length);

                if (items.length === 0) {
                    setError('No results found. Try different search terms.');
                }
            })
            .catch(err => {
                console.error('NASA Library search failed:', err);
                setError(err.message || 'Failed to search NASA library');
            })
            .finally(() => setLoading(false));
    }, [query, mediaType, yearStart, yearEnd]);

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSearch(1);
    };

    const getThumbUrl = (item) => {
        const links = item.links || [];
        const thumb = links.find(l => l.rel === 'preview');
        return thumb?.href || '';
    };

    const getItemData = (item) => {
        const data = item.data?.[0] || {};
        return {
            title: data.title || 'Untitled',
            description: data.description || '',
            date: data.date_created || '',
            nasaId: data.nasa_id || '',
            mediaType: data.media_type || 'image',
            center: data.center || '',
            keywords: data.keywords || [],
        };
    };

    // Fetch full quality media URLs
    const openItemDetail = async (item) => {
        const data = getItemData(item);
        const thumbUrl = getThumbUrl(item);
        setSelectedItem({ ...item, ...data, thumbUrl });
        setMediaUrls(null);

        // Fetch high-quality media URLs
        if (data.nasaId) {
            setLoadingMedia(true);
            try {
                const res = await getNasaLibraryAsset(data.nasaId);
                const urls = res.data?.collection?.items || [];
                setMediaUrls(urls);
            } catch (err) {
                console.error('Failed to fetch asset details:', err);
            } finally {
                setLoadingMedia(false);
            }
        }
    };

    // Get best quality URL for media type
    const getBestMediaUrl = (urls, mediaType) => {
        if (!urls || urls.length === 0) return null;

        const hrefs = urls.map(u => u.href);

        if (mediaType === 'video') {
            // Prefer mp4, then webm
            return hrefs.find(h => h.endsWith('.mp4')) ||
                hrefs.find(h => h.endsWith('.webm')) ||
                hrefs.find(h => h.includes('video'));
        }
        if (mediaType === 'audio') {
            // Prefer mp3, then wav
            return hrefs.find(h => h.endsWith('.mp3')) ||
                hrefs.find(h => h.endsWith('.wav')) ||
                hrefs.find(h => h.includes('audio'));
        }
        // Images - prefer orig, then large
        return hrefs.find(h => h.includes('~orig')) ||
            hrefs.find(h => h.includes('~large')) ||
            hrefs.find(h => h.endsWith('.jpg') || h.endsWith('.png'));
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '18px' }}>📷 NASA Image & Video Library</div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '12px', padding: '10px', border: '1px solid var(--tertiary)', background: 'var(--primary)' }}>
                <div className="field-row" style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '15px' }}>Search:</label>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., Apollo 11, Mars, Nebula..."
                        style={{ flex: 1, marginLeft: '8px', fontSize: '15px', padding: '6px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <div className="field-row">
                        <label style={{ fontSize: '14px' }}>Type:</label>
                        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} style={{ marginLeft: '4px', fontSize: '14px' }}>
                            <option value="">All</option>
                            <option value="image">🖼️ Images</option>
                            <option value="video">🎬 Videos</option>
                            <option value="audio">🔊 Audio</option>
                        </select>
                    </div>

                    <div className="field-row">
                        <label style={{ fontSize: '14px' }}>Year:</label>
                        <input
                            type="number"
                            value={yearStart}
                            onChange={(e) => setYearStart(e.target.value)}
                            placeholder="From"
                            style={{ width: '70px', marginLeft: '4px', fontSize: '14px' }}
                            min="1900"
                            max="2030"
                        />
                        <span style={{ margin: '0 4px' }}>-</span>
                        <input
                            type="number"
                            value={yearEnd}
                            onChange={(e) => setYearEnd(e.target.value)}
                            placeholder="To"
                            style={{ width: '70px', fontSize: '14px' }}
                            min="1900"
                            max="2030"
                        />
                    </div>
                </div>

                <button type="submit" className="btn nasa-btn-primary" disabled={loading} style={{ fontSize: '14px' }}>
                    {loading ? 'Searching...' : 'Search NASA'}
                </button>
            </form>

            {/* Results Count */}
            {hasSearched && !loading && (
                <div style={{ fontSize: '15px', marginBottom: '8px', opacity: 0.8 }}>
                    {totalHits > 0 ? `Found ${totalHits.toLocaleString()} results` : 'No results'}
                </div>
            )}

            {/* Error State */}
            {error && <div className="nasa-error" style={{ marginBottom: '8px', fontSize: '14px' }}>{error}</div>}

            {/* Results Grid */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: '10px',
                padding: '4px'
            }}>
                {loading ? (
                    <div className="nasa-loading" style={{ gridColumn: '1 / -1', fontSize: '15px' }}>Searching NASA archives...</div>
                ) : !hasSearched ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '64px', marginBottom: '12px' }}>🔭</div>
                        <div style={{ fontSize: '18px' }}>Search NASA's vast media archive</div>
                        <div style={{ fontSize: '15px', opacity: 0.7, marginTop: '8px' }}>
                            Over 140,000 images, videos, and audio files
                        </div>
                    </div>
                ) : (
                    results.map((item, idx) => {
                        const data = getItemData(item);
                        const thumbUrl = getThumbUrl(item);
                        const style = MEDIA_STYLES[data.mediaType] || MEDIA_STYLES.image;

                        return (
                            <div
                                key={data.nasaId || idx}
                                onClick={() => openItemDetail(item)}
                                style={{
                                    cursor: 'pointer',
                                    border: '2px solid var(--secondary)',
                                    padding: '6px',
                                    background: 'var(--primary)',
                                    position: 'relative',
                                }}
                            >
                                {/* Media Type Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: style.color,
                                    color: 'white',
                                    padding: '3px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    zIndex: 1,
                                }}>
                                    {style.icon} {style.label}
                                </div>

                                {thumbUrl ? (
                                    <img
                                        src={thumbUrl}
                                        alt={data.title}
                                        style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div style={{
                                        height: '120px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: '#333',
                                        fontSize: '48px'
                                    }}>
                                        {style.icon}
                                    </div>
                                )}
                                <div style={{
                                    fontSize: '14px',
                                    marginTop: '6px',
                                    fontWeight: 'bold',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {data.title.substring(0, 40)}...
                                </div>
                                <div style={{ fontSize: '13px', opacity: 0.7 }}>
                                    {data.date ? new Date(data.date).getFullYear() : 'Unknown year'}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Pagination */}
            {results.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <button
                        className="btn"
                        onClick={() => handleSearch(page - 1)}
                        disabled={page === 1 || loading}
                    >
                        ◀ Prev
                    </button>
                    <span style={{ padding: '6px 12px', fontSize: '14px' }}>Page {page}</span>
                    <button
                        className="btn"
                        onClick={() => handleSearch(page + 1)}
                        disabled={results.length < 100 || loading}
                    >
                        Next ▶
                    </button>
                </div>
            )}

            {/* Detail Modal with Native Media Handlers */}
            {selectedItem && (
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
                        padding: '20px',
                    }}
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            padding: '16px',
                            border: '3px solid var(--secondary)',
                            maxWidth: '800px',
                            maxHeight: '90vh',
                            overflow: 'auto',
                            width: '100%'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Media Type Badge in Modal */}
                        {(() => {
                            const style = MEDIA_STYLES[selectedItem.mediaType] || MEDIA_STYLES.image;
                            return (
                                <div style={{
                                    display: 'inline-block',
                                    background: style.color,
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    marginBottom: '12px'
                                }}>
                                    {style.icon} {style.label}
                                </div>
                            );
                        })()}

                        {/* Native Media Handlers */}
                        {loadingMedia ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>Loading media...</div>
                        ) : selectedItem.mediaType === 'video' && mediaUrls ? (
                            <video
                                controls
                                style={{ width: '100%', maxHeight: '400px', background: '#000' }}
                                src={getBestMediaUrl(mediaUrls, 'video')}
                            >
                                Your browser does not support video playback.
                            </video>
                        ) : selectedItem.mediaType === 'audio' && mediaUrls ? (
                            <div style={{ padding: '20px', background: '#1a1a2e', borderRadius: '8px' }}>
                                <div style={{ textAlign: 'center', fontSize: '64px', marginBottom: '16px' }}>🔊</div>
                                <audio
                                    controls
                                    style={{ width: '100%' }}
                                    src={getBestMediaUrl(mediaUrls, 'audio')}
                                >
                                    Your browser does not support audio playback.
                                </audio>
                            </div>
                        ) : (
                            selectedItem.thumbUrl && (
                                <img
                                    src={mediaUrls ? (getBestMediaUrl(mediaUrls, 'image') || selectedItem.thumbUrl) : selectedItem.thumbUrl}
                                    alt={selectedItem.title}
                                    style={{ maxWidth: '100%', maxHeight: '450px', display: 'block', margin: '0 auto' }}
                                />
                            )
                        )}

                        <div style={{ marginTop: '16px' }}>
                            <h3 style={{ fontSize: '18px', marginBottom: '10px' }}>{selectedItem.title}</h3>

                            {selectedItem.date && (
                                <div style={{ fontSize: '15px', marginBottom: '6px' }}>
                                    <strong>Date:</strong> {new Date(selectedItem.date).toLocaleDateString()}
                                </div>
                            )}

                            {selectedItem.center && (
                                <div style={{ fontSize: '15px', marginBottom: '6px' }}>
                                    <strong>Center:</strong> {selectedItem.center}
                                </div>
                            )}

                            {selectedItem.description && (
                                <div style={{ fontSize: '14px', marginTop: '10px', maxHeight: '150px', overflow: 'auto', lineHeight: '1.5' }}>
                                    {selectedItem.description.substring(0, 600)}
                                    {selectedItem.description.length > 600 && '...'}
                                </div>
                            )}

                            {selectedItem.keywords?.length > 0 && (
                                <div style={{ fontSize: '13px', marginTop: '10px', opacity: 0.8 }}>
                                    <strong>Tags:</strong> {selectedItem.keywords.slice(0, 8).join(', ')}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <SaveButton
                                itemType="nasa-library"
                                itemId={`nasa-lib-${selectedItem.nasaId}`}
                                itemDate={selectedItem.date || ''}
                                itemData={{
                                    title: selectedItem.title,
                                    description: selectedItem.description?.substring(0, 200),
                                    url: selectedItem.thumbUrl,
                                    date: selectedItem.date,
                                    center: selectedItem.center,
                                    mediaType: selectedItem.mediaType,
                                }}
                            />

                            {/* High Quality Download Link */}
                            {mediaUrls && (
                                <a
                                    href={getBestMediaUrl(mediaUrls, selectedItem.mediaType)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn"
                                    style={{ fontSize: '14px' }}
                                >
                                    ⬇️ Open Full Quality
                                </a>
                            )}

                            <button className="btn" onClick={() => setSelectedItem(null)} style={{ fontSize: '14px' }}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

NasaLibraryApp.propTypes = {
    windowId: PropTypes.string,
};

NasaLibraryApp.defaultProps = {
    windowId: null,
};
