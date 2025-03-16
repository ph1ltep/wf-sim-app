// backend/controllers/simulationController.js
const { 
  runSimulation, 
  runInputSimulation, 
  runOutputSimulation 
} = require('../services/monte-carlo');
const OEMScope = require('../models/OEMScope');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

/**
 * Run a full simulation based on provided settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const runFullSimulation = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate required parameters
    if (!settings || !settings.general || !settings.modules || !settings.project) {
      return res.status(400).json(formatError('Missing required parameters'));
    }
    
    // Preload OEM scopes if needed
    let oemScopes = null;
    const oemContracts = settings?.modules?.contracts?.oemContracts || [];
    if (oemContracts.length > 0) {
      const oemScopeIds = oemContracts.map(contract => contract.oemScopeId).filter(Boolean);
      if (oemScopeIds.length > 0) {
        oemScopes = await OEMScope.find({ _id: { $in: oemScopeIds } });
      }
    }
    
    // Create a temporary scenario object
    const tempScenario = {
      settings,
      simulation: {
        inputSim: {},
        outputSim: {}
      }
    };
    
    // Run the simulation (passing preloaded OEM scopes)
    const simulatedScenario = await runSimulation(tempScenario, oemScopes);
    
    // Return the simulation results
    res.json(formatSuccess({
      simulation: simulatedScenario.simulation
    }));
  } catch (error) {
    console.error('Error running simulation:', error);
    next(error);
  }
};

/**
 * Run only the input part of the simulation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const runInputSimulationOnly = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate required parameters
    if (!settings || !settings.general || !settings.modules || !settings.project) {
      return res.status(400).json(formatError('Missing required parameters'));
    }
    
    // Preload OEM scopes if needed
    let oemScopes = null;
    const oemContracts = settings?.modules?.contracts?.oemContracts || [];
    if (oemContracts.length > 0) {
      const oemScopeIds = oemContracts.map(contract => contract.oemScopeId).filter(Boolean);
      if (oemScopeIds.length > 0) {
        oemScopes = await OEMScope.find({ _id: { $in: oemScopeIds } });
      }
    }
    
    // Run the input simulation with preloaded scopes
    const inputSimResult = await runInputSimulation(settings, oemScopes);
    
    // Remove internal properties
    const cleanInputSim = { ...inputSimResult };
    delete cleanInputSim._rawResults;
    delete cleanInputSim._percentiles;
    
    // Return the input simulation results
    res.json(formatSuccess({
      inputSim: cleanInputSim
    }));
  } catch (error) {
    console.error('Error running input simulation:', error);
    next(error);
  }
};

/**
 * Run only the output part of the simulation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const runOutputSimulationOnly = async (req, res, next) => {
  try {
    const { settings, inputSim } = req.body;
    
    // Validate required parameters
    if (!settings || !settings.general) {
      return res.status(400).json(formatError('Missing required settings parameters'));
    }
    
    // Run the output simulation
    // If inputSim is provided, use it; otherwise run a fresh simulation
    const outputSimResult = runOutputSimulation(settings, inputSim);
    
    // Return the output simulation results
    res.json(formatSuccess({
      outputSim: outputSimResult
    }));
  } catch (error) {
    console.error('Error running output simulation:', error);
    next(error);
  }
};

module.exports = {
  runFullSimulation,
  runInputSimulationOnly,
  runOutputSimulationOnly
};