// backend/controllers/scenarioController.js
const { Scenario } = require('../models/Scenario');
const { runSimulation } = require('../services/monte-carlo');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Create a new scenario
const createScenario = async (req, res, next) => {
  try {
    const { name, description, settings } = req.body;
    
    // Create the scenario object with initial data
    const scenario = new Scenario({
      name,
      description,
      settings,
      simulation: {
        inputSim: {},
        outputSim: {}
      }
    });
    
    // Run the simulation if settings are provided
    if (settings) {
      // runSimulation takes a full ScenarioSchema object and returns updated object
      const simulatedScenario = await runSimulation(scenario);
      
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
      
      // Run the simulation with new settings
      const simulatedScenario = await runSimulation(scenario);
      
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