// src/utils/distributions/lognormal.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';

/**
 * LogNormal Distribution
 * Extends distributionBase with LogNormal distribution implementation
 */
export const LogNormal = {
    // Extend the base distribution template
    ...DistributionBase.template,

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
     * Calculate mean value for LogNormal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value
     */
    calculateMean(parameters) {
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);
        return Math.exp(mu + sigma * sigma / 2);
    },

    /**
     * Calculate standard deviation for LogNormal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);

        // LogNormal standard deviation formula
        const variance = Math.exp(2 * mu + sigma * sigma) * (Math.exp(sigma * sigma) - 1);
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

        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);

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
     * Calculate CDF at a specific point
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        if (x <= 0) return 0;

        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);

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
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);

        return jStat.lognormal.inv(p, mu, sigma);
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);

        // Calculate PDF values
        const pdfValues = filteredXValues.map(x => this.calculatePDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const stdDev = this.calculateStdDev(parameters);

        // Median = exp(mu)
        const median = Math.exp(mu);

        // Mode = exp(mu - sigma^2)
        const mode = Math.exp(mu - sigma * sigma);

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

        // Add mean/median/mode points if they're significantly different
        if (Math.abs(mean - value) > 0.001 * mean) {
            const meanY = this.calculatePDF(mean, parameters);
            keyPoints.push({ x: mean, y: meanY, label: 'Mean' });
        }

        if (Math.abs(median - mean) > 0.001 * mean) {
            const medianY = this.calculatePDF(median, parameters);
            keyPoints.push({ x: median, y: medianY, label: 'Median' });
        }

        if (Math.abs(mode - mean) > 0.001 * mean) {
            const modeY = this.calculatePDF(mode, parameters);
            keyPoints.push({ x: mode, y: modeY, label: 'Mode' });
        }

        // Add std dev points
        const stdDevPlus = mean + stdDev;
        // Ensure std dev minus is not negative (lognormal is strictly positive)
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
                variance: stdDev * stdDev,
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
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', this.calculateMean(parameters));

        // Filter x values to avoid issues near zero
        const filteredXValues = xValues.filter(x => x > 0);

        // Calculate CDF values
        const cdfValues = filteredXValues.map(x => this.calculateCDF(x, parameters));

        // Calculate statistics
        const mean = this.calculateMean(parameters);
        const median = Math.exp(mu);
        const mode = Math.exp(mu - sigma * sigma);
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

        // Add value point
        const valueCDF = this.calculateCDF(value, parameters);
        keyPoints.push({ x: value, y: valueCDF, label: 'Value' });

        // Add mean point
        const meanCDF = this.calculateCDF(mean, parameters);
        keyPoints.push({ x: mean, y: meanCDF, label: 'Mean' });

        // Add median point - CDF is 0.5 at median by definition
        keyPoints.push({ x: median, y: 0.5, label: 'Median' });

        // Add mode point
        const modeCDF = this.calculateCDF(mode, parameters);
        keyPoints.push({ x: mode, y: modeCDF, label: 'Mode' });

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
                mean,
                median,
                mode,
                stdDev,
                variance: stdDev * stdDev,
                mu,
                sigma
            }
        };
    },

    /**
     * Get metadata for LogNormal distribution
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
        let defaultMu = 0;
        let defaultSigma = 1;

        if (value !== null && value > 0) {
            // Work backwards to find mu and sigma that would give this mean
            // For lognormal, mean = exp(mu + sigma^2/2)
            // We'll set sigma to a reasonable default and solve for mu
            defaultSigma = 0.5; // Reasonable default sigma
            defaultMu = Math.log(value) - defaultSigma * defaultSigma / 2;
        }

        return {
            name: "Lognormal Distribution",
            description: "Right-skewed distribution for values that are the product of many independent factors.",
            applications: "Modeling naturally skewed data like repair costs, component prices, and certain failure times.",
            examples: "Repair costs, time to failure for components with wear-out characteristics, price uncertainty for major components.",
            defaultCurve: "pdf", // LogNormal is best visualized with PDF
            nonNegativeSupport: true, // LogNormal only supports non-negative values
            minPointsRequired: 5, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Default value",
                        defaultValue: value !== null ? value : Math.exp(defaultMu + defaultSigma * defaultSigma / 2),
                        min: 0.001
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
                        defaultValue: defaultMu
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
                        defaultValue: defaultSigma
                    }
                }
            ]
        };
    }
};