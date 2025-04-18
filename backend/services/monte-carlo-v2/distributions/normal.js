// backend/services/monte-carlo-v2/distributions/normal.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Normal (Gaussian) distribution implementation
 * Compatible with DistributionTypeSchema in DistributionSchemas.js
 * Generates values according to a bell-shaped curve
 */
class NormalDistribution extends DistributionGenerator {
    /**
     * Initialize the normal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for normal distribution
    }

    /**
     * Generate a random value from the normal distribution
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from normal distribution
     */
    generate(year, random) {
        // Get the mean value
        const mean = this.getParameterValue('value', year, 0);

        // Get the stdDev as a percentage of the mean
        const stdDevPercent = this.getParameterValue('stdDev', year, 10);

        // Convert stdDev from percentage to absolute value
        const stdDev = mean * (stdDevPercent / 100);

        // Box-Muller transform for normal distribution
        const u1 = random();
        const u2 = random();
        const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        return mean + stdDev * z0;
    }

    /**
     * Validate normal distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check mean parameter
        if (!validation.isValidParameter(parameters.value)) {
            errors.push("Mean value must be a number or a valid time series");
        }

        // Check stdDev parameter
        if (!validation.isValidParameter(parameters.stdDev, true)) {
            errors.push("Standard deviation must be a number or a valid time series");
        } else {
            // If stdDev is provided, check if it's positive
            if (typeof parameters.stdDev === 'number' && parameters.stdDev <= 0) {
                errors.push("Standard deviation percentage must be positive");
            } else if (Array.isArray(parameters.stdDev)) {
                // Check each time series point
                parameters.stdDev.forEach((point, index) => {
                    if (point.value <= 0) {
                        errors.push(`Standard deviation percentage at index ${index} (year ${point.year}) must be positive`);
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get normal distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Normal",
            description: "Symmetric bell-shaped distribution centered around the mean",
            parameters: [
                {
                    name: "mean",
                    description: "Center of the distribution",
                    required: true,
                    type: "number or time series",
                },
                {
                    name: "stdDev",
                    description: "Standard deviation as percentage of mean (e.g., 10 for 10%)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                }
            ],
            examples: [
                {
                    description: "Standard normal distribution",
                    parameters: { value: 0, stdDev: 10 }
                },
                {
                    description: "Distribution centered at 100 with moderate spread (15%)",
                    parameters: { value: 100, stdDev: 15 }
                }
            ]
        };
    }

    /**
     * Fit normal distribution to data points
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Data points are required for curve fitting");
        }

        // Extract values from data points
        const values = dataPoints.map(dp => dp.value);

        // Calculate mean
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;

        // Calculate standard deviation
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Convert stdDev to percentage of mean
        const stdDevPercent = (stdDev / mean) * 100;

        return {
            value: mean,
            stdDev: stdDevPercent > 0 ? stdDevPercent : 10 // Ensure positive standard deviation percentage, default to 10%
        };
    }

    /**
     * Get analytical formula for mean
     * @returns {Function} Formula function
     */
    getMeanFormula() {
        return (params, year) => this.getParameterValue('value', year, 0);
    }

    /**
     * Get analytical formula for standard deviation
     * @returns {Function} Formula function
     */
    getStdDevFormula() {
        return (params, year) => {
            const mean = this.getParameterValue('value', year, 0);
            const stdDevPercent = this.getParameterValue('stdDev', year, 10);
            return mean * (stdDevPercent / 100);
        };
    }

    /**
     * Get analytical formula for skewness
     * @returns {Function} Formula function
     */
    getSkewnessFormula() {
        return () => 0; // Normal distribution is symmetric
    }

    /**
     * Get analytical formula for kurtosis
     * @returns {Function} Formula function
     */
    getKurtosisFormula() {
        return () => 0; // Normal distribution has zero excess kurtosis
    }
}

module.exports = NormalDistribution;