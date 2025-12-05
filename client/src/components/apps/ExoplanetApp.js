import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getExoplanets } from '../../services/nasaApi';

/**
 * Exoplanet Explorer - NASA Exoplanet Archive
 * @component
 */
export default function ExoplanetApp({ windowId: _windowId }) {
    const [planets, setPlanets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlanet, setSelectedPlanet] = useState(null);

    const fetchPlanets = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getExoplanets({ query: searchQuery || undefined, limit: 100 });
            const data = Array.isArray(response.data) ? response.data : [];
            setPlanets(data);
            if (data.length === 0) {
                setError('No exoplanets found. Try a different search.');
            }
        } catch (err) {
            console.error('Exoplanet fetch error:', err);
            setError('Failed to load exoplanet data');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchPlanets();
    }, [fetchPlanets]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPlanets();
    };

    const formatDistance = (dist) => {
        if (!dist) return 'Unknown';
        return `${dist.toFixed(1)} light years`;
    };

    const formatMass = (mass) => {
        if (!mass) return 'Unknown';
        return `${mass.toFixed(2)} Earth masses`;
    };

    const formatRadius = (radius) => {
        if (!radius) return 'Unknown';
        return `${radius.toFixed(2)} Earth radii`;
    };

    const getPlanetSize = (radius) => {
        if (!radius) return { label: 'Unknown', color: '#9e9e9e' };
        if (radius < 1.5) return { label: 'Rocky', color: '#8b4513' };
        if (radius < 4) return { label: 'Super-Earth', color: '#4caf50' };
        if (radius < 10) return { label: 'Neptune-like', color: '#2196f3' };
        return { label: 'Gas Giant', color: '#ff9800' };
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>🪐 Exoplanet Explorer</div>
            <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8 }}>
                NASA Exoplanet Archive - {planets.length} planets loaded
            </div>

            {/* Search Form */}
            <form onSubmit={handleSearch} style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by planet or star name..."
                    style={{ flex: 1, fontSize: '16px', padding: '8px' }}
                />
                <button type="submit" className="btn nasa-btn-primary" style={{ fontSize: '16px' }}>
                    Search
                </button>
            </form>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>}

            {/* Planets Grid */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px' }}>Scanning the galaxy...</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '10px',
                    }}>
                        {planets.map((planet, idx) => {
                            const size = getPlanetSize(planet.pl_rade);
                            return (
                                <div
                                    key={`${planet.pl_name}-${idx}`}
                                    onClick={() => setSelectedPlanet(planet)}
                                    style={{
                                        padding: '12px',
                                        border: `2px solid ${size.color}`,
                                        background: 'var(--primary)',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{
                                        fontSize: '48px',
                                        marginBottom: '6px',
                                        filter: `hue-rotate(${(planet.disc_year || 2000) % 360}deg)`
                                    }}>
                                        🪐
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {planet.pl_name}
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.8 }}>
                                        ⭐ {planet.hostname}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        marginTop: '4px',
                                        padding: '2px 6px',
                                        background: size.color,
                                        color: 'white',
                                        display: 'inline-block',
                                        borderRadius: '8px',
                                    }}>
                                        {size.label}
                                    </div>
                                    <div style={{ fontSize: '13px', marginTop: '4px', opacity: 0.7 }}>
                                        Discovered {planet.disc_year || '?'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Planet Detail Modal */}
            {selectedPlanet && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                    }}
                    onClick={() => setSelectedPlanet(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            padding: '20px',
                            border: `3px solid ${getPlanetSize(selectedPlanet.pl_rade).color}`,
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                            <div style={{ fontSize: '72px' }}>🪐</div>
                            <h3 style={{ fontSize: '24px', marginBottom: '4px' }}>{selectedPlanet.pl_name}</h3>
                            <div style={{ fontSize: '18px', opacity: 0.8 }}>Host Star: {selectedPlanet.hostname}</div>
                        </div>

                        <div style={{ fontSize: '16px', lineHeight: 1.8 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <strong>📅 Discovered:</strong>
                                    <div>{selectedPlanet.disc_year || 'Unknown'}</div>
                                </div>
                                <div>
                                    <strong>🔬 Method:</strong>
                                    <div>{selectedPlanet.discoverymethod || 'Unknown'}</div>
                                </div>
                                <div>
                                    <strong>📏 Radius:</strong>
                                    <div>{formatRadius(selectedPlanet.pl_rade)}</div>
                                </div>
                                <div>
                                    <strong>⚖️ Mass:</strong>
                                    <div>{formatMass(selectedPlanet.pl_bmasse)}</div>
                                </div>
                                <div>
                                    <strong>🔄 Orbital Period:</strong>
                                    <div>{selectedPlanet.pl_orbper ? `${selectedPlanet.pl_orbper.toFixed(2)} days` : 'Unknown'}</div>
                                </div>
                                <div>
                                    <strong>📍 Distance:</strong>
                                    <div>{formatDistance(selectedPlanet.sy_dist)}</div>
                                </div>
                            </div>
                        </div>

                        <button className="btn" onClick={() => setSelectedPlanet(null)} style={{ marginTop: '16px', fontSize: '16px', width: '100%' }}>
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

ExoplanetApp.propTypes = {
    windowId: PropTypes.string,
};

ExoplanetApp.defaultProps = {
    windowId: null,
};
