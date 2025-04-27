// src/utils/distributions/index.js - Enhanced with base class support
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
import { DistributionBase } from './distributionBase';
import {
    hexToRgb,
    generatePdfPlot,
    generateCdfPlot,
    organizePercentiles
} from '../plotUtils';

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

// Available distribution types for UI selection
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
     * Get base distribution class
     * @returns {Object} Base distribution class
     */
    getDistributionBase() {
        return DistributionBase;
    },

    /**
     * Validate distribution parameters using the new schema structure
     * @param {Object} distribution - Distribution object with type, parameters, and timeSeriesParameters
     * @param {boolean} validateTimeSeries - Whether to validate time series data
     * @returns {Object} Validation result with isValid flag and messages
     */
    validateDistribution(distribution, validateTimeSeries = true) {
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

        const distributionImpl = this.getDistribution(distribution.type);
        if (!distributionImpl) {
            return {
                isValid: false,
                message: [`Unknown distribution type: ${distribution.type}`],
                details: `The distribution type "${distribution.type}" is not supported. Please choose from the available options.`
            };
        }

        // Use distribution's own validation method for the parameters
        return distributionImpl.validate(distribution.parameters || {});
    },

    /**
     * Generate plot data for a distribution, using the preferred visualization curve
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

        // Get metadata to determine preferred visualization curve
        const metadata = distribution.getMetadata();
        const defaultCurve = metadata?.defaultCurve || 'pdf';

        // Use the preferred curve or override with options
        const useCdf = options.useCdf || defaultCurve === 'cdf';

        // Use appropriate plotting function based on preferred curve
        if (useCdf) {
            return generateCdfPlot(distribution, parameters, options);
        } else {
            return generatePdfPlot(distribution, parameters, options);
        }
    },

    /**
     * Get minimum required points for a distribution from metadata
     * @param {string} type - Distribution type
     * @returns {number} Minimum recommended number of data points
     */
    getMinRequiredPoints(type) {
        const distribution = this.getDistribution(type);
        if (!distribution) return 3; // Default fallback

        const metadata = distribution.getMetadata();
        return metadata?.minPointsRequired || 3;
    },

    /**
     * Check if distribution supports non-negative values only
     * @param {string} type - Distribution type
     * @returns {boolean} Whether distribution supports only non-negative values
     */
    isNonNegative(type) {
        const distribution = this.getDistribution(type);
        if (!distribution) return false;

        const metadata = distribution.getMetadata();
        return metadata?.nonNegativeSupport || false;
    },

    /**
     * Get appropriate visualization curve for a distribution
     * @param {string} type - Distribution type
     * @returns {string} Preferred visualization curve ('pdf' or 'cdf')
     */
    getDefaultCurve(type) {
        const distribution = this.getDistribution(type);
        if (!distribution) return 'pdf';

        const metadata = distribution.getMetadata();
        return metadata?.defaultCurve || 'pdf';
    },

    /**
     * Get all available distribution types with metadata
     * @returns {Object} Map of distribution types to their metadata
     */
    getAllDistributionMetadata() {
        const metadata = {};

        Object.entries(DISTRIBUTIONS).forEach(([type, distribution]) => {
            metadata[type] = distribution.getMetadata();
        });

        return metadata;
    },

    /**
     * Get metadata for a specific distribution type
     * @param {string} type - Distribution type
     * @param {Object|number|null} currentValue - Optional current value for dynamic defaults
     * @returns {Object|null} Distribution metadata or null if not found
     */
    getMetadata(type, currentValue = null) {
        const distribution = this.getDistribution(type);
        if (!distribution) return null;

        return distribution.getMetadata(currentValue);
    },

    /**
     * Calculate mean value for a distribution
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(type, parameters) {
        const distribution = this.getDistribution(type);
        if (!distribution) return parameters?.value || 0;

        return distribution.calculateMean(parameters);
    },

    /**
     * Calculate standard deviation for a distribution
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(type, parameters) {
        const distribution = this.getDistribution(type);
        if (!distribution) return 0;

        return distribution.calculateStdDev(parameters);
    },

    /**
     * Calculate percentile value for a distribution
     * @param {string} type - Distribution type
     * @param {Object} parameters - Distribution parameters
     * @param {number} percentile - Percentile value (0-100)
     * @returns {number} Value at percentile
     */
    calculatePercentile(type, parameters, percentile) {
        const distribution = this.getDistribution(type);
        if (!distribution) return parameters?.value || 0;

        // Convert percentile to probability (0-1)
        const p = percentile / 100;
        return distribution.calculateQuantile(p, parameters);
    },

    /**
 * Ensures a distribution object conforms to the expected schema structure
 * 
 * @param {Object} distribution Distribution object to normalize
 * @returns {Object} Normalized distribution object
 */
    normalizeDistribution(distribution) {
        if (!distribution) {
            return {
                type: 'fixed',
                timeSeriesMode: false,
                parameters: { value: 0 },
                timeSeriesParameters: { value: [] }
            };
        }

        // Create a new object with defaults
        const normalized = {
            type: distribution.type || 'fixed',
            timeSeriesMode: !!distribution.timeSeriesMode,
            parameters: { ...(distribution.parameters || { value: 0 }) },
            timeSeriesParameters: { ...(distribution.timeSeriesParameters || { value: [] }) }
        };

        // Ensure parameters.value is a number
        if (typeof normalized.parameters.value !== 'number') {
            normalized.parameters.value = 0;
        }

        // Ensure timeSeriesParameters.value is an array
        if (!Array.isArray(normalized.timeSeriesParameters.value)) {
            normalized.timeSeriesParameters.value = [];
        }

        return normalized;
    }
};

// Export individual distributions and base class
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
    Gamma,
    DistributionBase
};