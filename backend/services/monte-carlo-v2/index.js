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
 * Run a distribution simulation
 * @param {Object} distribution - Distribution configuration following DistributionTypeSchema
 * @param {Object} simulationSettings - Simulation settings following SimSettingsSchema
 * @returns {Promise<Object>} Simulation results following SimResponseSchema
 */
async function simulateDistribution(distribution, simulationSettings) {
    try {
        // Validate settings
        if (!simulationSettings.iterations) simulationSettings.iterations = 10000;
        if (!simulationSettings.years) simulationSettings.years = 20;
        if (!simulationSettings.percentiles || !Array.isArray(simulationSettings.percentiles)) {
            simulationSettings.percentiles = [
                { value: 50, description: 'primary' },
                { value: 75, description: 'upper_bound' },
                { value: 25, description: 'lower_bound' },
                { value: 10, description: 'extreme_lower' },
                { value: 90, description: 'extreme_upper' }
            ];
        }

        // Create worker
        const worker = new DistributionWorker(distribution, simulationSettings);

        // Initialize with seed
        const seed = simulationSettings.seed || Math.floor(Math.random() * 1000000);
        worker.initialize(seed);

        // Record start time
        const startTime = Date.now();

        // Process simulation
        const results = worker.process();

        // Record end time
        const endTime = Date.now();
        const timeElapsed = endTime - startTime;

        // Format results following SimResponseSchema
        return {
            success: true,
            simulationInfo: [{
                distribution: distribution,
                iterations: simulationSettings.iterations,
                seed: seed,
                years: simulationSettings.years,
                timeElapsed: timeElapsed,
                results: Array.isArray(results) ? results : [results],
                errors: []
            }]
        };
    } catch (error) {
        return {
            success: false,
            simulationInfo: [{
                distribution: distribution,
                iterations: simulationSettings.iterations || 0,
                seed: simulationSettings.seed || 0,
                years: simulationSettings.years || 0,
                timeElapsed: 0,
                results: [],
                errors: [error.message]
            }]
        };
    }
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