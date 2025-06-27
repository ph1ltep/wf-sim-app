// frontend/src/utils/finance/percentileUtils.js - Simplified percentile utilities

/**
 * Discover available percentiles from scenario settings
 * @param {Function} getValueByPath - Function to get values from scenario
 * @returns {Object} { percentiles, primaryPercentile, availableValues }
 */
export const discoverPercentiles = (getValueByPath) => {
    const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
    const primaryPercentile = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
    const availableValues = percentiles.map(p => p.value).sort((a, b) => a - b);

    return {
        percentiles,
        primaryPercentile,
        availableValues,
        getPercentileLabel: (value) => {
            const percentile = percentiles.find(p => p.value === value);
            if (percentile && percentile.description) {
                const description = String(percentile.description).replace(/_/g, ' ');
                return `P${value} (${description})`;
            }
            return `P${value}`;
        }
    };
};

/**
 * Get default sensitivity range based on available percentiles
 * @param {Array} availableValues - Available percentile values
 * @param {number} primaryPercentile - Primary percentile
 * @returns {Object} { lowerPercentile, upperPercentile, confidenceLevel }
 */
export const getDefaultSensitivityRange = (availableValues, primaryPercentile) => {
    if (!availableValues || availableValues.length === 0) {
        return { lowerPercentile: 25, upperPercentile: 75, confidenceLevel: 50 };
    }

    // Find reasonable bounds around the primary percentile
    const idealLower = availableValues.filter(p => p < primaryPercentile);
    const idealUpper = availableValues.filter(p => p > primaryPercentile);

    const lowerPercentile = idealLower.length > 0 ? idealLower[idealLower.length - 1] : availableValues[0];
    const upperPercentile = idealUpper.length > 0 ? idealUpper[0] : availableValues[availableValues.length - 1];
    const confidenceLevel = upperPercentile - lowerPercentile;

    return { lowerPercentile, upperPercentile, confidenceLevel };
};

/**
 * Create percentile options for UI selects
 * @param {Array} percentiles - Percentile objects from scenario
 * @returns {Array} Options for Select components
 */
export const createPercentileOptions = (percentiles) => {
    return percentiles.map(p => ({
        value: p.value,
        label: `P${p.value} (${p.description.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())})`,
        key: `percentile-${p.value}`
    }));
};

/**
 * Get sensitivity range from simulation percentiles configuration
 * @param {Object} simulationConfig - simulation config with percentiles array and primaryPercentile
 * @returns {Object} { lower, upper, base }
 */
export const getSensitivityRangeFromSimulation = (simulationConfig) => {
    const percentiles = simulationConfig?.percentiles || [];
    const primaryPercentile = simulationConfig?.primaryPercentile || 50;

    if (percentiles.length === 0) {
        return { lower: 25, upper: 75, base: 50 };
    }

    // Extract values from PercentileSchema array
    const availableValues = percentiles.map(p => p.value).sort((a, b) => a - b);

    // Use existing function
    const range = getDefaultSensitivityRange(availableValues, primaryPercentile);

    return {
        lower: range.lowerPercentile,
        upper: range.upperPercentile,
        base: primaryPercentile
    };
};