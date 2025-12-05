/**
 * noaaSwpcApi.js
 * NOAA Space Weather Prediction Center API Service
 * All endpoints are public - no API key required
 * Base URL: https://services.swpc.noaa.gov
 */

const BASE_URL = 'https://services.swpc.noaa.gov';

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

/**
 * Get current NOAA Space Weather Scales (R/S/G)
 * R = Radio Blackouts, S = Solar Radiation, G = Geomagnetic
 * @returns {Promise<Object>} Current and predicted scales
 */
export async function getNoaaScales() {
    const data = await fetchSWPC('/products/noaa-scales.json');

    // Data format: { "0": current, "1": today forecast, "2": tomorrow, "3": day3, "-1": yesterday }
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

    // Most recent first (already sorted)
    return Array.isArray(data) ? data.slice(0, 50) : [];
}

/**
 * Get 7-day planetary K-index history
 * @returns {Promise<Array>} Array of Kp readings [time, Kp, a_running, station_count]
 */
export async function getKpIndex() {
    const data = await fetchSWPC('/products/noaa-planetary-k-index.json');

    if (!Array.isArray(data) || data.length < 2) return [];

    // Skip header row, parse data
    const [header, ...rows] = data;
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

    const [header, ...rows] = data;
    return rows.map(row => ({
        time: row[0],
        kp: parseFloat(row[1]),
        observed: row[2],
        noaaScale: row[3],
    }));
}

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

    // Get most recent observation for each unique region
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
 * Get aurora forecast probability (large dataset ~900KB)
 * Returns lon/lat/probability grid
 * @returns {Promise<Object>} Aurora forecast data
 */
export async function getAuroraForecast() {
    const data = await fetchSWPC('/json/ovation_aurora_latest.json', { timeout: 30000 });
    return data;
}

/**
 * Get real-time solar wind plasma data (7-day)
 * @returns {Promise<Array>} Solar wind readings
 */
export async function getSolarWind() {
    const data = await fetchSWPC('/products/solar-wind/plasma-7-day.json');

    if (!Array.isArray(data) || data.length < 2) return [];

    const [header, ...rows] = data;
    // Return last 100 readings (most recent)
    return rows.slice(-100).map(row => ({
        time: row[0],
        density: parseFloat(row[1]),
        speed: parseFloat(row[2]),
        temperature: parseFloat(row[3]),
    }));
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

/**
 * Parse NOAA scale value to severity info
 * @param {string|number} scale - Scale value (0-5)
 * @param {string} type - 'R', 'S', or 'G'
 */
export function getScaleSeverity(scale, type) {
    const scaleNum = parseInt(scale, 10) || 0;

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

export default {
    getNoaaScales,
    getAlerts,
    getKpIndex,
    getKpForecast,
    getSolarProbabilities,
    getSolarRegions,
    getAuroraForecast,
    getSolarWind,
    getAuroraImageUrls,
    getScaleSeverity,
};
