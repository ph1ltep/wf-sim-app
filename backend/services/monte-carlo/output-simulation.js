// backend/services/monte-carlo/output-simulation.js
const ModularMonteCarloEngine = require('./ModularMonteCarloEngine');
const ContextFactory = require('./ContextFactory');
const ResultFormatter = require('./ResultFormatter');
const SimulationBridge = require('./SimulationBridge');
const ValidationService = require('./ValidationService');

// Import financial modules
const FinancingModule = require('../modules/financingModule');
const IRRModule = require('../modules/irrModule');
const NPVModule = require('../modules/npvModule');
const PaybackModule = require('../modules/paybackModule');

/**
 * Run the output part of the simulation to generate financial metrics
 * 
 * @param {Object} settings - Scenario settings
 * @param {Object} inputSimData - Input simulation data
 * @returns {Object} Output simulation results
 */
async function runOutputSimulation(settings, inputSimData = null) {
  // Validate scenario settings
  const settingsValidation = ValidationService.validateScenarioSettings(settings);
  if (!settingsValidation.isValid) {
    console.error('Scenario settings validation failed:', settingsValidation.errors);
    throw new Error(`Scenario validation failed: ${settingsValidation.errors[0]}`);
  }
  
  // If input simulation data is provided, validate it
  if (inputSimData) {
    const inputDataValidation = ValidationService.validateInputResults(inputSimData);
    if (!inputDataValidation.isValid) {
      console.warn('Input data validation warnings:', inputDataValidation.errors);
      // Continue with warnings but don't throw error
    }
  }
  
  // Configure the simulation engine
  const options = {
    iterations: settings.simulation?.iterations || 10000,
    seed: settings.simulation?.seed || 42,
    percentiles: {
      primary: settings.simulation?.probabilities?.primary || 50,
      upperBound: settings.simulation?.probabilities?.upperBound || 75,
      lowerBound: settings.simulation?.probabilities?.lowerBound || 25,
      extremeUpper: settings.simulation?.probabilities?.extremeUpper || 90,
      extremeLower: settings.simulation?.probabilities?.extremeLower || 10
    }
  };
  
  // Create the modular engine
  const engine = new ModularMonteCarloEngine(options);
  
  // Create financial modules
  const financingModule = new FinancingModule();
  const irrModule = new IRRModule();
  const npvModule = new NPVModule();
  const paybackModule = new PaybackModule();
  
  // Register modules with the engine
  engine.registerModule(financingModule);
  engine.registerModule(irrModule);
  engine.registerModule(npvModule);
  engine.registerModule(paybackModule);
  
  // Prepare bridge data from input simulation if available
  let bridgeData = null;
  if (inputSimData) {
    bridgeData = SimulationBridge.bridgeInputToOutput(inputSimData);
  }
  
  // Create standardized context
  const context = ContextFactory.createOutputContext(settings, inputSimData);
  
  // Add bridge data to context if available
  if (bridgeData) {
    context.bridgeData = bridgeData;
  }
  
  // Run the simulation
  const rawResults = engine.run(context);
  
  // Format the results using the standard formatter
  const formattedResults = ResultFormatter.formatResults(rawResults, options.percentiles, false);
  
  // Validate formatted results
  const resultsValidation = ValidationService.validateOutputResults(formattedResults);
  if (!resultsValidation.isValid) {
    console.warn('Output results validation warnings:', resultsValidation.errors);
    // Continue with warnings but don't throw error
  }
  
  return formattedResults;
}

module.exports = runOutputSimulation;