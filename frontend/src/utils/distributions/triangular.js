// src/utils/distributions/triangular.js
import { DistributionBase } from './distributionBase';

/**
 * Triangular Distribution
 * Extends distributionBase with Triangular distribution implementation
 */
export const Triangular = {
    // Extend the base distribution template
    ...DistributionBase.template,

    /**
     * Validate parameters for triangular distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.min === undefined || parameters.min === null) {
            issues.push("Minimum value is required");
        }

        if (parameters.mode === undefined || parameters.mode === null) {
            issues.push("Mode value is required");
        }

        if (parameters.max === undefined || parameters.max === null) {
            issues.push("Maximum value is required");
        }

        // Only check relationships if all parameters are present
        if (issues.length === 0) {
            if (parameters.min > parameters.mode) {
                issues.push("Minimum must be less than or equal to mode");
            }

            if (parameters.mode > parameters.max) {
                issues.push("Mode must be less than or equal to maximum");
            }

            if (parameters.min > parameters.max) {
                issues.push("Minimum must be less than maximum");
            }
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The triangular distribution requires minimum, mode, and maximum values that satisfy: min ≤ mode ≤ max."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Triangular distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        return (min + mode + max) / 3;
    },

    /**
     * Calculate standard deviation for Triangular distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        return Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);
    },

    /**
     * Calculate PDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value
     */
    calculatePDF(x, parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        if (x < min || x > max) return 0;

        if (x < mode) {
            return 2 * (x - min) / ((max - min) * (mode - min));
        } else {
            return 2 * (max - x) / ((max - min) * (max - mode));
        }
    },

    /**
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        if (x <= min) return 0;
        if (x >= max) return 1;

        if (x <= mode) {
            return (x - min) * (x - min) / ((max - min) * (mode - min));
        } else {
            return 1 - (max - x) * (max - x) / ((max - min) * (max - mode));
        }
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        if (p <= 0) return min;
        if (p >= 1) return max;

        // The F point where CDF = mode
        const F = (mode - min) / (max - min);

        if (p < F) {
            // First part of triangle
            return min + Math.sqrt(p * (max - min) * (mode - min));
        } else {
            // Second part of triangle
            return max - Math.sqrt((1 - p) * (max - min) * (max - mode));
        }
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Calculate PDF values
        const pdfValues = xValues.map(x => this.calculatePDF(x, parameters));

        // Calculate peak height
        const peakY = 2 / (max - min);

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        const median = this.calculateQuantile(0.5, parameters);

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

        // Add min, mode, max points if not coincident with value
        if (Math.abs(min - value) > 0.001 * (max - min)) {
            keyPoints.push({ x: min, y: 0, label: 'Min' });
        }

        if (Math.abs(mode - value) > 0.001 * (max - min)) {
            keyPoints.push({ x: mode, y: peakY, label: 'Mode' });
        }

        if (Math.abs(max - value) > 0.001 * (max - min)) {
            keyPoints.push({ x: max, y: 0, label: 'Max' });
        }

        // Add mean point if different from value
        if (Math.abs(mean - value) > 0.001 * (max - min)) {
            const meanY = this.calculatePDF(mean, parameters);
            keyPoints.push({ x: mean, y: meanY, label: 'Mean' });
        }

        // Add median point if different from mean
        if (Math.abs(median - mean) > 0.001 * (max - min)) {
            const medianY = this.calculatePDF(median, parameters);
            keyPoints.push({ x: median, y: medianY, label: 'Median' });
        }

        // Add std dev points if within range
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;

        if (stdDevPlus < max) {
            const stdDevPlusY = this.calculatePDF(stdDevPlus, parameters);
            keyPoints.push({ x: stdDevPlus, y: stdDevPlusY, label: '+1σ' });
        }

        if (stdDevMinus > min) {
            const stdDevMinusY = this.calculatePDF(stdDevMinus, parameters);
            keyPoints.push({ x: stdDevMinus, y: stdDevMinusY, label: '-1σ' });
        }

        return {
            xValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                min,
                mode,
                max,
                mean,
                median,
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
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Calculate CDF values
        const cdfValues = xValues.map(x => this.calculateCDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        const median = this.calculateQuantile(0.5, parameters);

        // Calculate mode CDF
        const modeCDF = this.calculateCDF(mode, parameters);

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

        // Add min, max, value points
        keyPoints.push(
            { x: min, y: 0, label: 'Min' },
            { x: max, y: 1, label: 'Max' },
            { x: value, y: this.calculateCDF(value, parameters), label: 'Value' }
        );

        // Add mode point
        keyPoints.push({ x: mode, y: modeCDF, label: 'Mode' });

        // Add mean point if different from value
        if (Math.abs(mean - value) > 0.001 * (max - min)) {
            const meanCDF = this.calculateCDF(mean, parameters);
            keyPoints.push({ x: mean, y: meanCDF, label: 'Mean' });
        }

        // Add median point (CDF = 0.5)
        keyPoints.push({ x: median, y: 0.5, label: 'Median' });

        // Add std dev points if within range
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;

        if (stdDevPlus < max) {
            const stdDevPlusCDF = this.calculateCDF(stdDevPlus, parameters);
            keyPoints.push({ x: stdDevPlus, y: stdDevPlusCDF, label: '+1σ' });
        }

        if (stdDevMinus > min) {
            const stdDevMinusCDF = this.calculateCDF(stdDevMinus, parameters);
            keyPoints.push({ x: stdDevMinus, y: stdDevMinusCDF, label: '-1σ' });
        }

        return {
            xValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                min,
                mode,
                max,
                mean,
                median,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Get metadata for Triangular distribution
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

        // Set appropriate defaults based on current value
        let defaultMin = 0;
        let defaultMode = 5;
        let defaultMax = 10;

        if (value !== null) {
            // Create a triangular distribution with value as the mode
            // and a reasonable range around it
            const range = Math.max(1, Math.abs(value) * 0.5); // 50% range or at least 1
            defaultMin = value - range;
            defaultMode = value;
            defaultMax = value + range;
        }

        return {
            name: "Triangular Distribution",
            description: "Simple distribution defined by minimum, maximum, and most likely value.",
            applications: "Useful when exact distribution is unknown but minimum, maximum, and most likely values can be estimated.",
            examples: "Project durations, cost estimates with best/worst case scenarios, and expert opinions.",
            defaultCurve: "pdf", // Triangular is best visualized with PDF
            nonNegativeSupport: false, // Triangular can support negative values
            minPointsRequired: 3, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Value",
                        tooltip: "Default value",
                        defaultValue: value !== null ? value : defaultMode
                    }
                },
                {
                    name: "min",
                    description: "Minimum value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Minimum",
                        tooltip: "Smallest possible value",
                        defaultValue: defaultMin
                    }
                },
                {
                    name: "mode",
                    description: "Mode (most likely value)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mode",
                        tooltip: "Most likely value",
                        defaultValue: defaultMode
                    }
                },
                {
                    name: "max",
                    description: "Maximum value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Maximum",
                        tooltip: "Largest possible value",
                        defaultValue: defaultMax
                    }
                }
            ]
        };
    }
};