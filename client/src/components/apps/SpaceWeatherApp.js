import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { getDonkiCME, getDonkiFLR, getDonkiGST } from '../../services/nasaApi';
import { getNoaaScales, getAlerts, getKpIndex, getSolarRegions } from '../../services/noaaSwpcApi';
import SunVisualization from './SunVisualization';
import NoaaScalesGauge from './NoaaScalesGauge';
import KpIndexChart from './KpIndexChart';
import AlertsTicker from './AlertsTicker';
import AuroraForecastMap from './AuroraForecastMap';
// New SWPC data components
import GoesDataPanel from './GoesDataPanel';
import SolarWindCharts from './SolarWindCharts';
import SolarCycleDashboard from './SolarCycleDashboard';
import DrapViewer from './DrapViewer';
import SpaceWeatherGallery from './SpaceWeatherGallery';

/**
 * Space Weather App - NOAA SWPC + NASA DONKI
 * Apple System 6 HIG with tabbed interface
 * @component
 */
export default function SpaceWeatherApp({ windowId: _windowId }) {
    // Tab state
    const [activeTab, setActiveTab] = useState('current');

    // NOAA data
    const [noaaScales, setNoaaScales] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [kpIndex, setKpIndex] = useState([]);
    const [solarRegions, setSolarRegions] = useState([]);
    const [noaaLoading, setNoaaLoading] = useState(true);

    // DONKI data
    const [donkiEvents, setDonkiEvents] = useState([]);
    const [donkiLoading, setDonkiLoading] = useState(false);
    const [eventType, setEventType] = useState('CME');
    const [selectedEvent, setSelectedEvent] = useState(null);

    // 3D visualization
    const [showSunViz, setShowSunViz] = useState(false);

    const [error, setError] = useState(null);

    // Fetch NOAA data
    const fetchNoaaData = useCallback(async () => {
        setNoaaLoading(true);
        setError(null);

        try {
            const [scalesData, alertsData, kpData, regionsData] = await Promise.all([
                getNoaaScales().catch(() => null),
                getAlerts().catch(() => []),
                getKpIndex().catch(() => []),
                getSolarRegions().catch(() => []),
            ]);

            setNoaaScales(scalesData);
            setAlerts(alertsData);
            setKpIndex(kpData);
            setSolarRegions(regionsData);
        } catch (err) {
            console.error('NOAA fetch error:', err);
            setError('Failed to load NOAA data');
        } finally {
            setNoaaLoading(false);
        }
    }, []);

    // Fetch DONKI data
    const fetchDonkiData = useCallback(async () => {
        setDonkiLoading(true);
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];

        try {
            let response;
            switch (eventType) {
                case 'CME': response = await getDonkiCME(startDate, endDate); break;
                case 'FLR': response = await getDonkiFLR(startDate, endDate); break;
                case 'GST': response = await getDonkiGST(startDate, endDate); break;
                default: response = await getDonkiCME(startDate, endDate);
            }
            setDonkiEvents(Array.isArray(response.data) ? response.data.slice(0, 50) : []);
        } catch (err) {
            console.error('DONKI fetch error:', err);
        } finally {
            setDonkiLoading(false);
        }
    }, [eventType]);

    // Initial load
    useEffect(() => { fetchNoaaData(); }, [fetchNoaaData]);
    useEffect(() => { if (activeTab === 'donki') fetchDonkiData(); }, [activeTab, fetchDonkiData]);

    // 30-day timeline for DONKI
    const timeline = useMemo(() => {
        const days = [];
        const now = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            days.push({ date: date.toISOString().split('T')[0], count: 0 });
        }
        donkiEvents.forEach(event => {
            const eventDate = (event.startTime || event.beginTime || '').split('T')[0];
            const dayIndex = days.findIndex(d => d.date === eventDate);
            if (dayIndex >= 0) days[dayIndex].count++;
        });
        return days;
    }, [donkiEvents]);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
        });
    };

    // If showing 3D visualization
    if (showSunViz) {
        return <SunVisualization events={donkiEvents} solarRegions={solarRegions} onClose={() => setShowSunViz(false)} />;
    }

    // Tab button active style (for inverted selected state)
    const getTabClass = (isActive) => isActive ? 'btn-active' : 'btn';

    return (
        <div className="nasa-data-section app-text-lg" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="nasa-data-title" style={{ fontSize: 'var(--font-size-lg)' }}>🌞 Space Weather Monitor</div>

            {/* Tab Navigation - Using System 6 btn class */}
            {/* Tab Navigation - Row 1: Core tabs */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '2px', flexWrap: 'wrap' }}>
                <button className={getTabClass(activeTab === 'current')} onClick={() => setActiveTab('current')} style={{ fontSize: '10px', padding: '3px 6px' }}>📡 Current</button>
                <button className={getTabClass(activeTab === 'goes')} onClick={() => setActiveTab('goes')} style={{ fontSize: '10px', padding: '3px 6px' }}>🛰️ GOES</button>
                <button className={getTabClass(activeTab === 'solarwind')} onClick={() => setActiveTab('solarwind')} style={{ fontSize: '10px', padding: '3px 6px' }}>🌬️ Wind</button>
                <button className={getTabClass(activeTab === 'cycle')} onClick={() => setActiveTab('cycle')} style={{ fontSize: '10px', padding: '3px 6px' }}>☀️ Cycle</button>
                <button className={getTabClass(activeTab === 'drap')} onClick={() => setActiveTab('drap')} style={{ fontSize: '10px', padding: '3px 6px' }}>📻 HF</button>
            </div>
            {/* Tab Navigation - Row 2: Secondary tabs */}
            <div style={{ display: 'flex', gap: '2px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <button className={getTabClass(activeTab === 'alerts')} onClick={() => setActiveTab('alerts')} style={{ fontSize: '10px', padding: '3px 6px' }}>🚨 Alerts</button>
                <button className={getTabClass(activeTab === 'aurora')} onClick={() => setActiveTab('aurora')} style={{ fontSize: '10px', padding: '3px 6px' }}>🌌 Aurora</button>
                <button className={getTabClass(activeTab === 'donki')} onClick={() => setActiveTab('donki')} style={{ fontSize: '10px', padding: '3px 6px' }}>🔥 DONKI</button>
                <button className={getTabClass(activeTab === 'gallery')} onClick={() => setActiveTab('gallery')} style={{ fontSize: '10px', padding: '3px 6px' }}>🖼️ Gallery</button>
                <button className="btn" onClick={() => setShowSunViz(true)} style={{ fontSize: '10px', padding: '3px 6px' }}>🌐 3D</button>
            </div>

            {error && <div className="nasa-error" style={{ fontSize: '10px', marginBottom: '6px' }}>{error}</div>}

            {/* Tab Content */}
            <div style={{ flex: 1, overflow: 'auto' }}>

                {/* CURRENT CONDITIONS TAB */}
                {activeTab === 'current' && (
                    <div>
                        <NoaaScalesGauge scales={noaaScales} loading={noaaLoading} />
                        <div style={{ marginTop: '8px' }}>
                            <KpIndexChart data={kpIndex} loading={noaaLoading} height={70} />
                        </div>
                        <div style={{ marginTop: '8px', fontSize: '9px', textAlign: 'center' }}>
                            <button className="btn" onClick={fetchNoaaData} style={{ fontSize: '9px' }}>
                                🔄 Refresh NOAA Data
                            </button>
                        </div>
                    </div>
                )}

                {/* ALERTS TAB */}
                {activeTab === 'alerts' && (
                    <AlertsTicker alerts={alerts} loading={noaaLoading} maxVisible={10} />
                )}

                {/* GOES SATELLITE TAB */}
                {activeTab === 'goes' && (
                    <GoesDataPanel onError={(err) => setError(err)} />
                )}

                {/* SOLAR WIND TAB */}
                {activeTab === 'solarwind' && (
                    <SolarWindCharts onError={(err) => setError(err)} />
                )}

                {/* SOLAR CYCLE TAB */}
                {activeTab === 'cycle' && (
                    <SolarCycleDashboard onError={(err) => setError(err)} />
                )}

                {/* D-RAP HF RADIO TAB */}
                {activeTab === 'drap' && (
                    <DrapViewer />
                )}

                {/* GALLERY TAB */}
                {activeTab === 'gallery' && (
                    <SpaceWeatherGallery />
                )}

                {/* AURORA TAB */}
                {activeTab === 'aurora' && (
                    <AuroraForecastMap loading={noaaLoading} />
                )}

                {/* DONKI TAB */}
                {activeTab === 'donki' && (
                    <div>
                        {/* Event Type Selector */}
                        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                            {[
                                { type: 'CME', icon: '☀️', name: 'CME' },
                                { type: 'FLR', icon: '⚡', name: 'Flares' },
                                { type: 'GST', icon: '🌀', name: 'Storms' },
                            ].map(({ type, icon, name }) => (
                                <button
                                    key={type}
                                    className={`btn ${eventType === type ? 'btn-default' : ''}`}
                                    onClick={() => setEventType(type)}
                                    style={{ fontSize: '10px', padding: '2px 6px' }}
                                >
                                    {icon} {name}
                                </button>
                            ))}
                        </div>

                        {/* Timeline */}
                        <div style={{ marginBottom: '8px', padding: '4px', border: '1px solid var(--tertiary)' }}>
                            <div style={{ fontSize: '9px', marginBottom: '2px' }}>Last 30 Days:</div>
                            <div style={{ display: 'flex', height: '20px', gap: '1px' }}>
                                {timeline.map((day) => (
                                    <div
                                        key={day.date}
                                        title={`${day.date}: ${day.count}`}
                                        style={{
                                            flex: 1,
                                            background: day.count > 0 ? 'var(--secondary)' : 'var(--tertiary)',
                                            height: day.count > 0 ? '100%' : '2px',
                                            alignSelf: 'flex-end',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Events List */}
                        {donkiLoading ? (
                            <div className="nasa-loading">Loading DONKI events...</div>
                        ) : (
                            <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                                {donkiEvents.slice(0, 20).map((event, idx) => (
                                    <div
                                        key={event.activityID || event.flrID || idx}
                                        onClick={() => setSelectedEvent(event)}
                                        style={{
                                            padding: '4px 6px',
                                            borderBottom: '1px solid var(--tertiary)',
                                            cursor: 'pointer',
                                            fontSize: '10px',
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold' }}>
                                            {formatDate(event.startTime || event.beginTime)}
                                        </div>
                                        <div style={{ fontSize: '9px', opacity: 0.7 }}>
                                            {event.note?.substring(0, 50) || event.classType || 'Event detected'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* DONKI Event Detail Modal */}
            {selectedEvent && (
                <div
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(128,128,128,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
                    }}
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        style={{
                            background: 'var(--primary)', border: '2px solid var(--secondary)',
                            boxShadow: '4px 4px 0 var(--secondary)',
                            maxWidth: '400px', maxHeight: '60vh', overflow: 'auto', width: '90%',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            background: 'var(--secondary)', color: 'var(--primary)',
                            padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
                            display: 'flex', justifyContent: 'space-between',
                        }}>
                            <span>Event Details</span>
                            <button onClick={() => setSelectedEvent(null)} style={{ background: 'var(--primary)', color: 'var(--secondary)', border: 'none', cursor: 'pointer', fontSize: '10px' }}>✕</button>
                        </div>
                        <div style={{ padding: '10px', fontSize: '11px', lineHeight: 1.4 }}>
                            <div><strong>Start:</strong> {formatDate(selectedEvent.startTime || selectedEvent.beginTime)}</div>
                            {selectedEvent.classType && <div><strong>Class:</strong> {selectedEvent.classType}</div>}
                            {selectedEvent.note && <div style={{ marginTop: '6px' }}>{selectedEvent.note}</div>}
                            <button className="btn" onClick={() => setSelectedEvent(null)} style={{ marginTop: '10px', width: '100%', fontSize: '10px' }}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

SpaceWeatherApp.propTypes = { windowId: PropTypes.string };
SpaceWeatherApp.defaultProps = { windowId: null };
