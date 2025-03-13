// backend/controllers/scenarioController.js
const Simulation = require('../models/Simulation');
const { runSimulation } = require('../services/monte-carlo');

// Create a new simulation scenario
const createScenario = async (req, res, next) => {
  try {
    const { name, description, parameters } = req.body;
    
    // Validate required fields
    if (!name || !parameters) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and parameters are required' 
      });
    }
    
    // Run the simulation
    const simulationResults = runSimulation(parameters);
    
    // Create and save the scenario
    const scenario = new Simulation({
      name,
      description,
      parameters,
      projectMetrics: parameters.projectMetrics || {},
      results: simulationResults.results,
      annualAdjustments: parameters.annualAdjustments || []
    });
    
    await scenario.save();
    
    res.status(201).json({ 
      success: true, 
      scenario: {
        _id: scenario._id,
        name: scenario.name,
        description: scenario.description,
        createdAt: scenario.createdAt
      } 
    });
  } catch (error) {
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
    const total = await Simulation.countDocuments();
    
    // Get scenarios with limited fields
    const scenarios = await Simulation.find()
      .select('name description createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    res.json({ 
      success: true, 
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      scenarios 
    });
  } catch (error) {
    next(error);
  }
};

// Get a single scenario by ID
const getScenarioById = async (req, res, next) => {
  try {
    const scenario = await Simulation.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scenario not found' 
      });
    }
    
    res.json({ success: true, scenario });
  } catch (error) {
    next(error);
  }
};

// Update a scenario
const updateScenario = async (req, res, next) => {
  try {
    const { name, description, parameters } = req.body;
    
    // Find the scenario
    const scenario = await Simulation.findById(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scenario not found' 
      });
    }
    
    // Update basic fields
    if (name) scenario.name = name;
    if (description) scenario.description = description;
    
    // If parameters changed, re-run simulation
    if (parameters) {
      scenario.parameters = parameters;
      scenario.annualAdjustments = parameters.annualAdjustments || [];
      
      // Run the simulation with new parameters
      const simulationResults = runSimulation(parameters);
      scenario.results = simulationResults.results;
    }
    
    // Save changes
    await scenario.save();
    
    res.json({ 
      success: true, 
      scenario: {
        _id: scenario._id,
        name: scenario.name,
        description: scenario.description,
        updatedAt: scenario.updatedAt
      } 
    });
  } catch (error) {
    next(error);
  }
};

// Delete a scenario
const deleteScenario = async (req, res, next) => {
  try {
    const scenario = await Simulation.findByIdAndDelete(req.params.id);
    
    if (!scenario) {
      return res.status(404).json({ 
        success: false, 
        error: 'Scenario not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Scenario deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
};

// Compare multiple scenarios
const compareScenarios = async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least two scenario IDs are required for comparison' 
      });
    }
    
    // Get scenarios with selected fields
    const scenarios = await Simulation.find({ _id: { $in: ids } })
      .select('name results');
    
    if (scenarios.length !== ids.length) {
      return res.status(404).json({ 
        success: false, 
        error: 'One or more scenarios not found' 
      });
    }
    
    // Format for comparison
    const comparison = scenarios.map(scenario => ({
      id: scenario._id,
      name: scenario.name,
      IRR: scenario.results.finalResults.IRR,
      NPV: scenario.results.finalResults.NPV,
      paybackPeriod: scenario.results.finalResults.paybackPeriod,
      minDSCR: scenario.results.finalResults.minDSCR
    }));
    
    res.json({ 
      success: true, 
      comparison 
    });
  } catch (error) {
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