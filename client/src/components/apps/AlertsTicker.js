/**
 * AlertsTicker.js
 * Enhanced scrolling ticker of recent NOAA space weather alerts
 * Features: Category filters, color coding, expand/collapse, timeline
 * Apple System 6 HIG styling
 */

import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getNotificationsTimelineUrl } from '../../services/noaaSwpcApi';

// Alert category definitions with colors
const CATEGORIES = {
    WATCH: { icon: '⚠️', label: 'Watch', color: '#0a0', bgColor: 'rgba(0,170,0,0.1)' },
    WARNING: { icon: '🔶', label: 'Warning', color: '#f90', bgColor: 'rgba(255,153,0,0.1)' },
    ALERT: { icon: '🔴', label: 'Alert', color: '#f00', bgColor: 'rgba(255,0,0,0.1)' },
    SUMMARY: { icon: '📋', label: 'Summary', color: '#00f', bgColor: 'rgba(0,0,255,0.1)' },
    OTHER: { icon: '📡', label: 'Info', color: '#666', bgColor: 'rgba(102,102,102,0.1)' },
};

/**
 * Get alert category from product_id
 */
function getAlertCategory(productId) {
    const id = (productId || '').toUpperCase();

    if (id.includes('WAT') || id.includes('A50') || (id.includes('W') && id.includes('K'))) {
        return 'WATCH';
    }
    if (id.startsWith('WAR') || id.includes('K05W') || id.includes('K06W')) {
        return 'WARNING';
    }
    if (id.includes('K') && id.includes('A') && !id.startsWith('SUM')) {
        return 'ALERT';
    }
    if (id.startsWith('ALT') || id.includes('XM') || id.includes('X1')) {
        return 'ALERT';
    }
    if (id.startsWith('SUM')) {
        return 'SUMMARY';
    }
    return 'OTHER';
}

/**
 * Parse alert message for short summary
 */
function getShortSummary(message, maxLen = 60) {
    if (!message) return 'No details';

    const patterns = [
        /ALERT: (.+?)\n/,
        /WARNING: (.+?)\n/,
        /WATCH: (.+?)\n/,
        /SUMMARY: (.+?)\n/,
    ];

    for (const pattern of patterns) {
        const match = message.match(pattern);
        if (match) return match[1].substring(0, maxLen);
    }

    const firstLine = message.split('\n')[0];
    return firstLine.substring(0, maxLen);
}

/**
 * Filter button component
 */
function FilterButton({ category, active, count, onClick }) {
    const cat = CATEGORIES[category];
    return (
        <button
            onClick={onClick}
            className={active ? 'btn btn-active' : 'btn'}
            style={{
                fontSize: '8px',
                padding: '1px 4px',
                opacity: active ? 1 : 0.5,
                borderColor: active ? cat.color : undefined,
            }}
        >
            {cat.icon} {count}
        </button>
    );
}

FilterButton.propTypes = {
    category: PropTypes.string.isRequired,
    active: PropTypes.bool,
    count: PropTypes.number,
    onClick: PropTypes.func,
};

/**
 * Alerts Ticker Component
 */
