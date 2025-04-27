// src/utils/distributions/weibull.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';
import { roundTo } from 'utils/formatUtils';

/**
 * Weibull Distribution
 * Extends distributionBase with Weibull distribution implementation
 */
export const Weibull = {
    // Extend the base distribution template
    ...DistributionBase.template,
    /**
     * Validate parameters for Weibull distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.scale === undefined || parameters.scale === null) {
            issues.push("Scale parameter is required");
        } else if (parameters.scale <= 0) {
            issues.push("Scale parameter must be positive");
        }

        if (parameters.shape === undefined || parameters.shape === null) {
            issues.push("Shape parameter is required");
        } else if (parameters.shape <= 0) {
            issues.push("Shape parameter must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The Weibull distribution requires positive scale and shape parameters."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Weibull distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        return scale * jStat.gammafn(1 + 1 / shape);
    },

    /**
     * Calculate standard deviation for Weibull distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);

        const variance = scale * scale * (
            jStat.gammafn(1 + 2 / shape) -
            Math.pow(jStat.gammafn(1 + 1 / shape), 2)
        );

        return Math.sqrt(variance);
    },

    /**
     * Calculate PDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value
     */
    calculatePDF(x, parameters) {
        if (x <= 0) return 0;

        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);

        try {
            const y = (shape / scale) *
                Math.pow(x / scale, shape - 1) *
                Math.exp(-Math.pow(x / scale, shape));

            // Handle very small or large values to avoid numerical issues
            return isFinite(y) ? y : 0;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        if (x <= 0) return 0;

        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);

        try {
            const y = 1 - Math.exp(-Math.pow(x / scale, shape));
            return isFinite(y) ? y : (x > 0 ? 1 : 0);
        } catch (e) {
            return x > 0 ? 1 : 0;
        }
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);

        // Weibull quantile function: scale * (-ln(1-p))^(1/shape)
        return scale * Math.pow(-Math.log(1 - p), 1 / shape);
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues near zero for small shape values
        // This avoids performance issues with very steep curves
        const filteredXValues = xValues.filter(x => x >= 0.001);

        // Calculate PDF values for filtered x values
        const pdfValues = filteredXValues.map(x => this.calculatePDF(x, parameters));

        // Calculate mean and other statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // Calculate median and mode
        const median = scale * Math.pow(Math.log(2), 1 / shape);
        let mode = 0;
        if (shape > 1) {
            mode = scale * Math.pow((shape - 1) / shape, 1 / shape);
        }

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

        // Add mean point if different from value
        if (Math.abs(value - mean) > 0.001 * mean) {
            const meanY = this.calculatePDF(mean, parameters);
            keyPoints.push({ x: mean, y: meanY, label: 'Mean' });
        }

        // Add median point if significantly different from mean
        if (Math.abs(median - mean) > 0.001 * mean) {
            const medianY = this.calculatePDF(median, parameters);
            keyPoints.push({ x: median, y: medianY, label: 'Median' });
        }

        // Add mode point if shape > 1 and significantly different from mean
        if (shape > 1 && Math.abs(mode - mean) > 0.001 * mean) {
            const modeY = this.calculatePDF(mode, parameters);
            keyPoints.push({ x: mode, y: modeY, label: 'Mode' });
        }

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Avoid negative values for std dev points
        const stdDevMinus = Math.max(0.001, mean - stdDev);

        const stdDevPlusY = this.calculatePDF(stdDevPlus, parameters);
        const stdDevMinusY = this.calculatePDF(stdDevMinus, parameters);

        keyPoints.push(
            { x: stdDevPlus, y: stdDevPlusY, label: '+1σ' },
            { x: stdDevMinus, y: stdDevMinusY, label: '-1σ' }
        );

        return {
            xValues: filteredXValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                mean,
                median,
                mode,
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
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x >= 0);

        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => this.calculateCDF(x, parameters));

        // Calculate mean and other statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // Calculate median
        const median = scale * Math.pow(Math.log(2), 1 / shape);

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = this.calculateQuantile(p, parameters);

                // For CDF, y equals percentile probability
                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: p
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

        // Add median point - CDF is exactly 0.5 at median
        keyPoints.push({ x: median, y: 0.5, label: 'Median' });

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Avoid negative values for std dev points
        const stdDevMinus = Math.max(0.001, mean - stdDev);

        const stdDevPlusCDF = this.calculateCDF(stdDevPlus, parameters);
        const stdDevMinusCDF = this.calculateCDF(stdDevMinus, parameters);

        keyPoints.push(
            { x: stdDevPlus, y: stdDevPlusCDF, label: '+1σ' },
            { x: stdDevMinus, y: stdDevMinusCDF, label: '-1σ' }
        );

        return {
            xValues: filteredXValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                mean,
                median,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Get metadata for Weibull distribution
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
            value = roundTo(value, 2);
        }

        // Default scale based on current value or default
        const defaultScale = value !== null && value > 0
            ? roundTo(value / jStat.gammafn(1 + 1 / 2), 2) // Roughly align mean with current value for shape=2
            : 1;

        return {
            name: "Weibull Distribution",
            description: "Versatile distribution commonly used in reliability, wind speed, and repair time modeling.",
            applications: "The standard for modeling wind speed distributions, component reliability, and repair times, including delays from aging and parts scarcity.",
            examples: "Wind speed distributions, component failure rates, turbine lifetime modeling, repair times for major components as turbines age.",
            defaultCurve: "pdf", // Weibull is best visualized with PDF
            nonNegativeSupport: true, // Weibull only supports non-negative values
            minPointsRequired: 6, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Default value",
                        defaultValue: value !== null ? value : 7.5,
                        min: 0
                    }
                },
                {
                    name: "scale",
                    description: "Scale parameter",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Scale",
                        tooltip: "Scale parameter of the Weibull distribution",
                        min: 0,
                        step: 0.01,
                        defaultValue: value !== null ? defaultScale : 7.9
                    }
                },
                {
                    name: "shape",
                    description: "Shape parameter",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Shape",
                        tooltip: "Shape parameter of the Weibull distribution",
                        min: 0,
                        step: 0.01,
                        defaultValue: 1.8
                    }
                }
            ]
        };
    }
};