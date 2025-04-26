// src/utils/distributions/poisson.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';

/**
 * Poisson Distribution
 * Extends distributionBase with Poisson distribution implementation
 */
export const Poisson = {
    // Extend the base distribution template
    ...DistributionBase.template,

    /**
     * Validate parameters for Poisson distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        if (parameters.lambda === undefined || parameters.lambda === null) {
            return {
                isValid: false,
                message: ["Lambda parameter is required"],
                details: "The Poisson distribution requires a lambda (mean) parameter."
            };
        } else if (parameters.lambda <= 0) {
            return {
                isValid: false,
                message: ["Lambda parameter must be positive"],
                details: "The Poisson distribution's lambda parameter must be greater than zero."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Poisson distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        return DistributionBase.helpers.getParam(parameters, 'lambda', 3);
    },

    /**
     * Calculate standard deviation for Poisson distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        // For Poisson, std dev = sqrt(lambda)
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        return Math.sqrt(lambda);
    },

    /**
     * Calculate PMF (probability mass function) at a specific point
     * @param {number} x - Point to evaluate (integer)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PMF value
     */
    calculatePDF(x, parameters) {
        // Poisson is discrete, so round x to nearest integer
        const k = Math.round(x);
        if (k < 0) return 0;

        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        return jStat.poisson.pdf(k, lambda);
    },

    /**
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        // Poisson CDF at a real x value is P(X ≤ floor(x))
        const k = Math.floor(x);
        if (k < 0) return 0;

        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        return jStat.poisson.cdf(k, lambda);
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        if (p <= 0) return 0;
        if (p >= 1) return Infinity;

        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);

        // Numerical method for Poisson quantile
        let k = 0;
        let sum = Math.exp(-lambda); // P(X=0)

        // Start probability sum at P(X=0)
        let cdf = sum;

        // Keep adding P(X=k) terms until CDF exceeds p
        while (cdf < p && k < 100) { // 100 is a reasonably high limit
            k++;
            // Calculate P(X=k) from previous term: P(X=k) = P(X=k-1) * lambda / k
            sum = sum * lambda / k;
            cdf += sum;
        }

        return k;
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        const value = DistributionBase.helpers.getParam(parameters, 'value', lambda);

        // Poisson is discrete, so we need integer x values
        // Get unique integer values in the provided range
        const uniqueIntValues = Array.from(
            new Set(xValues.map(x => Math.round(x)).filter(x => x >= 0))
        ).sort((a, b) => a - b);

        // If no valid x values, generate a reasonable range
        const intValues = uniqueIntValues.length > 0 ? uniqueIntValues :
            Array.from({ length: Math.max(20, Math.ceil(lambda * 3)) }, (_, i) => i);

        // Calculate PDF values for each integer point
        const pdfValues = intValues.map(x => jStat.poisson.pdf(x, lambda));

        // Calculate statistics
        const mean = lambda;
        const stdDev = Math.sqrt(lambda);
        const mode = Math.floor(lambda); // Mode of Poisson is floor(lambda)
        if (lambda === Math.floor(lambda)) {
            // If lambda is integer, mode can be lambda-1 as well
            // e.g., for lambda=1, both 0 and 1 are modes
        }

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = this.calculateQuantile(p, parameters);
                const y = jStat.poisson.pdf(Math.round(x), lambda);

                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: y
                });
            });
        }

        // Create key points for markers
        const keyPoints = [];

        // Use rounded value for discrete distribution
        const roundedValue = Math.round(value);
        keyPoints.push({
            x: roundedValue,
            y: jStat.poisson.pdf(roundedValue, lambda),
            label: 'Value'
        });

        // Add mode point if different from value
        if (roundedValue !== mode) {
            keyPoints.push({
                x: mode,
                y: jStat.poisson.pdf(mode, lambda),
                label: 'Mode'
            });

            // If lambda is integer, also mark lambda-1 as mode
            if (lambda === Math.floor(lambda) && lambda > 0 && mode !== lambda - 1) {
                keyPoints.push({
                    x: lambda - 1,
                    y: jStat.poisson.pdf(lambda - 1, lambda),
                    label: 'Mode'
                });
            }
        }

        // Add mean point if different from value and mode
        // For Poisson, mean = lambda, which might not be an integer
        const roundedMean = Math.round(mean);
        if (roundedMean !== roundedValue && roundedMean !== mode) {
            keyPoints.push({
                x: roundedMean,
                y: jStat.poisson.pdf(roundedMean, lambda),
                label: 'Mean'
            });
        }

        // Add std dev points
        const stdDevPlus = Math.round(mean + stdDev);
        const stdDevMinus = Math.max(0, Math.round(mean - stdDev));

        // Only add if they're not already key points
        if (!keyPoints.some(p => p.x === stdDevPlus)) {
            keyPoints.push({
                x: stdDevPlus,
                y: jStat.poisson.pdf(stdDevPlus, lambda),
                label: '+1σ'
            });
        }

        if (stdDevMinus !== 0 && !keyPoints.some(p => p.x === stdDevMinus)) {
            keyPoints.push({
                x: stdDevMinus,
                y: jStat.poisson.pdf(stdDevMinus, lambda),
                label: '-1σ'
            });
        }

        return {
            xValues: intValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                lambda,
                mean,
                mode,
                stdDev,
                variance: lambda
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
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        const value = DistributionBase.helpers.getParam(parameters, 'value', lambda);

        // Poisson is discrete, so we need integer x values
        // Get unique integer values in the provided range
        const uniqueIntValues = Array.from(
            new Set(xValues.map(x => Math.floor(x)).filter(x => x >= 0))
        ).sort((a, b) => a - b);

        // If no valid x values, generate a reasonable range
        const intValues = uniqueIntValues.length > 0 ? uniqueIntValues :
            Array.from({ length: Math.max(20, Math.ceil(lambda * 3)) }, (_, i) => i);

        // Calculate CDF values for each integer point
        const cdfValues = intValues.map(x => jStat.poisson.cdf(x, lambda));

        // Calculate statistics
        const mean = lambda;
        const stdDev = Math.sqrt(lambda);
        const mode = Math.floor(lambda);

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

        // Use floored value for CDF (P(X ≤ floor(value)))
        const flooredValue = Math.floor(value);
        keyPoints.push({
            x: flooredValue,
            y: jStat.poisson.cdf(flooredValue, lambda),
            label: 'Value'
        });

        // Add mode point if different from value
        if (flooredValue !== mode) {
            keyPoints.push({
                x: mode,
                y: jStat.poisson.cdf(mode, lambda),
                label: 'Mode'
            });
        }

        // Add mean point if different from value and mode
        // For Poisson, mean = lambda, which might not be an integer
        const flooredMean = Math.floor(mean);
        if (flooredMean !== flooredValue && flooredMean !== mode) {
            keyPoints.push({
                x: flooredMean,
                y: jStat.poisson.cdf(flooredMean, lambda),
                label: 'Mean'
            });
        }

        // Add std dev points
        const stdDevPlus = Math.floor(mean + stdDev);
        const stdDevMinus = Math.max(0, Math.floor(mean - stdDev));

        // Only add if they're not already key points
        if (!keyPoints.some(p => p.x === stdDevPlus)) {
            keyPoints.push({
                x: stdDevPlus,
                y: jStat.poisson.cdf(stdDevPlus, lambda),
                label: '+1σ'
            });
        }

        if (stdDevMinus !== 0 && !keyPoints.some(p => p.x === stdDevMinus)) {
            keyPoints.push({
                x: stdDevMinus,
                y: jStat.poisson.cdf(stdDevMinus, lambda),
                label: '-1σ'
            });
        }

        return {
            xValues: intValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                lambda,
                mean,
                mode,
                stdDev,
                variance: lambda
            }
        };
    },

    /**
     * Get metadata for Poisson distribution
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

        // For Poisson, value = lambda is a good default
        const defaultLambda = value !== null && value > 0 ? value : 3;

        return {
            name: "Poisson Distribution",
            description: "Models the number of events occurring in a fixed time interval.",
            applications: "Used for modeling the number of independent events occurring at a constant rate.",
            examples: "Number of failures in a time period, number of maintenance calls per month.",
            defaultCurve: "pdf", // Poisson is best visualized with PDF
            nonNegativeSupport: true, // Poisson only supports non-negative integers
            minPointsRequired: 4, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Value",
                        tooltip: "Default value",
                        defaultValue: value !== null ? value : defaultLambda,
                        min: 0
                    }
                },
                {
                    name: "lambda",
                    description: "Lambda (mean)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Lambda",
                        tooltip: "Mean number of events in the specified interval",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: defaultLambda
                    }
                }
            ]
        };
    }
};