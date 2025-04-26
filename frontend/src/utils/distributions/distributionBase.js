// src/utils/distributions/distributionBase.js
import * as jStat from 'jstat';

/**
 * Base class for all distribution implementations
 * This defines the standard methods that all distributions must implement
 */
export const DistributionBase = {
    /**
     * Template for distribution implementation
     * Each distribution must implement these core functions
     */
    template: {
        /**
         * Validate parameters for this distribution
         * @param {Object} parameters - Distribution parameters
         * @returns {Object} Validation result with isValid flag and messages[]
         */
        validate(parameters) {
            throw new Error('validate() method must be implemented by each distribution');
        },

        /**
         * Calculate probability density function (PDF) at point x
         * @param {number} x - Point to evaluate PDF at
         * @param {Object} parameters - Distribution parameters
         * @returns {number} PDF value at x
         */
        calculatePDF(x, parameters) {
            throw new Error('calculatePDF() method must be implemented by each distribution');
        },

        /**
         * Calculate cumulative distribution function (CDF) at point x
         * @param {number} x - Point to evaluate CDF at
         * @param {Object} parameters - Distribution parameters
         * @returns {number} CDF value at x (0-1)
         */
        calculateCDF(x, parameters) {
            throw new Error('calculateCDF() method must be implemented by each distribution');
        },

        /**
         * Calculate the inverse cumulative distribution function (quantile) for probability p
         * @param {number} p - Probability (0-1)
         * @param {Object} parameters - Distribution parameters
         * @returns {number} Value x where CDF(x) = p
         */
        calculateQuantile(p, parameters) {
            throw new Error('calculateQuantile() method must be implemented by each distribution');
        },

        /**
         * Calculate mean value for this distribution
         * @param {Object} parameters - Distribution parameters
         * @returns {number} Mean value
         */
        calculateMean(parameters) {
            throw new Error('calculateMean() method must be implemented by each distribution');
        },

        /**
         * Calculate standard deviation for this distribution
         * @param {Object} parameters - Distribution parameters
         * @returns {number} Standard deviation
         */
        calculateStdDev(parameters) {
            throw new Error('calculateStdDev() method must be implemented by each distribution');
        },

        /**
         * Generate PDF curve and key statistics for plotting
         * @param {Object} parameters - Distribution parameters
         * @param {Array} xValues - X values to calculate for
         * @param {Array} percentiles - Array of percentile objects (optional)
         * @returns {Object} PDF curve data and statistics
         */
        generatePDF(parameters, xValues, percentiles = []) {
            throw new Error('generatePDF() method must be implemented by each distribution');
        },

        /**
         * Generate CDF curve and key statistics for plotting
         * @param {Object} parameters - Distribution parameters
         * @param {Array} xValues - X values to calculate for
         * @param {Array} percentiles - Array of percentile objects (optional)
         * @returns {Object} CDF curve data and statistics
         */
        generateCDF(parameters, xValues, percentiles = []) {
            throw new Error('generateCDF() method must be implemented by each distribution');
        },

        /**
         * Get distribution metadata
         * @param {Object|number|null} currentValue - Optional current value to influence defaults (can be number or full parameters object)
         * @returns {Object} Metadata including name, description, parameter info, and visualization preferences
         */
        getMetadata(currentValue = null) {
            throw new Error('getMetadata() method must be implemented by each distribution');
        }
    },

    /**
     * Common helper functions that distributions can use
     */
    helpers: {
        /**
         * Get parameter with fallback
         * @param {Object} params - Parameters object
         * @param {string} name - Parameter name
         * @param {*} defaultValue - Default value if parameter is not found
         * @returns {*} Parameter value or default
         */
        getParam(params, name, defaultValue) {
            if (!params || params[name] === undefined || params[name] === null) {
                return defaultValue;
            }
            return params[name];
        },

        /**
         * Generate evenly spaced x values within a range
         * @param {number} min - Minimum value
         * @param {number} max - Maximum value
         * @param {number} count - Number of points
         * @returns {Array} Array of x values
         */
        generateRange(min, max, count = 100) {
            const step = (max - min) / (count - 1);
            return Array.from({ length: count }, (_, i) => min + i * step);
        },

        /**
         * Calculate appropriate x-range for a distribution
         * @param {Object} parameters - Distribution parameters
         * @param {Function} calculateMean - Function to calculate mean
         * @param {Function} calculateStdDev - Function to calculate standard deviation
         * @param {boolean} nonNegativeSupport - Whether distribution supports negative values
         * @returns {Object} Object with min and max values
         */
        calculateXRange(parameters, calculateMean, calculateStdDev, nonNegativeSupport = false) {
            const mean = calculateMean(parameters);
            const stdDev = calculateStdDev(parameters);

            // Default range is ±4 standard deviations from mean
            let min = mean - 4 * stdDev;
            let max = mean + 4 * stdDev;

            // For non-negative distributions, adjust the minimum
            if (nonNegativeSupport && min < 0) {
                min = 0;
            }

            return { min, max };
        },

        /**
         * Ensure value is within valid bounds
         * @param {number} value - Value to check
         * @param {number} min - Minimum allowed value
         * @param {number} max - Maximum allowed value
         * @returns {number} Value within bounds
         */
        clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        },

        /**
         * Calculate dynamic defaults for parameter based on current value
         * @param {number} currentValue - Current value to base defaults on
         * @param {string} paramType - Parameter type (min, max, stdDev, etc.)
         * @returns {number} Calculated default
         */
        dynamicDefault(currentValue, paramType) {
            if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
                // Return standard defaults if no current value
                switch (paramType) {
                    case 'min': return 0;
                    case 'max': return 100;
                    case 'stdDev': return 10;
                    case 'mean': return 50;
                    default: return 0;
                }
            }

            // Ensure positive current value for calculations
            const absValue = Math.abs(currentValue) || 1;

            switch (paramType) {
                case 'min': return Math.max(0, currentValue - 0.1 * absValue);
                case 'max': return currentValue + 0.1 * absValue;
                case 'stdDev': return 0.1 * absValue;
                case 'shape': return 2;
                case 'scale': return absValue / 2;
                case 'lambda': return 1 / absValue;
                default: return currentValue;
            }
        }
    },

    /**
     * Common metadata structure all distributions should implement
     */
    metadataTemplate: {
        name: "Distribution Name",
        description: "Description of the distribution",
        applications: "Where this distribution is typically used",
        examples: "Example use cases",
        defaultCurve: "pdf", // or "cdf" depending on visualization preference
        nonNegativeSupport: false, // Whether distribution supports only non-negative values
        minPointsRequired: 3, // Minimum points needed for fitting
        parameters: [
            // Parameter definitions
        ]
    }
};