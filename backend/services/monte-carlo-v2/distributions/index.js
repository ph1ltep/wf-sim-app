// backend/services/monte-carlo-v2/distributions/index.js
/**
 * Registry for all distribution types
 * Acts as a central access point for creating distribution instances
 * Automatically imports and registers all distribution implementations
 */

const fs = require('fs');
const path = require('path');

// Distribution registry map
const distributionRegistry = new Map();

/**
 * Register a distribution class
 * @param {string} type - Distribution type identifier (lowercase)
 * @param {class} distributionClass - Distribution class implementation
 */
function registerDistribution(type, distributionClass) {
    const typeKey = type.toLowerCase();
    distributionRegistry.set(typeKey, distributionClass);
}

/**
 * Get a distribution class by type
 * @param {string} type - Distribution type identifier
 * @returns {class} Distribution class
 * @throws {Error} If distribution type is not registered
 */
function getDistributionClass(type) {
    const typeKey = type.toLowerCase();
    const distributionClass = distributionRegistry.get(typeKey);

    if (!distributionClass) {
        throw new Error(`Distribution type '${type}' is not registered`);
    }

    return distributionClass;
}

/**
 * Create a distribution instance
 * @param {Object} distribution - Distribution configuration object
 * @param {string} distribution.type - Distribution type
 * @param {Object} distribution.parameters - Distribution parameters
 * @param {Object} options - Additional options
 * @returns {Object} Distribution instance
 */
function createDistribution(distribution, options = {}) {
    const { type, parameters } = distribution;
    const DistributionClass = getDistributionClass(type);

    // Validate parameters
    const validation = DistributionClass.validate(parameters);
    if (!validation.isValid) {
        throw new Error(`Invalid parameters for ${type} distribution: ${validation.errors.join(', ')}`);
    }

    return new DistributionClass(parameters);
}

/**
 * Get all registered distribution types
 * @returns {Array<string>} Array of distribution type names
 */
function getRegisteredDistributionTypes() {
    return Array.from(distributionRegistry.keys());
}

/**
 * Get metadata for all registered distributions
 * @returns {Object} Metadata keyed by distribution type
 */
function getAllDistributionsMetadata() {
    const metadata = {};

    distributionRegistry.forEach((DistributionClass, type) => {
        metadata[type] = DistributionClass.getMetadata();
    });

    return metadata;
}

/**
 * Calculate percentiles from an array of values
 * @param {Array<number>} values - Array of numeric values
 * @param {Array<number>} percentiles - Array of percentile values (0-100)
 * @returns {Object} Percentiles keyed by Pxx notation
 */
function calculatePercentiles(values, percentiles = [10, 25, 50, 75, 90]) {
    if (!values || values.length === 0) {
        return percentiles.reduce((acc, p) => {
            acc[`P${p}`] = 0;
            return acc;
        }, {});
    }

    const sorted = [...values].sort((a, b) => a - b);

    return percentiles.reduce((acc, p) => {
        const index = Math.min(
            Math.floor((p / 100) * sorted.length),
            sorted.length - 1
        );
        acc[`P${p}`] = sorted[index];
        return acc;
    }, {});
}

/**
 * Auto-discover and register all distribution implementations
 * @private
 */
function _autoDiscoverDistributions() {
    try {
        // Get the directory of this module
        const currentDir = __dirname;

        // Read all files in the directory
        const files = fs.readdirSync(currentDir);

        // Process each JavaScript file (excluding index.js and base interface)
        files.forEach(file => {
            // Skip non-JS files, index.js, and distributionBase.js
            if (!file.endsWith('.js') ||
                file === 'index.js' ||
                file === 'distributionBase.js') {
                return;
            }

            try {
                // Import the distribution module
                const distributionModule = require(path.join(currentDir, file));

                // Extract distribution name from filename (remove .js extension)
                const distributionName = file.replace('.js', '');

                // Register the distribution with correct capitalization for DistributionTypeSchema
                const metaData = distributionModule.getMetadata();
                const properName = metaData.name; // Use the name from metadata

                // Register both capitalized and lowercase versions for flexibility
                registerDistribution(properName, distributionModule);
                registerDistribution(distributionName.toLowerCase(), distributionModule);

                console.log(`Auto-registered distribution: ${properName}`);
            } catch (err) {
                console.warn(`Failed to auto-register distribution ${file}: ${err.message}`);
            }
        });

        console.log(`Registered distributions: ${getRegisteredDistributionTypes().join(', ')}`);
    } catch (err) {
        console.error(`Error auto-discovering distributions: ${err.message}`);
    }
}

// Auto-discover and register distributions
_autoDiscoverDistributions();

module.exports = {
    registerDistribution,
    getDistributionClass,
    createDistribution,
    getRegisteredDistributionTypes,
    getAllDistributionsMetadata,
    calculatePercentiles
};

module.exports = {
    registerDistribution,
    getDistributionClass,
    createDistribution,
    getRegisteredDistributionTypes,
    getAllDistributionsMetadata,
    calculatePercentiles
};