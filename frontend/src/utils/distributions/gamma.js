// src/utils/distributions/gamma.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';

/**
 * Gamma Distribution
 * Extends distributionBase with Gamma distribution implementation
 * Optimized for wind power industry, particularly for modeling maintenance downtime
 */
export const Gamma = {
    // Extend the base distribution template
    ...DistributionBase.template,

    /**
     * Validate parameters for gamma distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.shape === undefined || parameters.shape === null) {
            issues.push("Shape parameter (α) is required");
        } else if (parameters.shape <= 0) {
            issues.push("Shape parameter (α) must be positive");
        }

        if (parameters.scale === undefined || parameters.scale === null) {
            issues.push("Scale parameter (β) is required");
        } else if (parameters.scale <= 0) {
            issues.push("Scale parameter (β) must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The gamma distribution requires positive shape (α) and scale (β) parameters."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Gamma distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        return shape * scale;
    },

    /**
     * Calculate standard deviation for Gamma distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        return Math.sqrt(shape * scale * scale);
    },

    /**
     * Calculate PDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value
     */
    calculatePDF(x, parameters) {
        if (x <= 0) return 0;

        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);

        try {
            return jStat.gamma.pdf(x, shape, scale);
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

        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);

        try {
            return jStat.gamma.cdf(x, shape, scale);
        } catch (e) {
            return 0;
        }
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);

        // jStat has no gamma.inv, so we need to use a numerical approximation
        // or wait until we have more advanced statistical libraries

        // Simple binary search approximation for low precision applications
        if (p <= 0) return 0;
        if (p >= 1) return Infinity;

        let low = 0;
        let high = shape * scale * 10; // Start with a reasonably high value (10x mean)
        let mid, midCdf;

        // Check if our initial high boundary is insufficient
        if (jStat.gamma.cdf(high, shape, scale) < p) {
            high = high * 10;
        }

        // Binary search for 20 iterations (gives reasonable precision)
        for (let i = 0; i < 20; i++) {
            mid = (low + high) / 2;
            midCdf = jStat.gamma.cdf(mid, shape, scale);

            if (Math.abs(midCdf - p) < 0.0001) {
                break;
            }

            if (midCdf < p) {
                low = mid;
            } else {
                high = mid;
            }
        }

        return mid;
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues with negative values (gamma is only defined for x > 0)
        const filteredXValues = xValues.filter(x => x > 0);

        // Calculate PDF values
        const pdfValues = filteredXValues.map(x => this.calculatePDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // Calculate mode: (shape - 1) * scale if shape >= 1, otherwise 0
        const mode = shape >= 1 ? (shape - 1) * scale : 0;

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;

                // Calculate percentile using our function
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

        // Add mode point if shape >= 1 and different from mean/value
        if (shape >= 1 && Math.abs(mode - mean) > 0.001 * mean) {
            const modeY = this.calculatePDF(mode, parameters);
            keyPoints.push({ x: mode, y: modeY, label: 'Mode' });
        }

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Ensure std dev minus is not negative (gamma is strictly positive)
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
                shape,
                scale,
                mean,
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
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues with negative values
        const filteredXValues = xValues.filter(x => x >= 0);

        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => this.calculateCDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        const mode = shape >= 1 ? (shape - 1) * scale : 0;

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

        // Add mode point if shape >= 1
        if (shape >= 1) {
            const modeCDF = this.calculateCDF(mode, parameters);
            keyPoints.push({ x: mode, y: modeCDF, label: 'Mode' });
        }

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Ensure std dev minus is not negative
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
                shape,
                scale,
                mean,
                mode,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Get metadata for Gamma distribution
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
        let defaultShape = 2;
        let defaultScale = 1;

        if (value !== null && value > 0) {
            // For gamma, mean = shape * scale
            // We can choose a reasonable shape and calculate scale
            defaultShape = 2; // Shape controls skewness, 2 gives moderate right skew
            defaultScale = value / defaultShape;
        }

        return {
            name: "Gamma Distribution",
            description: "Flexible two-parameter distribution for positive-valued random variables.",
            applications: "Used for modeling waiting times, rainfall amounts, and other quantities that are always positive and may be skewed.",
            examples: "Repair times, component lifetime, precipitation levels.",
            defaultCurve: "pdf", // Gamma is best visualized with PDF
            nonNegativeSupport: true, // Gamma only supports non-negative values
            minPointsRequired: 6, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Default value (mean of the distribution)",
                        defaultValue: value !== null ? value : defaultShape * defaultScale,
                        min: 0
                    }
                },
                {
                    name: "scale",
                    description: "Scale Parameter (β)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Scale (β)",
                        tooltip: "Scale parameter of the Gamma distribution",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: defaultScale
                    }
                },
                {
                    name: "shape",
                    description: "Shape Parameter (α)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Shape (α)",
                        tooltip: "Shape parameter of the Gamma distribution",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: defaultShape,
                        span: { xs: 24, sm: 8 }
                    }
                }
            ]
        };
    }
};