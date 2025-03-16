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
const OEMScope = require('../models/OEMScope');
const OEMContract = require('../models/OEMContract');
const { getDefaults } = require('./defaultsController'); // Import getDefaults

// Run a full simulation
const runFullSimulation = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate required parameters
    if (!settings || !settings.general || !settings.modules || !settings.project) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    // Convert from new structure to old structure for simulation engine
    const simulationParams = convertSettingsToSimulationParams(settings);
    
    // Generate OEM responsibility matrix if there are OEM contracts
    let responsibilityMatrix = null;
    const oemContracts = settings?.modules?.contracts?.oemContracts || [];
    
    if (oemContracts.length > 0) {
      // Get all OEM scope IDs referenced in contracts
      const oemScopeIds = oemContracts.map(contract => contract.oemScopeId).filter(Boolean);
      
      if (oemScopeIds.length > 0) {
        // Fetch all referenced OEM scopes
        const oemScopes = await OEMScope.find({ _id: { $in: oemScopeIds } });
        
        // Create a map of OEM scope IDs to OEM scope objects for quick lookup
        const oemScopeMap = oemScopes.reduce((map, scope) => {
          map[scope._id.toString()] = scope;
          return map;
        }, {});
        
        // Create augmented contracts with scope objects for the matrix generator
        const augmentedContracts = oemContracts.map(contract => {
          const oemScope = oemScopeMap[contract.oemScopeId];
          if (oemScope) {
            return { ...contract, oemScope };
          }
          return null;
        }).filter(Boolean);
        
        if (augmentedContracts.length > 0) {
          // Generate responsibility matrix
          responsibilityMatrix = generateResponsibilityMatrix(
            settings.general.projectLife || 20,
            settings.project.windFarm.numWTGs || 20,
            augmentedContracts
          );
        }
      }
    }
    
    // Run the simulation
    const simResults = runSimulation(simulationParams);
    
    // Return results in the new format
    const results = {
      success: true,
      percentileInfo: settings.simulation.probabilities || simResults.percentileInfo,
      simulation: {
        inputSim: {
          ...simResults.results.intermediateData,
          scope: {
            responsibilityMatrix
          }
        },
        outputSim: mapOutputSim(simResults.results.finalResults, settings.simulation.probabilities)
      }
    };
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the cost module
const runCostModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.cost || !settings.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required cost parameters' 
      });
    }
    
    // Create cost module and run
    const costModule = new CostModule();
    
    // Convert from new structure to old structure
    const simulationParams = {
      general: {
        ...settings.general,
        ...settings.project.windFarm
      },
      cost: settings.modules.cost,
      probabilities: settings.simulation.probabilities
    };
    
    const results = costModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the revenue module
const runRevenueModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.revenue || !settings.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required revenue parameters' 
      });
    }
    
    // Create revenue module and run
    const revenueModule = new RevenueModule();
    
    // Convert from new structure to old structure
    const simulationParams = {
      general: {
        ...settings.general,
        ...settings.project.windFarm
      },
      revenue: settings.modules.revenue,
      probabilities: settings.simulation.probabilities
    };
    
    const results = revenueModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the financing module
const runFinancingModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.financing || !settings.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required financing parameters' 
      });
    }
    
    // Create financing module and run
    const financingModule = new FinancingModule();
    
    // Convert from new structure to old structure
    const simulationParams = {
      general: {
        ...settings.general,
        loanDuration: settings.modules.financing.loanDuration
      },
      financing: settings.modules.financing,
      probabilities: settings.simulation.probabilities
    };
    
    const results = financingModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the risk mitigation module
const runRiskModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.risk || !settings.general || !settings.modules.cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required risk mitigation parameters' 
      });
    }
    
    // Create risk module and run
    const riskModule = new RiskModule();
    
    // Convert from new structure to old structure
    const simulationParams = {
      general: {
        ...settings.general,
        ...settings.project.windFarm
      },
      riskMitigation: settings.modules.risk,
      cost: settings.modules.cost,
      probabilities: settings.simulation.probabilities
    };
    
    const results = riskModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to convert from new settings structure to simulation engine format
 * @param {Object} settings - The new settings structure
 * @returns {Object} The old simulation engine parameter structure
 */
