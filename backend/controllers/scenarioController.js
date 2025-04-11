// backend/controllers/scenarioController.js
const { Scenario } = require('../../schemas/mongoose/scenario');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const defaultsController = require('./defaultsController');

// Create a new scenario
const createScenario = async (req, res, next) => {
  try {
    // Check if a complete scenario object is provided
    const isCompleteScenario = req.body.settings && req.body.simulation;
    let scenario;

    if (isCompleteScenario) {
      // If a complete scenario object is provided, use it directly
      const { name = 'New Scenario', description = '', settings, simulation = {} } = req.body;

      // Create a scenario from the provided data
      scenario = new Scenario({
        name,
        description,
        settings,
        simulation
      });
    } else {
      // Use the original flow for creating a default scenario
      const { name = 'New Scenario', description = '' } = req.body;

      // Get default settings from defaultsController
      const defaults = await defaultsController.getDefaultSettings();

      // Create a scenario object with initial data
      scenario = new Scenario({
        name,
        description,
        settings: defaults,
        simulation: {
          inputSim: {},
          outputSim: {}
        }
      });

      // If client provided partial settings, override the defaults
      if (req.body.settings) {
        scenario.settings = {
          ...defaults,
          ...req.body.settings
        };
      }
    }

    // Save the scenario to the database
    await scenario.save();

    console.log(`[ScenarioController] Created new scenario: ${scenario.name} (ID: ${scenario._id})`);

    // Return the saved scenario
    res.status(201).json(formatSuccess({
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      settings: scenario.settings,
      simulation: scenario.simulation,
      createdAt: scenario.createdAt
    }, 'Scenario created successfully'));

  } catch (error) {
    console.error('[ScenarioController] Error creating scenario:', error);
    next(error);
  }
};

// Get all scenarios with lightweight schema for listing
const getAllScenarios = async (req, res, next) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    // Get search parameter for filtering
    const search = req.query.search || '';

    // Build filter object
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count with filter
    const total = await Scenario.countDocuments(filter);

    // Get scenarios with essential fields for listing
    const scenarios = await Scenario.find(filter)
      .select('_id name description createdAt updatedAt settings.general.projectLife settings.project.windFarm.numWTGs settings.metrics.totalMW')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`[ScenarioController] Fetched ${scenarios.length} scenarios (Total: ${total}, Page: ${page}, Search: ${search || 'None'})`);

    // Transform scenarios to match the ScenarioListingSchema
    const scenarioListings = scenarios.map(scenario => ({
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
      metrics: {
        totalMW: scenario.settings?.metrics?.totalMW || 0,
        windFarmSize: scenario.settings?.project?.windFarm?.numWTGs || 0,
        projectLife: scenario.settings?.general?.projectLife || 0
      }
    }));

    res.json(formatSuccess({
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      scenarios: scenarioListings
    }));
  } catch (error) {
    console.error('[ScenarioController] Error fetching scenarios:', error);
    next(error);
  }
};

// Get a single scenario by ID
const getScenarioById = async (req, res, next) => {
  try {
    const scenario = await Scenario.findById(req.params.id);

    if (!scenario) {
      console.log(`[ScenarioController] Scenario not found with ID: ${req.params.id}`);
      return res.status(404).json(formatError('Scenario not found'));
    }

    console.log(`[ScenarioController] Retrieved scenario: ${scenario.name} (ID: ${scenario._id})`);
    res.json(formatSuccess(scenario));
  } catch (error) {
    console.error('[ScenarioController] Error fetching scenario:', error);
    next(error);
  }
};

// Update a scenario
const updateScenario = async (req, res, next) => {
  try {
    // Find the scenario
    const scenario = await Scenario.findById(req.params.id);

    if (!scenario) {
      console.log(`[ScenarioController] Scenario not found for update: ${req.params.id}`);
      return res.status(404).json(formatError('Scenario not found'));
    }

    // Update the scenario with the validated req.body
    scenario.set(req.body);

    // Save changes
    await scenario.save();

    console.log(`[ScenarioController] Updated scenario: ${scenario.name} (ID: ${scenario._id})`);

    res.json(formatSuccess({
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      updatedAt: scenario.updatedAt
    }, 'Scenario updated successfully'));
  } catch (error) {
    console.error('[ScenarioController] Error updating scenario:', error);
    next(error);
  }
};

// Delete a scenario
const deleteScenario = async (req, res, next) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);

    if (!scenario) {
      console.log(`[ScenarioController] Scenario not found for deletion: ${req.params.id}`);
      return res.status(404).json(formatError('Scenario not found'));
    }

    console.log(`[ScenarioController] Deleted scenario: ${scenario.name} (ID: ${scenario._id})`);

    res.json(formatSuccess(null, 'Scenario deleted successfully'));
  } catch (error) {
    console.error('[ScenarioController] Error deleting scenario:', error);
    next(error);
  }
};

// Compare multiple scenarios
const compareScenarios = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      console.log('[ScenarioController] Invalid scenarios comparison request');
      return res.status(400).json(formatError('At least two scenario IDs are required for comparison'));
    }

    // Get scenarios with selected fields
    const scenarios = await Scenario.find({ _id: { $in: ids } })
      .select('name simulation');

    console.log(`[ScenarioController] Comparing ${scenarios.length} scenarios`);

    if (scenarios.length !== ids.length) {
      console.log(`[ScenarioController] Some scenarios not found. Requested: ${ids.length}, Found: ${scenarios.length}`);
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
    console.error('[ScenarioController] Error comparing scenarios:', error);
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