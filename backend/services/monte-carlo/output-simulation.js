// backend/services/monte-carlo/output-simulation.js
const { createSimulationEngine, convertToSimulationParams, getPercentileValues } = require('./utils');

/**
 * Run the output part of the simulation to get final metrics
 * @param {Object} settings - Scenario settings using the new schema structure
 * @param {Object} inputSimData - Optional inputSim data from runInputSimulation
 * @returns {Object} outputSim object
 */
function runOutputSimulation(settings, inputSimData = null) {
  let results;
  let percentiles;
  
  if (inputSimData && inputSimData._rawResults) {
    // Reuse results from previous calculation if available
    results = inputSimData._rawResults;
    percentiles = inputSimData._percentiles;
  } else {
    // Otherwise run a full simulation
    const parameters = convertToSimulationParams(settings);
    
    const options = {
      iterations: settings.simulation?.iterations || 10000,
      seed: settings.simulation?.seed || 42,
      percentiles: getPercentileValues(settings.simulation?.probabilities)
    };
    
    const engine = createSimulationEngine(options);
    results = engine.run(parameters);
    percentiles = options.percentiles;
  }
  
  // Map traditional percentile keys (P50) to new format (Pprimary)
  const percentileMapping = {
    [`P${percentiles.extremeLower}`]: 'Pextreme_lower',
    [`P${percentiles.lowerBound}`]: 'Plower_bound',
    [`P${percentiles.primary}`]: 'Pprimary',
    [`P${percentiles.upperBound}`]: 'Pupper_bound',
    [`P${percentiles.extremeUpper}`]: 'Pextreme_upper'
  };
  
  // Format the results for outputSim
  const outputSim = {
    IRR: {},
    NPV: {},
    paybackPeriod: {},
    minDSCR: {}
  };
  
  // Process IRR
  if (results.summary.metrics.irr) {
    Object.keys(results.summary.metrics.irr).forEach(percentileKey => {
      const newKey = percentileMapping[percentileKey] || percentileKey;
      outputSim.IRR[newKey] = results.summary.metrics.irr[percentileKey];
    });
  }
  
  // Process NPV
  if (results.summary.metrics.npv) {
    Object.keys(results.summary.metrics.npv).forEach(percentileKey => {
      const newKey = percentileMapping[percentileKey] || percentileKey;
      outputSim.NPV[newKey] = results.summary.metrics.npv[percentileKey];
    });
  }
  
  // Process paybackPeriod
  if (results.summary.metrics.paybackPeriod) {
    Object.keys(results.summary.metrics.paybackPeriod).forEach(percentileKey => {
      const newKey = percentileMapping[percentileKey] || percentileKey;
      outputSim.paybackPeriod[newKey] = results.summary.metrics.paybackPeriod[percentileKey];
    });
  }
  
  // Process minDSCR
  if (results.summary.metrics.minDSCR) {
    Object.keys(results.summary.metrics.minDSCR).forEach(percentileKey => {
      const newKey = percentileMapping[percentileKey] || percentileKey;
      outputSim.minDSCR[newKey] = results.summary.metrics.minDSCR[percentileKey];
    });
  }
  
  return outputSim;
}

module.exports = runOutputSimulation;