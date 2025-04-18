// backend/services/monte-carlo-v2/distributions/fixed.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Fixed Distribution implementation
 * Represents a deterministic value with optional annual growth rate
 * Not a true probability distribution but maintains API compatibility
 * with other distributions in the Monte Carlo engine
 */
class FixedDistribution extends DistributionGenerator {
    /**
     * Initialize the fixed distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for fixed distribution
    }

    /**
     * Generate a fixed value, optionally with annual growth applied
     * @param {number} year - Current year
     * @param {function} random - Random generator function (not used in fixed distribution)
     * @returns {number} Fixed value with annual growth applied if specified
     */
    generate(year, random) {
        const baseValue = this.getParameterValue('value', year, 0);
        const drift = this.getParameterValue('drift', year, 0) / 100; // Convert from percentage to decimal

        // If no drift/growth is specified, just return the base value
        if (drift === 0 || year === 1) {
            return baseValue;
        }

        // Apply compound annual growth: value * (1 + drift)^(year-1)
        return baseValue * Math.pow(1 + drift, year - 1);
    }

    /**
     * Validate fixed distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check value parameter (required)
        if (!validation.isValidParameter(parameters.value)) {
            errors.push("Value parameter must be a number or a valid time series");
        }

        // Check drift parameter (optional)
        if (parameters.drift !== undefined) {
            if (!validation.isValidParameter(parameters.drift, true)) {
                errors.push("Drift parameter must be a number or a valid time series");
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get fixed distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Fixed Value",
            description: "Uses a single deterministic value with no variability.",
            applications: "Used for deterministic analysis, base case scenarios, or when uncertainty is accounted for separately.",
            examples: "Fixed power purchase agreement (PPA) prices, guaranteed availability levels, or contractual performance metrics.",
            parameters: [
                {
                    name: "value",
                    description: "Set to the most likely or contractually agreed value",
                    required: true,
                    type: "number or time series"
                },
                {
                    name: "drift",
                    description: "Annual growth rate (%)",
                    required: false,
                    type: "number or time series",
                    default: 0
                }
            ],
            examples: [
                {
                    description: "Fixed price with no growth",
                    parameters: { value: 50, drift: 0 }
                },
                {
                    description: "Fixed price with 2% annual growth",
                    parameters: { value: 50, drift: 2 }
                },
                {
                    description: "Performance guarantee",
                    parameters: { value: 98.5 }
                }
            ]
        };
    }

    /**
     * Fit fixed distribution to data points
     * Simply uses the mean of the data as the fixed value
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

        // Calculate mean for the fixed value
        const sum = values.reduce((acc, val) => acc + val, 0);
        const mean = sum / values.length;

        // If we have multiple years of data, try to estimate growth rate
        let drift = 0;
        if (dataPoints.length > 1) {
            // Sort data points by year
            const sortedPoints = [...dataPoints].sort((a, b) => a.year - b.year);
            const firstPoint = sortedPoints[0];
            const lastPoint = sortedPoints[sortedPoints.length - 1];

            // Only calculate drift if we have different years and first value isn't zero
            if (lastPoint.year > firstPoint.year && firstPoint.value !== 0) {
                // Calculate compound annual growth rate
                const years = lastPoint.year - firstPoint.year;
                drift = (Math.pow(lastPoint.value / firstPoint.value, 1 / years) - 1) * 100;
            }
        }

        return {
            value: mean,
            drift: Math.round(drift * 100) / 100 // Round to 2 decimal places
        };
    }

    getMeanFormula() {
        return (params, year) => this.getParameterValue('value', year, 0);
    }
    getStdDevFormula() {
        return () => 0;
    }
    getMinFormula() {
        return (params, year) => this.getParameterValue('value', year, 0);
    }
    getMaxFormula() {
        return (params, year) => this.getParameterValue('value', year, 0);
    }
    getSkewnessFormula() {
        return () => 0;
    }
    getKurtosisFormula() {
        return () => 0; // Or null if undefined
    }
}

module.exports = FixedDistribution;