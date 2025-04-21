// src/utils/distributions/uniform.js
import { getParam } from '../plotUtils';

/**
 * Uniform Distribution
 */
export const Uniform = {
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
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const min = getParam(parameters, 'min', 0);
        const max = getParam(parameters, 'max', 1);
        const value = getParam(parameters, 'value', (min + max) / 2);
        
        // Calculate the PDF height (constant across the range)
        const height = 1 / (max - min);
        
        // Calculate PDF values 
        const pdfValues = xValues.map(x => {
            // PDF is constant within range, zero outside
            return (x >= min && x <= max) ? height : 0;
        });
        
        // Calculate statistics
        const mean = (min + max) / 2;
        const variance = Math.pow(max - min, 2) / 12;
        const stdDev = Math.sqrt(variance);
        
        // For uniform, mean = median = mode
        const median = mean;
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                
                // Uniform percentile formula: min + p * (max - min)
                const x = min + p * (max - min);
                
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
                variance
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
        const min = getParam(parameters, 'min', 0);
        const max = getParam(parameters, 'max', 1);
        const value = getParam(parameters, 'value', (min + max) / 2);
        
        // Calculate CDF values
        const cdfValues = xValues.map(x => {
            // CDF for uniform: 
            // 0 for x < min
            // (x - min) / (max - min) for min <= x <= max
            // 1 for x > max
            if (x < min) return 0;
            if (x > max) return 1;
            return (x - min) / (max - min);
        });
        
        // Calculate statistics
        const mean = (min + max) / 2;
        const variance = Math.pow(max - min, 2) / 12;
        const stdDev = Math.sqrt(variance);
        const median = mean;
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                
                // Uniform percentile: min + p * (max - min)
                const x = min + p * (max - min);
                
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
        const valueCDF = this.calculateCDFPoint(value, min, max);
        keyPoints.push({ x: value, y: valueCDF, label: 'Value' });
        
        // Mean/median (they're the same for uniform)
        keyPoints.push({ x: mean, y: 0.5, label: 'Mean/Median' });
        
        // Add std dev points if they're within range
        const stdDevPlus = mean + stdDev;
        const stdDevMinus = mean - stdDev;
        
        if (stdDevPlus <= max) {
            const stdDevPlusCDF = this.calculateCDFPoint(stdDevPlus, min, max);
            keyPoints.push({ x: stdDevPlus, y: stdDevPlusCDF, label: '+1σ' });
        }
        
        if (stdDevMinus >= min) {
            const stdDevMinusCDF = this.calculateCDFPoint(stdDevMinus, min, max);
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
                variance
            }
        };
    },

    /**
     * Calculate a single CDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} min - Min parameter
     * @param {number} max - Max parameter
     * @returns {number} CDF value
     */
    calculateCDFPoint(x, min, max) {
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
        const min = getParam(parameters, 'min', 0);
        const max = getParam(parameters, 'max', 1);
        
        // Uniform quantile formula: min + p * (max - min)
        return min + p * (max - min);
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const min = getParam(parameters, 'min', 0);
        const max = getParam(parameters, 'max', 1);
        
        // Uniform standard deviation formula
        return Math.sqrt(Math.pow(max - min, 2) / 12);
    },

    /**
     * Get metadata for Uniform distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Uniform Distribution",
            description: "Equal probability across a specified range.",
            applications: "Modeling variables with equal likelihood across a range, or when only min/max bounds are known.",
            examples: "Component price uncertainty when only a range is known, simple random inputs for simulation.",
            nonNegativeSupport: false, // Uniform can support negative values
            getMean: (parameters) => {
                const min = parameters.min || 0;
                const max = parameters.max || 1;
                return (min + max) / 2;
            },
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Default",
                        tooltip: "Default value (typically mean)"
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
                        defaultValue: 0
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
                        defaultValue: 1
                    }
                }
            ]
        };
    }
};