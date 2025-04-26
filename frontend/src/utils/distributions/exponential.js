// src/utils/distributions/exponential.js
import { DistributionBase } from './distributionBase';

/**
 * Exponential Distribution
 * Extends distributionBase with Exponential distribution implementation
 */
export const Exponential = {
    // Extend the base distribution template
    ...DistributionBase.template,

    /**
     * Validate parameters for exponential distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        if (parameters.lambda === undefined || parameters.lambda === null) {
            return {
                isValid: false,
                message: ["Lambda parameter is required"],
                details: "The exponential distribution requires a lambda (rate) parameter."
            };
        } else if (parameters.lambda <= 0) {
            return {
                isValid: false,
                message: ["Lambda parameter must be positive"],
                details: "The exponential distribution's lambda parameter must be greater than zero."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Exponential distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);
        return 1 / lambda;
    },

    /**
     * Calculate standard deviation for Exponential distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        // For exponential distribution, std dev = mean = 1/lambda
        return this.calculateMean(parameters);
    },

    /**
     * Calculate PDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value
     */
    calculatePDF(x, parameters) {
        if (x < 0) return 0;

        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);
        return lambda * Math.exp(-lambda * x);
    },

    /**
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        if (x < 0) return 0;

        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);
        return 1 - Math.exp(-lambda * x);
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);

        // Exponential quantile formula: -ln(1-p)/lambda
        return -Math.log(1 - p) / lambda;
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues with very large values
        const mean = this.calculateMean(parameters);
        const filteredXValues = xValues.filter(x => x >= 0);

        // Calculate PDF values
        const pdfValues = filteredXValues.map(x => this.calculatePDF(x, parameters));

        // For exponential, peak is at x=0
        const peakY = lambda;

        // For exponential, mean and std dev are both 1/lambda
        const stdDev = mean;

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = this.calculateQuantile(p, parameters);
                const y = this.calculatePDF(x, parameters);

                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: y
                });
            });
        }

        // Create key points for markers
        const keyPoints = [];

        // Add value point
        const valueY = this.calculatePDF(value, parameters);
        keyPoints.push({ x: value, y: valueY, label: 'Value' });

        // Show peak at x=0 if value isn't at 0
        if (value > 0.001) {
            keyPoints.push({ x: 0, y: peakY, label: 'Peak' });
        }

        // Add mean point if different from value
        if (Math.abs(value - mean) > 0.001 * mean) {
            const meanY = lambda * Math.exp(-1); // PDF at x=mean is lambda*e^-1
            keyPoints.push({ x: mean, y: meanY, label: 'Mean (1σ)' });
        }

        // Add std dev points if different from mean (they're the same for exponential)
        if (Math.abs(value - (mean + stdDev)) > 0.001 * mean) {
            const stdDevPlusY = lambda * Math.exp(-2); // PDF at x=2*mean is lambda*e^-2
            keyPoints.push({ x: mean + stdDev, y: stdDevPlusY, label: '+1σ' });
        }

        return {
            xValues: filteredXValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                lambda,
                mean,
                median: Math.log(2) / lambda, // For exponential, median = ln(2)/lambda
                stdDev,
                variance: stdDev * stdDev
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
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues with very large values
        const filteredXValues = xValues.filter(x => x >= 0);

        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => this.calculateCDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = mean; // For exponential, mean = std dev = 1/lambda
        const median = Math.log(2) / lambda;

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = this.calculateQuantile(p, parameters);

                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: p // For CDF, y equals percentile probability
                });
            });
        }

        // Create key points for markers
        const keyPoints = [];

        // Add value point
        const valueCDF = this.calculateCDF(value, parameters);
        keyPoints.push({ x: value, y: valueCDF, label: 'Value' });

        // Add mean point if different from value
        if (Math.abs(value - mean) > 0.001 * mean) {
            const meanCDF = this.calculateCDF(mean, parameters);
            keyPoints.push({ x: mean, y: meanCDF, label: 'Mean' });
        }

        // Add median point
        const medianCDF = this.calculateCDF(median, parameters);
        keyPoints.push({ x: median, y: medianCDF, label: 'Median' });

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // For exponential distribution, std dev + is 2*mean
        const stdDevPlusCDF = this.calculateCDF(stdDevPlus, parameters);
        keyPoints.push({ x: stdDevPlus, y: stdDevPlusCDF, label: '+1σ' });

        return {
            xValues: filteredXValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                lambda,
                mean,
                median,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Get metadata for Exponential distribution
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

        // For exponential, lambda = 1/mean
        const defaultLambda = value !== null && value > 0 ? 1 / value : 1;

        return {
            name: "Exponential Distribution",
            description: "Models the time between independent events occurring at a constant average rate.",
            applications: "Used for modeling waiting times and the lifetime of components with constant failure rate.",
            examples: "Time between failures for simple components, inter-arrival times for random events.",
            defaultCurve: "pdf", // Exponential is best visualized with PDF
            nonNegativeSupport: true, // Exponential only supports non-negative values
            minPointsRequired: 4, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Mean value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Value",
                        tooltip: "Mean value of the distribution (1/lambda)",
                        min: 0,
                        defaultValue: value !== null ? value : 1
                    }
                },
                {
                    name: "lambda",
                    description: "Rate parameter",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Lambda",
                        tooltip: "Rate parameter of the exponential distribution",
                        min: 0.001,
                        step: 0.01,
                        defaultValue: defaultLambda
                    }
                }
            ]
        };
    }
};