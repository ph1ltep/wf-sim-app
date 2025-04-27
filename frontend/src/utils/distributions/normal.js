// src/utils/distributions/normal.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';

/**
 * Normal Distribution
 * Extends distributionBase with normal distribution implementation
 */
export const Normal = {
    // Extend the base distribution template
    ...DistributionBase.template,
    /**
     * Validate parameters for Normal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.stdDev === undefined || parameters.stdDev === null) {
            issues.push("Standard deviation is required");
        } else if (parameters.stdDev <= 0) {
            issues.push("Standard deviation must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The normal distribution requires a positive standard deviation."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for this distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        return DistributionBase.helpers.getParam(parameters, 'value', 0);
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const mean = this.calculateMean(parameters);
        const stdDevPercent = DistributionBase.helpers.getParam(parameters, 'stdDev', 10);
        return Math.abs(mean) * (stdDevPercent / 100);
    },

    /**
     * Calculate PDF at point x
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value at x
     */
    calculatePDF(x, parameters) {
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        return jStat.normal.pdf(x, mean, stdDev);
    },

    /**
     * Calculate CDF at point x
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value at x
     */
    calculateCDF(x, parameters) {
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        return jStat.normal.cdf(x, mean, stdDev);
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        return jStat.normal.inv(p, mean, stdDev);
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // Calculate PDF values for all x values at once
        const pdfValues = xValues.map(x => jStat.normal.pdf(x, mean, stdDev));

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = jStat.normal.inv(p, mean, stdDev);
                const y = jStat.normal.pdf(x, mean, stdDev);
                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: y
                });
            });
        }

        // Calculate key statistics
        const stats = {
            mean: mean,
            median: mean, // For normal distribution, mean = median
            mode: mean,   // For normal distribution, mean = mode = median
            stdDev: stdDev,
            stdDevPercent: DistributionBase.helpers.getParam(parameters, 'stdDev', 10),
            variance: stdDev * stdDev
        };

        // Create key point data
        const keyPoints = [
            { x: mean, y: jStat.normal.pdf(mean, mean, stdDev), label: 'Mean' }
        ];

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;

        keyPoints.push(
            { x: stdDevPlus, y: jStat.normal.pdf(stdDevPlus, mean, stdDev), label: '+1σ' },
            { x: stdDevMinus, y: jStat.normal.pdf(stdDevMinus, mean, stdDev), label: '-1σ' }
        );

        return {
            xValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats
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
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // Calculate CDF values for all x values at once
        const cdfValues = xValues.map(x => jStat.normal.cdf(x, mean, stdDev));

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = jStat.normal.inv(p, mean, stdDev);
                const y = p; // CDF value is exactly p at the percentile point
                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: y
                });
            });
        }

        // Calculate key statistics
        const stats = {
            mean: mean,
            median: mean, // For normal distribution, mean = median
            mode: mean,   // For normal distribution, mean = mode = median
            stdDev: stdDev,
            stdDevPercent: DistributionBase.helpers.getParam(parameters, 'stdDev', 10),
            variance: stdDev * stdDev
        };

        // Create key point data for CDF
        const keyPoints = [
            { x: mean, y: 0.5, label: 'Mean' } // CDF = 0.5 at mean for normal distribution
        ];

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;

        keyPoints.push(
            { x: stdDevPlus, y: jStat.normal.cdf(stdDevPlus, mean, stdDev), label: '+1σ' }, // ~0.84
            { x: stdDevMinus, y: jStat.normal.cdf(stdDevMinus, mean, stdDev), label: '-1σ' } // ~0.16
        );

        return {
            xValues,
            cdfValues, // CDF values instead of PDF values
            percentilePoints,
            keyPoints,
            stats
        };
    },

    /**
     * Get metadata for Normal distribution
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
            name: "Normal Distribution",
            description: "Symmetrical bell curve representing values clustered around a mean.",
            applications: "Modeling natural phenomena, measurement errors, and averages of large samples regardless of the underlying distribution.",
            examples: "Average wind speeds, measurement errors, aggregated financial metrics.",
            defaultCurve: "pdf", // Normal distribution is best visualized with PDF
            nonNegativeSupport: false, // Normal distribution supports negative values
            minPointsRequired: 5, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Mean value of the distribution",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Center point of the normal distribution",
                        defaultValue: value !== null ? value : 0
                    }
                },
                {
                    name: "stdDev",
                    description: "Standard deviation as percentage of mean",
                    required: true,
                    fieldType: "percentage", // Explicitly mark as percentage field type
                    fieldProps: {
                        label: "Std Dev (%)",
                        tooltip: "Standard deviation as percentage of the mean value",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: value !== null ? Math.max(1, Math.abs(value) * 0.1) : 10
                    }
                }
            ]
        };
    }
};