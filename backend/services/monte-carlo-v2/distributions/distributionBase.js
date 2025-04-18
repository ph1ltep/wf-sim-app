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

    /**
         * Get analytical formula for mean
         * @returns {Function|null} Function (parameters, year) => number|null, or null for numerical fallback
         */
    getMeanFormula() {
        return null;
    }

    /**
     * Get analytical formula for standard deviation
     * @returns {Function|null} Function (parameters, year) => number|null, or null for numerical fallback
     */
    getStdDevFormula() {
        return null;
    }

    /**
     * Get analytical formula for minimum
     * @returns {Function|null} Function (parameters, year) => number|null, or null for numerical fallback
     */
    getMinFormula() {
        return null;
    }

    /**
     * Get analytical formula for maximum
     * @returns {Function|null} Function (parameters, year) => number|null, or null for numerical fallback
     */
    getMaxFormula() {
        return null;
    }

    /**
     * Get analytical formula for skewness
     * @returns {Function|null} Function (parameters, year) => number|null, or null for numerical fallback
     */
    getSkewnessFormula() {
        return null;
    }

    /**
     * Get analytical formula for kurtosis
     * @returns {Function|null} Function (parameters, year) => number|null, or null for numerical fallback
     */
    getKurtosisFormula() {
        return null;
    }

    /**
     * Calculate per-year statistics from running statistics and analytical formulas
     * @param {Array<Object>} runningStatsByYear - Array of running statistics for each year
     * @param {number} years - Number of years
     * @returns {Object} Statistics object with arrays of DataPointSchema objects
     */
    calculateStatistics(runningStatsByYear, years) {
        const statistics = {
            mean: [],
            stdDev: [],
            min: [],
            max: [],
            skewness: [],
            kurtosis: []
        };

        // Get formula providers
        const formulas = {
            mean: this.getMeanFormula(),
            stdDev: this.getStdDevFormula(),
            min: this.getMinFormula(),
            max: this.getMaxFormula(),
            skewness: this.getSkewnessFormula(),
            kurtosis: this.getKurtosisFormula()
        };

        for (let year = 1; year <= years; year++) {
            const stats = runningStatsByYear[year - 1] || {};
            const n = stats.count || 0;

            if (n === 0) {
                // Push empty DataPointSchema for missing years
                const emptyPoint = { year: Number(year), value: null };
                Object.keys(statistics).forEach(stat => statistics[stat].push(emptyPoint));
                continue;
            }

            // Compute statistics, preferring analytical formulas
            const mean = formulas.mean ? formulas.mean(this.parameters, year) : stats.sum / n;
            const variance = stats.m2 / n;
            const stdDev = formulas.stdDev ? formulas.stdDev(this.parameters, year) : Math.sqrt(variance);
            const min = formulas.min ? formulas.min(this.parameters, year) : stats.min;
            const max = formulas.max ? formulas.max(this.parameters, year) : stats.max;
            const skewness = formulas.skewness
                ? formulas.skewness(this.parameters, year)
                : stdDev > 0 ? (stats.m3 / n) / (stdDev ** 3) : 0;
            const kurtosis = formulas.kurtosis
                ? formulas.kurtosis(this.parameters, year)
                : stdDev > 0 ? ((stats.m4 / n) / (stdDev ** 4) - 3) : 0;

            // Store as DataPointSchema with numeric types
            statistics.mean.push({ year: Number(year), value: mean !== null ? Number(mean) : null });
            statistics.stdDev.push({ year: Number(year), value: stdDev !== null ? Number(stdDev) : null });
            statistics.min.push({ year: Number(year), value: min !== null ? Number(min) : null });
            statistics.max.push({ year: Number(year), value: max !== null ? Number(max) : null });
            statistics.skewness.push({ year: Number(year), value: skewness !== null ? Number(skewness) : null });
            statistics.kurtosis.push({ year: Number(year), value: kurtosis !== null ? Number(kurtosis) : null });
        }

        return statistics;
    }
}

module.exports = DistributionGenerator;