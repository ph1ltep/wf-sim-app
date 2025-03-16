// backend/services/monte-carlo/SimulationModule.js

/**
 * Base class for simulation modules to standardize the interface
 * All modules should extend this class and implement its methods
 */
class SimulationModule {
    /**
     * @param {string} name - Module name
     * @param {Object} config - Module configuration
     */
    constructor(name, config = {}) {
      this.name = name;
      this.config = config;
    }
  
    /**
     * Process a single iteration
     * @param {Object} context - Standardized simulation context
     * @param {Object} state - Current simulation state
     * @param {number} iterationIndex - Current iteration index
     * @returns {Object} Module-specific results for this iteration
     */
    processIteration(context, state, iterationIndex) {
      throw new Error(`Module ${this.name} must implement processIteration method`);
    }
  
    /**
     * Transform raw data into the format required by this module
     * @param {Object} data - Raw data from scenario
     * @returns {Object} Transformed data in module-specific format
     */
    prepareInputData(data) {
      throw new Error(`Module ${this.name} must implement prepareInputData method`);
    }
  
    /**
     * Format module results for output
     * @param {Array} iterations - Raw iteration results
     * @param {Object} percentiles - Percentile configuration
     * @returns {Object} Formatted results
     */
    formatResults(iterations, percentiles) {
      throw new Error(`Module ${this.name} must implement formatResults method`);
    }
  
    /**
     * Validate module-specific inputs
     * @param {Object} data - Input data to validate
     * @returns {Object} Validation result with isValid flag and errors array
     */
    validateInputs(data) {
      // Default implementation returns valid
      return { isValid: true, errors: [] };
    }
  
    /**
     * Get module metadata
     * @returns {Object} Module metadata
     */
    getMetadata() {
      return {
        name: this.name,
        version: this.config.version || '1.0.0',
        description: this.config.description || `${this.name} simulation module`
      };
    }
  }
  
  module.exports = SimulationModule;