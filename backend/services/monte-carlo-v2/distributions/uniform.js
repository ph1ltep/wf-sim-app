// backend/services/monte-carlo-v2/distributions/uniform.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Uniform distribution implementation
 * Generates values equally likely to be anywhere between min and max
 */
class UniformDistribution extends DistributionGenerator {
    /**
     * Initialize the uniform distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for uniform distribution
    }

    /**
     * Generate a random value from the uniform distribution
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from uniform distribution
     */
    generate(year, random) {
        const min = this.getParameterValue('min', year, 0);
        const max = this.getParameterValue('max', year, 1);

        // Generate uniform value between min and max
        return min + (max - min) * random();
    }

    /**
     * Validate uniform distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check min parameter
        if (!validation.isValidParameter(parameters.min)) {
            errors.push("Minimum value must be a number or a valid time series");
        }

        // Check max parameter
        if (!validation.isValidParameter(parameters.max)) {
            errors.push("Maximum value must be a number or a valid time series");
        }

        // Check relationship between min and max
        if (typeof parameters.min === 'number' &&
            typeof parameters.max === 'number' &&
            parameters.min >= parameters.max) {
            errors.push("Maximum value must be greater than minimum value");
        } else if (Array.isArray(parameters.min) && Array.isArray(parameters.max)) {
            // Check each year if both min and max are time series
            // Find matching years in both arrays
            const minYears = parameters.min.map(p => p.year);
            const maxYears = parameters.max.map(p => p.year);
            const commonYears = minYears.filter(year => maxYears.includes(year));

            for (const year of commonYears) {
                const minPoint = parameters.min.find(p => p.year === year);
                const maxPoint = parameters.max.find(p => p.year === year);

                if (minPoint.value >= maxPoint.value) {
                    errors.push(`For year ${year}, maximum value (${maxPoint.value}) must be greater than minimum value (${minPoint.value})`);
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get uniform distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Uniform Distribution",
            description: "Equal probability across all values in a defined range.",
            applications: "Used when all values in a range are equally likely or when uncertainty is high.",
            examples: "Energy price forecasts under high uncertainty, random component failures, initial bidding ranges.",
            parameters: [
                {
                    name: "min",
                    description: "Lower bound (typically -20% of expected value for pricing)",
                    required: true,
                    type: "number or time series"
                },
                {
                    name: "max",
                    description: "Upper bound (typically +20% of expected value for pricing)",
                    required: true,
                    type: "number or time series"
                }
            ],
            examples: [
                {
                    description: "Standard uniform [0,1]",
                    parameters: { min: 0, max: 1 }
                },
                {
                    description: "Energy price uncertainty",
                    parameters: { min: 40, max: 60 }
                }
            ]
        };
    }

    /**
     * Fit uniform distribution to data points
     * Uses min and max of observed values
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Data points are required for curve fitting");
        }

        // Extract values from data points
        const values = dataPoints.map(dp => dp.value);

        // Calculate min and max for uniform distribution
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Ensure min and max are different
        if (min === max) {
            // Add a small buffer if all values are the same
            return {
                min: min - 0.05 * Math.abs(min),
                max: max + 0.05 * Math.abs(max)
            };
        }

        return { min, max };
    }
}

module.exports = UniformDistribution;