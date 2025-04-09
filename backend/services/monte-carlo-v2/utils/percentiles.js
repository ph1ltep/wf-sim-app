// backend/services/monte-carlo-v2/utils/percentiles.js
/**
 * Utilities for percentile calculations
 */

/**
 * Calculate a specific percentile from an array of values
 * @param {Array<number>} values - Array of numeric values
 * @param {number} percentile - Percentile value (0-100)
 * @returns {number} Calculated percentile value
 */
function calculatePercentile(values, percentile) {
    if (!values || values.length === 0) {
        return 0;
    }

    if (percentile < 0 || percentile > 100) {
        throw new Error('Percentile must be between 0 and 100');
    }

    // Sort values in ascending order
    const sorted = [...values].sort((a, b) => a - b);

    // Handle edge cases
    if (percentile === 0) return sorted[0];
    if (percentile === 100) return sorted[sorted.length - 1];

    // Calculate the index based on percentile
    const index = (percentile / 100) * (sorted.length - 1);
    const lowerIndex = Math.floor(index);
    const upperIndex = Math.ceil(index);

    // If index is an integer, return the exact value
    if (lowerIndex === upperIndex) {
        return sorted[lowerIndex];
    }

    // Interpolate between the two nearest values
    const weight = index - lowerIndex;
    return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

/**
 * Calculate multiple percentiles from an array of values
 * @param {Array<number>} values - Array of numeric values
 * @param {Array<number>} percentiles - Array of percentile values (0-100)
 * @returns {Object} Percentiles keyed by Pxx notation
 */
function calculatePercentiles(values, percentiles = [10, 25, 50, 75, 90]) {
    if (!values || values.length === 0) {
        return percentiles.reduce((acc, p) => {
            acc[`P${p}`] = 0;
            return acc;
        }, {});
    }

    return percentiles.reduce((acc, p) => {
        acc[`P${p}`] = calculatePercentile(values, p);
        return acc;
    }, {});
}

/**
 * Calculate basic statistics for an array of values
 * @param {Array<number>} values - Array of numeric values
 * @returns {Object} Object containing mean, median, min, max, and standard deviation
 */
function calculateStatistics(values) {
    if (!values || values.length === 0) {
        return { mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
    }

    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;

    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    // Calculate median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

    // Calculate standard deviation
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return { mean, median, min, max, stdDev };
}

module.exports = {
    calculatePercentile,
    calculatePercentiles,
    calculateStatistics
};