// src/utils/distributions/uniform.js
import { DistributionBase } from './distributionBase';

/**
 * Uniform Distribution
 * Extends distributionBase with Uniform distribution implementation
 */
export const Uniform = {
    // Extend the base distribution template
    ...DistributionBase.template,

    /**
     * Validate parameters for Uniform distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.min === undefined || parameters.min === null) {
            issues.push("Minimum value is required");
        }

        if (parameters.max === undefined || parameters.max === null) {
            issues.push("Maximum value is required");
        } else if (parameters.min !== undefined && parameters.max <= parameters.min) {
            issues.push("Maximum value must be greater than minimum value");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The uniform distribution requires a minimum and maximum value with max > min."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Uniform distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);
        return (min + max) / 2;
    },

    /**
     * Calculate standard deviation for Uniform distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);

        // Uniform standard deviation formula
        return Math.sqrt(Math.pow(max - min, 2) / 12);
    },

    /**
     * Calculate PDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value
     */
    calculatePDF(x, parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);

        // PDF is constant within range, zero outside
        return (x >= min && x <= max) ? 1 / (max - min) : 0;
    },

    /**
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);

        if (x < min) return 0;
        if (x > max) return 1;
        return (x - min) / (max - min);
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);

        // Uniform quantile formula: min + p * (max - min)
        return min + p * (max - min);
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
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Calculate the PDF height (constant across the range)
        const height = 1 / (max - min);

        // Calculate PDF values 
        const pdfValues = xValues.map(x => this.calculatePDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // For uniform, mean = median = mode
        const median = mean;

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                const x = this.calculateQuantile(p, parameters);

                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: height // Constant height within range
                });
            });
        }

        // Create key points for markers
        const keyPoints = [];

        // Add points for min, max, and value
        keyPoints.push(
            { x: min, y: height, label: 'Min' },
            { x: max, y: height, label: 'Max' },
            { x: value, y: height, label: 'Value' }
        );

        // Add mean point if different from value
        if (Math.abs(value - mean) > 0.001 * (max - min)) {
            keyPoints.push({ x: mean, y: height, label: 'Mean' });
        }

        // Add std dev points if they're within range
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;

        if (stdDevPlus <= max) {
            keyPoints.push({ x: stdDevPlus, y: height, label: '+1σ' });
        }

        if (stdDevMinus >= min) {
            keyPoints.push({ x: stdDevMinus, y: height, label: '-1σ' });
        }

        return {
            xValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                min,
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
        const max = DistributionBase.helpers.getParam(parameters, 'max', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Calculate CDF values
        const cdfValues = xValues.map(x => this.calculateCDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);
        const median = mean;

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

        // Add points for min, max, and value
        keyPoints.push(
            { x: min, y: 0, label: 'Min' },
            { x: max, y: 1, label: 'Max' }
        );

        // Value point
        const valueCDF = this.calculateCDF(value, parameters);
        keyPoints.push({ x: value, y: valueCDF, label: 'Value' });

        // Mean/median (they're the same for uniform)
        keyPoints.push({ x: mean, y: 0.5, label: 'Mean/Median' });

        // Add std dev points if they're within range
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;

        if (stdDevPlus <= max) {
            const stdDevPlusCDF = this.calculateCDF(stdDevPlus, parameters);
            keyPoints.push({ x: stdDevPlus, y: stdDevPlusCDF, label: '+1σ' });
        }

        if (stdDevMinus >= min) {
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
                max,
                mean,
                median,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Get metadata for Uniform distribution
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
        let defaultMax = 1;

        if (value !== null) {
            // Center the uniform distribution around the current value
            const range = Math.max(1, Math.abs(value) * 0.2); // 20% of value or at least 1
            defaultMin = value - range / 2;
            defaultMax = value + range / 2;
        }

        return {
            name: "Uniform Distribution",
            description: "Equal probability across a specified range.",
            applications: "Modeling variables with equal likelihood across a range, or when only min/max bounds are known.",
            examples: "Component price uncertainty when only a range is known, simple random inputs for simulation.",
            defaultCurve: "pdf", // Uniform is best visualized with PDF
            nonNegativeSupport: false, // Uniform can support negative values
            minPointsRequired: 2, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Default",
                        tooltip: "Default value (typically mean)",
                        defaultValue: value !== null ? value : (defaultMin + defaultMax) / 2
                    }
                },
                {
                    name: "min",
                    description: "Minimum value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Min",
                        tooltip: "Minimum value of the uniform distribution",
                        step: 0.1,
                        defaultValue: defaultMin
                    }
                },
                {
                    name: "max",
                    description: "Maximum value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Max",
                        tooltip: "Maximum value of the uniform distribution",
                        step: 0.1,
                        defaultValue: defaultMax
                    }
                }
            ]
        };
    }
};