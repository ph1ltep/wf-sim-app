// backend/services/monte-carlo/input-simulation.js
const ModularMonteCarloEngine = require('./ModularMonteCarloEngine');
const ContextFactory = require('./ContextFactory');
const ResultFormatter = require('./ResultFormatter');
const ValidationService = require('./ValidationService');
const { generateResponsibilityMatrix } = require('../oemResponsibilityMatrix');

// Import modules
const CostModule = require('../modules/costModule');
const RevenueModule = require('../modules/revenueModule');
const RiskModule = require('../modules/riskModule');

/**
 * Run the input part of the simulation to generate operational results
 * 
 * @param {Object} settings - Scenario settings
 * @param {Array} oemScopes - Optional pre-fetched OEM scopes
 * @returns {Object} Input simulation results
 */
async function runInputSimulation(settings, oemScopes = null) {
  // Validate scenario settings
  const settingsValidation = ValidationService.validateScenarioSettings(settings);
  if (!settingsValidation.isValid) {
    console.error('Scenario settings validation failed:', settingsValidation.errors);
    throw new Error(`Scenario validation failed: ${settingsValidation.errors[0]}`);
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
  
  // Create modules
  const costModule = new CostModule();
  const revenueModule = new RevenueModule();
  const riskModule = new RiskModule();
  
  // Register modules with the engine
  engine.registerModule(costModule);
  engine.registerModule(revenueModule);
  engine.registerModule(riskModule);
  
  // Create standardized context
  const context = await ContextFactory.createInputContext(settings, oemScopes);
  
  // Run the simulation
  const rawResults = engine.run(context);
  
  // Generate OEM responsibility matrix
  const responsibilityContext = ContextFactory.createResponsibilityContext(settings, oemScopes);
  const responsibilityMatrix = await generateResponsibilityMatrix(
    responsibilityContext.projectLife,
    responsibilityContext.numWTGs,
    responsibilityContext.oemContracts.map(contract => {
      // Find OEM scope for this contract
      const oemScope = responsibilityContext.oemScopes.find(
        scope => scope._id.toString() === contract.oemScopeId
      );
      
      return {
        ...contract,
        oemScope
      };
    }).filter(Boolean)
  );
  
  // Add responsibility matrix to results
  rawResults.responsibilityMatrix = responsibilityMatrix;
  
  // Format the results using the standard formatter
  const formattedResults = ResultFormatter.formatResults(rawResults, options.percentiles, true);
  
  // Validate formatted results
  const resultsValidation = ValidationService.validateInputResults(formattedResults);
  if (!resultsValidation.isValid) {
    console.warn('Input results validation warnings:', resultsValidation.errors);
    // Continue with warnings but don't throw error
  }
  
  // Store raw results for potential use by output simulation
  formattedResults._rawResults = rawResults;
  formattedResults._percentiles = options.percentiles;
  
  return formattedResults;
}

module.exports = runInputSimulation;