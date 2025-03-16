// backend/services/monte-carlo/index.js
const { createSimulationEngine, convertToSimulationParams, getPercentileValues } = require('./utils');
const runInputSimulation = require('./input-simulation');
const runOutputSimulation = require('./output-simulation');

/**
 * Run a complete Monte Carlo simulation with all modules
 * @param {Object} scenarioData - ScenarioSchema object
 * @param {Array} oemScopes - Optional pre-fetched OEM scopes 
 * @returns {Object} Updated ScenarioSchema object with simulation results
 */
async function runSimulation(scenarioData, oemScopes = null) {
  const settings = scenarioData.settings;
  
  // Run both input and output parts of the simulation
  const inputSim = await runInputSimulation(settings, oemScopes);
  const outputSim = await runOutputSimulation(settings, inputSim);
  
  // Create a copy of the scenario to avoid modifying the original
  const updatedScenario = JSON.parse(JSON.stringify(scenarioData));
  
  // Clean the inputSim by removing internal properties
  const cleanInputSim = { ...inputSim };
  delete cleanInputSim._rawResults;
  delete cleanInputSim._percentiles;
  
  // Update the scenario with simulation results
  updatedScenario.simulation = {
    inputSim: cleanInputSim,
    outputSim: outputSim
  };
  
  return updatedScenario;
}

module.exports = {
  createSimulationEngine,
  convertToSimulationParams,
  getPercentileValues,
  runSimulation,
  runInputSimulation,
  runOutputSimulation
};