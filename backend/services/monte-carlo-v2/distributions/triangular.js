// backend/services/monte-carlo-v2/distributions/triangular.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Triangular distribution implementation
 * A continuous probability distribution with lower limit, upper limit, and mode,
 * forming a triangular-shaped probability density function.
 */
class TriangularDistribution extends DistributionGenerator {
    /**
     * Initialize the triangular distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for triangular distribution
    }

    /**
     * Generate a random value from the triangular distribution
     * Uses the inverse CDF method
     * 
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value from triangular distribution
     */
    generate(year, random) {
        const min = this.getParameterValue('min', year, 0);
        const max = this.getParameterValue('max', year, 1);
        const mode = this.getParameterValue('mode', year, 0.5);

        // Ensure parameters are valid
        if (min >= max) {
            return min; // Fallback to minimum if parameters are invalid
        }

        // Clamp mode to be between min and max
        const clampedMode = Math.max(min, Math.min(mode, max));

        // Calculate the normalized mode (c) between 0 and 1
        const c = (clampedMode - min) / (max - min);

        // Generate a uniform random number
        const u = random();

        // Apply inverse CDF to get triangular distributed value
        if (u < c) {
            // Left side of the triangle
            return min + Math.sqrt(u * (max - min) * (clampedMode - min));
        } else {
            // Right side of the triangle
            return max - Math.sqrt((1 - u) * (max - min) * (max - clampedMode));
        }
    }

    /**
     * Validate triangular distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check min parameter
        if (!validation.isValidParameter(parameters.min)) {
            errors.push("Minimum value must be a number or a valid time series");
        }

        // Check mode parameter
        if (!validation.isValidParameter(parameters.mode)) {
            errors.push("Mode value must be a number or a valid time series");
        }

        // Check max parameter
        if (!validation.isValidParameter(parameters.max)) {
            errors.push("Maximum value must be a number or a valid time series");
        }

        // Check relationships between parameters if all are numbers
        if (typeof parameters.min === 'number' &&
            typeof parameters.max === 'number' &&
            typeof parameters.mode === 'number') {

            if (parameters.min > parameters.max) {
                errors.push("Minimum value must be less than maximum value");
            }

            if (parameters.min > parameters.mode) {
                errors.push("Minimum value must be less than or equal to mode");
            }

            if (parameters.mode > parameters.max) {
                errors.push("Mode must be less than or equal to maximum value");
            }
        }

        // If time series, checking every combination would be complex
        // We could add more sophisticated validation for time series here if needed

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get triangular distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Triangular Distribution",
            description: "Simple distribution defined by minimum, maximum, and most likely values.",
            applications: "Useful when data is limited but min, max, and most likely values are known from expert judgment.",
            examples: "Construction costs, project timelines, capacity factors, seasonal energy output variations.",
            parameters: [
                {
                    name: "min",
                    description: "Absolute minimum (e.g., 30% for capacity factor)",
                    required: true,
                    type: "number or time series"
                },
                {
                    name: "mode",
                    description: "Most likely value (e.g., 40% for capacity factor)",
                    required: true,
                    type: "number or time series"
                },
                {
                    name: "max",
                    description: "Maximum reasonable value (e.g., 50% for capacity factor)",
                    required: true,
                    type: "number or time series"
                }
            ],
            examples: [
                {
                    description: "Capacity factor estimation",
                    parameters: { min: 0.30, mode: 0.40, max: 0.50 }
                },
                {
                    description: "Construction timeline (months)",
                    parameters: { min: 12, mode: 18, max: 24 }
                }
            ]
        };
    }

    /**
     * Fit triangular distribution to data points
     * Uses min, max, and approximates the mode using the data density
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

        // For triangular, we need min, max and mode
        const min = Math.min(...values);
        const max = Math.max(...values);

        // Simple mode estimation
        // This is a basic approach - a more sophisticated method would use a density estimation
        // For larger datasets, we would use a histogram approach
        if (values.length <= 5) {
            // With few points, use the median as a proxy for mode
            const sortedValues = [...values].sort((a, b) => a - b);
            const midIndex = Math.floor(sortedValues.length / 2);
            const mode = sortedValues[midIndex];
            return { min, mode, max };
        } else {
            // With more points, we can try to find the most common value
            // or the center of the densest region

            // Sort the values
            const sortedValues = [...values].sort((a, b) => a - b);

            // Count frequency of values by binning into 10 segments
            const binWidth = (max - min) / 10;
            if (binWidth === 0) {
                // All values are the same
                return { min, mode: min, max: min };
            }

            const bins = new Array(10).fill(0);
            values.forEach(value => {
                const binIndex = Math.min(9, Math.floor((value - min) / binWidth));
                bins[binIndex]++;
            });

            // Find the bin with highest frequency
            let maxFreqBin = 0;
            let maxFreq = bins[0];
            for (let i = 1; i < bins.length; i++) {
                if (bins[i] > maxFreq) {
                    maxFreq = bins[i];
                    maxFreqBin = i;
                }
            }

            // Estimate mode as the center of the highest frequency bin
            const mode = min + (maxFreqBin + 0.5) * binWidth;

            return { min, mode, max };
        }
    }

    getMeanFormula() {
        return (params, year) => {
            const min = this.getParameterValue('min', year, 0);
            const mode = this.getParameterValue('mode', year, 0.5);
            const max = this.getParameterValue('max', year, 1);
            return (min + mode + max) / 3;
        };
    }
    getStdDevFormula() {
        return (params, year) => {
            const min = this.getParameterValue('min', year, 0);
            const mode = this.getParameterValue('mode', year, 0.5);
            const max = this.getParameterValue('max', year, 1);
            return Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);
        };
    }
    getMinFormula() {
        return (params, year) => this.getParameterValue('min', year, 0);
    }
    getMaxFormula() {
        return (params, year) => this.getParameterValue('max', year, 1);
    }
    getSkewnessFormula() {
        return (params, year) => {
            const min = this.getParameterValue('min', year, 0);
            const mode = this.getParameterValue('mode', year, 0.5);
            const max = this.getParameterValue('max', year, 1);
            const denom = 5 * Math.pow(min * min + mode * mode + max * max - min * mode - min * max - mode * max, 1.5);
            return denom !== 0 ? (Math.sqrt(2) * (min + max - 2 * mode) * (max - min)) / denom : 0;
        };
    }
}

module.exports = TriangularDistribution;