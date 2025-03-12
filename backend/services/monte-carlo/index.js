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
    seed: parameters.simulation?.seed || 42
  };
  
  const engine = createSimulationEngine(options);
  const results = engine.run(parameters);
  
  return formatResults(results);
}

/**
 * Format raw simulation results into the expected API response format
 * @param {Object} results - Raw simulation results
 * @returns {Object} Formatted results
 */
function formatResults(results) {
  // Transform results into the expected output format
  const { summary } = results;
  
  return {
    success: true,
    results: {
      intermediateData: {
        annualCosts: {
          total: {
            P50: summary.annualData.totalCost?.P50 || [],
            P75: summary.annualData.totalCost?.P75 || [],
            P90: summary.annualData.totalCost?.P90 || []
          },
          components: {
            baseOM: {
              P50: summary.annualData.baseOMCost?.P50 || [],
              P75: summary.annualData.baseOMCost?.P75 || [],
              P90: summary.annualData.baseOMCost?.P90 || []
            },
            failureRisk: {
              P50: summary.annualData.failureEventCost?.P50 || [],
              P75: summary.annualData.failureEventCost?.P75 || [],
              P90: summary.annualData.failureEventCost?.P90 || []
            }
          }
        },
        annualRevenue: {
          P50: summary.annualData.revenue?.P50 || [],
          P75: summary.annualData.revenue?.P75 || [],
          P90: summary.annualData.revenue?.P90 || []
        },
        dscr: {
          P50: summary.annualData.dscr?.P50 || [],
          P90: summary.annualData.dscr?.P90 || []
        },
        cashFlows: {
          P50: summary.annualData.cashFlow?.P50 || [],
          P75: summary.annualData.cashFlow?.P75 || [],
          P90: summary.annualData.cashFlow?.P90 || []
        }
      },
      finalResults: {
        IRR: {
          P50: summary.metrics.irr?.P50 || 0,
          P75: summary.metrics.irr?.P75 || 0,
          P90: summary.metrics.irr?.P90 || 0
        },
        NPV: {
          P50: summary.metrics.npv?.P50 || 0,
          P75: summary.metrics.npv?.P75 || 0,
          P90: summary.metrics.npv?.P90 || 0
        },
        paybackPeriod: {
          P50: summary.metrics.paybackPeriod?.P50 || 0,
          P75: summary.metrics.paybackPeriod?.P75 || 0,
          P90: summary.metrics.paybackPeriod?.P90 || 0
        },
        minDSCR: {
          P50: summary.metrics.minDSCR?.P50 || 0,
          P90: summary.metrics.minDSCR?.P90 || 0
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