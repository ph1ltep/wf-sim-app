const seedrandom = require('seedrandom');
const DistributionWorker = require('./worker');
const { SimRequestSchema, SimResponseSchema } = require('../../../../schemas/yup/distribution');

/**
 * Monte Carlo engine for running multiple distribution simulations
 */
class MonteCarloEngine {
    /**
     * Create a new Monte Carlo engine
     * @param {Object} simRequest - SimRequestSchema-compliant object with distributions and simulationSettings
     * @param {number} [parallelWorkers=1] - Number of parallel workers for simulation
     */
    constructor(simRequest, parallelWorkers = 1) {
        // Validate input against SimRequestSchema
        const validatedRequest = SimRequestSchema.validateSync(simRequest, { strict: true });

        // Initialize properties
        this.options = {
            ...validatedRequest.simulationSettings,
            parallelWorkers: parallelWorkers // Store parallelWorkers in options
        };
        this.workers = new Map();
        this.originalRandom = null;
        this.results = null;

        // Add distributions
        validatedRequest.distributions.forEach((distribution, index) => {
            const id = distribution.id || `distribution_${index + 1}`;
            this.addDistribution(id, distribution);
        });
    }

    /**
     * Add a distribution to the simulation
     * @param {string} id - Unique identifier for the distribution
     * @param {Object} distribution - Distribution configuration following DistributionTypeSchema
     * @param {Object} settings - Per-distribution settings (overrides engine settings)
     * @returns {this} For method chaining
     */
    addDistribution(id, distribution, settings = {}) {
        if (!distribution.type || !distribution.parameters) {
            throw new Error(`Invalid distribution format: must have type and parameters properties`);
        }
        const combinedSettings = { ...this.options, ...settings };
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
        this.originalRandom = Math.random;
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
     * @returns {Object} Simulation results validated against SimResponseSchema
     */
    async run() {
        if (this.workers.size === 0) {
            throw new Error('No distributions added to the simulation');
        }

        this._initializeRNG();
        const startTime = Date.now();
        const results = {
            success: true,
            simulationInfo: []
        };

        // Note: Current implementation runs sequentially
        // Future enhancement: Use this.options.parallelWorkers for true parallelism
        for (const [id, { worker, distribution }] of this.workers.entries()) {
            try {
                const distributionSeed = `${this.options.seed}-${id}`;
                worker.initialize(distributionSeed);
                const { results: distributionResults, statistics } = worker.process();

                results.simulationInfo.push({
                    distribution,
                    iterations: this.options.iterations,
                    seed: this.options.seed,
                    years: this.options.years,
                    timeElapsed: 0, // Updated later
                    results: Array.isArray(distributionResults) ? distributionResults : [distributionResults],
                    errors: [],
                    statistics
                });
            } catch (error) {
                results.simulationInfo.push({
                    distribution,
                    iterations: this.options.iterations,
                    seed: this.options.seed,
                    years: this.options.years,
                    timeElapsed: 0,
                    results: [],
                    errors: [error.message],
                    statistics: {}
                });
                results.success = false;
            }
        }

        const totalElapsed = Date.now() - startTime;
        results.simulationInfo.forEach(info => {
            info.timeElapsed = totalElapsed;
        });

        this._restoreRNG();

        // Validate and cast output
        this.results = SimResponseSchema.validateSync(results, { stripUnknown: true });
        return this.results;
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