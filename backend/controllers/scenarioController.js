// backend/controllers/scenarioController.js
const { Scenario } = require('../../schemas/mongoose/scenario');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const defaultsController = require('./defaultsController');
const {
  SuccessResponseSchema,
  ErrorResponseSchema,
  ValidationResponseSchema,
  CrudResponseSchema,
  ListResponseSchema
} = require('../../schemas/yup/response');

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


    let schema = CrudResponseSchema.cast({
      success: true,
      data: { _id, name, description, settings, simulation, createdAt },
      message: 'Scenario created successfully',
      timestamp: new Date()
    });

    // Return the saved scenario
    res.status(201).json(formatSuccess(schema, schema.message, "crud"));

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

    let schema = ListResponseSchema.cast({
      success: true,
      data: {
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        },
        items: scenarioListings,
        count: scenarioListings.length
      },
      message: 'Scenarios retrieved successfully',
      timestamp: new Date()
    });

    res.json(formatSuccess(schema, schema.message, 'list'));

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

    let schema = SuccessResponseSchema.cast({
      success: true,
      data: scenario,
      message: `Retrieved scenario: ${scenario.name} (ID: ${scenario._id})`,
      timestamp: new Date()
    });

    res.json(formatSuccess(scenario, scenario.message, 'default'));

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

    let schema = CrudResponseSchema.cast({
      success: true,
      data: { _id: scenario._id, createdAt: scenario.createdAt, updatedAt: scenario.updatedAt },
      message: `Scenario updated successfully: ${scenario.name} (ID: ${scenario._id})`,
      timestamp: new Date()
    });

    res.json(formatSuccess(schema, schema.message, 'crud'));

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

    let schema = CrudResponseSchema.cast({
      success: true,
      data: { _id: scenario._id, createdAt: scenario.createdAt, updatedAt: scenario.updatedAt },
      message: `Scenario deleted: ${scenario.name} (ID: ${scenario._id})`,
      timestamp: new Date()
    });

    res.json(formatSuccess(schema, schema.message, 'crud'));

  } catch (error) {
    console.error('[ScenarioController] Error deleting scenario:', error);
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