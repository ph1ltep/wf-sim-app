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
     * Process the distribution simulation and compute statistics
     * @returns {Object} Object containing results (SimResultsSchema) and statistics
     */
    process() {
        if (!this.generator || !this.random) {
            throw new Error('Worker must be initialized before processing');
        }

        const { iterations, years, percentiles: percentileValues } = this.settings;

        // Initialize structures for percentiles and running statistics
        const yearlyData = Array(years).fill().map(() => []);
        const runningStats = Array(years).fill().map(() => ({
            count: 0,
            sum: 0,
            m2: 0,
            m3: 0,
            m4: 0,
            min: Infinity,
            max: -Infinity
        }));

        // Run iterations
        try {
            for (let i = 0; i < iterations; i++) {
                for (let year = 0; year < years; year++) {
                    // Update generator year
                    this.generator.updateYear(year + 1);

                    // Generate value
                    const value = this.generator.generate(year + 1, this.random);

                    // Store value for percentile calculation
                    yearlyData[year].push(value);

                    // Update running statistics
                    const stats = runningStats[year];
                    stats.count += 1;
                    const n = stats.count;

                    // Welford's algorithm for mean and variance
                    const delta = value - (stats.sum / n);
                    stats.sum += value;
                    const mean = stats.sum / n;
                    const delta2 = value - mean;
                    stats.m2 += delta * delta2;

                    // Higher moments for skewness and kurtosis
                    stats.m3 += delta * delta2 * delta2;
                    stats.m4 += delta * delta2 * delta2 * delta2;

                    // Update min and max
                    stats.min = Math.min(stats.min, value);
                    stats.max = Math.max(stats.max, value);
                }
            }
        } catch (error) {
            throw new Error(`Error during simulation: ${error.message}`);
        }

        // Calculate percentiles for each year
        const results = percentileValues.map(percentileConfig => {
            const result = {
                name: `${this.distribution.type}_P${percentileConfig.value}`,
                percentile: percentileConfig,
                data: []
            };

            for (let year = 0; year < years; year++) {
                const yearValues = yearlyData[year];

                // ADDED: Check percentileDirection metadata
                const isDescending = this.distribution.metadata?.percentileDirection === 'descending';
                const targetPercentile = isDescending ? (100 - percentileConfig.value) : percentileConfig.value;

                const percentileResult = percentiles.calculatePercentile(yearValues, targetPercentile);

                result.data.push({
                    year: year + 1,
                    value: percentileResult
                });
            }

            return result;
        });

        // Calculate statistics from running stats
        const statistics = this.generator.calculateStatistics(runningStats, years);

        return { results, statistics };
    }
}

module.exports = DistributionWorker;