// backend/services/monte-carlo-v2/distributions/gamma.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Gamma distribution implementation
 * A two-parameter family of continuous probability distributions
 * commonly used to model waiting times, maintenance durations,
 * and repair times in reliability engineering
 */
class GammaDistribution extends DistributionGenerator {
    /**
     * Initialize the gamma distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for gamma distribution
    }

    /**
     * Generate a random value from the gamma distribution
     * Uses the Marsaglia and Tsang method for gamma generation
     * 
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from gamma distribution
     */
    generate(year, random) {
        const shape = this.getParameterValue('shape', year, 2);
        const scale = this.getParameterValue('scale', year, 1);

        // Ensure valid parameters
        const validShape = Math.max(0.001, shape);
        const validScale = Math.max(0.001, scale);

        // Marsaglia and Tsang method for generating gamma random variables
        // Efficient and accurate for shape >= 1
        if (validShape >= 1) {
            const d = validShape - 1 / 3;
            const c = 1 / Math.sqrt(9 * d);

            let x, v, u;
            do {
                x = this._generateStandardNormal(random);
                v = 1 + c * x;
                if (v <= 0) continue;
                v = v * v * v;
                u = random();
            } while (
                u >= 1 - 0.0331 * x * x * x * x &&
                Math.log(u) >= 0.5 * x * x + d * (1 - v + Math.log(v))
            );

            return validScale * d * v;
        } else {
            // For shape < 1, use the sum of shape*2 exponential random variables
            // and adjust to maintain the proper mean
            let sum = 0;
            const n = Math.ceil(validShape * 2);
            for (let i = 0; i < n; i++) {
                sum -= Math.log(random());
            }
            return validScale * sum * validShape / n;
        }
    }

    /**
     * Helper method to generate standard normal random values using Box-Muller transform
     * @private
     * @param {function} random - Random generator function
     * @returns {number} Standard normal random value
     */
    _generateStandardNormal(random) {
        const u1 = random();
        const u2 = random();
        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    /**
     * Validate gamma distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check shape parameter (must be positive)
        if (!validation.isValidParameter(parameters.shape)) {
            errors.push("Shape parameter must be a number or a valid time series");
        } else if (typeof parameters.shape === 'number' && parameters.shape <= 0) {
            errors.push("Shape parameter must be positive");
        } else if (Array.isArray(parameters.shape)) {
            // Check each time series point
            parameters.shape.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Shape parameter at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        // Check scale parameter (must be positive)
        if (!validation.isValidParameter(parameters.scale)) {
            errors.push("Scale parameter must be a number or a valid time series");
        } else if (typeof parameters.scale === 'number' && parameters.scale <= 0) {
            errors.push("Scale parameter must be positive");
        } else if (Array.isArray(parameters.scale)) {
            // Check each time series point
            parameters.scale.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Scale parameter at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get gamma distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Gamma Distribution",
            description: "Versatile right-skewed distribution ideal for modeling maintenance durations and repair times.",
            applications: "Excellent for modeling repair times, maintenance durations, and downtime events in wind farms.",
            examples: "Turbine maintenance durations, component repair times, downtime periods for major repairs.",
            parameters: [
                {
                    name: "shape",
                    description: "Controls distribution shape (k): 1-3 for maintenance tasks, 2-5 for complex repairs",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                },
                {
                    name: "scale",
                    description: "Controls distribution spread (θ): typically 4-24 for maintenance tasks in hours",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                }
            ],
            examples: [
                {
                    description: "Simple maintenance tasks",
                    parameters: { shape: 2, scale: 4 }
                },
                {
                    description: "Complex repair operation",
                    parameters: { shape: 3, scale: 16 }
                },
                {
                    description: "Major component replacement",
                    parameters: { shape: 5, scale: 24 }
                }
            ],
            axis: "The x-axis represents time (typically hours or days) and y-axis shows probability density."
        };
    }

    /**
     * Fit gamma distribution to data points
     * Uses method of moments estimation
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

        // Filter out non-positive values (gamma is defined only for positive values)
        const positiveValues = values.filter(v => v > 0);

        if (positiveValues.length === 0) {
            throw new Error("No positive values found in data points (required for gamma fitting)");
        }

        // Calculate sample mean and variance
        const sum = positiveValues.reduce((acc, val) => acc + val, 0);
        const mean = sum / positiveValues.length;

        const sumSquaredDiffs = positiveValues.reduce((acc, val) =>
            acc + Math.pow(val - mean, 2), 0);
        const variance = sumSquaredDiffs / positiveValues.length;

        // Method of moments estimation for gamma parameters
        // shape = mean^2 / variance
        // scale = variance / mean

        if (variance === 0) {
            // All values are the same
            return { shape: 100, scale: mean / 100 }; // High shape with appropriate scale gives narrow peak
        }

        const shape = Math.pow(mean, 2) / variance;
        const scale = variance / mean;

        // Ensure parameters are within reasonable bounds
        return {
            shape: Math.max(0.1, Math.min(100, shape)),
            scale: Math.max(0.1, Math.min(1000, scale))
        };
    }

    getMeanFormula() {
        return (params, year) => {
            const shape = this.getParameterValue('shape', year, 1);
            const scale = this.getParameterValue('scale', year, 1);
            return shape * scale;
        };
    }
    getStdDevFormula() {
        return (params, year) => {
            const shape = this.getParameterValue('shape', year, 1);
            const scale = this.getParameterValue('scale', year, 1);
            return Math.sqrt(shape) * scale;
        };
    }
    // getMinFormula() {
    //     return () => 0;
    // }
    getSkewnessFormula() {
        return (params, year) => {
            const shape = this.getParameterValue('shape', year, 1);
            return shape > 0 ? 2 / Math.sqrt(shape) : null;
        };
    }
    getKurtosisFormula() {
        return (params, year) => {
            const shape = this.getParameterValue('shape', year, 1);
            return shape > 0 ? 6 / shape : null;
        };
    }
}

module.exports = GammaDistribution;