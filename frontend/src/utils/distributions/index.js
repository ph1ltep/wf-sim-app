// src/utils/distributions/index.js - Enhanced with percentile support
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
import { Gamma } from './gamma';
import {
    validateDistribution,
    normalizeDistribution,
    initializeTimeSeriesIfEmpty,
    getMinRequiredPoints,
    checkDataCompatibility
} from './validationHelper';
import { generatePdfPlot, hexToRgb, organizePercentiles } from '../plotUtils';

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
    gbm: GBM,
    gamma: Gamma
};

export const distributionTypes = [
    { value: 'fixed', label: 'Fixed Value' },
    { value: 'normal', label: 'Normal Distribution' },
    { value: 'lognormal', label: 'Lognormal Distribution' },
    { value: 'triangular', label: 'Triangular Distribution' },
    { value: 'uniform', label: 'Uniform Distribution' },
    { value: 'weibull', label: 'Weibull Distribution' },
    { value: 'exponential', label: 'Exponential Distribution' },
    { value: 'poisson', label: 'Poisson Distribution' },
    { value: 'kaimal', label: 'Kaimal Distribution' },
    { value: 'gbm', label: 'Geometric Brownian Motion' },
    { value: 'gamma', label: 'Gamma Distribution' },
];

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
     * Validate distribution parameters using the new schema structure
     * @param {Object} distribution - Distribution object with type, parameters, and timeSeriesParameters
     * @param {boolean} validateTimeSeries - Whether to validate time series data
     * @returns {Object} Validation result with isValid flag and messages
     */
    validateDistribution,

    /**
     * Validate distribution parameters (legacy method)
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result with isValid flag and messages
     */
    validateDistributionParameters(type, parameters) {
        const distribution = this.getDistribution(type);

        if (!distribution) {
            return {
                isValid: false,
                message: [`Unknown distribution type: ${type}`],
                details: `The distribution type "${type}" is not supported. Please choose from the available options.`
            };
        }

        if (!parameters) {
            return {
                isValid: false,
                message: ["Parameters are required"],
                details: "Please provide parameters for the distribution."
            };
        }

        return distribution.validate(parameters);
    },

    /**
     * Generate plot data for a distribution
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options including percentile support
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

        // Use plotUtils.generatePdfPlot instead of distribution.generatePlot
        return generatePdfPlot(distribution, parameters, options);
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
    },

    /**
     * Get Metadata by type
     * @param {string} type - Distribution type
     * @returns {Object} Metadata implementation or null if not found
     */
    getMetadata(type) {
        if (!type) return null;
        const distribution = this.getDistribution(type);

        return distribution ? distribution.getMetadata() : null;
    },

    /**
     * Normalize a distribution object to ensure it conforms to the expected schema
     * @param {Object} distribution - Distribution object to normalize
     * @returns {Object} Normalized distribution object
     */
    normalizeDistribution,

    /**
     * Initialize time series data if empty
     * @param {Object} distribution - Distribution object
     * @returns {Object} Distribution with initialized time series data
     */
    initializeTimeSeriesIfEmpty,

    /**
     * Get minimum required points for a distribution type
     * @param {string} type - Distribution type
     * @returns {number} Minimum recommended number of data points
     */
    getMinRequiredPoints,

    /**
     * Check compatibility of time series data with a distribution type
     * @param {string} type - Distribution type
     * @param {Array} data - Time series data points
     * @returns {Object|null} Compatibility check result or null if compatible
     */
    checkDataCompatibility,

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
    GBM,
    Gamma
};