// src/utils/distributions/validationHelper.js
import { DistributionUtils } from './index';

/**
 * Validates a distribution based on the new schema structure
 * 
 * @param {Object} distribution The distribution object to validate
 * @param {boolean} validateTimeSeries Whether to validate time series data
 * @returns {Object} Validation result with isValid flag and error messages
 */
export const validateDistribution = (distribution, validateTimeSeries = true) => {
    if (!distribution) {
        return {
            isValid: false,
            message: ['Distribution object is required'],
            details: 'No distribution object provided'
        };
    }

    // Validate distribution type
    if (!distribution.type) {
        return {
            isValid: false,
            message: ['Distribution type is required'],
            details: 'Please specify a distribution type'
        };
    }

    const type = distribution.type.toLowerCase();
    const distributionDef = DistributionUtils.getDistribution(type);

    if (!distributionDef) {
        return {
            isValid: false,
            message: [`Unknown distribution type: ${type}`],
            details: `The distribution type "${type}" is not supported. Please choose from the available options.`
        };
    }

    // Validate main parameters
    if (!distribution.parameters) {
        return {
            isValid: false,
            message: ['Parameters are required'],
            details: 'Please provide parameters for the distribution'
        };
    }

    // Use distribution's own validation method for the parameters
    const paramValidation = distributionDef.validate(distribution.parameters);
    if (!paramValidation.isValid) {
        return paramValidation;
    }

    // Validate time series data if in time series mode
    if (distribution.timeSeriesMode && validateTimeSeries) {
        if (!distribution.timeSeriesParameters) {
            return {
                isValid: false,
                message: ['Time series parameters are required in time series mode'],
                details: 'Please provide time series parameters'
            };
        }

        const tsData = distribution.timeSeriesParameters.value;

        // Validate array structure
        if (!Array.isArray(tsData)) {
            return {
                isValid: false,
                message: ['Time series data must be an array'],
                details: 'Please provide a valid array of time series data points'
            };
        }

        // Validate data points structure
        const invalidPoints = tsData.filter(point =>
            !point || typeof point !== 'object' ||
            point.year === undefined || point.value === undefined
        );

        if (invalidPoints.length > 0) {
            return {
                isValid: false,
                message: ['Time series contains invalid data points'],
                details: `${invalidPoints.length} data points are missing required year or value properties`
            };
        }

        // Validate minimum number of data points for fitting
        const minPoints = getMinRequiredPoints(type);
        if (tsData.length < minPoints) {
            return {
                isValid: true, // Still valid, but with a warning
                warning: [`Time series has fewer than recommended ${minPoints} data points`],
                details: `For ${type} distribution, it's recommended to have at least ${minPoints} data points for accurate fitting`
            };
        }

        // Validate data compatibility with distribution type
        const compatibility = checkDataCompatibility(type, tsData);
        if (compatibility && !compatibility.isValid) {
            return {
                isValid: true, // Still valid but with a warning
                warning: [compatibility.message],
                details: compatibility.details
            };
        }
    }

    return { isValid: true };
};

/**
 * Get minimum required data points for a distribution type
 * 
 * @param {string} type Distribution type
 * @returns {number} Minimum recommended number of data points
 */
export const getMinRequiredPoints = (type) => {
    switch (type) {
        case 'normal':
        case 'lognormal':
            return 5;
        case 'weibull':
        case 'gamma':
            return 6;
        case 'triangular':
            return 3;
        case 'uniform':
            return 2;
        case 'exponential':
            return 4;
        case 'gbm':
            return 8; // Time series data needs more points for GBM
        default:
            return 3;
    }
};

/**
 * Check if time series data is compatible with distribution type
 * 
 * @param {string} type Distribution type
 * @param {Array} data Time series data points
 * @returns {Object|null} Compatibility check result or null if compatible
 */
export const checkDataCompatibility = (type, data) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
        return null;
    }

    // Check for non-positive values in distributions that require positive values
    if (['lognormal', 'exponential', 'weibull', 'gamma'].includes(type)) {
        const hasNonPositive = data.some(point =>
            point && typeof point === 'object' &&
            point.value !== undefined &&
            point.value <= 0
        );

        if (hasNonPositive) {
            return {
                isValid: false,
                message: `${type} distribution requires all values to be positive`,
                details: 'Please ensure all data points have positive values'
            };
        }
    }

    // Check for symmetry in normal distribution data
    if (type === 'normal' && data.length > 2) {
        const values = data
            .filter(point => point && typeof point === 'object' && point.value !== undefined)
            .map(point => point.value);

        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;
        const sortedValues = [...values].sort((a, b) => a - b);
        const median = sortedValues[Math.floor(values.length / 2)];

        const meanMedianDiff = Math.abs(mean - median) / mean;
        if (meanMedianDiff > 0.3) {
            return {
                isValid: true, // Still valid but with a warning
                message: 'Data appears skewed. Consider using lognormal or weibull distribution instead.',
                details: 'Normal distribution works best with symmetric data'
            };
        }
    }

    return null;
};



/**
 * Initializes time series data with default values if needed
 * 
 * @param {Object} distribution Distribution object
 * @returns {Object} Distribution with initialized time series data
 */
export const initializeTimeSeriesIfEmpty = (distribution) => {
    const normalized = DistributionUtils.normalizeDistribution(distribution);

    // If in time series mode but no data points, initialize with current value
    if (normalized.timeSeriesMode &&
        (!normalized.timeSeriesParameters.value || normalized.timeSeriesParameters.value.length === 0)) {

        normalized.timeSeriesParameters.value = [
            { year: 0, value: normalized.parameters.value || 0 }
        ];
    }

    return normalized;
};