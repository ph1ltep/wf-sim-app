// src/utils/distributions/stateTransition.js
import { DistributionUtils } from './index';

/**
 * Validates and prepares a distribution for time series mode transition
 * 
 * @param {Object} distribution Current distribution object
 * @param {boolean} targetMode The target time series mode (true/false)
 * @param {number} defaultValue Default value to use if needed
 * @returns {Object} Updated distribution object and validation result
 */
export const validateTimeSeriesModeTransition = (distribution, targetMode, defaultValue = 0) => {
    // Normalize the distribution first
    const normalized = DistributionUtils.normalizeDistribution(distribution);
    let isValid = true;
    let message = '';
    let updatedDistribution = { ...normalized };

    if (targetMode) {
        // Transitioning TO time series mode

        // Ensure parameters.value is a valid number
        if (typeof normalized.parameters.value !== 'number') {
            updatedDistribution.parameters.value = defaultValue;
            message = 'Invalid parameter value, using default';
        }

        // Ensure timeSeriesParameters.value is an array
        if (!Array.isArray(normalized.timeSeriesParameters.value) ||
            normalized.timeSeriesParameters.value.length === 0) {
            // Initialize with a single data point using current parameter value
            updatedDistribution.timeSeriesParameters.value = [
                { year: 0, value: updatedDistribution.parameters.value }
            ];
        }

        // Set time series mode flag
        updatedDistribution.timeSeriesMode = true;
    } else {
        // Transitioning FROM time series mode

        // Ensure parameters.value is valid
        if (typeof normalized.parameters.value !== 'number') {
            // Try to get a value from time series data
            if (Array.isArray(normalized.timeSeriesParameters.value) &&
                normalized.timeSeriesParameters.value.length > 0) {

                // Use the most recent data point or calculate average
                const sortedData = [...normalized.timeSeriesParameters.value].sort((a, b) => b.year - a.year);
                if (sortedData[0] && typeof sortedData[0].value === 'number') {
                    updatedDistribution.parameters.value = sortedData[0].value;
                } else {
                    updatedDistribution.parameters.value = defaultValue;
                }
            } else {
                updatedDistribution.parameters.value = defaultValue;
            }

            message = 'Using time series data for parameter value';
        }

        // Set time series mode flag
        updatedDistribution.timeSeriesMode = false;
    }

    return {
        isValid,
        message,
        distribution: updatedDistribution
    };
};

/**
 * Gets the most appropriate value from a distribution based on its mode
 * 
 * @param {Object} distribution Distribution object
 * @param {number} defaultValue Default value to use if needed
 * @returns {number} Appropriate value
 */
export const getAppropriateValue = (distribution, defaultValue = 0) => {
    const normalized = DistributionUtils.normalizeDistribution(distribution);

    if (normalized.timeSeriesMode) {
        // In time series mode, try to get a representative value
        const tsData = normalized.timeSeriesParameters.value;
        if (Array.isArray(tsData) && tsData.length > 0) {
            // Get the most recent data point
            const sortedData = [...tsData].sort((a, b) => b.year - a.year);
            if (sortedData[0] && typeof sortedData[0].value === 'number') {
                return sortedData[0].value;
            }

            // Or calculate average if most recent isn't available
            const values = tsData
                .filter(point => point && typeof point.value === 'number')
                .map(point => point.value);

            if (values.length > 0) {
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        }
    }

    // In regular mode, or if time series data is invalid, use parameter value
    return typeof normalized.parameters.value === 'number'
        ? normalized.parameters.value
        : defaultValue;
};