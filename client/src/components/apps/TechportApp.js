import React, { useState, useEffect } from 'react';
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

    // Known working project IDs
    const FEATURED_IDS = [17700, 93617, 94234, 94385, 96541, 95987, 88534, 91815, 93746, 94127, 88071, 95548];

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError(null);

            try {
                const apiKey = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';

                const projectPromises = FEATURED_IDS.slice(0, 10).map(id =>
                    axios.get(`https://api.nasa.gov/techport/api/projects/${id}`, {
                        params: { api_key: apiKey }
                    }).catch(() => null)
                );

                const results = await Promise.all(projectPromises);
                const validProjects = results
                    .filter(r => r?.data?.project)
                    .map(r => r.data.project);

                setProjects(validProjects);
                if (validProjects.length === 0) {
                    setError('Could not load projects. Try again later.');
                }
            } catch (err) {
                console.error('Techport error:', err);
                setError('Failed to load NASA projects.');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const getStatusIcon = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('active') || s.includes('ongoing')) return '🟢';
        if (s.includes('completed')) return '✅';
        if (s.includes('cancelled')) return '❌';
        return '🟡';
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div className="nasa-data-title">🔬 NASA Techport</div>
            <div style={{ fontSize: '11px', marginBottom: '8px', opacity: 0.8 }}>
                Technology Projects & Innovations • {projects.length} loaded
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '11px', marginBottom: '6px' }}>{error}</div>}

            {/* Projects List */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading">Loading NASA projects...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {projects.map((project) => (
                            <div
                                key={project.projectId}
                                onClick={() => setSelectedProject(project)}
                                style={{
                                    padding: '8px',
                                    border: '1px solid var(--secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '8px',
                                }}
                            >
                                <span style={{ fontSize: '18px' }}>🚀</span>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                                        {project.title?.substring(0, 50)}{project.title?.length > 50 ? '…' : ''}
                                    </div>
                                    <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '2px' }}>
                                        {getStatusIcon(project.statusDescription)} {project.statusDescription || 'Unknown'}
                                        {project.startYear && ` • Started ${project.startYear}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Project Detail Modal - System 6 Style */}
            {selectedProject && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(128,128,128,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setSelectedProject(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            border: '2px solid var(--secondary)',
                            boxShadow: '4px 4px 0 var(--secondary)',
                            maxWidth: '500px',
                            maxHeight: '70vh',
                            overflow: 'auto',
                            width: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Title Bar */}
                        <div style={{
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            justifyContent: 'space-between',
                        }}>
                            <span>🚀 Project Details</span>
                            <button
                                onClick={() => setSelectedProject(null)}
                                style={{
                                    background: 'var(--primary)',
                                    color: 'var(--secondary)',
                                    border: '1px solid var(--primary)',
                                    padding: '0 6px',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{ padding: '12px', fontSize: '12px' }}>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>{selectedProject.title}</h3>

                            {selectedProject.description && (
                                <p style={{ marginBottom: '10px', lineHeight: 1.4, fontSize: '11px' }}>
                                    {selectedProject.description}
                                </p>
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
                                {selectedProject.endYear && (
                                    <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Ended</div>
                                        <div>{selectedProject.endYear}</div>
                                    </div>
                                )}
                                {selectedProject.responsibleMd && (
                                    <div style={{ padding: '6px', border: '1px solid var(--tertiary)' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Office</div>
                                        <div>{selectedProject.responsibleMd}</div>
                                    </div>
                                )}
                            </div>

                            {selectedProject.website && (
                                <div style={{ marginBottom: '10px' }}>
                                    <a
                                        href={selectedProject.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#00c', fontSize: '11px' }}
                                    >
                                        🔗 Visit Project Website →
                                    </a>
                                </div>
                            )}

                            <button
                                onClick={() => setSelectedProject(null)}
                                className="btn"
                                style={{ width: '100%', fontSize: '12px' }}
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

TechportApp.propTypes = {
    windowId: PropTypes.string,
};

TechportApp.defaultProps = {
    windowId: null,
};
