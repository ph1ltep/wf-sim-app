// backend/services/monte-carlo/index.js
const runInputSimulation = require('./input-simulation');
const runOutputSimulation = require('./output-simulation');
const ModularMonteCarloEngine = require('./ModularMonteCarloEngine');
const SimulationModule = require('./SimulationModule');
const ResultFormatter = require('./ResultFormatter');
const FinancialFormatter = require('./FinancialFormatter');
const SimulationBridge = require('./SimulationBridge');
const ContextFactory = require('./ContextFactory');

/**
 * Run a complete Monte Carlo simulation with all modules
 * 
 * @param {Object} scenarioData - ScenarioSchema object
 * @param {Array} oemScopes - Optional pre-fetched OEM scopes 
 * @returns {Object} Updated ScenarioSchema object with simulation results
 */
async function runSimulation(scenarioData, oemScopes = null) {
  const settings = scenarioData.settings;
  
  // Run input simulation to get operational data
  const inputSim = await runInputSimulation(settings, oemScopes);
  
  // Run output simulation to get financial metrics
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

// Export all simulation-related components
module.exports = {
  runSimulation,
  runInputSimulation,
  runOutputSimulation,
  ModularMonteCarloEngine,
  SimulationModule,
  ResultFormatter,
  FinancialFormatter,
  SimulationBridge,
  ContextFactory
};