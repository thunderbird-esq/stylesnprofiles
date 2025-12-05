import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

/**
 * Techport App - NASA Technology Projects
 * Simplified implementation with working API calls
 * @component
 */
export default function TechportApp({ windowId: _windowId }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    // Sample featured projects (hardcoded IDs that are known to work)
    const FEATURED_IDS = [
        17700, 93617, 94234, 94385, 96541, 95987, 88534, 91815, 93746, 94127,
        88071, 95548, 91454, 94720, 95326, 93218, 96088, 94891, 88163, 91627
    ];

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError(null);

            try {
                const apiKey = localStorage.getItem('nasa_api_key') || 'DEMO_KEY';

                // Fetch details for featured projects
                const projectPromises = FEATURED_IDS.slice(0, 12).map(id =>
                    axios.get(`https://api.nasa.gov/techport/api/projects/${id}`, {
                        params: { api_key: apiKey }
                    }).catch(() => null) // Ignore individual failures
                );

                const results = await Promise.all(projectPromises);
                const validProjects = results
                    .filter(r => r?.data?.project)
                    .map(r => r.data.project);

                setProjects(validProjects);

                if (validProjects.length === 0) {
                    setError('Could not load projects. API may be slow - try again later.');
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

    const getStatusStyle = (status) => {
        const s = (status || '').toLowerCase();
        if (s.includes('active') || s.includes('ongoing')) return { color: '#4caf50', label: '🟢 Active' };
        if (s.includes('completed')) return { color: '#2196f3', label: '✅ Completed' };
        if (s.includes('cancelled')) return { color: '#9e9e9e', label: '❌ Cancelled' };
        return { color: '#ff9800', label: status || 'Unknown' };
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
                <div style={{ fontSize: '20px', marginBottom: '6px' }}>🔬 NASA Techport</div>
                <div style={{ fontSize: '14px', opacity: 0.7 }}>
                    Technology Projects & Innovations • {projects.length} projects
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ padding: '10px 12px', background: '#550000', fontSize: '16px' }}>
                    {error}
                </div>
            )}

            {/* Projects */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', fontSize: '20px' }}>
                        🚀 Loading NASA projects...
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '12px',
                    }}>
                        {projects.map((project) => {
                            const status = getStatusStyle(project.statusDescription);
                            return (
                                <div
                                    key={project.projectId}
                                    onClick={() => setSelectedProject(project)}
                                    style={{
                                        padding: '14px',
                                        background: '#1a1a2e',
                                        border: `2px solid ${status.color}`,
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🚀</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '6px' }}>
                                        {project.title?.substring(0, 50) || `Project ${project.projectId}`}
                                        {project.title?.length > 50 ? '...' : ''}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        padding: '3px 8px',
                                        background: status.color,
                                        color: '#fff',
                                        display: 'inline-block',
                                        borderRadius: '10px',
                                    }}>
                                        {status.label}
                                    </div>
                                    {project.startYear && (
                                        <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.7 }}>
                                            Started: {project.startYear}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
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
                    onClick={() => setSelectedProject(null)}
                >
                    <div
                        style={{
                            background: '#1a1a2e',
                            padding: '24px',
                            border: `3px solid ${getStatusStyle(selectedProject.statusDescription).color}`,
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            width: '100%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>
                            🚀 {selectedProject.title || `Project ${selectedProject.projectId}`}
                        </h3>

                        <div style={{ fontSize: '16px', lineHeight: 1.7 }}>
                            {selectedProject.description && (
                                <p style={{ marginBottom: '16px' }}>{selectedProject.description}</p>
                            )}

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px',
                            }}>
                                {selectedProject.statusDescription && (
                                    <div style={infoBox}>
                                        <strong>Status:</strong><br />
                                        {getStatusStyle(selectedProject.statusDescription).label}
                                    </div>
                                )}
                                {selectedProject.startYear && (
                                    <div style={infoBox}>
                                        <strong>Started:</strong><br />
                                        {selectedProject.startYear}
                                    </div>
                                )}
                                {selectedProject.endYear && (
                                    <div style={infoBox}>
                                        <strong>Ended:</strong><br />
                                        {selectedProject.endYear}
                                    </div>
                                )}
                                {selectedProject.responsibleMd && (
                                    <div style={infoBox}>
                                        <strong>Office:</strong><br />
                                        {selectedProject.responsibleMd}
                                    </div>
                                )}
                            </div>

                            {selectedProject.website && (
                                <p>
                                    <a
                                        href={selectedProject.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#4a9eff' }}
                                    >
                                        🔗 Visit Project Website →
                                    </a>
                                </p>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedProject(null)}
                            style={{
                                marginTop: '16px',
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

const infoBox = {
    padding: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid #333',
};

TechportApp.propTypes = {
    windowId: PropTypes.string,
};

TechportApp.defaultProps = {
    windowId: null,
};