function convertSettingsToSimulationParams(settings) {
  // Extract relevant contracts from the contracts module
  const oemContracts = settings?.modules?.contracts?.oemContracts || [];
  let costModule = { ...settings.modules.cost };
  
  // Find contracts that apply to each year and update cost parameters
  if (oemContracts.length > 0) {
    // Get the most extensive OEM contract (covering the most years)
    const mostExtensiveContract = [...oemContracts].sort((a, b) => b.years.length - a.years.length)[0];
    
    if (mostExtensiveContract) {
      // Find the maximum year
      const maxYear = Math.max(...mostExtensiveContract.years);
      
      // Update OEM term and fixed fee
      costModule.oemTerm = maxYear;
      costModule.fixedOMFee = mostExtensiveContract.isPerTurbine ? 
        mostExtensiveContract.fixedFee * settings.project.windFarm.numWTGs : 
        mostExtensiveContract.fixedFee;
    }
  }
  
  // Convert cost and revenue adjustments to annual adjustments
  const annualAdjustments = [];
  const projectLife = settings.general.projectLife || 20;
  
  // Initialize annual adjustments array
  for (let year = 1; year <= projectLife; year++) {
    annualAdjustments.push({
      year,
      additionalOM: 0,
      additionalRevenue: 0
    });
  }
  
  // Process cost adjustments
  if (settings.modules.cost.adjustments && settings.modules.cost.adjustments.length > 0) {
    settings.modules.cost.adjustments.forEach(adjustment => {
      adjustment.years.forEach(year => {
        if (year >= 1 && year <= projectLife) {
          annualAdjustments[year - 1].additionalOM += adjustment.amount;
        }
      });
    });
  }
  
  // Process revenue adjustments
  if (settings.modules.revenue.adjustments && settings.modules.revenue.adjustments.length > 0) {
    settings.modules.revenue.adjustments.forEach(adjustment => {
      adjustment.years.forEach(year => {
        if (year >= 1 && year <= projectLife) {
          annualAdjustments[year - 1].additionalRevenue += adjustment.amount;
        }
      });
    });
  }
  
  return {
    general: {
      ...settings.general,
      ...settings.project.windFarm,
      loanDuration: settings.modules.financing.loanDuration
    },
    financing: {
      ...settings.modules.financing
    },
    cost: costModule,
    revenue: settings.modules.revenue,
    riskMitigation: settings.modules.risk,
    simulation: settings.simulation,
    probabilities: settings.simulation.probabilities,
    annualAdjustments: annualAdjustments,
    scenario: {
      name: settings.general.projectName,
      description: '',
      scenarioType: 'base',
      currency: settings.project.currency.local,
      foreignCurrency: settings.project.currency.foreign,
      exchangeRate: settings.project.currency.exchangeRate,
      location: settings.project.location
    }
  };
}

/**
 * Maps the old-style simulation results to the new outputSim structure
 * @param {Object} finalResults - The old-style finalResults 
 * @param {Object} probabilities - The probability settings
 * @returns {Object} The new outputSim structure
 */
function mapOutputSim(finalResults, probabilities) {
  // Define percentile mapping
  const percentileMapping = {
    P10: `Pextreme_lower`,
    P25: `Plower_bound`,
    P50: `Pprimary`,
    P75: `Pupper_bound`,
    P90: `Pextreme_upper`
  };
  
  // Map custom percentiles if defined
  if (probabilities) {
    percentileMapping[`P${probabilities.extremeLower}`] = 'Pextreme_lower';
    percentileMapping[`P${probabilities.lowerBound}`] = 'Plower_bound';
    percentileMapping[`P${probabilities.primary}`] = 'Pprimary';
    percentileMapping[`P${probabilities.upperBound}`] = 'Pupper_bound';
    percentileMapping[`P${probabilities.extremeUpper}`] = 'Pextreme_upper';
  }
  
  const outputSim = {};
  
  // Process each result category (IRR, NPV, etc.)
  Object.keys(finalResults).forEach(category => {
    if (category === 'probabilityOfDSCRBelow1') return; // Skip this field as it's being removed
    
    outputSim[category] = {};
    
    // Process each percentile within the category
    Object.keys(finalResults[category]).forEach(oldPercentile => {
      const newPercentile = percentileMapping[oldPercentile] || oldPercentile;
      outputSim[category][newPercentile] = finalResults[category][oldPercentile];
    });
  });
  
  return outputSim;
}

module.exports = {
  runFullSimulation,
  runCostModule,
  runRevenueModule,
  runFinancingModule,
  runRiskModule,
  getDefaultParameters: getDefaults // Export the imported function
};