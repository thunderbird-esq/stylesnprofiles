import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Exoplanet Explorer - NASA Exoplanet Archive
 * Fixed API implementation
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
            // Use the correct TAP query format
            let query = 'select top 100 pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_bmasse,sy_dist from ps';

            if (searchQuery) {
                query = `select top 100 pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_bmasse,sy_dist from ps where pl_name like '%${searchQuery}%' or hostname like '%${searchQuery}%'`;
            }

            query += ' order by disc_year desc';

            console.log('🪐 Fetching exoplanets...');
            const response = await axios.get('https://exoplanetarchive.ipac.caltech.edu/TAP/sync', {
                params: {
                    query,
                    format: 'json'
                }
            });

            const data = Array.isArray(response.data) ? response.data : [];
            setPlanets(data);

            if (data.length === 0) {
                setError('No exoplanets found. Try a different search.');
            }
        } catch (err) {
            console.error('Exoplanet fetch error:', err);
            setError('Failed to load exoplanet data. The archive may be temporarily unavailable.');
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        fetchPlanets();
    }, []); // Only fetch on mount

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
        if (mass > 100) return `${(mass / 317.8).toFixed(1)} Jupiter masses`;
        return `${mass.toFixed(1)} Earth masses`;
    };

    const formatRadius = (radius) => {
        if (!radius) return 'Unknown';
        if (radius > 5) return `${(radius / 11.2).toFixed(2)} Jupiter radii`;
        return `${radius.toFixed(2)} Earth radii`;
    };

    const getPlanetType = (radius, mass) => {
        if (!radius) {
            if (mass && mass > 100) return { label: 'Gas Giant', color: '#ff9800', emoji: '🟠' };
            return { label: 'Unknown', color: '#9e9e9e', emoji: '❓' };
        }
        if (radius < 1.5) return { label: 'Rocky', color: '#8b4513', emoji: '🪨' };
        if (radius < 2.5) return { label: 'Super-Earth', color: '#4caf50', emoji: '🌍' };
        if (radius < 6) return { label: 'Neptune-like', color: '#2196f3', emoji: '🔵' };
        return { label: 'Gas Giant', color: '#ff9800', emoji: '🟠' };
    };

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#0a0a1a',
            color: '#fff',
            fontFamily: 'Chicago_12, Geneva_9, sans-serif',
        }}>
            {/* Header */}
            <div style={{
                padding: '10px 12px',
                background: '#1a1a2e',
                borderBottom: '1px solid #333',
            }}>
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🪐 Exoplanet Explorer</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    NASA Exoplanet Archive • {planets.length} planets loaded
                </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} style={{
                display: 'flex',
                gap: '8px',
                padding: '10px 12px',
                background: '#151528',
                borderBottom: '1px solid #333',
            }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by planet or star name..."
                    style={{
                        flex: 1,
                        fontSize: '16px',
                        padding: '8px 12px',
                        background: '#252540',
                        color: '#fff',
                        border: '1px solid #444',
                    }}
                />
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        fontSize: '16px',
                        padding: '8px 16px',
                        background: loading ? '#555' : '#0066cc',
                        color: '#fff',
                        border: 'none',
                        cursor: loading ? 'wait' : 'pointer',
                    }}
                >
                    {loading ? '...' : 'Search'}
                </button>
            </form>

            {/* Error */}
            {error && (
                <div style={{ padding: '10px 12px', background: '#550000', fontSize: '16px' }}>
                    {error}
                </div>
            )}

            {/* Planets Grid */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '20px' }}>
                        🔭 Scanning the galaxy...
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                        gap: '12px',
                    }}>
                        {planets.map((planet, idx) => {
                            const type = getPlanetType(planet.pl_rade, planet.pl_bmasse);
                            return (
                                <div
                                    key={`${planet.pl_name}-${idx}`}
                                    onClick={() => setSelectedPlanet(planet)}
                                    style={{
                                        padding: '14px',
                                        background: '#1a1a2e',
                                        border: `2px solid ${type.color}`,
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'transform 0.2s',
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ fontSize: '40px', marginBottom: '8px' }}>{type.emoji}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                        {planet.pl_name}
                                    </div>
                                    <div style={{ fontSize: '14px', opacity: 0.7 }}>
                                        ⭐ {planet.hostname}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        marginTop: '8px',
                                        padding: '3px 8px',
                                        background: type.color,
                                        color: '#fff',
                                        display: 'inline-block',
                                        borderRadius: '10px',
                                    }}>
                                        {type.label}
                                    </div>
                                    <div style={{ fontSize: '13px', marginTop: '6px', opacity: 0.6 }}>
                                        {planet.disc_year || 'Year unknown'}
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
                        background: 'rgba(0,0,0,0.95)',
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
                            background: '#1a1a2e',
                            padding: '24px',
                            border: `3px solid ${getPlanetType(selectedPlanet.pl_rade, selectedPlanet.pl_bmasse).color}`,
                            maxWidth: '500px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            width: '100%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '72px' }}>
                                {getPlanetType(selectedPlanet.pl_rade, selectedPlanet.pl_bmasse).emoji}
                            </div>
                            <h3 style={{ fontSize: '26px', marginTop: '8px', marginBottom: '4px' }}>
                                {selectedPlanet.pl_name}
                            </h3>
                            <div style={{ fontSize: '18px', opacity: 0.8 }}>
                                ⭐ Host Star: {selectedPlanet.hostname}
                            </div>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '16px',
                            fontSize: '16px',
                        }}>
                            <div style={infoBoxStyle}>
                                <div style={labelStyle}>📅 Discovered</div>
                                <div>{selectedPlanet.disc_year || 'Unknown'}</div>
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={labelStyle}>🔬 Method</div>
                                <div>{selectedPlanet.discoverymethod || 'Unknown'}</div>
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={labelStyle}>📏 Radius</div>
                                <div>{formatRadius(selectedPlanet.pl_rade)}</div>
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={labelStyle}>⚖️ Mass</div>
                                <div>{formatMass(selectedPlanet.pl_bmasse)}</div>
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={labelStyle}>🔄 Orbital Period</div>
                                <div>{selectedPlanet.pl_orbper ? `${selectedPlanet.pl_orbper.toFixed(1)} days` : 'Unknown'}</div>
                            </div>
                            <div style={infoBoxStyle}>
                                <div style={labelStyle}>📍 Distance</div>
                                <div>{formatDistance(selectedPlanet.sy_dist)}</div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPlanet(null)}
                            style={{
                                marginTop: '20px',
                                width: '100%',
                                fontSize: '18px',
                                padding: '12px',
                                background: '#0066cc',
                                color: '#fff',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const infoBoxStyle = {
    padding: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #333',
};

const labelStyle = {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '4px',
    opacity: 0.8,
};

ExoplanetApp.propTypes = {
    windowId: PropTypes.string,
};

ExoplanetApp.defaultProps = {
    windowId: null,
};
