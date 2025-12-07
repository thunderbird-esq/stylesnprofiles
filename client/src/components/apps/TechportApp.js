import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Techport App - NASA Technology Projects
 * Apple System 6 HIG styling
 * @component
 */
export default function TechportApp({ windowId: _windowId }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    // Get API key - user's key or demo
    const getApiKey = () => {
        return localStorage.getItem('nasa_api_key') || 'DEMO_KEY';
    };

    // Known working project IDs
    const FEATURED_IDS = [17700, 93617, 94234, 94385, 96541, 95987, 88534, 91815, 93746, 94127];

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);

        const apiKey = getApiKey();
        console.log('Techport using API key:', apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'User key');

        try {
            // Fetch projects sequentially to avoid rate limits
            const validProjects = [];

            for (const id of FEATURED_IDS.slice(0, 8)) {
                try {
                    // Try direct API call first
                    let response;
                    try {
                        response = await axios.get(
                            `https://api.nasa.gov/techport/api/projects/${id}`,
                            {
                                params: { api_key: apiKey },
                                timeout: 15000,
                            }
                        );
                    } catch (directErr) {
                        // If CORS error, try with proxy
                        console.log(`Techport project ${id} direct failed, trying proxy...`);
                        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.nasa.gov/techport/api/projects/${id}?api_key=${apiKey}`)}`;
                        const proxyResponse = await axios.get(proxyUrl, { timeout: 15000 });
                        response = { data: JSON.parse(proxyResponse.data.contents) };
                    }

                    if (response.data?.project) {
                        validProjects.push(response.data.project);
                        console.log(`✓ Loaded project ${id}: ${response.data.project.title}`);
                    }

                    // Small delay between requests
                    await new Promise(r => setTimeout(r, 200));
                } catch (err) {
                    console.warn(`Techport project ${id} failed:`, err.message);

                    // If rate limited, show message and stop
                    if (err.response?.data?.error?.code === 'OVER_RATE_LIMIT') {
                        setError('Rate limited. Add your NASA API key in Settings.');
                        break;
                    }
                }
            }

            setProjects(validProjects);

            if (validProjects.length === 0 && !error) {
                setError('Could not load projects. The Techport API may be temporarily unavailable.');
            }
        } catch (err) {
            console.error('Techport error:', err);
            setError(`Failed to load NASA projects: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const getStatusIcon = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('active') || s.includes('ongoing')) return '🟢';
        if (s.includes('completed')) return '✅';
        if (s.includes('cancelled')) return '❌';
        return '🟡';
    };

    // Get project icon based on mission type/keywords
    const getProjectIcon = (project) => {
        const title = (project.title || '').toLowerCase();
        const desc = (project.description || '').toLowerCase();
        const text = title + ' ' + desc;
        if (text.includes('lunar') || text.includes('moon')) return '🌙';
        if (text.includes('mars')) return '🔴';
        if (text.includes('satellite') || text.includes('orbit')) return '🛰️';
        if (text.includes('propulsion') || text.includes('engine')) return '🚀';
        if (text.includes('solar') || text.includes('sun')) return '☀️';
        if (text.includes('robot') || text.includes('rover')) return '🤖';
        if (text.includes('material') || text.includes('thermal')) return '🧪';
        if (text.includes('communication') || text.includes('antenna')) return '📡';
        if (text.includes('habitat') || text.includes('life support')) return '🏠';
        return '💻';
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title">🔬 NASA Techport</div>
            <div style={{ fontSize: '11px', marginBottom: '8px', opacity: 0.8 }}>
                Technology Projects • {projects.length} loaded
            </div>

            {/* API Key Status */}
            <div style={{
                fontSize: '10px',
                marginBottom: '8px',
                padding: '4px 6px',
                background: getApiKey() === 'DEMO_KEY' ? '#ffc' : '#cfc',
                border: '1px solid var(--tertiary)',
            }}>
                {getApiKey() === 'DEMO_KEY'
                    ? '⚠️ Using DEMO_KEY (rate limited). Add your key in Settings.'
                    : '✓ Using your API key'}
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '11px', marginBottom: '6px' }}>{error}</div>}

            {/* Projects List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading">Loading NASA projects...</div>
                ) : projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔬</div>
                        <div>No projects loaded.</div>
                        <button className="btn" onClick={fetchProjects} style={{ marginTop: '10px' }}>Retry</button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {projects.map((project) => (
                            <div
                                key={project.projectId}
                                onClick={() => setSelectedProject(project)}
                                style={{
                                    padding: '10px',
                                    border: '2px solid var(--secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '10px',
                                    background: 'var(--primary)',
                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '3px 3px 0 var(--secondary)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'none';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <span style={{ fontSize: '24px' }}>{getProjectIcon(project)}</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'bold' }}>
                                        {project.title?.substring(0, 50)}{project.title?.length > 50 ? '…' : ''}
                                    </div>
                                    <div style={{ fontSize: 'var(--font-size-base)', opacity: 0.7, marginTop: '4px' }}>
                                        {getStatusIcon(project.statusDescription)} {project.statusDescription || 'Unknown'}
                                        {project.startYear && ` • Started ${project.startYear}`}
                                    </div>
                                </div>
                                <span style={{ fontSize: '18px', opacity: 0.5 }}>▶</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(128,128,128,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                    onClick={() => setSelectedProject(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)', border: '2px solid var(--secondary)',
                            boxShadow: '4px 4px 0 var(--secondary)',
                            maxWidth: '500px', maxHeight: '70vh', overflow: 'auto', width: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            background: 'var(--secondary)', color: 'var(--primary)',
                            padding: '4px 8px', fontSize: '12px', fontWeight: 'bold',
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span>🚀 Project Details</span>
                            <button onClick={() => setSelectedProject(null)} style={{ background: 'var(--primary)', color: 'var(--secondary)', border: '1px solid var(--primary)', padding: '0 6px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                        </div>

                        <div style={{ padding: '12px', fontSize: '12px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{selectedProject.title}</h3>

                            {selectedProject.description && (
                                <p style={{ marginBottom: '10px', lineHeight: 1.4, fontSize: '11px' }}>{selectedProject.description}</p>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                                <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Status</div>
                                    <div>{getStatusIcon(selectedProject.statusDescription)} {selectedProject.statusDescription}</div>
                                </div>
                                {selectedProject.startYear && (
                                    <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Started</div>
                                        <div>{selectedProject.startYear}</div>
                                    </div>
                                )}
                            </div>

                            {selectedProject.website && (
                                <div style={{ marginBottom: '10px' }}>
                                    <a href={selectedProject.website} target="_blank" rel="noopener noreferrer" style={{ color: '#00c', fontSize: '11px' }}>
                                        🔗 Visit Project Website →
                                    </a>
                                </div>
                            )}

                            <button onClick={() => setSelectedProject(null)} className="btn" style={{ width: '100%', fontSize: '12px' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

TechportApp.propTypes = { windowId: PropTypes.string };
TechportApp.defaultProps = { windowId: null };
