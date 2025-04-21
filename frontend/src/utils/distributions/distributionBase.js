// src/utils/distributions/distributionBase.js
import * as jStat from 'jstat';
import { getParam } from '../plotUtils';

/**
 * Base distribution functions and structure
 */
export const DistributionBase = {
    /**
     * Template for distribution implementation
     * Each distribution must implement these functions
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
         * Calculate standard deviation for this distribution
         * @param {Object} parameters - Distribution parameters
         * @returns {number} Standard deviation
         */
        calculateStdDev(parameters) {
            throw new Error('calculateStdDev() method must be implemented by each distribution');
        },

        /**
         * Get distribution metadata
         * @returns {Object} Metadata including name, description, and parameter info
         */
        getMetadata() {
            throw new Error('getMetadata() method must be implemented by each distribution');
        }
    },

    /**
     * Common helper functions that distributions may use
     */
    helpers: {
        getParam
    }
};