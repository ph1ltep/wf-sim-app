// backend/controllers/scenarioController.js
const Scenario = require('../models/Scenario');
const OEMScope = require('../models/OEMScope');
const { runSimulation } = require('../services/monte-carlo');
const { generateResponsibilityMatrix } = require('../services/oemResponsibilityMatrix');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Create a new scenario
const createScenario = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json(formatError('Name is required'));
    }
    
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
    
    // Run the simulation if settings are provided
    let simulationResults = null;
    if (settings) {
      // Convert from new structure to old structure for simulation engine
      const simulationParams = convertSettingsToSimulationParams(settings);
      simulationResults = runSimulation(simulationParams);
    }
    
    // Create the scenario object
    const scenario = new Scenario({
      name,
      description,
      settings,
      simulation: simulationResults ? {
        inputSim: {
          ...simulationResults.results.intermediateData,
          scope: {
            responsibilityMatrix
          }
        },
        outputSim: mapOutputSim(simulationResults.results.finalResults, settings.simulation.probabilities)
      } : {
        inputSim: {
          scope: {
            responsibilityMatrix
          }
        }
      }
    });
    
    await scenario.save();
    
    res.status(201).json(formatSuccess({
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      createdAt: scenario.createdAt
    }, 'Scenario created successfully'));
  } catch (error) {
    console.error('Error creating scenario:', error);
    next(error);
  }
};

// Get all scenarios
const getAllScenarios = async (req, res, next) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Scenario.countDocuments();
    
    // Get scenarios with limited fields
    const scenarios = await Scenario.find()
      .select('name description createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json(formatSuccess({
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      scenarios
    }));
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    next(error);
  }
};

// Get a single scenario by ID
const getScenarioById = async (req, res, next) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found'));
    }
    
    // If the scenario has OEM contracts but no responsibility matrix, generate it
    const oemContracts = scenario.settings?.modules?.contracts?.oemContracts || [];
    
    if (oemContracts.length > 0 && !scenario.simulation?.inputSim?.scope?.responsibilityMatrix) {
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
          const matrix = generateResponsibilityMatrix(
            scenario.settings.general.projectLife || 20,
            scenario.settings.project.windFarm.numWTGs || 20,
            augmentedContracts
          );
          
          // Make sure the inputSim and scope properties exist
          if (!scenario.simulation) {
            scenario.simulation = {};
          }
          if (!scenario.simulation.inputSim) {
            scenario.simulation.inputSim = {};
          }
          if (!scenario.simulation.inputSim.scope) {
            scenario.simulation.inputSim.scope = {};
          }
          
          // Update scenario with new matrix
          scenario.simulation.inputSim.scope.responsibilityMatrix = matrix;
          
          // Save the updated scenario
          await scenario.save();
        }
      }
    }
    
    res.json(formatSuccess(scenario));
  } catch (error) {
    console.error('Error fetching scenario:', error);
    next(error);
  }
};

// Update a scenario
const updateScenario = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;
    
    // Find the scenario
    const scenario = await Scenario.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found'));
    }
    
    // Update basic fields
    if (name) scenario.name = name;
    if (description) scenario.description = description;
    
    // If settings changed, re-run simulation
    if (settings) {
      scenario.settings = settings;
      
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
      
      // Run the simulation with new settings
      const simulationParams = convertSettingsToSimulationParams(settings);
      const simulationResults = runSimulation(simulationParams);
      
      // Update simulation results
      scenario.simulation = {
        inputSim: {
          ...simulationResults.results.intermediateData,
          scope: {
            responsibilityMatrix
          }
        },
        outputSim: mapOutputSim(simulationResults.results.finalResults, settings.simulation.probabilities)
      };
    }
    
    // Save changes
    await scenario.save();
    
    res.json(formatSuccess({
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      updatedAt: scenario.updatedAt
    }, 'Scenario updated successfully'));
  } catch (error) {
    console.error('Error updating scenario:', error);
    next(error);
  }
};

// Delete a scenario
const deleteScenario = async (req, res, next) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found'));
    }
    
    res.json(formatSuccess(null, 'Scenario deleted successfully'));
  } catch (error) {
    console.error('Error deleting scenario:', error);
    next(error);
  }
};

// Compare multiple scenarios
const compareScenarios = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json(formatError('At least two scenario IDs are required for comparison'));
    }
    
    // Get scenarios with selected fields
    const scenarios = await Scenario.find({ _id: { $in: ids } })
      .select('name simulation');
    
    if (scenarios.length !== ids.length) {
      return res.status(404).json(formatError('One or more scenarios not found'));
    }
    
    // Format for comparison
    const comparison = scenarios.map(scenario => ({
      id: scenario._id,
      name: scenario.name,
      IRR: scenario.simulation.outputSim.IRR,
      NPV: scenario.simulation.outputSim.NPV,
      paybackPeriod: scenario.simulation.outputSim.paybackPeriod,
      minDSCR: scenario.simulation.outputSim.minDSCR
    }));
    
    res.json(formatSuccess(comparison));
  } catch (error) {
    console.error('Error comparing scenarios:', error);
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
  createScenario,
  getAllScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
  compareScenarios
};