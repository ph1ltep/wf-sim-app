// backend/services/monte-carlo/engine.js
const seedrandom = require('seedrandom');
const financial = require('financial');
const DistributionFactory = require('./distributions');

class MonteCarloEngine {
  constructor(options = {}) {
    this.options = {
      seed: options.seed || 42,
      iterations: options.iterations || 10000,
      percentiles: options.percentiles || {
        primary: 50,      // Default: P50 (median)
        upperBound: 75,   // Default: P75
        lowerBound: 25,   // Default: P25
        extremeLower: 10, // Default: P10
        extremeUpper: 90  // Default: P90
      },
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

    const { general, financing } = parameters;
    const projectLife = general.projectLife || 20;
    // Update here: Use loanDuration from financing parameters
    const loanDuration = financing.loanDuration || 15;

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

    // Calculate summary statistics using the specified percentiles
    this.calculateSummary();
    
    // Restore RNG
    this.restoreRNG();
    
    return this.results;
  }

  /**
   * Calculate summary statistics from all iterations using specified percentiles
   */
  calculateSummary() {
    if (!this.results || !this.results.iterations.length) {
      return this;
    }

    const { iterations } = this.results;
    const projectLife = iterations[0].annualData.length;
    
    // Generate percentile labels
    const percentileValues = [
      this.options.percentiles.extremeLower, 
      this.options.percentiles.lowerBound,
      this.options.percentiles.primary,
      this.options.percentiles.upperBound,
      this.options.percentiles.extremeUpper
    ];
    
    const percentileLabels = percentileValues.map(p => `P${p}`);

    // Get all metric names
    const metricNames = new Set();
    iterations.forEach(iter => {
      Object.keys(iter.metrics).forEach(key => metricNames.add(key));
    });

    // Calculate percentiles for each metric using the specified percentile values
    const metricResults = {};
    metricNames.forEach(metric => {
      const values = iterations.map(iter => iter.metrics[metric]);
      metricResults[metric] = DistributionFactory.calculatePercentiles(
        values, 
        percentileValues
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
    
    // Then calculate percentiles for each field for each year using specified percentiles
    annualDataFields.forEach(field => {
      annualResults[field] = {};
      
      // Initialize arrays for each percentile
      percentileLabels.forEach(label => {
        annualResults[field][label] = [];
      });
      
      for (let year = 0; year < projectLife; year++) {
        const yearValues = iterations.map(iter => 
          iter.annualData[year][field] || 0
        );
        
        const percentiles = DistributionFactory.calculatePercentiles(
          yearValues, 
          percentileValues
        );
        
        // Add values for each percentile
        percentileLabels.forEach(label => {
          annualResults[field][label].push(percentiles[label]);
        });
      }
    });

    // Calculate DSCR below 1 probability
    if (annualResults.dscr) {
      const dscrValues = iterations.map(iter => {
        // Find minimum DSCR for each iteration
        const dscrArray = [];
        for (let year = 0; year < projectLife; year++) {
          if (iter.annualData[year].dscr !== undefined && iter.annualData[year].dscr !== Infinity) {
            dscrArray.push(iter.annualData[year].dscr);
          }
        }
        return dscrArray.length > 0 ? Math.min(...dscrArray) : Infinity;
      });
      
      // Calculate probability of min DSCR falling below 1
      const dscrBelow1Count = dscrValues.filter(dscr => dscr < 1).length;
      metricResults.dscrBelow1Probability = dscrBelow1Count / iterations.length;
    }

    this.results.summary = {
      metrics: metricResults,
      annualData: annualResults
    };
    
    return this;
  }
}

module.exports = MonteCarloEngine;