// src/utils/distributions/weibull.js
import * as jStat from 'jstat';
import { getParam } from '../plotUtils';

/**
 * Weibull Distribution
 */
export const Weibull = {
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
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const scale = getParam(parameters, 'scale', 1);
        const shape = getParam(parameters, 'shape', 2);
        const value = getParam(parameters, 'value', this.getMeanValue(scale, shape));
        
        // Filter x values to avoid issues near zero for small shape values
        // This avoids performance issues with very steep curves
        const filteredXValues = xValues.filter(x => x >= 0.001);
        
        // Calculate PDF values for filtered x values
        const pdfValues = filteredXValues.map(x => {
            return (shape / scale) * 
                Math.pow(x / scale, shape - 1) * 
                Math.exp(-Math.pow(x / scale, shape));
        });
        
        // Calculate mean and other statistics
        const mean = this.getMeanValue(scale, shape);
        
        // Calculate variance and standard deviation
        const variance = scale * scale * (
            jStat.gammafn(1 + 2 / shape) - 
            Math.pow(jStat.gammafn(1 + 1 / shape), 2)
        );
        const stdDev = Math.sqrt(variance);
        
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
                // Weibull quantile: scale * (-ln(1-p))^(1/shape)
                const x = scale * Math.pow(-Math.log(1 - p), 1 / shape);
                
                // Calculate PDF at this point
                let y = (shape / scale) * 
                    Math.pow(x / scale, shape - 1) * 
                    Math.exp(-Math.pow(x / scale, shape));
                
                // Handle very small or large values to avoid numerical issues
                if (!isFinite(y) || y < 0) y = 0;
                
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
        const valueY = this.calculatePDFPoint(value, scale, shape);
        keyPoints.push({ x: value, y: valueY, label: 'Value' });
        
        // Add mean point if different from value
        if (Math.abs(value - mean) > 0.001 * mean) {
            const meanY = this.calculatePDFPoint(mean, scale, shape);
            keyPoints.push({ x: mean, y: meanY, label: 'Mean' });
        }
        
        // Add median point if significantly different from mean
        if (Math.abs(median - mean) > 0.001 * mean) {
            const medianY = this.calculatePDFPoint(median, scale, shape);
            keyPoints.push({ x: median, y: medianY, label: 'Median' });
        }
        
        // Add mode point if shape > 1 and significantly different from mean
        if (shape > 1 && Math.abs(mode - mean) > 0.001 * mean) {
            const modeY = this.calculatePDFPoint(mode, scale, shape);
            keyPoints.push({ x: mode, y: modeY, label: 'Mode' });
        }
        
        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Avoid negative values for std dev points
        const stdDevMinus = Math.max(0.001, mean - stdDev);
        
        const stdDevPlusY = this.calculatePDFPoint(stdDevPlus, scale, shape);
        const stdDevMinusY = this.calculatePDFPoint(stdDevMinus, scale, shape);
        
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
        const scale = getParam(parameters, 'scale', 1);
        const shape = getParam(parameters, 'shape', 2);
        const value = getParam(parameters, 'value', this.getMeanValue(scale, shape));
        
        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x >= 0);
        
        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => {
            if (x <= 0) return 0;
            return 1 - Math.exp(-Math.pow(x / scale, shape));
        });
        
        // Calculate mean and other statistics
        const mean = this.getMeanValue(scale, shape);
        
        // Calculate variance and standard deviation
        const variance = scale * scale * (
            jStat.gammafn(1 + 2 / shape) - 
            Math.pow(jStat.gammafn(1 + 1 / shape), 2)
        );
        const stdDev = Math.sqrt(variance);
        
        // Calculate median
        const median = scale * Math.pow(Math.log(2), 1 / shape);
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                // Weibull quantile: scale * (-ln(1-p))^(1/shape)
                const x = scale * Math.pow(-Math.log(1 - p), 1 / shape);
                
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
        const valueCDF = this.calculateCDFPoint(value, scale, shape);
        keyPoints.push({ x: value, y: valueCDF, label: 'Value' });
        
        // Add mean point if different from value
        if (Math.abs(value - mean) > 0.001 * mean) {
            const meanCDF = this.calculateCDFPoint(mean, scale, shape);
            keyPoints.push({ x: mean, y: meanCDF, label: 'Mean' });
        }
        
        // Add median point - CDF is exactly 0.5 at median
        keyPoints.push({ x: median, y: 0.5, label: 'Median' });
        
        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Avoid negative values for std dev points
        const stdDevMinus = Math.max(0.001, mean - stdDev);
        
        const stdDevPlusCDF = this.calculateCDFPoint(stdDevPlus, scale, shape);
        const stdDevMinusCDF = this.calculateCDFPoint(stdDevMinus, scale, shape);
        
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
                variance
            }
        };
    },

    /**
     * Calculate a single PDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} scale - Scale parameter
     * @param {number} shape - Shape parameter
     * @returns {number} PDF value
     */
    calculatePDFPoint(x, scale, shape) {
        if (x <= 0) return 0;
        
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
     * Calculate a single CDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} scale - Scale parameter
     * @param {number} shape - Shape parameter
     * @returns {number} CDF value
     */
    calculateCDFPoint(x, scale, shape) {
        if (x <= 0) return 0;
        
        try {
            const y = 1 - Math.exp(-Math.pow(x / scale, shape));
            return isFinite(y) ? y : (x > 0 ? 1 : 0);
        } catch (e) {
            return x > 0 ? 1 : 0;
        }
    },

    /**
     * Helper to calculate mean value from scale and shape
     * @param {number} scale - Scale parameter
     * @param {number} shape - Shape parameter
     * @returns {number} Mean value
     */
    getMeanValue(scale, shape) {
        return scale * jStat.gammafn(1 + 1 / shape);
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        const scale = getParam(parameters, 'scale', 1);
        const shape = getParam(parameters, 'shape', 2);
        
        // Weibull quantile function: scale * (-ln(1-p))^(1/shape)
        return scale * Math.pow(-Math.log(1 - p), 1 / shape);
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const scale = getParam(parameters, 'scale', 1);
        const shape = getParam(parameters, 'shape', 2);

        const variance = scale * scale * (
            jStat.gammafn(1 + 2 / shape) - 
            Math.pow(jStat.gammafn(1 + 1 / shape), 2)
        );
        
        return Math.sqrt(variance);
    },

    /**
     * Get metadata for Weibull distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Weibull Distribution",
            description: "Versatile distribution commonly used in reliability, wind speed, and repair time modeling.",
            applications: "The standard for modeling wind speed distributions, component reliability, and repair times, including delays from aging and parts scarcity.",
            examples: "Wind speed distributions, component failure rates, turbine lifetime modeling, repair times for major components as turbines age.",
            nonNegativeSupport: true, // Weibull only supports non-negative values
            getMean: (parameters) => {
                const scale = parameters.scale || 1;
                const shape = parameters.shape || 2;
                return scale * jStat.gammafn(1 + 1 / shape);
            },
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Default value"
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
                        defaultValue: 1
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
                        defaultValue: 2
                    }
                }
            ]
        };
    }
};