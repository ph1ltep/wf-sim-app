// src/utils/distributions/fixed.js
import { DistributionBase } from './distributionBase';

/**
 * Fixed Distribution (constant value with optional growth rate)
 * Extends distributionBase with Fixed distribution implementation
 * 
 * This is not a true statistical distribution but a deterministic value
 * that can grow/decline at a fixed rate over time.
 */
export const Fixed = {
    // Extend the base distribution template
    ...DistributionBase.template,

    /**
     * Validate parameters for Fixed distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        // Fixed distribution only requires a value parameter
        if (parameters.value === undefined || parameters.value === null) {
            return {
                isValid: false,
                message: ["Fixed value is required"],
                details: "Please provide a fixed value for this distribution."
            };
        }
        return { isValid: true };
    },

    /**
     * Calculate mean value for Fixed distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        return DistributionBase.helpers.getParam(parameters, 'value', 0);
    },

    /**
     * Calculate standard deviation for Fixed distribution (always 0)
     * @returns {number} Standard deviation
     */
    calculateStdDev() {
        return 0; // Fixed distribution has no variability
    },

    /**
     * Calculate PDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value (Dirac delta function)
     */
    calculatePDF(x, parameters) {
        // For Fixed distribution, PDF is a Dirac delta function
        // For visualization purposes, we approximate it as a narrow spike
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        const epsilon = Math.abs(value) * 0.0001 || 0.0001; // Small tolerance value 

        return Math.abs(x - value) < epsilon ? 1 / epsilon : 0;
    },

    /**
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value (Heaviside step function)
     */
    calculateCDF(x, parameters) {
        // For Fixed distribution, CDF is a Heaviside step function
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        return x >= value ? 1 : 0;
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        // For Fixed distribution, all quantiles equal the fixed value
        // except p=0, which is technically -infinity
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        return p > 0 ? value : value - 1e-10; // Small offset for p=0
    },

    /**
     * Calculate future value with compound growth
     * @param {Object} parameters - Distribution parameters
     * @param {number} years - Number of years to project
     * @returns {number} Future value
     */
    calculateFutureValue(parameters, years) {
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 0) / 100; // Convert percentage to decimal

        // Compound growth formula: FV = PV * (1 + rate)^time
        return value * Math.pow(1 + drift, years);
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 0);

        // Filter x values close to the fixed value for better visualization
        const epsilon = Math.abs(value) * 0.05 || 0.1; // Wider tolerance for visualization
        const filteredXValues = xValues.filter(x => Math.abs(x - value) < epsilon * 10);

        // If no values close to fixed value, add some points around it
        const pointsAroundValue = filteredXValues.length > 0 ? filteredXValues : [
            value - epsilon,
            value - epsilon / 2,
            value,
            value + epsilon / 2,
            value + epsilon
        ];

        // Approximate delta function with a narrow spike for visualization
        const visualEpsilon = epsilon / 5;
        const pdfValues = pointsAroundValue.map(x =>
            Math.abs(x - value) < visualEpsilon ? 1 / visualEpsilon : 0
        );

        // Calculate percentile points (all equal to value)
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                percentilePoints.push({
                    percentile: percentile,
                    x: value,
                    y: pdfValues[pointsAroundValue.indexOf(value)] || 0
                });
            });
        }

        // Create key points for markers
        const keyPoints = [
            { x: value, y: pdfValues[pointsAroundValue.indexOf(value)] || 0, label: 'Value' }
        ];

        return {
            xValues: pointsAroundValue,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                value,
                drift,
                mean: value,
                median: value,
                mode: value,
                stdDev: 0,
                variance: 0
            }
        };
    },

    /**
     * Generate CDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} CDF curve data and statistics
     */
    generateCDF(parameters, xValues, percentiles = []) {
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 0);

        // For visualizing a step function, we need points just before and after the value
        const epsilon = Math.abs(value) * 0.001 || 0.001;
        const extendedXValues = [...xValues];

        // Make sure we have points just before and after the value
        if (!extendedXValues.includes(value)) {
            extendedXValues.push(value - epsilon, value, value + epsilon);
            extendedXValues.sort((a, b) => a - b);
        }

        // Step function: 0 before value, 1 after value
        const cdfValues = extendedXValues.map(x => x >= value ? 1 : 0);

        // Calculate percentile points (all equal to value)
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                percentilePoints.push({
                    percentile: percentile,
                    x: value,
                    y: 0.5 // Center point of step
                });
            });
        }

        // Create key points for markers
        const keyPoints = [
            { x: value, y: 0.5, label: 'Value' } // Mark at center of step
        ];

        return {
            xValues: extendedXValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                value,
                drift,
                mean: value,
                median: value,
                mode: value,
                stdDev: 0,
                variance: 0
            }
        };
    },

    /**
     * Generate time series projection data
     * @param {Object} parameters - Distribution parameters
     * @param {number} years - Number of years to project
     * @returns {Array} Array of data points {year, value}
     */
    generateTimeSeries(parameters, years = 20) {
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 0) / 100; // Convert percentage to decimal

        // Create time series data with compound growth
        return Array.from({ length: years + 1 }, (_, i) => ({
            year: i,
            value: value * Math.pow(1 + drift, i)
        }));
    },

    /**
     * Get metadata for Fixed distribution
     * @param {Object|number|null} currentValue - Optional current value to influence defaults
     * @returns {Object} Metadata
     */
    getMetadata(currentValue = null) {
        // Convert current value to number if it's an object
        let value = null;
        if (currentValue !== null) {
            value = typeof currentValue === 'object'
                ? DistributionBase.helpers.getParam(currentValue, 'value', 0)
                : currentValue;
        }

        return {
            name: "Fixed Value",
            description: "A constant value with optional annual growth/decline rate.",
            applications: "Used for well-known constant values or when a single best estimate is preferred over a range of values.",
            examples: "Fixed operations and maintenance costs, known quantities, or deterministic projections.",
            defaultCurve: "cdf", // CDF is better for visualizing fixed values
            nonNegativeSupport: false, // Fixed distribution can support any value
            minPointsRequired: 1, // Only need one point for a fixed value
            parameters: [
                {
                    name: "value",
                    description: "The exact value to use",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Value",
                        tooltip: "Exact value to use (no randomness)",
                        defaultValue: value !== null ? value : 0
                    }
                },
                {
                    name: "drift",
                    description: "Annual percentage change",
                    required: false,
                    fieldType: "percentage",
                    fieldProps: {
                        label: "Growth rate (%)",
                        tooltip: "Annual percentage growth or decline rate",
                        min: -50,
                        max: 100,
                        step: 0.1,
                        precision: 1,
                        defaultValue: 0
                    }
                }
            ]
        };
    }
};