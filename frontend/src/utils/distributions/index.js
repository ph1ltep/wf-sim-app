// src/utils/distributions/index.js
import { Fixed } from './fixed';
import { Normal } from './normal';
import { LogNormal } from './lognormal';
import { Triangular } from './triangular';
import { Uniform } from './uniform';
import { Weibull } from './weibull';
import { Exponential } from './exponential';
import { Poisson } from './poisson';
import { Kaimal } from './kaimal';
import { GBM } from './gbm';

// Map of distribution types to their implementations
const DISTRIBUTIONS = {
    fixed: Fixed,
    normal: Normal,
    lognormal: LogNormal,
    triangular: Triangular,
    uniform: Uniform,
    weibull: Weibull,
    exponential: Exponential,
    poisson: Poisson,
    kaimal: Kaimal,
    gbm: GBM
};

/**
 * Distribution utilities
 */
export const DistributionUtils = {
    /**
     * Get distribution by type
     * @param {string} type - Distribution type
     * @returns {Object} Distribution implementation or null if not found
     */
    getDistribution(type) {
        if (!type) return null;
        return DISTRIBUTIONS[type.toLowerCase()] || null;
    },

    /**
     * Validate distribution parameters
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result with isValid flag and messages
     */
    validateDistribution(type, parameters) {
        const distribution = this.getDistribution(type);

        if (!distribution) {
            return {
                isValid: false,
                message: `Unknown distribution type: ${type}`,
                details: `The distribution type "${type}" is not supported. Please choose from the available options.`
            };
        }

        if (!parameters) {
            return {
                isValid: false,
                message: "Parameters are required",
                details: "Please provide parameters for the distribution."
            };
        }

        return distribution.validate(parameters);
    },

    /**
     * Generate plot data for a distribution
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generateDistributionData(type, parameters, options = {}) {
        const distribution = this.getDistribution(type);

        if (!distribution || !parameters) {
            return {
                data: [],
                shapes: [],
                annotations: [],
                title: 'Unknown Distribution',
                xaxisTitle: options.addonAfter ? `Value (${options.addonAfter})` : 'Value',
                yaxisTitle: 'Probability Density',
                showLegend: false
            };
        }

        return distribution.generatePlot(parameters, options);
    },

    /**
     * Get list of available distribution types
     * @returns {Array} Array of distribution types
     */
    getDistributionTypes() {
        return Object.keys(DISTRIBUTIONS);
    },

    /**
     * Get metadata for all distributions
     * @returns {Object} Metadata for all distributions
     */
    getAllDistributionMetadata() {
        const metadata = {};

        Object.entries(DISTRIBUTIONS).forEach(([type, distribution]) => {
            metadata[type] = distribution.getMetadata();
        });

        return metadata;
    }
};

// Export individual distributions
export {
    Fixed,
    Normal,
    LogNormal,
    Triangular,
    Uniform,
    Weibull,
    Exponential,
    Poisson,
    Kaimal,
    GBM
};