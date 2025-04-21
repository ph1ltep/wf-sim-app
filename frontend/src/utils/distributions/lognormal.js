// src/utils/distributions/lognormal.js
import * as jStat from 'jstat';
import { getParam } from '../plotUtils';

/**
 * LogNormal Distribution
 */
export const LogNormal = {
    /**
     * Validate parameters for LogNormal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.sigma === undefined || parameters.sigma === null) {
            issues.push("Sigma parameter is required");
        } else if (parameters.sigma <= 0) {
            issues.push("Sigma parameter must be positive");
        }

        if (parameters.mu !== undefined && typeof parameters.mu !== 'number') {
            issues.push("Mu parameter must be a number");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The lognormal distribution requires a positive sigma parameter and a numeric mu parameter."
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
        const mu = getParam(parameters, 'mu', 0);
        const sigma = getParam(parameters, 'sigma', 1);
        const value = getParam(parameters, 'value', Math.exp(mu + sigma * sigma / 2));
        
        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);
        
        // Calculate PDF values
        const pdfValues = filteredXValues.map(x => {
            return this.calculatePDFPoint(x, mu, sigma);
        });
        
        // Calculate statistics
        // Mean = exp(mu + sigma^2/2)
        const mean = Math.exp(mu + sigma * sigma / 2);
        
        // Median = exp(mu)
        const median = Math.exp(mu);
        
        // Mode = exp(mu - sigma^2)
        const mode = Math.exp(mu - sigma * sigma);
        
        // Variance = exp(2*mu + sigma^2) * (exp(sigma^2) - 1)
        const variance = Math.exp(2 * mu + sigma * sigma) * (Math.exp(sigma * sigma) - 1);
        const stdDev = Math.sqrt(variance);
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                
                // Use jStat for LogNormal quantile function
                const x = jStat.lognormal.inv(p, mu, sigma);
                const y = this.calculatePDFPoint(x, mu, sigma);
                
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
        const valueY = this.calculatePDFPoint(value, mu, sigma);
        keyPoints.push({ x: value, y: valueY, label: 'Value' });
        
        // Add mean/median/mode points if they're significantly different
        if (Math.abs(mean - value) > 0.001 * mean) {
            const meanY = this.calculatePDFPoint(mean, mu, sigma);
            keyPoints.push({ x: mean, y: meanY, label: 'Mean' });
        }
        
        if (Math.abs(median - mean) > 0.001 * mean) {
            const medianY = this.calculatePDFPoint(median, mu, sigma);
            keyPoints.push({ x: median, y: medianY, label: 'Median' });
        }
        
        if (Math.abs(mode - mean) > 0.001 * mean) {
            const modeY = this.calculatePDFPoint(mode, mu, sigma);
            keyPoints.push({ x: mode, y: modeY, label: 'Mode' });
        }
        
        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Ensure std dev minus is not negative (lognormal is strictly positive)
        const stdDevMinus = Math.max(0.001, mean - stdDev);
        
        const stdDevPlusY = this.calculatePDFPoint(stdDevPlus, mu, sigma);
        const stdDevMinusY = this.calculatePDFPoint(stdDevMinus, mu, sigma);
        
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
                variance,
                mu,
                sigma
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
        const mu = getParam(parameters, 'mu', 0);
        const sigma = getParam(parameters, 'sigma', 1);
        const value = getParam(parameters, 'value', Math.exp(mu + sigma * sigma / 2));
        
        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);
        
        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => {
            return this.calculateCDFPoint(x, mu, sigma);
        });
        
        // Calculate statistics
        const mean = Math.exp(mu + sigma * sigma / 2);
        const median = Math.exp(mu);
        const mode = Math.exp(mu - sigma * sigma);
        const variance = Math.exp(2 * mu + sigma * sigma) * (Math.exp(sigma * sigma) - 1);
        const stdDev = Math.sqrt(variance);
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                
                // Use jStat for LogNormal quantile function
                const x = jStat.lognormal.inv(p, mu, sigma);
                
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
        const valueCDF = this.calculateCDFPoint(value, mu, sigma);
        keyPoints.push({ x: value, y: valueCDF, label: 'Value' });
        
        // Add mean point
        const meanCDF = this.calculateCDFPoint(mean, mu, sigma);
        keyPoints.push({ x: mean, y: meanCDF, label: 'Mean' });
        
        // Add median point - CDF is 0.5 at median by definition
        keyPoints.push({ x: median, y: 0.5, label: 'Median' });
        
        // Add mode point
        const modeCDF = this.calculateCDFPoint(mode, mu, sigma);
        keyPoints.push({ x: mode, y: modeCDF, label: 'Mode' });
        
        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Ensure std dev minus is not negative
        const stdDevMinus = Math.max(0.001, mean - stdDev);
        
        const stdDevPlusCDF = this.calculateCDFPoint(stdDevPlus, mu, sigma);
        const stdDevMinusCDF = this.calculateCDFPoint(stdDevMinus, mu, sigma);
        
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
                mode,
                stdDev,
                variance,
                mu,
                sigma
            }
        };
    },

    /**
     * Calculate a single PDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} mu - Location parameter
     * @param {number} sigma - Scale parameter
     * @returns {number} PDF value
     */
    calculatePDFPoint(x, mu, sigma) {
        if (x <= 0) return 0;
        
        try {
            // LogNormal PDF formula
            const exponent = -Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma);
            const coefficient = 1 / (x * sigma * Math.sqrt(2 * Math.PI));
            const pdf = coefficient * Math.exp(exponent);
            
            return isFinite(pdf) ? pdf : 0;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Calculate a single CDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} mu - Location parameter
     * @param {number} sigma - Scale parameter
     * @returns {number} CDF value
     */
    calculateCDFPoint(x, mu, sigma) {
        if (x <= 0) return 0;
        
        try {
            // LogNormal CDF formula
            const z = (Math.log(x) - mu) / sigma;
            const cdf = 0.5 * (1 + jStat.erf(z / Math.sqrt(2)));
            
            return isFinite(cdf) ? cdf : (x > 0 ? 1 : 0);
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
        const mu = getParam(parameters, 'mu', 0);
        const sigma = getParam(parameters, 'sigma', 1);
        
        return jStat.lognormal.inv(p, mu, sigma);
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const mu = getParam(parameters, 'mu', 0);
        const sigma = getParam(parameters, 'sigma', 1);
        
        // LogNormal standard deviation formula
        const variance = Math.exp(2 * mu + sigma * sigma) * (Math.exp(sigma * sigma) - 1);
        return Math.sqrt(variance);
    },

    /**
     * Get metadata for LogNormal distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Lognormal Distribution",
            description: "Right-skewed distribution for values that are the product of many independent factors.",
            applications: "Modeling naturally skewed data like repair costs, component prices, and certain failure times.",
            examples: "Repair costs, time to failure for components with wear-out characteristics, price uncertainty for major components.",
            nonNegativeSupport: true, // LogNormal only supports non-negative values
            getMean: (parameters) => {
                const mu = parameters.mu || 0;
                const sigma = parameters.sigma || 1;
                return Math.exp(mu + sigma * sigma / 2);
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
                    name: "mu",
                    description: "Location parameter (logarithmic mean)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "μ",
                        tooltip: "Location parameter of the lognormal distribution (mean of the logarithm of the variable)",
                        step: 0.1,
                        defaultValue: 0
                    }
                },
                {
                    name: "sigma",
                    description: "Scale parameter (logarithmic standard deviation)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "σ",
                        tooltip: "Scale parameter of the lognormal distribution (standard deviation of the logarithm of the variable)",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: 1
                    }
                }
            ]
        };
    }
};