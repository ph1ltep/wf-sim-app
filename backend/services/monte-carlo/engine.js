// Proposed engine refactoring
class ModularMonteCarloEngine {
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
   * Run simulation with provided context
   * @param {Object} context - Simulation context
   * @returns {Object} Simulation results
   */
  run(context) {
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
        // Allow module to transform input data for its needs
        const moduleContext = module.prepareInputData(context);
        
        // Run module for this iteration
        const moduleResult = module.processIteration(
          moduleContext, 
          iterationState,
          i
        );
        
        // Store module results
        iterationState.moduleResults[name] = moduleResult;
      }
      
      // Store iteration results
      iterationResults.push(iterationState);
    }
    
    // Format results using each module's formatter
    const formattedResults = {
      summary: {}
    };
    
    for (const [name, module] of this.modules) {
      // Extract module results from all iterations
      const moduleIterations = iterationResults.map(iter => iter.moduleResults[name]);
      
      // Format using module's formatter
      formattedResults.summary[name] = module.formatResults(
        moduleIterations, 
        this.options.percentiles
      );
    }
    
    // Restore RNG
    this.restoreRNG();
    
    // Store and return results
    this.results = {
      iterations: iterationResults,
      summary: formattedResults.summary
    };
    
    return this.results;
  }

  // RNG methods remain the same
  initializeRNG() {/* ... */}
  restoreRNG() {/* ... */}
}