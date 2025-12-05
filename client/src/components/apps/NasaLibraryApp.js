import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { searchNasaLibrary } from '../../services/nasaApi';
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

    // Search parameters
    const [query, setQuery] = useState('');
    const [mediaType, setMediaType] = useState('');
    const [yearStart, setYearStart] = useState('');
    const [yearEnd, setYearEnd] = useState('');
    const [page, setPage] = useState(1);
    const [totalHits, setTotalHits] = useState(0);

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

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">📷 NASA Image & Video Library</div>

            {/* Search Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '12px', padding: '8px', border: '1px solid var(--tertiary)', background: 'var(--primary)' }}>
                <div className="field-row" style={{ marginBottom: '8px' }}>
                    <label>Search:</label>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="e.g., Apollo 11, Mars, Nebula..."
                        style={{ flex: 1, marginLeft: '8px' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
                    <div className="field-row">
                        <label>Type:</label>
                        <select value={mediaType} onChange={(e) => setMediaType(e.target.value)} style={{ marginLeft: '4px' }}>
                            <option value="">All</option>
                            <option value="image">Images</option>
                            <option value="video">Videos</option>
                            <option value="audio">Audio</option>
                        </select>
                    </div>

                    <div className="field-row">
                        <label>Year:</label>
                        <input
                            type="number"
                            value={yearStart}
                            onChange={(e) => setYearStart(e.target.value)}
                            placeholder="From"
                            style={{ width: '60px', marginLeft: '4px' }}
                            min="1900"
                            max="2030"
                        />
                        <span style={{ margin: '0 4px' }}>-</span>
                        <input
                            type="number"
                            value={yearEnd}
                            onChange={(e) => setYearEnd(e.target.value)}
                            placeholder="To"
                            style={{ width: '60px' }}
                            min="1900"
                            max="2030"
                        />
                    </div>
                </div>

                <button type="submit" className="btn nasa-btn-primary" disabled={loading}>
                    {loading ? 'Searching...' : 'Search NASA'}
                </button>
            </form>

            {/* Results Count */}
            {hasSearched && !loading && (
                <div style={{ fontSize: '13px', marginBottom: '8px', opacity: 0.8 }}>
                    {totalHits > 0 ? `Found ${totalHits.toLocaleString()} results` : 'No results'}
                </div>
            )}

            {/* Error State */}
            {error && <div className="nasa-error" style={{ marginBottom: '8px' }}>{error}</div>}

            {/* Results Grid */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '8px',
                padding: '4px'
            }}>
                {loading ? (
                    <div className="nasa-loading" style={{ gridColumn: '1 / -1' }}>Searching NASA archives...</div>
                ) : !hasSearched ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔭</div>
                        <div style={{ fontSize: '15px' }}>Search NASA's vast media archive</div>
                        <div style={{ fontSize: '13px', opacity: 0.7, marginTop: '8px' }}>
                            Over 140,000 images, videos, and audio files
                        </div>
                    </div>
                ) : (
                    results.map((item, idx) => {
                        const data = getItemData(item);
                        const thumbUrl = getThumbUrl(item);

                        return (
                            <div
                                key={data.nasaId || idx}
                                onClick={() => setSelectedItem({ ...item, ...data, thumbUrl })}
                                style={{
                                    cursor: 'pointer',
                                    border: '2px solid var(--secondary)',
                                    padding: '4px',
                                    background: 'var(--primary)',
                                }}
                            >
                                {thumbUrl ? (
                                    <img
                                        src={thumbUrl}
                                        alt={data.title}
                                        style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                                        loading="lazy"
                                    />
                                ) : (
                                    <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eee' }}>
                                        {data.mediaType === 'video' ? '🎬' : data.mediaType === 'audio' ? '🔊' : '📷'}
                                    </div>
                                )}
                                <div style={{ fontSize: '11px', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {data.title.substring(0, 30)}...
                                </div>
                                <div style={{ fontSize: '10px', opacity: 0.6 }}>
                                    {data.mediaType} {data.date ? `• ${data.date.substring(0, 4)}` : ''}
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
                    <span style={{ padding: '6px 12px' }}>Page {page}</span>
                    <button
                        className="btn"
                        onClick={() => handleSearch(page + 1)}
                        disabled={results.length < 100 || loading}
                    >
                        Next ▶
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {selectedItem && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
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
                            padding: '12px',
                            border: '3px solid var(--secondary)',
                            maxWidth: '700px',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            width: '100%'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {selectedItem.thumbUrl && (
                            <img
                                src={selectedItem.thumbUrl}
                                alt={selectedItem.title}
                                style={{ maxWidth: '100%', maxHeight: '400px', display: 'block', margin: '0 auto' }}
                            />
                        )}
                        <div style={{ marginTop: '12px' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>{selectedItem.title}</h3>

                            {selectedItem.date && (
                                <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                                    <strong>Date:</strong> {new Date(selectedItem.date).toLocaleDateString()}
                                </div>
                            )}

                            {selectedItem.center && (
                                <div style={{ fontSize: '13px', marginBottom: '4px' }}>
                                    <strong>Center:</strong> {selectedItem.center}
                                </div>
                            )}

                            {selectedItem.description && (
                                <div style={{ fontSize: '13px', marginTop: '8px', maxHeight: '150px', overflow: 'auto' }}>
                                    {selectedItem.description.substring(0, 500)}
                                    {selectedItem.description.length > 500 && '...'}
                                </div>
                            )}

                            {selectedItem.keywords?.length > 0 && (
                                <div style={{ fontSize: '11px', marginTop: '8px', opacity: 0.7 }}>
                                    Tags: {selectedItem.keywords.slice(0, 5).join(', ')}
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
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
                                }}
                            />
                            {selectedItem.thumbUrl && (
                                <a
                                    href={selectedItem.thumbUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn"
                                >
                                    Open Image
                                </a>
                            )}
                            <button className="btn" onClick={() => setSelectedItem(null)}>
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
