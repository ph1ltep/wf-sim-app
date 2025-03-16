// backend/controllers/scenarioController.js
const { Scenario } = require('../models/Scenario');
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
    
    // Create the scenario object with initial data
    const scenario = new Scenario({
      name,
      description,
      settings,
      simulation: {
        inputSim: {
          scope: {
            responsibilityMatrix
          }
        }
      }
    });
    
    // Run the simulation if settings are provided
    if (settings) {
      // runSimulation now takes a full ScenarioSchema object and returns updated object
      const simulatedScenario = runSimulation(scenario);
      
      // Update our scenario with the simulation results
      scenario.simulation = simulatedScenario.simulation;
    }
    
    // Save to database
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
      
      // Create scope if it doesn't exist
      if (!scenario.simulation) {
        scenario.simulation = {};
      }
      if (!scenario.simulation.inputSim) {
        scenario.simulation.inputSim = {};
      }
      if (!scenario.simulation.inputSim.scope) {
        scenario.simulation.inputSim.scope = {};
      }
      
      // Set responsibility matrix
      scenario.simulation.inputSim.scope.responsibilityMatrix = responsibilityMatrix;
      
      // Run the simulation with new settings
      const simulatedScenario = runSimulation(scenario);
      
      // Update simulation results
      scenario.simulation = simulatedScenario.simulation;
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
    
    // Format for comparison - directly use new schema structure
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

module.exports = {
  createScenario,
  getAllScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario,
  compareScenarios
};