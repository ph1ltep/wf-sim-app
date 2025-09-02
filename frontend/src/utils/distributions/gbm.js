// src/utils/distributions/gbm.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';

/**
 * Geometric Brownian Motion (GBM) Distribution
 * Extends distributionBase with GBM distribution implementation
 * 
 * GBM is a continuous-time stochastic process where the logarithm of the randomly
 * varying quantity follows a Brownian motion (Wiener process) with drift.
 * Often used to model stock prices and similar financial data.
 */
export const GBM = {
    // Extend the base distribution template
    ...DistributionBase.template,

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
     * Calculate mean value for GBM distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // Mean at time T
        return initialValue * Math.exp(drift * timeStep);
    },

    /**
     * Calculate standard deviation for GBM distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const volatility = DistributionBase.helpers.getParam(parameters, 'volatility', 20) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // Variance at time T
        const variance = initialValue * initialValue *
            Math.exp(2 * drift * timeStep) *
            (Math.exp(volatility * volatility * timeStep) - 1);

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

        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const volatility = DistributionBase.helpers.getParam(parameters, 'volatility', 20) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // For GBM, the PDF follows a lognormal distribution at time T
        // Calculate effective mu and sigma parameters for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);

        try {
            // Lognormal PDF formula
            const exponent = -Math.pow(Math.log(x) - mu, 2) / (2 * sigma * sigma);
            const coefficient = 1 / (x * sigma * Math.sqrt(2 * Math.PI));
            const pdf = coefficient * Math.exp(exponent);

            // Handle very small or large values to avoid numerical issues
            return isFinite(pdf) ? pdf : 0;
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

        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const volatility = DistributionBase.helpers.getParam(parameters, 'volatility', 20) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // For GBM, the CDF follows a lognormal distribution at time T
        // Calculate effective mu and sigma parameters for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);

        try {
            // Lognormal CDF formula
            const z = (Math.log(x) - mu) / sigma;
            const cdf = 0.5 * (1 + jStat.erf(z / Math.sqrt(2)));

            // Handle very small or large values to avoid numerical issues
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
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const volatility = DistributionBase.helpers.getParam(parameters, 'volatility', 20) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // Calculate effective mu and sigma for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);

        // Lognormal quantile
        return Math.exp(mu + sigma * jStat.normal.inv(p, 0, 1));
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const volatility = DistributionBase.helpers.getParam(parameters, 'volatility', 20) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);

        // For GBM, the PDF follows a lognormal distribution at time T
        // Calculate effective mu and sigma parameters for the lognormal
        const mu = Math.log(initialValue) + (drift - 0.5 * volatility * volatility) * timeStep;
        const sigma = volatility * Math.sqrt(timeStep);

        // Calculate PDF values
        const pdfValues = filteredXValues.map(x => this.calculatePDF(x, parameters));

        // Calculate statistics
        // Mean at time T
        const mean = this.calculateMean(parameters);

        // Median at time T
        const median = initialValue * Math.exp((drift - 0.5 * volatility * volatility) * timeStep);

        // Calculate standard deviation
        const stdDev = this.calculateStdDev(parameters);

        // Calculate mode
        const mode = initialValue * Math.exp((drift - volatility * volatility) * timeStep);

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

        // Add values for important points
        keyPoints.push({
            x: initialValue,
            y: this.calculatePDF(initialValue, parameters),
            label: 'Initial'
        });

        keyPoints.push({
            x: mean,
            y: this.calculatePDF(mean, parameters),
            label: 'Mean'
        });

        keyPoints.push({
            x: median,
            y: this.calculatePDF(median, parameters),
            label: 'Median'
        });

        if (mode > 0) {
            keyPoints.push({
                x: mode,
                y: this.calculatePDF(mode, parameters),
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
                y: this.calculatePDF(stdDevPlus, parameters),
                label: '+1σ'
            }
        );

        // Only add -1σ if it's reasonably far from zero
        if (stdDevMinus > initialValue * 0.01) {
            keyPoints.push(
                {
                    x: stdDevMinus,
                    y: this.calculatePDF(stdDevMinus, parameters),
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
                initialValue,
                drift: parameters.drift, // Store as percentage
                volatility: parameters.volatility, // Store as percentage
                timeStep,
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
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const drift = DistributionBase.helpers.getParam(parameters, 'drift', 5) / 100; // Convert percentage to decimal
        const volatility = DistributionBase.helpers.getParam(parameters, 'volatility', 20) / 100; // Convert percentage to decimal
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);

        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => this.calculateCDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const median = initialValue * Math.exp((drift - 0.5 * volatility * volatility) * timeStep);
        const stdDev = this.calculateStdDev(parameters);

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

        // Add values for important points
        keyPoints.push({
            x: initialValue,
            y: this.calculateCDF(initialValue, parameters),
            label: 'Initial'
        });

        keyPoints.push({
            x: mean,
            y: this.calculateCDF(mean, parameters),
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
                y: this.calculateCDF(stdDevPlus, parameters),
                label: '+1σ'
            }
        );

        // Only add -1σ if it's reasonably far from zero
        if (stdDevMinus > initialValue * 0.01) {
            keyPoints.push(
                {
                    x: stdDevMinus,
                    y: this.calculateCDF(stdDevMinus, parameters),
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
                initialValue,
                drift: parameters.drift, // Store as percentage
                volatility: parameters.volatility, // Store as percentage
                timeStep,
                mean,
                median,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Get metadata for GBM distribution
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
        const defaultInitialValue = value !== null && value > 0 ? value : 100;

        return {
            name: "Geometric Brownian Motion",
            description: "A continuous-time stochastic process used in financial modeling.",
            applications: "Modeling stock prices, asset values, and commodity prices that exhibit both drift and volatility.",
            examples: "Electricity price forecasting, asset value modeling, stock price simulation.",
            defaultCurve: "cdf", // GBM is often best visualized with CDF for time series
            nonNegativeSupport: true, // GBM only supports non-negative values
            minPointsRequired: 8, // Minimum points needed for fitting
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
                        defaultValue: defaultInitialValue
                    }
                },
                {
                    name: "drift",
                    description: "Annual drift rate (% growth)",
                    required: true,
                    fieldType: "percentage", // Changed to percentage field type
                    fieldProps: {
                        label: "Drift (%)",
                        tooltip: "Annual growth rate (as percentage)",
                        step: 0.1,
                        defaultValue: 5, // Changed from 0.05 to 5 (now as percentage)
                        span: { xs: 24, sm: 8 }
                    }
                },
                {
                    name: "volatility",
                    description: "Annual volatility (% standard deviation)",
                    required: true,
                    fieldType: "percentage", // Changed to percentage field type
                    fieldProps: {
                        label: "Volatility (%)",
                        tooltip: "Annual volatility (as percentage)",
                        min: 0,
                        step: 0.1,
                        defaultValue: 20, // Changed from 0.2 to 20 (now as percentage)
                        span: { xs: 24, sm: 8 }
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
                        defaultValue: 1,
                        span: { xs: 24, sm: 8 }
                    }
                }
            ]
        };
    }
};