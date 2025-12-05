import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Exoplanet Explorer - NASA Exoplanet Archive
 * Apple System 6 HIG styling with discovery visualization
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
            // Build query - use URL encoding for safety
            let query = 'select top 100 pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_bmasse,sy_dist from ps';
            if (searchQuery.trim()) {
                const search = searchQuery.trim().replace(/'/g, "''"); // Escape quotes
                query = `select top 100 pl_name,hostname,disc_year,discoverymethod,pl_orbper,pl_rade,pl_bmasse,sy_dist from ps where pl_name like '%${search}%' or hostname like '%${search}%'`;
            }
            query += ' order by disc_year desc';

            console.log('Exoplanet query:', query);

            const response = await axios.get('https://exoplanetarchive.ipac.caltech.edu/TAP/sync', {
                params: { query, format: 'json' },
                timeout: 30000, // 30 second timeout
            });

            console.log('Exoplanet response:', response.data);
            const data = Array.isArray(response.data) ? response.data : [];
            setPlanets(data);
            if (data.length === 0) setError('No exoplanets found.');
        } catch (err) {
            console.error('Exoplanet fetch error:', err);
            if (err.code === 'ECONNABORTED') {
                setError('Request timed out. Try again.');
            } else if (err.response?.status === 400) {
                setError('Invalid search query.');
            } else {
                setError('Failed to load exoplanet data. Check console.');
            }
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    // Fetch on mount
    useEffect(() => {
        fetchPlanets();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSearch = (e) => {
        e.preventDefault();
        fetchPlanets();
    };

    const formatDistance = (dist) => dist ? `${dist.toFixed(1)} ly` : 'Unknown';
    const formatMass = (mass) => {
        if (!mass) return 'Unknown';
        return mass > 100 ? `${(mass / 317.8).toFixed(1)} Jupiter` : `${mass.toFixed(1)} Earth`;
    };
    const formatRadius = (radius) => {
        if (!radius) return 'Unknown';
        return radius > 5 ? `${(radius / 11.2).toFixed(2)} Jupiter` : `${radius.toFixed(2)} Earth`;
    };

    const getPlanetType = (radius, mass) => {
        if (!radius) {
            if (mass && mass > 100) return { label: 'Gas Giant', icon: '🟠' };
            return { label: 'Unknown', icon: '❓' };
        }
        if (radius < 1.5) return { label: 'Rocky', icon: '🪨' };
        if (radius < 2.5) return { label: 'Super-Earth', icon: '🌍' };
        if (radius < 6) return { label: 'Neptune-like', icon: '🔵' };
        return { label: 'Gas Giant', icon: '🟠' };
    };

    // Discovery year histogram
    const yearHistogram = useMemo(() => {
        const counts = {};
        planets.forEach(p => {
            const year = p.disc_year;
            if (year) counts[year] = (counts[year] || 0) + 1;
        });
        return counts;
    }, [planets]);

    const years = Object.keys(yearHistogram).map(Number).sort((a, b) => a - b);
    const maxCount = Math.max(...Object.values(yearHistogram), 1);

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">🪐 Exoplanet Explorer</div>
            <div style={{ fontSize: '11px', marginBottom: '6px', opacity: 0.8 }}>
                NASA Exoplanet Archive • {planets.length} planets loaded
            </div>

            {/* Discovery Timeline */}
            {years.length > 0 && (
                <div style={{ marginBottom: '8px', padding: '4px', border: '1px solid var(--tertiary)', fontSize: '9px' }}>
                    <div style={{ marginBottom: '2px', fontWeight: 'bold' }}>Discoveries by Year:</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '20px', gap: '1px' }}>
                        {years.slice(-15).map(year => (
                            <div
                                key={year}
                                title={`${year}: ${yearHistogram[year]} planets`}
                                style={{
                                    flex: 1,
                                    background: 'var(--secondary)',
                                    height: `${(yearHistogram[year] / maxCount) * 100}%`,
                                    minHeight: '2px',
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                        <span>{years.slice(-15)[0]}</span>
                        <span>{years[years.length - 1]}</span>
                    </div>
                </div>
            )}

            {/* Search */}
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search planet or star..."
                    style={{ flex: 1, fontSize: '11px', padding: '4px' }}
                />
                <button type="submit" className="btn" disabled={loading} style={{ fontSize: '11px' }}>
                    {loading ? '...' : 'Search'}
                </button>
            </form>

            {error && <div className="nasa-error" style={{ fontSize: '11px', marginBottom: '6px' }}>{error}</div>}

            {/* Planets List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading">Scanning the galaxy...</div>
                ) : planets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔭</div>
                        <div>No planets found. Try a different search.</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {planets.map((planet, idx) => {
                            const type = getPlanetType(planet.pl_rade, planet.pl_bmasse);
                            return (
                                <div
                                    key={`${planet.pl_name}-${idx}`}
                                    onClick={() => setSelectedPlanet(planet)}
                                    style={{
                                        padding: '6px 8px',
                                        border: '1px solid var(--secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <span style={{ fontSize: '18px' }}>{type.icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{planet.pl_name}</div>
                                        <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                            ⭐ {planet.hostname} • {planet.disc_year || '?'} • {type.label}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.6, textAlign: 'right' }}>
                                        {planet.sy_dist ? `${Math.round(planet.sy_dist)} ly` : ''}
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
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(128,128,128,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                    onClick={() => setSelectedPlanet(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)', border: '2px solid var(--secondary)',
                            boxShadow: '4px 4px 0 var(--secondary)',
                            maxWidth: '400px', maxHeight: '70vh', overflow: 'auto', width: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            background: 'var(--secondary)', color: 'var(--primary)',
                            padding: '4px 8px', fontSize: '12px', fontWeight: 'bold',
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span>{getPlanetType(selectedPlanet.pl_rade, selectedPlanet.pl_bmasse).icon} {selectedPlanet.pl_name}</span>
                            <button onClick={() => setSelectedPlanet(null)} style={{ background: 'var(--primary)', color: 'var(--secondary)', border: '1px solid var(--primary)', padding: '0 6px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                        </div>

                        <div style={{ padding: '12px', fontSize: '12px' }}>
                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                <div style={{ fontSize: '48px' }}>{getPlanetType(selectedPlanet.pl_rade, selectedPlanet.pl_bmasse).icon}</div>
                                <div style={{ fontSize: '11px', opacity: 0.8 }}>⭐ Host Star: {selectedPlanet.hostname}</div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>📅 Discovered</div>
                                    <div>{selectedPlanet.disc_year || 'Unknown'}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>🔬 Method</div>
                                    <div>{selectedPlanet.discoverymethod || 'Unknown'}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>📏 Radius</div>
                                    <div>{formatRadius(selectedPlanet.pl_rade)}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>⚖️ Mass</div>
                                    <div>{formatMass(selectedPlanet.pl_bmasse)}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>🔄 Orbit</div>
                                    <div>{selectedPlanet.pl_orbper ? `${selectedPlanet.pl_orbper.toFixed(1)} days` : 'Unknown'}</div>
                                </div>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>📍 Distance</div>
                                    <div>{formatDistance(selectedPlanet.sy_dist)}</div>
                                </div>
                            </div>

                            <button onClick={() => setSelectedPlanet(null)} className="btn" style={{ marginTop: '10px', width: '100%', fontSize: '12px' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

ExoplanetApp.propTypes = { windowId: PropTypes.string };
ExoplanetApp.defaultProps = { windowId: null };
