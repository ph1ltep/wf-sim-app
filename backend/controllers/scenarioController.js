const { Scenario } = require('../../schemas/mongoose/scenario');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const defaultsController = require('./defaultsController');

// Create a new scenario
const createScenario = async (req, res) => {
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

    const data = {
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      settings: scenario.settings,
      simulation: scenario.simulation,
      createdAt: scenario.createdAt
    };
    res.status(201).json(formatSuccess(data, 'Scenario created successfully', 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to create scenario', 500, [error.message]));
  }
};

// Get all scenarios with lightweight schema for listing
const listScenarios = async (req, res) => {
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

    //Get scenarios with essential fields for listing
    const scenarios = await Scenario.find(filter)
      .select('_id name description createdAt updatedAt settings.general settings.project.windFarm settings.metrics')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform scenarios to match the ScenarioListingSchema
    const scenarioListings = scenarios.map(scenario => ({
      _id: scenario._id,
      name: scenario.name,
      description: scenario.description,
      createdAt: scenario.createdAt,
      updatedAt: scenario.updatedAt,
      details: {
        projectName: scenario.settings?.general?.projectName || '',
        totalMW: scenario.settings?.metrics?.totalMW || 0,
        windFarmSize: scenario.settings?.project?.windFarm?.numWTGs || 0,
        projectLife: scenario.settings?.general?.projectLife || 0,
        numWTGs: scenario.settings?.project?.windFarm?.numWTGs || 0,
        mwPerWTG: scenario.settings?.project?.windFarm?.mwPerWTG || 0,
        capacityFactor: scenario.settings?.project?.windFarm?.capacityFactor || 0,
        currency: scenario.settings?.general?.currency || 'USD',
        startDate: scenario.settings?.general?.startDate || null,
        netAEP: scenario.settings?.metrics?.netAEP || 0
      }
    }));

    const data = {
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      items: scenarioListings,
      count: scenarioListings.length
    };
    res.json(formatSuccess(data, 'Scenarios retrieved successfully', 'list'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch scenarios', 500, [error.message]));
  }
};

// Get a single scenario by ID
const getScenarioById = async (req, res) => {
  try {
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found', 404, []));
    }
    res.json(formatSuccess(scenario, `Retrieved scenario: ${scenario.name} (ID: ${scenario._id})`, 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to fetch scenario', 500, [error.message]));
  }
};

// Update a scenario
const updateScenario = async (req, res) => {
  try {
    // Find the scenario
    const scenario = await Scenario.findById(req.params.id);
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found', 404, []));
    }

    // Update the scenario with the validated req.body
    scenario.set(req.body);

    // Save changes
    await scenario.save();

    const data = { _id: scenario._id, createdAt: scenario.createdAt, updatedAt: scenario.updatedAt };
    res.json(formatSuccess(data, `Scenario updated successfully: ${scenario.name} (ID: ${scenario._id})`, 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to update scenario', 500, [error.message]));
  }
};

// Delete a scenario
const deleteScenario = async (req, res) => {
  try {
    const scenario = await Scenario.findByIdAndDelete(req.params.id);
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found', 404, []));
    }
    const data = { _id: scenario._id, createdAt: scenario.createdAt, updatedAt: scenario.updatedAt };
    res.json(formatSuccess(data, `Scenario deleted: ${scenario.name} (ID: ${scenario._id})`, 'crud'));
  } catch (error) {
    res.status(500).json(formatError('Failed to delete scenario', 500, [error.message]));
  }
};

module.exports = {
  createScenario,
  listScenarios,
  getScenarioById,
  updateScenario,
  deleteScenario
};