// backend/services/monte-carlo-v2/distributions/lognormal.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Lognormal distribution implementation
 * Used for modeling variables where the logarithm follows a normal distribution
 */
class LognormalDistribution extends DistributionGenerator {
    /**
     * Initialize the lognormal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for lognormal distribution
    }

    /**
     * Generate a random value from the lognormal distribution
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from lognormal distribution
     */
    generate(year, random) {
        const mu = this.getParameterValue('mu', year, 0);
        const sigma = this.getParameterValue('sigma', year, 1);

        // Generate a normal random variable
        const u1 = random();
        const u2 = random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Transform to lognormal: if X is normal, then exp(X) is lognormal
        return Math.exp(mu + sigma * z);
    }

    /**
     * Validate lognormal distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check mu parameter (location parameter)
        if (!validation.isValidParameter(parameters.mu)) {
            errors.push("Mu parameter (location) must be a number or a valid time series");
        }

        // Check sigma parameter (scale parameter)
        if (!validation.isValidParameter(parameters.sigma)) {
            errors.push("Sigma parameter (scale) must be a number or a valid time series");
        } else {
            // If sigma is provided, check if it's positive
            if (typeof parameters.sigma === 'number' && parameters.sigma <= 0) {
                errors.push("Sigma parameter must be positive");
            } else if (Array.isArray(parameters.sigma)) {
                // Check each time series point
                parameters.sigma.forEach((point, index) => {
                    if (point.value <= 0) {
                        errors.push(`Sigma parameter at index ${index} (year ${point.year}) must be positive`);
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
     * Get lognormal distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Lognormal Distribution",
            description: "Used for modeling variables where the logarithm follows a normal distribution",
            parameters: [
                {
                    name: "mu",
                    description: "Location parameter (mean of the logarithm)",
                    required: true,
                    type: "number or time series"
                },
                {
                    name: "sigma",
                    description: "Scale parameter (standard deviation of the logarithm)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                }
            ],
            examples: [
                {
                    description: "Standard lognormal distribution",
                    parameters: { mu: 0, sigma: 1 }
                },
                {
                    description: "Typical financial asset return distribution",
                    parameters: { mu: 0.05, sigma: 0.2 }
                },
                {
                    description: "Repair time distribution",
                    parameters: { mu: 3, sigma: 0.8 }
                }
            ]
        };
    }

    /**
     * Fit lognormal distribution to data points
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Data points are required for curve fitting");
        }

        // Extract values from data points
        const values = dataPoints.map(dp => dp.value);

        // Filter out non-positive values (lognormal is defined only for positive values)
        const positiveValues = values.filter(v => v > 0);

        if (positiveValues.length === 0) {
            throw new Error("No positive values found in data points (required for lognormal fitting)");
        }

        // Take the natural logarithm of the values
        const logValues = positiveValues.map(v => Math.log(v));

        // Calculate mu (mean of log values)
        const sum = logValues.reduce((acc, val) => acc + val, 0);
        const mu = sum / logValues.length;

        // Calculate sigma (standard deviation of log values)
        const squaredDiffs = logValues.map(val => Math.pow(val - mu, 2));
        const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / logValues.length;
        const sigma = Math.sqrt(variance);

        return {
            mu,
            sigma: sigma > 0 ? sigma : 0.1 // Ensure positive sigma
        };
    }
}

module.exports = LognormalDistribution;