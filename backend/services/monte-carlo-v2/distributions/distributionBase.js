// backend/services/monte-carlo-v2/distributions/distributionBase.js
/**
 * Base class for all probability distributions
 * Defines the interface that all distribution generators must implement
 */
class DistributionGenerator {
    /**
     * Initialize the distribution
     * @param {Object} parameters - Distribution parameters
     */
    constructor(parameters) {
        this.parameters = parameters;
        this.state = this.initialize(parameters);
    }

    /**
     * Create initial state for the distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        throw new Error('Method initialize() must be implemented');
    }

    /**
     * Generate a random value from the distribution
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random value
     */
    generate(year, random) {
        throw new Error('Method generate() must be implemented');
    }

    /**
     * Update internal state for a new year
     * @param {number} year - New year
     */
    updateYear(year) {
        // Default implementation - override if needed
        // This method allows for optimization in time-dependent distributions
    }

    /**
     * Get parameter value for specific year
     * @param {string} paramName - Parameter name
     * @param {number} year - Current year
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Parameter value
     */
    getParameterValue(paramName, year, defaultValue) {
        const paramValue = this.parameters[paramName];

        if (paramValue === undefined || paramValue === null) {
            return defaultValue;
        }

        if (Array.isArray(paramValue)) {
            const yearPoint = paramValue.find(dp => dp.year === year);
            return yearPoint ? yearPoint.value : defaultValue;
        }

        return paramValue;
    }

    /**
     * Validate distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        throw new Error('Method validate() must be implemented');
    }

    /**
     * Get distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        throw new Error('Method getMetadata() must be implemented');
    }

    /**
     * Fit distribution to data points
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        throw new Error('Method fitCurve() must be implemented');
    }
}

module.exports = DistributionGenerator;