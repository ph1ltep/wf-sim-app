// backend/services/monte-carlo-v2/engine/worker.js
const seedrandom = require('seedrandom');
const distributionRegistry = require('../distributions');
const percentiles = require('../utils/percentiles');
const validation = require('../utils/validation');

/**
 * Worker that handles the simulation of a specific distribution
 */
class DistributionWorker {
    /**
     * Create a new distribution worker
     * @param {Object} distributionSchema - Distribution configuration
     * @param {Object} settings - Simulation settings
     */
    constructor(distributionSchema, settings) {
        this.distribution = distributionSchema;
        this.settings = settings;
        this.generator = null;
        this.random = null;

        // Validate inputs
        this._validateInputs();
    }

    /**
     * Validate worker inputs
     * @private
     */
    _validateInputs() {
        // Validate distribution config
        const distValidation = validation.validateDistributionConfig(this.distribution);
        if (!distValidation.isValid) {
            throw new Error(`Invalid distribution configuration: ${distValidation.errors.join(', ')}`);
        }

        // Validate simulation settings
        const settingsValidation = validation.validateSimulationSettings(this.settings);
        if (!settingsValidation.isValid) {
            throw new Error(`Invalid simulation settings: ${settingsValidation.errors.join(', ')}`);
        }
    }

    /**
     * Initialize the worker with a random seed
     * @param {number|string} randomSeed - Seed for the random number generator
     */
    initialize(randomSeed) {
        // Setup seeded random generator
        this.random = seedrandom(randomSeed);

        try {
            // Get distribution class
            const distributionClass = distributionRegistry.getDistributionClass(this.distribution.type);

            // Apply curve fitting if requested
            let parameters = this.distribution.parameters;
            if (this.settings.fitToData && this.settings.fitToData.length > 0) {
                parameters = {
                    ...parameters,
                    ...distributionClass.fitCurve(this.settings.fitToData)
                };
            }

            // Validate parameters with the distribution class
            const validation = distributionClass.validate(parameters);
            if (!validation.isValid) {
                throw new Error(`Invalid parameters for ${this.distribution.type} distribution: ${validation.errors.join(', ')}`);
            }

            // Initialize generator
            this.generator = new distributionClass(parameters);
        } catch (error) {
            throw new Error(`Failed to initialize distribution worker: ${error.message}`);
        }
    }

    /**
     * Process the distribution simulation
     * @returns {Array} Array of SimResultsSchema objects
     */
    process() {
        if (!this.generator || !this.random) {
            throw new Error('Worker must be initialized before processing');
        }

        const { iterations, years, percentiles: percentileValues } = this.settings;

        // Create result structure for storing values
        const yearlyData = Array(years).fill().map(() => []);

        // Run iterations
        try {
            for (let i = 0; i < iterations; i++) {
                for (let year = 0; year < years; year++) {
                    // Update generator year if needed
                    this.generator.updateYear(year + 1);

                    // Generate value
                    const value = this.generator.generate(year + 1, this.random);

                    // Store value
                    yearlyData[year].push(value);
                }
            }
        } catch (error) {
            throw new Error(`Error during simulation: ${error.message}`);
        }

        // Calculate percentiles for each year
        const results = [];

        // Generate results for each requested percentile
        percentileValues.forEach(percentileConfig => {
            const result = {
                name: `${this.distribution.type}_P${percentileConfig.value}`,
                percentile: percentileConfig,
                data: []
            };

            for (let year = 0; year < years; year++) {
                const yearValues = yearlyData[year];
                const percentileResult = percentiles.calculatePercentile(yearValues, percentileConfig.value);

                result.data.push({
                    year: year + 1,
                    value: percentileResult
                });
            }

            results.push(result);
        });

        return results;
    }

    /**
     * Calculate summary statistics for the distribution
     * @returns {Object} Summary statistics
     */
    calculateStatistics() {
        if (!this.generator || !this.random) {
            throw new Error('Worker must be initialized before calculating statistics');
        }

        const { iterations, years } = this.settings;
        const stats = {
            years: Array(years).fill().map(() => ({}))
        };

        // Generate sample data
        const samples = Array(iterations).fill().map(() => {
            const sample = [];
            for (let year = 0; year < years; year++) {
                this.generator.updateYear(year + 1);
                sample.push(this.generator.generate(year + 1, this.random));
            }
            return sample;
        });

        // Calculate statistics for each year
        for (let year = 0; year < years; year++) {
            const yearValues = samples.map(sample => sample[year]);
            stats.years[year] = percentiles.calculateStatistics(yearValues);
        }

        return stats;
    }
}

module.exports = DistributionWorker;