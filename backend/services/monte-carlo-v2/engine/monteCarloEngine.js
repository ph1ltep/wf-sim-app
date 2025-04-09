// backend/services/monte-carlo-v2/engine/monteCarloEngine.js
const seedrandom = require('seedrandom');
const DistributionWorker = require('./worker');
const validation = require('../utils/validation');

/**
 * Monte Carlo engine for running multiple distribution simulations
 */
class MonteCarloEngine {
    /**
     * Create a new Monte Carlo engine
     * @param {Object} options - Engine configuration options
     */
    constructor(options = {}) {
        this.options = {
            seed: options.seed !== undefined ? options.seed : Math.floor(Math.random() * 1000000),
            iterations: options.iterations || 10000,
            years: options.years || 20,
            percentiles: options.percentiles || [
                { value: 50, description: 'primary' },
                { value: 75, description: 'upper_bound' },
                { value: 25, description: 'lower_bound' },
                { value: 10, description: 'extreme_lower' },
                { value: 90, description: 'extreme_upper' }
            ],
            parallelWorkers: options.parallelWorkers || 1,
            ...options
        };

        this.workers = new Map();
        this.originalRandom = null;
        this.results = null;
    }

    /**
     * Add a distribution to the simulation
     * @param {string} id - Unique identifier for the distribution
     * @param {Object} distribution - Distribution configuration following DistributionTypeSchema
     * @param {Object} settings - Per-distribution settings (overrides engine settings)
     * @returns {this} For method chaining
     */
    addDistribution(id, distribution, settings = {}) {
        // Verify distribution has proper type and parameters structure
        if (!distribution.type || !distribution.parameters) {
            throw new Error(`Invalid distribution format: must have type and parameters properties`);
        }

        // Create combined settings
        const combinedSettings = {
            ...this.options,
            ...settings
        };

        // Create worker for this distribution
        const worker = new DistributionWorker(distribution, combinedSettings);
        this.workers.set(id, { worker, distribution, settings: combinedSettings });

        return this;
    }

    /**
     * Remove a distribution from the simulation
     * @param {string} id - Distribution identifier to remove
     * @returns {this} For method chaining
     */
    removeDistribution(id) {
        this.workers.delete(id);
        return this;
    }

    /**
     * Clear all distributions from the simulation
     * @returns {this} For method chaining
     */
    clearDistributions() {
        this.workers.clear();
        return this;
    }

    /**
     * Initialize the random number generator
     * @private
     */
    _initializeRNG() {
        // Save original random function
        this.originalRandom = Math.random;

        // Replace with seeded version
        Math.random = seedrandom(this.options.seed);
    }

    /**
     * Restore the original random number generator
     * @private
     */
    _restoreRNG() {
        if (this.originalRandom) {
            Math.random = this.originalRandom;
            this.originalRandom = null;
        }
    }

    /**
     * Run the Monte Carlo simulation
     * @returns {Object} Simulation results following SimResponseSchema
     */
    async run() {
        // Check if we have any distributions
        if (this.workers.size === 0) {
            throw new Error('No distributions added to the simulation');
        }

        // Initialize RNG
        this._initializeRNG();

        // Create result structure following SimResponseSchema
        const results = {
            success: true,
            simulationInfo: []
        };

        // Record start time
        const startTime = Date.now();

        // Initialize and run all workers
        // For simplicity in initial implementation, we run them sequentially
        // Future optimization: implement true parallelism or worker pool
        for (const [id, { worker, distribution }] of this.workers.entries()) {
            try {
                // Initialize worker with a derived seed (unique per distribution)
                const distributionSeed = `${this.options.seed}-${id}`;
                worker.initialize(distributionSeed);

                // Run simulation
                const distributionResults = worker.process();

                // Store results
                results.simulationInfo.push({
                    distribution: distribution,
                    iterations: this.options.iterations,
                    seed: this.options.seed,
                    years: this.options.years,
                    timeElapsed: Date.now() - startTime,
                    results: Array.isArray(distributionResults) ? distributionResults : [distributionResults],
                    errors: []
                });
            } catch (error) {
                // Record error
                results.simulationInfo.push({
                    distribution: distribution,
                    iterations: this.options.iterations,
                    seed: this.options.seed,
                    years: this.options.years,
                    timeElapsed: Date.now() - startTime,
                    results: [],
                    errors: [error.message]
                });
                results.success = false;
            }
        }

        // Record end time and calculate elapsed time
        const endTime = Date.now();
        const totalElapsed = endTime - startTime;

        // Update timeElapsed for all simulation info entries
        results.simulationInfo.forEach(info => {
            info.timeElapsed = totalElapsed;
        });

        // Restore RNG
        this._restoreRNG();

        // Store and return results
        this.results = results;
        return results;
    }

    /**
     * Get the latest simulation results
     * @returns {Object|null} Latest simulation results or null if no simulation has been run
     */
    getResults() {
        return this.results;
    }

    /**
     * Get settings for a specific distribution
     * @param {string} id - Distribution identifier
     * @returns {Object|null} Distribution settings or null if not found
     */
    getDistributionSettings(id) {
        const workerInfo = this.workers.get(id);
        return workerInfo ? workerInfo.settings : null;
    }

    /**
     * Get all distributions in the simulation
     * @returns {Object} Map of distribution IDs to their configurations
     */
    getDistributions() {
        const distributions = {};
        for (const [id, { distribution }] of this.workers.entries()) {
            distributions[id] = distribution;
        }
        return distributions;
    }
}

module.exports = MonteCarloEngine;