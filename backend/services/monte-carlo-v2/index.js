// backend/services/monte-carlo-v2/index.js
/**
 * Main entry point for Monte Carlo V2 module
 * Handles distribution registration and provides public API
 */

// Import registry
const distributionRegistry = require('./distributions');

// Import worker and engine components
const DistributionWorker = require('./engine/worker');
const MonteCarloEngine = require('./engine/monteCarloEngine');
const ResultsFormatter = require('./engine/resultsFormatter');

/**
 * Initialize the Monte Carlo engine with settings
 * @param {Object} settings - Engine settings
 * @returns {Object} Initialized engine instance
 */
function createEngine(settings = {}) {
    return new MonteCarloEngine(settings);
}

/**
 * Get information about all registered distributions
 * @returns {Object} Distribution metadata
 */
function getDistributionsInfo() {
    return distributionRegistry.getAllDistributionsMetadata();
}

/**
 * Validate distribution parameters
 * @param {string} type - Distribution type
 * @param {Object} parameters - Distribution parameters
 * @returns {Object} Validation result
 */
function validateParameters(type, parameters) {
    try {
        const DistributionClass = distributionRegistry.getDistributionClass(type);
        return DistributionClass.validate(parameters);
    } catch (error) {
        return {
            isValid: false,
            errors: [error.message]
        };
    }
}

/**
 * Fit a distribution to data points
 * @param {string} type - Distribution type
 * @param {Array} dataPoints - Data points to fit
 * @returns {Object} Fitted parameters
 */
function fitDistribution(type, dataPoints) {
    try {
        const DistributionClass = distributionRegistry.getDistributionClass(type);
        return DistributionClass.fitCurve(dataPoints);
    } catch (error) {
        throw new Error(`Failed to fit ${type} distribution: ${error.message}`);
    }
}

// Export public API
module.exports = {
    createEngine,
    simulateDistribution,
    getDistributionsInfo,
    validateParameters,
    fitDistribution,

    // Re-export registry functions for extension
    registerDistribution: distributionRegistry.registerDistribution,
    getDistributionClass: distributionRegistry.getDistributionClass,
    getRegisteredDistributionTypes: distributionRegistry.getRegisteredDistributionTypes,

    // Export classes for advanced usage
    DistributionWorker,
    MonteCarloEngine,
    ResultsFormatter,

    // Export utility functions - simplified following schema structures
    formatForCharts: ResultsFormatter.formatForCharts,
    formatDistributionCSV: ResultsFormatter.formatDistributionCSV,
    calculatePercentiles: distributionRegistry.calculatePercentiles
};