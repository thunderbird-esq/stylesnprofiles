/**
 * AlertsTicker.js
 * Scrolling ticker of recent NOAA space weather alerts
 * Apple System 6 HIG styling
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Get alert type info (icon, color)
 */
function getAlertInfo(productId) {
    const id = (productId || '').toUpperCase();

    // Watches
    if (id.includes('W') && id.includes('K')) return { icon: '⚠️', type: 'Watch', color: '#f90' };
    if (id.includes('A50')) return { icon: '⚠️', type: 'Watch', color: '#f90' };

    // Warnings
    if (id.startsWith('WAR')) return { icon: '🔶', type: 'Warning', color: '#f60' };
    if (id.includes('K05W') || id.includes('K06W')) return { icon: '🔶', type: 'Warning', color: '#f60' };

    // Alerts
    if (id.includes('K') && id.includes('A')) return { icon: '🔴', type: 'Alert', color: '#c00' };
    if (id.startsWith('ALT')) return { icon: '🔴', type: 'Alert', color: '#c00' };

    // X-ray events
    if (id.includes('XM') || id.includes('X1')) return { icon: '☀️', type: 'Flare', color: '#f00' };

    // Radio bursts
    if (id.includes('BHI') || id.includes('10R')) return { icon: '📻', type: 'Radio', color: '#06f' };

    // Summaries
    if (id.startsWith('SUM')) return { icon: '📋', type: 'Summary', color: '#060' };

    // Proton events
    if (id.includes('EF') || id.includes('PF')) return { icon: '⚡', type: 'Proton', color: '#909' };

    return { icon: '📡', type: 'Info', color: '#666' };
}

/**
 * Parse alert message for short summary
 */
function getShortSummary(message, maxLen = 60) {
    if (!message) return 'No details';

    // Look for key patterns
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

    // Just take first line
    const firstLine = message.split('\n')[0];
    return firstLine.substring(0, maxLen);
}

/**
 * Alerts Ticker Component
 */
export default function AlertsTicker({ alerts, loading, maxVisible = 5 }) {
    const [selectedAlert, setSelectedAlert] = useState(null);

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
            {/* Header */}
            <div style={{
                fontSize: '10px',
                fontWeight: 'bold',
                marginBottom: '6px',
                padding: '2px 4px',
                background: 'var(--secondary)',
                color: 'var(--primary)',
                display: 'flex',
                justifyContent: 'space-between',
            }}>
                <span>🚨 Recent Alerts & Warnings</span>
                <span>{alerts.length} total</span>
            </div>

            {/* Alert list */}
            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                {alerts.slice(0, maxVisible).map((alert, idx) => {
                    const info = getAlertInfo(alert.product_id);
                    const summary = getShortSummary(alert.message);
                    const time = alert.issue_datetime ?
                        new Date(alert.issue_datetime).toLocaleString('en-US', {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        }) : '';

                    return (
                        <div
                            key={`${alert.product_id}-${idx}`}
                            onClick={() => setSelectedAlert(alert)}
                            style={{
                                display: 'flex',
                                gap: '6px',
                                padding: '4px 6px',
                                borderBottom: '1px solid var(--tertiary)',
                                cursor: 'pointer',
                                fontSize: '10px',
                            }}
                        >
                            <span style={{ fontSize: '12px' }}>{info.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 'bold', color: info.color }}>
                                    {info.type}: {summary}
                                </div>
                                <div style={{ fontSize: '9px', opacity: 0.6 }}>{time}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

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
                            <span>{getAlertInfo(selectedAlert.product_id).icon} Alert Details</span>
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
};

AlertsTicker.defaultProps = {
    alerts: [],
    loading: false,
    maxVisible: 5,
};
