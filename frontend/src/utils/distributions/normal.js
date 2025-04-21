// src/utils/distributions/normal.js
import * as jStat from 'jstat';
import { getParam } from '../plotUtils';

/**
 * Normal Distribution
 */
export const Normal = {
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
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const mean = getParam(parameters, 'value', 0);
        // Convert stdDev from percentage to absolute value
        const stdDevPercent = getParam(parameters, 'stdDev', 10);
        const stdDev = Math.abs(mean) * (stdDevPercent / 100);
        
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
            stdDevPercent: stdDevPercent,
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
        const mean = getParam(parameters, 'value', 0);
        // Convert stdDev from percentage to absolute value
        const stdDevPercent = getParam(parameters, 'stdDev', 10);
        const stdDev = Math.abs(mean) * (stdDevPercent / 100);
        
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
            stdDevPercent: stdDevPercent,
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
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const mean = getParam(parameters, 'value', 0);
        // Convert stdDev from percentage to absolute value
        const stdDevPercent = getParam(parameters, 'stdDev', 10);
        const stdDev = Math.abs(mean) * (stdDevPercent / 100);
        
        return jStat.normal.inv(p, mean, stdDev);
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const mean = getParam(parameters, 'value', 0);
        const stdDevPercent = getParam(parameters, 'stdDev', 10);
        return Math.abs(mean) * (stdDevPercent / 100);
    },

    /**
     * Get metadata for Normal distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Normal Distribution",
            description: "Symmetrical bell curve representing values clustered around a mean.",
            applications: "Modeling natural phenomena, measurement errors, and averages of large samples regardless of the underlying distribution.",
            examples: "Average wind speeds, measurement errors, aggregated financial metrics.",
            nonNegativeSupport: false, // Normal distribution supports negative values
            getMean: (parameters) => parameters.value || 0,
            parameters: [
                {
                    name: "value",
                    description: "Mean value of the distribution",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Center point of the normal distribution",
                        defaultValue: 0
                    }
                },
                {
                    name: "stdDev",
                    description: "Standard deviation as percentage of mean",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Std Dev (%)",
                        tooltip: "Standard deviation as percentage of the mean value",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: 10
                    }
                }
            ]
        };
    }
};