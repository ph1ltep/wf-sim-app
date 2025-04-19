// backend/services/monte-carlo-v2/distributions/exponential.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Exponential distribution implementation
 * Models time between events in a Poisson process, or the time until
 * an event occurs where events happen at a constant average rate.
 * Commonly used for failure times and event waiting times.
 */
class ExponentialDistribution extends DistributionGenerator {
    /**
     * Initialize the exponential distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for exponential distribution
    }

    /**
     * Generate a random value from the exponential distribution
     * Uses the inverse CDF method: -ln(1-U)/lambda where U is uniform(0,1)
     * 
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from exponential distribution
     */
    generate(year, random) {
        const lambda = this.getParameterValue('lambda', year, 1);

        // Ensure valid lambda parameter
        const validLambda = Math.max(0.00001, lambda);

        // Generate exponential random variable using inverse CDF method
        // Using 1-random() to avoid log(0) if random() returns 0
        return -Math.log(1 - random()) / validLambda;
    }

    /**
     * Validate exponential distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check lambda parameter (rate parameter, must be positive)
        if (!validation.isValidParameter(parameters.lambda)) {
            errors.push("Lambda parameter must be a number or a valid time series");
        } else if (typeof parameters.lambda === 'number' && parameters.lambda <= 0) {
            errors.push("Lambda parameter must be positive");
        } else if (Array.isArray(parameters.lambda)) {
            // Check each time series point
            parameters.lambda.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Lambda parameter at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get exponential distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Exponential Distribution",
            description: "Models time between independent events occurring at a constant rate.",
            applications: "Used for random failure events with constant failure rates.",
            examples: "Time between random equipment failures, maintenance visit intervals, grid outage events.",
            parameters: [
                {
                    name: "lambda",
                    description: "Rate parameter (events per time unit)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                }
            ],
            examples: [
                {
                    description: "Random component failures (0.1 failures per year)",
                    parameters: { lambda: 0.1 }
                },
                {
                    description: "Grid outage frequency (5 per year)",
                    parameters: { lambda: 5 }
                },
                {
                    description: "Time between maintenance visits (monthly)",
                    parameters: { lambda: 12 }
                }
            ]
        };
    }

    /**
     * Fit exponential distribution to data points
     * For exponential, lambda is simply 1/mean
     * 
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Data points are required for curve fitting");
        }

        // Extract values from data points
        const values = dataPoints.map(dp => dp.value);

        // Filter out non-positive values (exponential is defined only for positive values)
        const positiveValues = values.filter(v => v > 0);

        if (positiveValues.length === 0) {
            throw new Error("No positive values found in data points (required for exponential fitting)");
        }

        // For exponential, lambda is 1/mean
        const sum = positiveValues.reduce((acc, val) => acc + val, 0);
        const mean = sum / positiveValues.length;

        // Calculate lambda (with bounds checking)
        const lambda = mean > 0 ? 1 / mean : 1;

        return { lambda: Math.min(1000, Math.max(0.00001, lambda)) };
    }

    getMeanFormula() {
        return (params, year) => {
            const lambda = this.getParameterValue('lambda', year, 1);
            return lambda > 0 ? 1 / lambda : null;
        };
    }
    getStdDevFormula() {
        return (params, year) => {
            const lambda = this.getParameterValue('lambda', year, 1);
            return lambda > 0 ? 1 / lambda : null;
        };
    }
    // getMinFormula() {
    //     return () => 0;
    // }
    getSkewnessFormula() {
        return () => 2;
    }
    getKurtosisFormula() {
        return () => 6;
    }
}

module.exports = ExponentialDistribution;