export default function AlertsTicker({ alerts, loading, maxVisible = 10, onRefresh }) {
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [showTimeline, setShowTimeline] = useState(false);
    const [filters, setFilters] = useState({
        WATCH: true,
        WARNING: true,
        ALERT: true,
        SUMMARY: true,
        OTHER: true,
    });

    // Count alerts by category
    const categoryCounts = useMemo(() => {
        const counts = { WATCH: 0, WARNING: 0, ALERT: 0, SUMMARY: 0, OTHER: 0 };
        (alerts || []).forEach(alert => {
            const cat = getAlertCategory(alert.product_id);
            counts[cat]++;
        });
        return counts;
    }, [alerts]);

    // Filter alerts based on active filters
    const filteredAlerts = useMemo(() => {
        return (alerts || []).filter(alert => {
            const cat = getAlertCategory(alert.product_id);
            return filters[cat];
        });
    }, [alerts, filters]);

    const toggleFilter = (category) => {
        setFilters(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const toggleExpand = (alertId) => {
        setExpandedId(prev => prev === alertId ? null : alertId);
    };

    if (loading) {
        return (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '11px' }}>
                Loading alerts...
            </div>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <div style={{ padding: '8px', fontSize: '11px', opacity: 0.6, textAlign: 'center' }}>
                ✓ No active space weather alerts
            </div>
        );
    }

    return (
        <div>
            {/* Header with live indicator */}
            <div style={{
                fontSize: '10px',
                fontWeight: 'bold',
                marginBottom: '4px',
                padding: '2px 4px',
                background: 'var(--secondary)',
                color: 'var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span>
                    <span style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#f00',
                        marginRight: '4px',
                        animation: 'pulse 2s infinite',
                    }} />
                    🚨 Alerts ({filteredAlerts.length}/{alerts.length})
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={showTimeline ? 'btn btn-active' : 'btn'}
                        onClick={() => setShowTimeline(!showTimeline)}
                        style={{ fontSize: '8px', padding: '1px 4px' }}
                    >
                        📊
                    </button>
                    {onRefresh && (
                        <button className="btn" onClick={onRefresh} style={{ fontSize: '8px', padding: '1px 4px' }}>
                            🔄
                        </button>
                    )}
                </div>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '4px', flexWrap: 'wrap' }}>
                {Object.keys(CATEGORIES).map(cat => (
                    <FilterButton
                        key={cat}
                        category={cat}
                        active={filters[cat]}
                        count={categoryCounts[cat]}
                        onClick={() => toggleFilter(cat)}
                    />
                ))}
            </div>

            {/* Timeline image (collapsible) */}
            {showTimeline && (
                <div style={{ marginBottom: '6px', border: '1px solid var(--tertiary)' }}>
                    <img
                        src={getNotificationsTimelineUrl()}
                        alt="Notifications Timeline"
                        style={{ width: '100%', maxHeight: '100px', objectFit: 'contain' }}
                        onError={(e) => { /** @type {HTMLImageElement} */ (e.target).style.display = 'none'; }}
                    />
                </div>
            )}

            {/* Alert list */}
            <div style={{ maxHeight: '180px', overflow: 'auto' }}>
                {filteredAlerts.slice(0, maxVisible).map((alert, idx) => {
                    const category = getAlertCategory(alert.product_id);
                    const catInfo = CATEGORIES[category];
                    const summary = getShortSummary(alert.message);
                    const alertId = `${alert.product_id}-${idx}`;
                    const isExpanded = expandedId === alertId;
                    const time = alert.issue_datetime ?
                        new Date(alert.issue_datetime).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '';

                    return (
                        <div
                            key={alertId}
                            style={{
                                borderLeft: `3px solid ${catInfo.color}`,
                                background: catInfo.bgColor,
                                marginBottom: '2px',
                            }}
                        >
                            {/* Alert header (clickable) */}
                            <div
                                onClick={() => toggleExpand(alertId)}
                                style={{
                                    display: 'flex',
                                    gap: '6px',
                                    padding: '4px 6px',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                }}
                            >
                                <span style={{ fontSize: '12px' }}>{catInfo.icon}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: 'bold', color: catInfo.color }}>
                                        {catInfo.label}: {summary}
                                    </div>
                                    <div style={{ fontSize: '9px', opacity: 0.6 }}>{time}</div>
                                </div>
                                <span style={{ opacity: 0.5 }}>{isExpanded ? '▼' : '▶'}</span>
                            </div>

                            {/* Expanded content */}
                            {isExpanded && (
                                <div style={{
                                    padding: '6px 10px',
                                    borderTop: '1px solid var(--tertiary)',
                                    fontSize: '9px',
                                    maxHeight: '150px',
                                    overflow: 'auto',
                                }}>
                                    <pre style={{
                                        whiteSpace: 'pre-wrap',
                                        wordBreak: 'break-word',
                                        fontFamily: 'inherit',
                                        margin: 0,
                                        lineHeight: 1.3,
                                    }}>
                                        {alert.message}
                                    </pre>
                                    <button
                                        className="btn"
                                        onClick={(e) => { e.stopPropagation(); setSelectedAlert(alert); }}
                                        style={{ marginTop: '6px', fontSize: '9px', padding: '2px 8px' }}
                                    >
                                        View Full Details
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Show more indicator */}
            {filteredAlerts.length > maxVisible && (
                <div style={{ fontSize: '9px', textAlign: 'center', opacity: 0.6, marginTop: '4px' }}>
                    +{filteredAlerts.length - maxVisible} more alerts
                </div>
            )}

            {/* Alert detail modal */}
            {selectedAlert && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(128,128,128,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                    onClick={() => setSelectedAlert(null)}
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
                            <span>{CATEGORIES[getAlertCategory(selectedAlert.product_id)].icon} Alert Details</span>
                            <button onClick={() => setSelectedAlert(null)} style={{
                                background: 'var(--primary)', color: 'var(--secondary)',
                                border: '1px solid var(--primary)', padding: '0 6px',
                                cursor: 'pointer', fontSize: '10px'
                            }}>✕</button>
                        </div>

                        <div style={{ padding: '12px', fontSize: '11px' }}>
                            <div style={{ marginBottom: '8px', fontSize: '9px', opacity: 0.6 }}>
                                {selectedAlert.issue_datetime} • ID: {selectedAlert.product_id}
                            </div>
                            <pre style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                fontFamily: 'inherit',
                                margin: 0,
                                lineHeight: 1.4,
                            }}>
                                {selectedAlert.message}
                            </pre>
                            <button
                                className="btn"
                                onClick={() => setSelectedAlert(null)}
                                style={{ marginTop: '12px', width: '100%', fontSize: '11px' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS for pulse animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.3; }
                }
            `}</style>
        </div>
    );
}

AlertsTicker.propTypes = {
    alerts: PropTypes.arrayOf(PropTypes.shape({
        product_id: PropTypes.string,
        issue_datetime: PropTypes.string,
        message: PropTypes.string,
    })),
    loading: PropTypes.bool,
    maxVisible: PropTypes.number,
    onRefresh: PropTypes.func,
};

AlertsTicker.defaultProps = {
    alerts: [],
    loading: false,
    maxVisible: 10,
    onRefresh: null,
};
