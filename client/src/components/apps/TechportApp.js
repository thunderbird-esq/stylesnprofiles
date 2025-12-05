import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getTechportProjects, getTechportProject } from '../../services/nasaApi';

/**
 * Techport App - NASA Technology Projects
 * @component
 */
export default function TechportApp({ windowId: _windowId }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Get projects updated in the last year
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            const response = await getTechportProjects({
                updatedSince: oneYearAgo.toISOString().split('T')[0]
            });

            const data = response.data?.projects?.project || response.data?.projects || [];
            const projectList = Array.isArray(data) ? data : [data];
            setProjects(projectList.slice(0, 50)); // Limit to 50
            if (projectList.length === 0) {
                setError('No recent projects found.');
            }
        } catch (err) {
            console.error('Techport fetch error:', err);
            setError('Failed to load NASA technology projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const handleSelectProject = async (projectId) => {
        setLoadingDetails(true);
        try {
            const response = await getTechportProject(projectId);
            setSelectedProject(response.data?.project || { projectId });
        } catch (err) {
            console.error('Failed to load project details:', err);
            setSelectedProject({ projectId, error: 'Failed to load details' });
        } finally {
            setLoadingDetails(false);
        }
    };

    const getStatusColor = (status) => {
        const statusLower = (status || '').toLowerCase();
        if (statusLower.includes('active')) return '#4caf50';
        if (statusLower.includes('completed')) return '#2196f3';
        if (statusLower.includes('cancelled')) return '#9e9e9e';
        return '#ff9800';
    };

    return (
        <div className="nasa-data-section" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: '22px' }}>🔬 NASA Techport</div>
            <div style={{ fontSize: '16px', marginBottom: '10px', opacity: 0.8 }}>
                NASA Technology Projects & Innovations
            </div>

            {/* Error State */}
            {error && <div className="nasa-error" style={{ fontSize: '16px', marginBottom: '8px' }}>{error}</div>}

            {/* Projects Grid */}
            <div style={{ flex: 1, overflow: 'auto' }}>
                {loading ? (
                    <div className="nasa-loading" style={{ fontSize: '18px' }}>Loading technology projects...</div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '10px',
                    }}>
                        {projects.map((project) => (
                            <div
                                key={project.projectId}
                                onClick={() => handleSelectProject(project.projectId)}
                                style={{
                                    padding: '12px',
                                    border: '2px solid var(--secondary)',
                                    background: 'var(--primary)',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ fontSize: '28px', marginBottom: '6px' }}>🚀</div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '4px' }}>
                                    {project.title?.substring(0, 50) || `Project ${project.projectId}`}
                                    {project.title?.length > 50 ? '...' : ''}
                                </div>
                                <div style={{
                                    fontSize: '12px',
                                    padding: '2px 8px',
                                    background: getStatusColor(project.status),
                                    color: 'white',
                                    display: 'inline-block',
                                    borderRadius: '8px',
                                    marginTop: '4px',
                                }}>
                                    {project.status || 'Unknown Status'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Project Detail Modal */}
            {selectedProject && (
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
                    onClick={() => setSelectedProject(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)',
                            padding: '20px',
                            border: '3px solid var(--secondary)',
                            maxWidth: '600px',
                            maxHeight: '80vh',
                            overflow: 'auto',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {loadingDetails ? (
                            <div style={{ textAlign: 'center', padding: '40px', fontSize: '18px' }}>
                                Loading project details...
                            </div>
                        ) : (
                            <>
                                <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>
                                    🚀 {selectedProject.title || `Project ${selectedProject.projectId}`}
                                </h3>
                                <div style={{ fontSize: '16px', lineHeight: 1.6 }}>
                                    {selectedProject.description && (
                                        <p style={{ marginBottom: '12px' }}>{selectedProject.description}</p>
                                    )}

                                    {selectedProject.status && (
                                        <p><strong>Status:</strong> {selectedProject.status}</p>
                                    )}

                                    {selectedProject.startDate && (
                                        <p><strong>Started:</strong> {selectedProject.startDate}</p>
                                    )}

                                    {selectedProject.endDate && (
                                        <p><strong>End Date:</strong> {selectedProject.endDate}</p>
                                    )}

                                    {selectedProject.responsibleMissionDirectorateOrOffice && (
                                        <p><strong>Office:</strong> {selectedProject.responsibleMissionDirectorateOrOffice}</p>
                                    )}

                                    {selectedProject.website && (
                                        <p>
                                            <a href={selectedProject.website} target="_blank" rel="noopener noreferrer" style={{ color: '#4a90d9' }}>
                                                View Project Website →
                                            </a>
                                        </p>
                                    )}

                                    {selectedProject.error && (
                                        <p style={{ color: '#f44336' }}>{selectedProject.error}</p>
                                    )}
                                </div>

                                <button className="btn" onClick={() => setSelectedProject(null)} style={{ marginTop: '16px', fontSize: '16px' }}>
                                    Close
                                </button>
                            </>
                        )}
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
