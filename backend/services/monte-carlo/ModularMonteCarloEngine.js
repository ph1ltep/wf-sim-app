// backend/services/monte-carlo/ModularMonteCarloEngine.js
const seedrandom = require('seedrandom');
const ValidationService = require('./ValidationService');

/**
 * A modular Monte Carlo simulation engine that works with standardized simulation modules
 */
class ModularMonteCarloEngine {
  /**
   * Create a new Monte Carlo engine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      seed: options.seed || 42,
      iterations: options.iterations || 10000,
      percentiles: options.percentiles || {
        primary: 50,
        upperBound: 75,
        lowerBound: 25,
        extremeLower: 10,
        extremeUpper: 90
      },
      ...options
    };
    
    this.modules = new Map();
    this.results = null;
    this.originalRandom = null;
  }

  /**
   * Register a simulation module
   * @param {SimulationModule} module - Module instance
   * @returns {this} For chaining
   */
  registerModule(module) {
    if (!module.name) {
      throw new Error('Module must have a name');
    }
    this.modules.set(module.name, module);
    return this;
  }

  /**
   * Initialize the random number generator with a seed
   * @returns {this} For chaining
   */
  initializeRNG() {
    // Save original random function
    this.originalRandom = Math.random;
    
    // Replace with seeded version
    Math.random = seedrandom(this.options.seed);
    
    return this;
  }

  /**
   * Restore the original random number generator
   * @returns {this} For chaining
   */
  restoreRNG() {
    if (this.originalRandom) {
      Math.random = this.originalRandom;
      this.originalRandom = null;
    }
    return this;
  }

/**
 * Validate the global simulation context and module-specific inputs
 * @param {Object} context - Simulation context
 * @returns {Object} Validation result
 */
  validateContext(context) {
    // Use the validation service for comprehensive validation
    const isInputContext = context.cost !== undefined;
    const contextValidation = isInputContext 
      ? ValidationService.validateInputContext(context) 
      : ValidationService.validateOutputContext(context);
    
    if (!contextValidation.isValid) {
      return contextValidation;
    }
    
    // Check if we have at least one module
    if (this.modules.size === 0) {
      return { isValid: false, errors: ['No simulation modules registered'] };
    }
    
    // Module-specific validation
    const moduleValidations = {};
    let allValid = true;
    const errors = [...contextValidation.errors]; // Start with context validation errors
    
    for (const [name, module] of this.modules) {
      // Use the module's validateInputs method
      const validation = module.validateInputs(context);
      moduleValidations[name] = validation;
      
      if (!validation.isValid) {
        allValid = false;
        errors.push(`Validation failed for module '${name}'`);
        validation.errors.forEach(err => errors.push(`  - ${err}`));
      }
    }
    
    return {
      isValid: allValid && contextValidation.isValid,
      errors,
      moduleValidations,
      contextValidation
    };
  }

  /**
   * Run simulation with provided context
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation results
   */
  run(context) {
    // Validate context
    const validation = this.validateContext(context);
    if (!validation.isValid) {
      throw new Error(`Context validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Initialize RNG
    this.initializeRNG();
    
    // Initialize results
    const iterationResults = [];
    
    // Run iterations
    for (let i = 0; i < this.options.iterations; i++) {
      const iterationState = {
        iteration: i,
        moduleResults: {}
      };
      
      // Process each module
      for (const [name, module] of this.modules) {
        try {
          // Allow module to transform input data for its needs
          const moduleContext = module.prepareInputData(context);
          
          // Run module for this iteration
          const moduleResult = module.processIteration(
            moduleContext, 
            iterationState,
            i
          );
          
          // Validate module results
          const validation = ValidationService.validateModuleResults(moduleResult, name);
          if (!validation.isValid) {
            console.warn(`Module ${name} result validation failed:`, validation.errors);
          }
          
          // Store module results
          iterationState.moduleResults[name] = moduleResult;
        } catch (error) {
          console.error(`Error in module ${name} for iteration ${i}:`, error);
          // Store error in results
          iterationState.moduleResults[name] = { error: error.message };
        }
      }
      
      // Store iteration results
      iterationResults.push(iterationState);
    }
    
    // Format results using each module's formatter
    const formattedResults = {
      summary: {},
      metadata: {
        iterations: this.options.iterations,
        seed: this.options.seed,
        percentiles: this.options.percentiles,
        modules: Array.from(this.modules.keys())
      }
    };
    
    for (const [name, module] of this.modules) {
      try {
        // Extract module results from all iterations
        const moduleIterations = iterationResults.map(iter => 
          iter.moduleResults[name]
        );
        
        // Skip if we have errors
        if (moduleIterations.some(res => res && res.error)) {
          formattedResults.summary[name] = { 
            error: 'One or more iterations failed' 
          };
          continue;
        }
        
        // Format using module's formatter
        formattedResults.summary[name] = module.formatResults(
          moduleIterations, 
          this.options.percentiles
        );
      } catch (error) {
        console.error(`Error formatting results for module ${name}:`, error);
        formattedResults.summary[name] = { error: error.message };
      }
    }
    
    // Restore RNG
    this.restoreRNG();
    
    // Store and return results
    this.results = {
      iterations: iterationResults,
      summary: formattedResults.summary,
      metadata: formattedResults.metadata
    };
    
    return this.results;
  }

}


module.exports = ModularMonteCarloEngine;