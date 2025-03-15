// backend/controllers/simulationController.js
const { 
  runSimulation,
  createSimulationEngine
} = require('../services/monte-carlo');

const CostModule = require('../services/modules/costModule');
const RevenueModule = require('../services/modules/revenueModule');
const FinancingModule = require('../services/modules/financingModule');
const RiskModule = require('../services/modules/riskModule');
const { generateResponsibilityMatrix } = require('../services/oemResponsibilityMatrix');
const OEMContract = require('../models/OEMContract');
const { getDefaults } = require('../controllers/defaultsController'); // Import getDefaults

// Run a full simulation
const runFullSimulation = async (req, res, next) => {
  try {
    const parameters = req.body;
    
    // Validate required parameters
    if (!parameters.general || !parameters.financing || !parameters.cost || !parameters.revenue) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    // Fetch OEM contracts if any are referenced
    let oemResponsibilityMatrix = null;
    if (parameters.cost && parameters.cost.oemContractId) {
      // Fetch the contract and any related contracts
      const oemContracts = await OEMContract.find({
        _id: parameters.cost.oemContractId
      }).populate('oemScope');
      
      // Generate responsibility matrix
      if (oemContracts.length > 0) {
        oemResponsibilityMatrix = generateResponsibilityMatrix(
          parameters.general.projectLife || 20,
          parameters.general.numWTGs || 20,
          oemContracts
        );
        
        // Add to parameters for simulation
        parameters.oemResponsibilityMatrix = oemResponsibilityMatrix;
      }
    }
    
    // Run the simulation
    const results = runSimulation(parameters);
    
    // Add responsibility matrix to results if available
    if (oemResponsibilityMatrix) {
      results.oemResponsibilityMatrix = oemResponsibilityMatrix;
    }
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the cost module
const runCostModule = async (req, res, next) => {
  try {
    const parameters = req.body;
    
    // Validate parameters
    if (!parameters.cost || !parameters.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required cost parameters' 
      });
    }
    
    // Create cost module and run
    const costModule = new CostModule();
    const results = costModule.runStandalone(parameters);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the revenue module
const runRevenueModule = async (req, res, next) => {
  try {
    const parameters = req.body;
    
    // Validate parameters
    if (!parameters.revenue || !parameters.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required revenue parameters' 
      });
    }
    
    // Create revenue module and run
    const revenueModule = new RevenueModule();
    const results = revenueModule.runStandalone(parameters);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the financing module
const runFinancingModule = async (req, res, next) => {
  try {
    const parameters = req.body;
    
    // Validate parameters
    if (!parameters.financing || !parameters.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required financing parameters' 
      });
    }
    
    // Create financing module and run
    const financingModule = new FinancingModule();
    const results = financingModule.runStandalone(parameters);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the risk mitigation module
const runRiskModule = async (req, res, next) => {
  try {
    const parameters = req.body;
    
    // Validate parameters
    if (!parameters.riskMitigation || !parameters.general || !parameters.cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required risk mitigation parameters' 
      });
    }
    
    // Create risk module and run
    const riskModule = new RiskModule();
    const results = riskModule.runStandalone(parameters);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// We removed getDefaultParameters and will use the imported getDefaults instead

module.exports = {
  runFullSimulation,
  runCostModule,
  runRevenueModule,
  runFinancingModule,
  runRiskModule,
  getDefaultParameters: getDefaults // Export the imported function instead
};