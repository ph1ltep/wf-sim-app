// backend/services/monte-carlo/input-simulation.js
const { createSimulationEngine, convertToSimulationParams, getPercentileValues } = require('./utils');

/**
 * Run the input part of the simulation to get intermediateData
 * @param {Object} settings - Scenario settings using the new schema structure
 * @returns {Object} inputSim object
 */
function runInputSimulation(settings) {
  // Convert from the new scenario schema structure to the parameters format expected by the engine
  const parameters = convertToSimulationParams(settings);
  
  const options = {
    iterations: settings.simulation?.iterations || 10000,
    seed: settings.simulation?.seed || 42,
    percentiles: getPercentileValues(settings.simulation?.probabilities)
  };
  
  const engine = createSimulationEngine(options);
  const results = engine.run(parameters);
  
  // Extract percentiles
  const percentiles = options.percentiles;
  
  // Map traditional percentile keys (P50) to new format (Pprimary)
  const percentileMapping = {
    [`P${percentiles.extremeLower}`]: 'Pextreme_lower',
    [`P${percentiles.lowerBound}`]: 'Plower_bound',
    [`P${percentiles.primary}`]: 'Pprimary',
    [`P${percentiles.upperBound}`]: 'Pupper_bound',
    [`P${percentiles.extremeUpper}`]: 'Pextreme_upper'
  };
  
  // Initialize input simulation result structure
  const inputSim = {
    cashflow: {
      annualCosts: {
        total: {},
        components: {
          baseOM: {},
          failureRisk: {}
        }
      },
      annualRevenue: {},
      dscr: {},
      netCashFlow: {}
    },
    risk: {
      failureRates: {},
      eventProbabilities: {}
    },
    scope: {
      responsibilityMatrix: null
    },
    // Store raw results for internal use
    _rawResults: results,
    _percentiles: percentiles
  };
  
  // Process annual costs total
  if (results.summary.annualData.totalCost) {
    Object.keys(results.summary.annualData.totalCost).forEach(oldKey => {
      const newKey = percentileMapping[oldKey] || oldKey;
      inputSim.cashflow.annualCosts.total[newKey] = results.summary.annualData.totalCost[oldKey];
    });
  }
  
  // Process baseOM costs
  if (results.summary.annualData.baseOMCost) {
    Object.keys(results.summary.annualData.baseOMCost).forEach(oldKey => {
      const newKey = percentileMapping[oldKey] || oldKey;
      inputSim.cashflow.annualCosts.components.baseOM[newKey] = results.summary.annualData.baseOMCost[oldKey];
    });
  }
  
  // Process failure event costs
  if (results.summary.annualData.failureEventCost) {
    Object.keys(results.summary.annualData.failureEventCost).forEach(oldKey => {
      const newKey = percentileMapping[oldKey] || oldKey;
      inputSim.cashflow.annualCosts.components.failureRisk[newKey] = results.summary.annualData.failureEventCost[oldKey];
    });
  }
  
  // Process annual revenue
  if (results.summary.annualData.revenue) {
    Object.keys(results.summary.annualData.revenue).forEach(oldKey => {
      const newKey = percentileMapping[oldKey] || oldKey;
      inputSim.cashflow.annualRevenue[newKey] = results.summary.annualData.revenue[oldKey];
    });
  }
  
  // Process DSCR
  if (results.summary.annualData.dscr) {
    Object.keys(results.summary.annualData.dscr).forEach(oldKey => {
      const newKey = percentileMapping[oldKey] || oldKey;
      inputSim.cashflow.dscr[newKey] = results.summary.annualData.dscr[oldKey];
    });
  }
  
  // Process cashFlow
  if (results.summary.annualData.cashFlow) {
    Object.keys(results.summary.annualData.cashFlow).forEach(oldKey => {
      const newKey = percentileMapping[oldKey] || oldKey;
      inputSim.cashflow.netCashFlow[newKey] = results.summary.annualData.cashFlow[oldKey];
    });
  }
  
  return inputSim;
}

module.exports = runInputSimulation;