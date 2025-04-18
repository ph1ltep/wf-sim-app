// backend/services/monte-carlo-v2/distributions/poisson.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Poisson distribution implementation
 * Models the number of events occurring in a fixed time interval,
 * with events occurring independently at a constant average rate.
 */
class PoissonDistribution extends DistributionGenerator {
    /**
     * Initialize the Poisson distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for Poisson distribution
    }

    /**
     * Generate a random value from the Poisson distribution
     * Uses the inverse transform method for generating Poisson random variables
     * 
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from Poisson distribution (integer)
     */
    generate(year, random) {
        const lambda = this.getParameterValue('lambda', year, 1);

        // Handle edge cases
        if (lambda <= 0) {
            return 0;
        }

        // Use the inverse transform method to generate Poisson random variable
        const L = Math.exp(-lambda);
        let k = 0;
        let p = 1;

        do {
            k++;
            // Generate uniform random number and update product
            p *= random();
        } while (p > L);

        // Return k-1 (the number of iterations before condition was met)
        return k - 1;
    }

    /**
     * Validate Poisson distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check lambda parameter (mean rate, must be positive)
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
     * Get Poisson distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Poisson Distribution",
            description: "Discrete distribution for the number of events in a fixed time interval.",
            applications: "Models the frequency of rare, independent events over time.",
            examples: "Number of lightning strikes, grid outages, major component failures per year, extreme weather events.",
            parameters: [
                {
                    name: "lambda",
                    description: "Expected number of events per period (0.1-2 failures per turbine per year)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                }
            ],
            examples: [
                {
                    description: "Rare failures (once per decade)",
                    parameters: { lambda: 0.1 }
                },
                {
                    description: "Moderate events (annual)",
                    parameters: { lambda: 1.0 }
                },
                {
                    description: "Frequent small issues",
                    parameters: { lambda: 5.0 }
                }
            ]
        };
    }

    /**
     * Fit Poisson distribution to data points
     * For Poisson, we simply use the mean as the lambda parameter
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

        // For Poisson, lambda is simply the mean of the observed data
        const sum = values.reduce((acc, val) => acc + val, 0);
        const lambda = sum / values.length;

        // Ensure lambda is positive
        return { lambda: Math.max(lambda, 0.001) };
    }
}

module.exports = PoissonDistribution;