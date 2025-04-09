// backend/services/monte-carlo-v2/distributions/weibull.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Weibull distribution implementation
 * Common in reliability engineering and failure analysis
 */
class WeibullDistribution extends DistributionGenerator {
    /**
     * Initialize the Weibull distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for Weibull distribution
    }

    /**
     * Generate a random value from the Weibull distribution
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from Weibull distribution
     */
    generate(year, random) {
        const scale = this.getParameterValue('scale', year, 1);
        const shape = this.getParameterValue('shape', year, 1);

        // Generate Weibull random variable
        // Using inverse transform sampling: X = scale * (-ln(U))^(1/shape)
        const u = random();
        return scale * Math.pow(-Math.log(u), 1 / shape);
    }

    /**
     * Validate Weibull distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check scale parameter (must be positive)
        if (!validation.isValidParameter(parameters.scale)) {
            errors.push("Scale parameter must be a number or a valid time series");
        } else {
            // If scale is provided, check if it's positive
            if (typeof parameters.scale === 'number' && parameters.scale <= 0) {
                errors.push("Scale parameter must be positive");
            } else if (Array.isArray(parameters.scale)) {
                // Check each time series point
                parameters.scale.forEach((point, index) => {
                    if (point.value <= 0) {
                        errors.push(`Scale parameter at index ${index} (year ${point.year}) must be positive`);
                    }
                });
            }
        }

        // Check shape parameter (must be positive)
        if (!validation.isValidParameter(parameters.shape)) {
            errors.push("Shape parameter must be a number or a valid time series");
        } else {
            // If shape is provided, check if it's positive
            if (typeof parameters.shape === 'number' && parameters.shape <= 0) {
                errors.push("Shape parameter must be positive");
            } else if (Array.isArray(parameters.shape)) {
                // Check each time series point
                parameters.shape.forEach((point, index) => {
                    if (point.value <= 0) {
                        errors.push(`Shape parameter at index ${index} (year ${point.year}) must be positive`);
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
     * Get Weibull distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Weibull Distribution",
            description: "Common in reliability engineering and failure analysis",
            parameters: [
                {
                    name: "scale",
                    description: "Scale parameter (related to the characteristic life)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                },
                {
                    name: "shape",
                    description: "Shape parameter (determines the shape of the failure rate function)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive"
                }
            ],
            examples: [
                {
                    description: "Exponential distribution (constant failure rate)",
                    parameters: { scale: 1, shape: 1 }
                },
                {
                    description: "Rayleigh distribution",
                    parameters: { scale: 1, shape: 2 }
                },
                {
                    description: "Typical wind turbine failure model",
                    parameters: { scale: 10000, shape: 1.5 }
                }
            ]
        };
    }

    /**
     * Fit Weibull distribution to data points
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Data points are required for curve fitting");
        }

        // Extract values from data points
        const values = dataPoints.map(dp => dp.value);

        // Filter out non-positive values (Weibull is defined only for positive values)
        const positiveValues = values.filter(v => v > 0);

        if (positiveValues.length === 0) {
            throw new Error("No positive values found in data points (required for Weibull fitting)");
        }

        // Method of moments estimation for Weibull parameters
        // Calculate mean and variance
        const sum = positiveValues.reduce((acc, val) => acc + val, 0);
        const mean = sum / positiveValues.length;

        const squaredSum = positiveValues.reduce((acc, val) => acc + (val * val), 0);
        const variance = (squaredSum / positiveValues.length) - (mean * mean);

        // Calculate coefficient of variation
        const cv = Math.sqrt(variance) / mean;

        // Approximate shape parameter using coefficient of variation
        // This is an approximation, more advanced methods exist
        const shape = Math.pow(0.9 / cv, 1.086);

        // Derive scale parameter from mean and shape
        const scale = mean / this._gammaFunction(1 + 1 / shape);

        return {
            scale: scale > 0 ? scale : 1,
            shape: shape > 0 ? shape : 1
        };
    }

    /**
     * Approximation of the gamma function for Weibull calculations
     * @private
     * @param {number} x - Input value
     * @returns {number} Gamma function result
     */
    static _gammaFunction(x) {
        // Lanczos approximation for gamma function
        // Simplified version for practical use in distribution fitting
        if (x < 0.5) {
            return Math.PI / (Math.sin(Math.PI * x) * this._gammaFunction(1 - x));
        }

        x -= 1;
        const p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
            771.32342877765313, -176.61502916214059, 12.507343278686905,
            -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];

        let a = p[0];
        const g = 7;

        for (let i = 1; i < g + 2; i++) {
            a += p[i] / (x + i);
        }

        const t = x + g + 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, (x + 0.5)) * Math.exp(-t) * a;
    }
}

module.exports = WeibullDistribution;