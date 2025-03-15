// backend/services/monte-carlo/index.js
const MonteCarloEngine = require('./engine');
const DistributionFactory = require('./distributions');

// Module classes will be imported and attached here
const CostModule = require('../modules/costModule');
const RevenueModule = require('../modules/revenueModule');
const FinancingModule = require('../modules/financingModule');
const RiskModule = require('../modules/riskModule');

/**
 * Create a fully configured Monte Carlo simulation engine
 * @param {Object} options - Simulation options
 * @returns {MonteCarloEngine} Configured engine instance
 */
function createSimulationEngine(options = {}) {
  const engine = new MonteCarloEngine({
    iterations: options.iterations || 10000,
    seed: options.seed || 42,
    ...options
  });
  
  // Register all modules
  engine.registerModule('cost', new CostModule())
        .registerModule('revenue', new RevenueModule())
        .registerModule('financing', new FinancingModule())
        .registerModule('risk', new RiskModule());
  
  return engine;
}

/**
 * Run a complete Monte Carlo simulation with all modules
 * @param {Object} parameters - Simulation parameters
 * @returns {Object} Simulation results
 */
function runSimulation(parameters) {
  const options = {
    iterations: parameters.simulation?.iterations || 10000,
    seed: parameters.simulation?.seed || 42,
    percentiles: getPercentileValues(parameters)
  };
  
  const engine = createSimulationEngine(options);
  const results = engine.run(parameters);
  
  return formatResults(results, options.percentiles);
}

/**
 * Get percentile values from parameters or use defaults
 * @param {Object} parameters - Simulation parameters
 * @returns {Object} Percentile values
 */
function getPercentileValues(parameters) {
  // Get probability values from parameters or use defaults
  const probabilities = parameters.probabilities || {};
  
  return {
    primary: probabilities.primary || 50,      // Default: P50 (median)
    upperBound: probabilities.upperBound || 75, // Default: P75
    lowerBound: probabilities.lowerBound || 25, // Default: P25
    extremeLower: probabilities.extremeLower || 10, // Default: P10
    extremeUpper: probabilities.extremeUpper || 90  // Default: P90
  };
}

/**
 * Format raw simulation results into the expected API response format
 * @param {Object} results - Raw simulation results
 * @param {Object} percentiles - Percentile values to use
 * @returns {Object} Formatted results
 */
function formatResults(results, percentiles) {
  // Transform results into the expected output format
  const { summary } = results;
  
  // Create mappings from percentile values to labels
  const pLabels = {
    [percentiles.primary]: 'P' + percentiles.primary,
    [percentiles.upperBound]: 'P' + percentiles.upperBound,
    [percentiles.lowerBound]: 'P' + percentiles.lowerBound,
    [percentiles.extremeUpper]: 'P' + percentiles.extremeUpper,
    [percentiles.extremeLower]: 'P' + percentiles.extremeLower,
  };

  // Use primary, upper, and extreme upper for most displays
  const pPrimary = pLabels[percentiles.primary];
  const pUpper = pLabels[percentiles.upperBound];
  const pExtreme = pLabels[percentiles.extremeUpper];
  
  return {
    success: true,
    percentileInfo: percentiles, // Include percentile info for reference
    results: {
      intermediateData: {
        annualCosts: {
          total: {
            [pPrimary]: summary.annualData.totalCost?.[pPrimary] || [],
            [pUpper]: summary.annualData.totalCost?.[pUpper] || [],
            [pExtreme]: summary.annualData.totalCost?.[pExtreme] || []
          },
          components: {
            baseOM: {
              [pPrimary]: summary.annualData.baseOMCost?.[pPrimary] || [],
              [pUpper]: summary.annualData.baseOMCost?.[pUpper] || [],
              [pExtreme]: summary.annualData.baseOMCost?.[pExtreme] || []
            },
            failureRisk: {
              [pPrimary]: summary.annualData.failureEventCost?.[pPrimary] || [],
              [pUpper]: summary.annualData.failureEventCost?.[pUpper] || [],
              [pExtreme]: summary.annualData.failureEventCost?.[pExtreme] || []
            }
          }
        },
        annualRevenue: {
          [pPrimary]: summary.annualData.revenue?.[pPrimary] || [],
          [pUpper]: summary.annualData.revenue?.[pUpper] || [],
          [pExtreme]: summary.annualData.revenue?.[pExtreme] || []
        },
        dscr: {
          [pPrimary]: summary.annualData.dscr?.[pPrimary] || [],
          [pExtreme]: summary.annualData.dscr?.[pExtreme] || []
        },
        cashFlows: {
          [pPrimary]: summary.annualData.cashFlow?.[pPrimary] || [],
          [pUpper]: summary.annualData.cashFlow?.[pUpper] || [],
          [pExtreme]: summary.annualData.cashFlow?.[pExtreme] || []
        }
      },
      finalResults: {
        IRR: {
          [pPrimary]: summary.metrics.irr?.[pPrimary] || 0,
          [pUpper]: summary.metrics.irr?.[pUpper] || 0,
          [pExtreme]: summary.metrics.irr?.[pExtreme] || 0
        },
        NPV: {
          [pPrimary]: summary.metrics.npv?.[pPrimary] || 0,
          [pUpper]: summary.metrics.npv?.[pUpper] || 0,
          [pExtreme]: summary.metrics.npv?.[pExtreme] || 0
        },
        paybackPeriod: {
          [pPrimary]: summary.metrics.paybackPeriod?.[pPrimary] || 0,
          [pUpper]: summary.metrics.paybackPeriod?.[pUpper] || 0,
          [pExtreme]: summary.metrics.paybackPeriod?.[pExtreme] || 0
        },
        minDSCR: {
          [pPrimary]: summary.metrics.minDSCR?.[pPrimary] || 0,
          [pExtreme]: summary.metrics.minDSCR?.[pExtreme] || 0
        },
        probabilityOfDSCRBelow1: summary.metrics.dscrBelow1Probability || 0
      }
    }
  };
}

module.exports = {
  MonteCarloEngine,
  DistributionFactory,
  createSimulationEngine,
  runSimulation
};