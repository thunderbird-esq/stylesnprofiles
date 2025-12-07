/**
 * noaaSwpcApi.js
 * NOAA Space Weather Prediction Center API Service
 * All endpoints are public - no API key required
 * Base URL: https://services.swpc.noaa.gov
 * 
 * Expanded to cover comprehensive SWPC data including:
 * - Solar Wind (plasma, magnetic field)
 * - GOES Satellite (X-rays, protons, electrons, magnetometers)
 * - Solar Cycle (sunspots, F10.7 flux predictions)
 * - Geomagnetic Indices (Dst, Kp, A-index)
 * - Imagery (aurora, D-RAP, synoptic maps, ACE plots)
 */

const BASE_URL = 'https://services.swpc.noaa.gov';

// Valid periods for time-series data
const VALID_PERIODS = ['5-minute', '2-hour', '6-hour', '1-day', '3-day', '7-day'];

/**
 * Base fetch helper with timeout and error handling
 */
async function fetchSWPC(endpoint, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 15000);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            signal: controller.signal,
            ...options,
        });

        if (!response.ok) {
            throw new Error(`SWPC API error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out');
        }
        throw error;
    } finally {
        clearTimeout(timeout);
    }
}

// ============================================================================
// NOAA SCALES & ALERTS
// ============================================================================

/**
 * Get current NOAA Space Weather Scales (R/S/G)
 * R = Radio Blackouts, S = Solar Radiation, G = Geomagnetic
 * @returns {Promise<Object>} Current and predicted scales
 */
export async function getNoaaScales() {
    const data = await fetchSWPC('/products/noaa-scales.json');
    return {
        current: data['0'] || null,
        today: data['1'] || null,
        tomorrow: data['2'] || null,
        day3: data['3'] || null,
        yesterday: data['-1'] || null,
    };
}

/**
 * Get active space weather alerts, warnings, and watches
 * @returns {Promise<Array>} Array of alert objects
 */
export async function getAlerts() {
    const data = await fetchSWPC('/products/alerts.json');
    return Array.isArray(data) ? data.slice(0, 50) : [];
}

// ============================================================================
// KP INDEX & GEOMAGNETIC
// ============================================================================

/**
 * Get 7-day planetary K-index history
 * @returns {Promise<Array>} Array of Kp readings
 */
export async function getKpIndex() {
    const data = await fetchSWPC('/products/noaa-planetary-k-index.json');
    if (!Array.isArray(data) || data.length < 2) return [];

    const rows = data.slice(1);
    return rows.map(row => ({
        time: row[0],
        kp: parseFloat(row[1]),
        aRunning: parseInt(row[2], 10),
        stationCount: parseInt(row[3], 10),
    }));
}

/**
 * Get 3-day Kp index forecast
 * @returns {Promise<Array>} Forecast data
 */
export async function getKpForecast() {
    const data = await fetchSWPC('/products/noaa-planetary-k-index-forecast.json');
    if (!Array.isArray(data) || data.length < 2) return [];

    const rows = data.slice(1);
    return rows.map(row => ({
        time: row[0],
        kp: parseFloat(row[1]),
        observed: row[2],
        noaaScale: row[3],
    }));
}

/**
 * Get Kyoto Dst index (storm intensity indicator)
 * Dst < -50 = moderate storm, < -100 = intense, < -200 = extreme
 * @returns {Promise<Array>} Dst readings
 */
export async function getKyotoDst() {
    const data = await fetchSWPC('/products/kyoto-dst.json');
    if (!Array.isArray(data) || data.length < 2) return [];

    const rows = data.slice(1);
    return rows.map(row => ({
        time: row[0],
        dst: parseInt(row[1], 10),
    }));
}

/**
 * Get Boulder K-index (local magnetometer, 1-minute resolution)
 * @returns {Promise<Array>} K-index readings
 */
export async function getBoulderKIndex() {
    const data = await fetchSWPC('/json/boulder_k_index_1m.json');
    if (!Array.isArray(data)) return [];
    return data.slice(-200); // Last 200 readings
}

/**
 * Get planetary K-index at 1-minute resolution
 * @returns {Promise<Array>} High-resolution Kp data
 */
export async function getPlanetaryKIndex1m() {
    const data = await fetchSWPC('/json/planetary_k_index_1m.json');
    if (!Array.isArray(data)) return [];
    return data.slice(-200);
}

/**
 * Get predicted Fredericksburg A-index
 * @returns {Promise<Array>} A-index predictions
 */
export async function getPredictedAIndex() {
    const data = await fetchSWPC('/json/predicted_fredericksburg_a_index.json');
    return Array.isArray(data) ? data : [];
}

// ============================================================================
// SOLAR ACTIVITY
// ============================================================================

/**
 * Get solar flare probabilities (C/M/X class)
 * @returns {Promise<Array>} Probability data by day
 */
export async function getSolarProbabilities() {
    const data = await fetchSWPC('/json/solar_probabilities.json');
    return Array.isArray(data) ? data.slice(0, 14) : [];
}

/**
 * Get active solar regions with flare history
 * @returns {Promise<Array>} Solar region data
 */
export async function getSolarRegions() {
    const data = await fetchSWPC('/json/solar_regions.json');
    if (!Array.isArray(data)) return [];

    const regionMap = new Map();
    data.forEach(region => {
        if (region.region && (!regionMap.has(region.region) ||
            new Date(region.observed_date) > new Date(regionMap.get(region.region).observed_date))) {
            regionMap.set(region.region, region);
        }
    });

    return Array.from(regionMap.values());
}

/**
 * Get detailed sunspot report
 * @returns {Promise<Array>} Sunspot data
 */
export async function getSunspotReport() {
    const data = await fetchSWPC('/json/sunspot_report.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get predicted monthly sunspot number
 * @returns {Promise<Array>} SSN predictions with confidence intervals
 */
export async function getPredictedSunspotNumber() {
    const data = await fetchSWPC('/json/predicted_monthly_sunspot_number.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get predicted F10.7 cm radio flux
 * @returns {Promise<Array>} F10.7 predictions
 */
export async function getPredictedF107() {
    const data = await fetchSWPC('/json/predicted_f107cm_flux.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get Solar Cycle 25 sunspot number predicted range
 * @returns {Promise<Array>} Cycle 25 SSN predictions
 */
export async function getSolarCycle25SSN() {
    const data = await fetchSWPC('/products/solar-cycle-25-ssn-predicted-range.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get Solar Cycle 25 F10.7 predicted range
 * @returns {Promise<Array>} Cycle 25 F10.7 predictions
 */
export async function getSolarCycle25F107() {
    const data = await fetchSWPC('/products/solar-cycle-25-f10-7-predicted-range.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get current 10cm (F10.7) radio flux (30-day history)
 * @returns {Promise<Array>} F10.7 readings
 */
export async function get10cmFlux() {
    const data = await fetchSWPC('/products/10cm-flux-30-day.json');
    if (!Array.isArray(data) || data.length < 2) return [];
    const rows = data.slice(1);
    return rows.map(row => ({
        time: row[0],
        flux: parseFloat(row[1]),
    }));
}

// ============================================================================
// SOLAR WIND
// ============================================================================

/**
 * Get real-time solar wind plasma data
 * @param {string} period - Time period (2-hour, 6-hour, 1-day, 3-day, 7-day)
 * @returns {Promise<Array>} Solar wind plasma readings (density, speed, temperature)
 */
export async function getSolarWindPlasma(period = '1-day') {
    const data = await fetchSWPC(`/products/solar-wind/plasma-${period}.json`);
    if (!Array.isArray(data) || data.length < 2) return [];

    const rows = data.slice(1);
    return rows.map(row => ({
        time: row[0],
        density: parseFloat(row[1]),
        speed: parseFloat(row[2]),
        temperature: parseFloat(row[3]),
    }));
}

/**
 * Get solar wind magnetic field data (IMF)
 * @param {string} period - Time period (2-hour, 6-hour, 1-day, 3-day, 7-day)
 * @returns {Promise<Array>} IMF readings (Bx, By, Bz, Bt, Lat, Lon)
 */
export async function getSolarWindMag(period = '1-day') {
    const data = await fetchSWPC(`/products/solar-wind/mag-${period}.json`);
    if (!Array.isArray(data) || data.length < 2) return [];

    const rows = data.slice(1);
    return rows.map(row => ({
        time: row[0],
        bx: parseFloat(row[1]),
        by: parseFloat(row[2]),
        bz: parseFloat(row[3]),
        bt: parseFloat(row[4]),
        lat: parseFloat(row[5]),
        lon: parseFloat(row[6]),
    }));
}

/**
 * Get propagated solar wind (arrival at Earth)
 * @returns {Promise<Array>} Propagated solar wind data
 */
export async function getPropagatedSolarWind() {
    const data = await fetchSWPC('/products/geospace/propagated-solar-wind-1-hour.json');
    if (!Array.isArray(data) || data.length < 2) return [];
    const rows = data.slice(1);
    return rows;
}

/**
 * Get solar wind summary (current speed)
 * @returns {Promise<Object>} Current speed summary
 */
export async function getSolarWindSummary() {
    const data = await fetchSWPC('/products/summary/solar-wind-speed.json');
    return data;
}

/**
 * Get solar wind magnetic field summary
 * @returns {Promise<Object>} Current Bz summary
 */
export async function getSolarWindMagSummary() {
    const data = await fetchSWPC('/products/summary/solar-wind-mag-field.json');
    return data;
}

// Legacy function for backwards compatibility
export async function getSolarWind() {
    return getSolarWindPlasma('7-day').then(data => data.slice(-100));
}

// ============================================================================
// GOES SATELLITE DATA
// ============================================================================

/**
 * Get GOES X-ray flux data
 * @param {string} period - Time period (6-hour, 1-day, 3-day, 7-day)
 * @returns {Promise<Array>} X-ray readings (XRS-A, XRS-B)
 */
export async function getGoesXrays(period = '1-day') {
    const data = await fetchSWPC(`/json/goes/primary/xrays-${period}.json`);
    return Array.isArray(data) ? data : [];
}

/**
 * Get GOES X-ray flares (7-day history)
 * @returns {Promise<Array>} Flare events with class and times
 */
export async function getGoesXrayFlares() {
    const data = await fetchSWPC('/json/goes/primary/xray-flares-7-day.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get latest X-ray flare
 * @returns {Promise<Object|null>} Most recent flare
 */
export async function getGoesXrayFlaresLatest() {
    const data = await fetchSWPC('/json/goes/primary/xray-flares-latest.json');
    return data || null;
}

/**
 * Get GOES integral proton flux
 * @param {string} period - Time period (6-hour, 1-day, 3-day, 7-day)
 * @returns {Promise<Array>} Proton flux readings
 */
export async function getGoesProtons(period = '1-day') {
    const data = await fetchSWPC(`/json/goes/primary/integral-protons-${period}.json`);
    return Array.isArray(data) ? data : [];
}

/**
 * Get GOES integral electron flux
 * @param {string} period - Time period (6-hour, 1-day, 3-day, 7-day)
 * @returns {Promise<Array>} Electron flux readings
 */
export async function getGoesElectrons(period = '1-day') {
    const data = await fetchSWPC(`/json/goes/primary/integral-electrons-${period}.json`);
    return Array.isArray(data) ? data : [];
}

/**
 * Get GOES magnetometer data
 * @param {string} period - Time period (6-hour, 1-day, 3-day, 7-day)
 * @returns {Promise<Array>} Magnetometer readings
 */
export async function getGoesMagnetometers(period = '1-day') {
    const data = await fetchSWPC(`/json/goes/primary/magnetometers-${period}.json`);
    return Array.isArray(data) ? data : [];
}

/**
 * Get electron fluence forecast
 * @returns {Promise<Array>} Electron fluence predictions
 */
export async function getElectronFluenceForecast() {
    const data = await fetchSWPC('/json/electron_fluence_forecast.json');
    return Array.isArray(data) ? data : [];
}

/**
 * Get SUVI flares (7-day)
 * @returns {Promise<Array>} SUVI flare events
 */
export async function getSuviFlares() {
    const data = await fetchSWPC('/json/goes/primary/suvi-flares-7-day.json');
    return Array.isArray(data) ? data : [];
}

// ============================================================================
// AURORA
// ============================================================================

/**
 * Get aurora forecast probability grid (large dataset ~900KB)
 * @returns {Promise<Object>} OVATION aurora forecast data
 */
export async function getAuroraForecast() {
    const data = await fetchSWPC('/json/ovation_aurora_latest.json', { timeout: 30000 });
    return data;
}

/**
 * Get aurora forecast image URLs
 * @returns {Object} Image URLs for N and S hemispheres
 */
export function getAuroraImageUrls() {
    return {
        northern: `${BASE_URL}/images/aurora-forecast-northern-hemisphere.jpg`,
        southern: `${BASE_URL}/images/aurora-forecast-southern-hemisphere.jpg`,
    };
}

// ============================================================================
// IMAGE URLS
// ============================================================================

/**
 * Get D-RAP (D Region Absorption Prediction) image URLs
 * Shows HF radio absorption at multiple frequencies
 * @returns {Object} D-RAP image URLs by frequency and view
 */
export function getDrapImageUrls() {
    const frequencies = [5, 10, 15, 20, 25, 30];

    const urls = {
        current: {
            global: `${BASE_URL}/images/drap_global.png`,
            nPole: `${BASE_URL}/images/drap_n-pole.png`,
            sPole: `${BASE_URL}/images/drap_s-pole.png`,
        },
        byFrequency: {},
    };

    frequencies.forEach(freq => {
        urls.byFrequency[`${freq}MHz`] = {
            global: `${BASE_URL}/images/drap_f${freq.toString().padStart(2, '0')}_global.png`,
            nPole: `${BASE_URL}/images/drap_f${freq.toString().padStart(2, '0')}_n-pole.png`,
            sPole: `${BASE_URL}/images/drap_f${freq.toString().padStart(2, '0')}_s-pole.png`,
        };
    });

    return urls;
}

/**
 * Get ACE satellite plot image URLs
 * @returns {Object} ACE instrument plot URLs by period
 */
export function getAceImageUrls() {
    const periods = ['2-hour', '6-hour', '24-hour', '3-day', '7-day'];
    const instruments = ['mag', 'swepam', 'epam', 'sis', 'mag-swepam'];

    const urls = {};
    instruments.forEach(inst => {
        urls[inst] = {};
        periods.forEach(period => {
            urls[inst][period] = `${BASE_URL}/images/ace-${inst}-${period}.gif`;
        });
    });

    return urls;
}

/**
 * Get synoptic map URL (full solar disk with active regions)
 * @returns {string} Synoptic map image URL
 */
export function getSynopticMapUrl() {
    return `${BASE_URL}/images/synoptic-map.jpg`;
}

/**
 * Get notifications timeline image URL
 * @returns {string} Timeline image URL
 */
export function getNotificationsTimelineUrl() {
    return `${BASE_URL}/images/notifications-timeline.png`;
}

/**
 * Get station K-index chart URL
 * @returns {string} K-index chart URL
 */
export function getStationKIndexUrl() {
    return `${BASE_URL}/images/station-k-index.png`;
}

/**
 * Get electron fluence image URLs
 * @returns {Object} Current and verification image URLs
 */
export function getElectronFluenceImageUrls() {
    return {
        current: `${BASE_URL}/images/relativistic-electron-fluence.png`,
        verification: `${BASE_URL}/images/relativistic-electron-fluence-verification.png`,
    };
}

/**
 * Get geospace plot image URLs
 * @returns {Object} Geospace plot URLs by period
 */
export function getGeospaceImageUrls() {
    return {
        '3-hour': `${BASE_URL}/images/geospacegeospace_3_hour.png`,
        '1-day': `${BASE_URL}/images/geospacegeospace_1_day.png`,
        '3-day': `${BASE_URL}/images/geospacegeospace_3_day.png`,
        '7-day': `${BASE_URL}/images/geospacegeospace_7_day.png`,
    };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Parse NOAA scale value to severity info
 * @param {string|number} scale - Scale value (0-5)
 * @param {string} type - 'R', 'S', or 'G'
 * @returns {Object} Severity info with level, text, and color
 */
export function getScaleSeverity(scale, type) {
    const scaleNum = parseInt(String(scale), 10) || 0;

    const descriptions = {
        R: ['None', 'Minor', 'Moderate', 'Strong', 'Severe', 'Extreme'],
        S: ['None', 'Minor', 'Moderate', 'Strong', 'Severe', 'Extreme'],
        G: ['None', 'Minor', 'Moderate', 'Strong', 'Severe', 'Extreme'],
    };

    const colors = {
        0: '#4a4', // Green
        1: '#8c8', // Light green
        2: '#cc0', // Yellow
        3: '#f90', // Orange
        4: '#f00', // Red
        5: '#f0f', // Magenta/Extreme
    };

    return {
        level: scaleNum,
        text: descriptions[type]?.[scaleNum] || 'Unknown',
        color: colors[scaleNum] || '#888',
    };
}

/**
 * Get Dst storm classification
 * @param {number} dst - Dst value in nT
 * @returns {Object} Storm classification with level, text, and color
 */
export function getDstClassification(dst) {
    if (dst >= -30) return { level: 0, text: 'Quiet', color: '#4a4' };
    if (dst >= -50) return { level: 1, text: 'Weak Storm', color: '#8c8' };
    if (dst >= -100) return { level: 2, text: 'Moderate Storm', color: '#cc0' };
    if (dst >= -200) return { level: 3, text: 'Intense Storm', color: '#f90' };
    if (dst >= -350) return { level: 4, text: 'Severe Storm', color: '#f00' };
    return { level: 5, text: 'Extreme Storm', color: '#f0f' };
}

/**
 * Get X-ray flare class from flux value
 * @param {number} flux - X-ray flux in W/m²
 * @returns {Object} Flare class info
 */
export function getFlareClass(flux) {
    if (flux >= 1e-4) return { class: 'X', text: 'X-class (Extreme)', color: '#f0f' };
    if (flux >= 1e-5) return { class: 'M', text: 'M-class (Major)', color: '#f00' };
    if (flux >= 1e-6) return { class: 'C', text: 'C-class (Common)', color: '#f90' };
    if (flux >= 1e-7) return { class: 'B', text: 'B-class (Minor)', color: '#cc0' };
    return { class: 'A', text: 'A-class (Quiet)', color: '#4a4' };
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const noaaSwpcApi = {
    // Scales & Alerts
    getNoaaScales,
    getAlerts,

    // Kp Index & Geomagnetic
    getKpIndex,
    getKpForecast,
    getKyotoDst,
    getBoulderKIndex,
    getPlanetaryKIndex1m,
    getPredictedAIndex,

    // Solar Activity
    getSolarProbabilities,
    getSolarRegions,
    getSunspotReport,
    getPredictedSunspotNumber,
    getPredictedF107,
    getSolarCycle25SSN,
    getSolarCycle25F107,
    get10cmFlux,

    // Solar Wind
    getSolarWind,
    getSolarWindPlasma,
    getSolarWindMag,
    getPropagatedSolarWind,
    getSolarWindSummary,
    getSolarWindMagSummary,

    // GOES Satellite
    getGoesXrays,
    getGoesXrayFlares,
    getGoesXrayFlaresLatest,
    getGoesProtons,
    getGoesElectrons,
    getGoesMagnetometers,
    getElectronFluenceForecast,
    getSuviFlares,

    // Aurora
    getAuroraForecast,
    getAuroraImageUrls,

    // Image URLs
    getDrapImageUrls,
    getAceImageUrls,
    getSynopticMapUrl,
    getNotificationsTimelineUrl,
    getStationKIndexUrl,
    getElectronFluenceImageUrls,
    getGeospaceImageUrls,

    // Utilities
    getScaleSeverity,
    getDstClassification,
    getFlareClass,

    // Constants
    VALID_PERIODS,
};

export default noaaSwpcApi;

