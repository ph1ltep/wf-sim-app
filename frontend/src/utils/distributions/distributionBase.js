// src/utils/distributions/distributionBase.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';

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
         * @returns {Object} Validation result with isValid flag and messages
         */
        validate(parameters) {
            throw new Error('validate() method must be implemented by each distribution');
        },

        /**
         * Generate plot data for this distribution
         * @param {Object} parameters - Distribution parameters
         * @param {Object} options - Plotting options
         * @returns {Object} Plot data object with data, shapes, annotations, etc.
         */
        generatePlot(parameters, options) {
            throw new Error('generatePlot() method must be implemented by each distribution');
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
        getParam: PlotUtils.getParam
    }
};