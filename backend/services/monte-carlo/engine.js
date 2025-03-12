// backend/services/monte-carlo/engine.js
const seedrandom = require('seedrandom');
const financial = require('financial');
const DistributionFactory = require('./distributions');

class MonteCarloEngine {
  constructor(options = {}) {
    this.options = {
      seed: options.seed || 42,
      iterations: options.iterations || 10000,
      ...options
    };
    
    this.modules = new Map();
    this.results = null;
    this.originalRandom = null;
  }

  /**
   * Register a simulation module
   * @param {string} name - Module name
   * @param {Object} module - Module instance
   */
  registerModule(name, module) {
    this.modules.set(name, module);
    return this;
  }

  /**
   * Initialize the random number generator with a seed
   */
  initializeRNG() {
    this.originalRandom = Math.random;
    Math.random = seedrandom(this.options.seed);
    return this;
  }

  /**
   * Restore the original random number generator
   */
  restoreRNG() {
    if (this.originalRandom) {
      Math.random = this.originalRandom;
      this.originalRandom = null;
    }
    return this;
  }

  /**
   * Run a Monte Carlo simulation
   * @param {Object} parameters - Simulation parameters
   * @returns {Object} Simulation results
   */
  run(parameters) {
    // Initialize
    this.initializeRNG();
    this.results = {
      iterations: [],
      summary: {},
    };

    const { general } = parameters;
    const projectLife = general.projectLife || 20;

    // Run iterations
    for (let iter = 0; iter < this.options.iterations; iter++) {
      const iterationResult = {
        annualData: Array(projectLife).fill().map(() => ({})),
        metrics: {},
      };

      // Initialize with initial cash flow (CAPEX + DEVEX)
      const initialInvestment = -((parameters.financing.capex || 0) + (parameters.financing.devex || 0));
      iterationResult.cashFlows = [initialInvestment];
      
      // Run each module for this iteration
      for (const [name, module] of this.modules.entries()) {
        const moduleResult = module.processIteration(
          parameters, 
          iterationResult,
          iter
        );
        
        // Merge module result into iteration result
        Object.assign(iterationResult.metrics, moduleResult.metrics || {});
        
        // Update annual data
        if (moduleResult.annualData) {
          for (let year = 0; year < projectLife; year++) {
            iterationResult.annualData[year] = {
              ...iterationResult.annualData[year],
              ...(moduleResult.annualData[year] || {})
            };
          }
        }
      }
      
      // Calculate IRR for this iteration
      iterationResult.metrics.irr = financial.irr(iterationResult.cashFlows) || 0;
      
      // Store iteration result
      this.results.iterations.push(iterationResult);
    }

    // Calculate summary statistics
    this.calculateSummary();
    
    // Restore RNG
    this.restoreRNG();
    
    return this.results;
  }

  /**
   * Calculate summary statistics from all iterations
   */
  calculateSummary() {
    if (!this.results || !this.results.iterations.length) {
      return this;
    }

    const { iterations } = this.results;
    const projectLife = iterations[0].annualData.length;

    // Get all metric names
    const metricNames = new Set();
    iterations.forEach(iter => {
      Object.keys(iter.metrics).forEach(key => metricNames.add(key));
    });

    // Calculate percentiles for each metric
    const metricResults = {};
    metricNames.forEach(metric => {
      const values = iterations.map(iter => iter.metrics[metric]);
      metricResults[metric] = DistributionFactory.calculatePercentiles(
        values, 
        [10, 50, 75, 90]
      );
    });

    // Calculate annual data percentiles (costs, revenue, etc.)
    const annualResults = {};
    
    // First, identify all annual data fields
    const annualDataFields = new Set();
    iterations.forEach(iter => {
      iter.annualData.forEach(yearData => {
        Object.keys(yearData).forEach(key => annualDataFields.add(key));
      });
    });
    
    // Then calculate percentiles for each field for each year
    annualDataFields.forEach(field => {
      annualResults[field] = {
        P10: [],
        P50: [],
        P75: [],
        P90: []
      };
      
      for (let year = 0; year < projectLife; year++) {
        const yearValues = iterations.map(iter => 
          iter.annualData[year][field] || 0
        );
        
        const percentiles = DistributionFactory.calculatePercentiles(
          yearValues, 
          [10, 50, 75, 90]
        );
        
        annualResults[field].P10.push(percentiles.P10);
        annualResults[field].P50.push(percentiles.P50);
        annualResults[field].P75.push(percentiles.P75);
        annualResults[field].P90.push(percentiles.P90);
      }
    });

    this.results.summary = {
      metrics: metricResults,
      annualData: annualResults
    };
    
    return this;
  }
}

module.exports = MonteCarloEngine;