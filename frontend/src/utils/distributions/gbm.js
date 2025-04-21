// src/utils/distributions/gbm.js
import * as jStat from 'jstat';
import { getParam } from '../plotUtils';

/**
 * Geometric Brownian Motion (GBM) Distribution
 * 
 * GBM is a continuous-time stochastic process where the logarithm of the randomly
 * varying quantity follows a Brownian motion (Wiener process) with drift.
 * Often used to model stock prices and similar financial data.
 */
export const GBM = {
    /**
     * Validate parameters for GBM distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.value === undefined || parameters.value === null) {
            issues.push("Starting value is required");
        } else if (parameters.value <= 0) {
            issues.push("Starting value must be positive");
        }

        if (parameters.volatility === undefined || parameters.volatility === null) {
            issues.push("Volatility parameter is required");
        } else if (parameters.volatility < 0) {
            issues.push("Volatility cannot be negative");
        }

        if (parameters.timeStep === undefined || parameters.timeStep === null) {
            issues.push("Time step parameter is required");
        } else if (parameters.timeStep <= 0) {
            issues.push("Time step must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The GBM distribution requires a positive initial value, a non-negative volatility, and a positive time step."
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
        const initialValue = getParam(parameters, 'value', 100);
        const drift = getParam(parameters, 'drift', 0.05);
        const volatility = getParam(parameters, 'volatility', 0.2);
        const timeStep = getParam(parameters, 'timeStep', 1);
        
        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);
        
        // For GBM, the PDF follows a lognormal distribution at time T
        // Calculate effective mu and sigma parameters for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);
        
        // Calculate PDF values for filtered x values
        const pdfValues = filteredXValues.map(x => {
            // Lognormal PDF formula
            return (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma));
        });
        
        // Calculate statistics for GBM
        // Mean at time T
        const mean = initialValue * Math.exp(drift * timeStep);
        
        // Median at time T
        const median = initialValue * Math.exp((drift - 0.5 * volatility * volatility) * timeStep);
        
        // Variance at time T
        const variance = initialValue * initialValue * 
                         Math.exp(2 * drift * timeStep) * 
                         (Math.exp(volatility * volatility * timeStep) - 1);
        
        const stdDev = Math.sqrt(variance);
        
        // Calculate mode
        const mode = initialValue * Math.exp((drift - 0.5 * volatility * volatility - sigma * sigma) * timeStep);
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                
                // GBM percentiles follow lognormal with our effective mu and sigma
                // Lognormal quantile formula
                const x = Math.exp(mu + sigma * jStat.normal.inv(p, 0, 1));
                
                // Calculate PDF at this point
                let y = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * 
                        Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma));
                
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
        
        // Add values for important points
        keyPoints.push({ 
            x: initialValue, 
            y: this.calculatePDFPoint(initialValue, mu, sigma), 
            label: 'Initial' 
        });
        
        keyPoints.push({ 
            x: mean, 
            y: this.calculatePDFPoint(mean, mu, sigma), 
            label: 'Mean' 
        });
        
        keyPoints.push({ 
            x: median, 
            y: this.calculatePDFPoint(median, mu, sigma), 
            label: 'Median' 
        });
        
        if (mode > 0) {
            keyPoints.push({ 
                x: mode, 
                y: this.calculatePDFPoint(mode, mu, sigma), 
                label: 'Mode' 
            });
        }
        
        // Add std dev points if they're in a sensible range
        const stdDevPlus = mean + stdDev;
        // Avoid too-small values for GBM
        const stdDevMinus = Math.max(mean - stdDev, mean * 0.01);
        
        keyPoints.push(
            { 
                x: stdDevPlus, 
                y: this.calculatePDFPoint(stdDevPlus, mu, sigma), 
                label: '+1σ' 
            }
        );
        
        // Only add -1σ if it's reasonably far from zero
        if (stdDevMinus > initialValue * 0.01) {
            keyPoints.push(
                { 
                    x: stdDevMinus, 
                    y: this.calculatePDFPoint(stdDevMinus, mu, sigma), 
                    label: '-1σ' 
                }
            );
        }
        
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
                mu,      // Lognormal param
                sigma    // Lognormal param
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
        const initialValue = getParam(parameters, 'value', 100);
        const drift = getParam(parameters, 'drift', 0.05);
        const volatility = getParam(parameters, 'volatility', 0.2);
        const timeStep = getParam(parameters, 'timeStep', 1);
        
        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);
        
        // For GBM, the CDF follows a lognormal distribution at time T
        // Calculate effective mu and sigma parameters for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);
        
        // Calculate CDF values for filtered x values
        const cdfValues = filteredXValues.map(x => {
            return this.calculateCDFPoint(x, mu, sigma);
        });
        
        // Calculate statistics for GBM
        // Mean at time T
        const mean = initialValue * Math.exp(drift * timeStep);
        
        // Median at time T
        const median = initialValue * Math.exp((drift - 0.5 * volatility * volatility) * timeStep);
        
        // Variance at time T
        const variance = initialValue * initialValue * 
                         Math.exp(2 * drift * timeStep) * 
                         (Math.exp(volatility * volatility * timeStep) - 1);
        
        const stdDev = Math.sqrt(variance);
        
        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;
                
                // GBM percentiles follow lognormal with our effective mu and sigma
                // Lognormal quantile formula
                const x = Math.exp(mu + sigma * jStat.normal.inv(p, 0, 1));
                
                percentilePoints.push({
                    percentile: percentile,
                    x: x,
                    y: p // For CDF, y equals percentile probability
                });
            });
        }
        
        // Create key points for markers
        const keyPoints = [];
        
        // Add values for important points
        keyPoints.push({ 
            x: initialValue, 
            y: this.calculateCDFPoint(initialValue, mu, sigma), 
            label: 'Initial' 
        });
        
        keyPoints.push({ 
            x: mean, 
            y: this.calculateCDFPoint(mean, mu, sigma), 
            label: 'Mean' 
        });
        
        // Median has a CDF value of 0.5 by definition
        keyPoints.push({ 
            x: median, 
            y: 0.5, 
            label: 'Median' 
        });
        
        // Add std dev points if they're in a sensible range
        const stdDevPlus = mean + stdDev;
        // Avoid too-small values for GBM
        const stdDevMinus = Math.max(mean - stdDev, mean * 0.01);
        
        keyPoints.push(
            { 
                x: stdDevPlus, 
                y: this.calculateCDFPoint(stdDevPlus, mu, sigma), 
                label: '+1σ' 
            }
        );
        
        // Only add -1σ if it's reasonably far from zero
        if (stdDevMinus > initialValue * 0.01) {
            keyPoints.push(
                { 
                    x: stdDevMinus, 
                    y: this.calculateCDFPoint(stdDevMinus, mu, sigma), 
                    label: '-1σ' 
                }
            );
        }
        
        return {
            xValues: filteredXValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                mean,
                median,
                stdDev,
                variance,
                mu,      // Lognormal param
                sigma    // Lognormal param
            }
        };
    },

    /**
     * Calculate a single PDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} mu - Log-mean parameter
     * @param {number} sigma - Log-std dev parameter
     * @returns {number} PDF value
     */
    calculatePDFPoint(x, mu, sigma) {
        if (x <= 0) return 0;
        
        try {
            const y = (1 / (x * sigma * Math.sqrt(2 * Math.PI))) * 
                   Math.exp(-Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma));
            
            // Handle very small or large values to avoid numerical issues
            return isFinite(y) ? y : 0;
        } catch (e) {
            return 0;
        }
    },

    /**
     * Calculate a single CDF point with error handling
     * @param {number} x - Point to evaluate
     * @param {number} mu - Log-mean parameter
     * @param {number} sigma - Log-std dev parameter
     * @returns {number} CDF value
     */
    calculateCDFPoint(x, mu, sigma) {
        if (x <= 0) return 0;
        
        try {
            // Lognormal CDF = normal CDF of log(x)
            const z = (Math.log(x) - mu) / sigma;
            const y = 0.5 * (1 + jStat.erf(z / Math.sqrt(2)));
            
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
        const initialValue = getParam(parameters, 'value', 100);
        const drift = getParam(parameters, 'drift', 0.05);
        const volatility = getParam(parameters, 'volatility', 0.2);
        const timeStep = getParam(parameters, 'timeStep', 1);
        
        // Calculate effective mu and sigma for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);
        
        // Lognormal quantile
        return Math.exp(mu + sigma * jStat.normal.inv(p, 0, 1));
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const initialValue = getParam(parameters, 'value', 100);
        const drift = getParam(parameters, 'drift', 0.05);
        const volatility = getParam(parameters, 'volatility', 0.2);
        const timeStep = getParam(parameters, 'timeStep', 1);
        
        // Variance at time T
        const variance = initialValue * initialValue * 
                        Math.exp(2 * drift * timeStep) * 
                        (Math.exp(volatility * volatility * timeStep) - 1);
        
        return Math.sqrt(variance);
    },

    /**
     * Get metadata for GBM distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Geometric Brownian Motion",
            description: "A continuous-time stochastic process used in financial modeling.",
            applications: "Modeling stock prices, asset values, and commodity prices that exhibit both drift and volatility.",
            examples: "Electricity price forecasting, asset value modeling, stock price simulation.",
            nonNegativeSupport: true, // GBM only supports non-negative values
            getMean: (parameters) => {
                const initialValue = parameters.value || 100;
                const drift = parameters.drift || 0.05;
                const timeStep = parameters.timeStep || 1;
                return initialValue * Math.exp(drift * timeStep);
            },
            parameters: [
                {
                    name: "value",
                    description: "Initial value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Initial Value",
                        tooltip: "Starting value at time zero",
                        min: 0.001,
                        step: 1,
                        defaultValue: 100
                    }
                },
                {
                    name: "drift",
                    description: "Drift rate (μ)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Drift",
                        tooltip: "Annual growth rate (as decimal)",
                        step: 0.01,
                        defaultValue: 0.05
                    }
                },
                {
                    name: "volatility",
                    description: "Volatility (σ)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Volatility",
                        tooltip: "Annual volatility (as decimal)",
                        min: 0,
                        step: 0.01,
                        defaultValue: 0.2
                    }
                },
                {
                    name: "timeStep",
                    description: "Time step",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Time Step",
                        tooltip: "Number of time units to project forward",
                        min: 0.001,
                        step: 0.1,
                        defaultValue: 1
                    }
                }
            ]
        };
    }
};