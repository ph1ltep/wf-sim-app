// backend/controllers/defaultsController.js
const { getDefaultFailureModels } = require('./failureModelController');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { ScenarioSchema } = require('../../schemas/yup/scenario');

/**
 * Get default parameter values for simulation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDefaults = async (req, res) => {
  try {
    // Get platform type from query parameter (default to 'geared')
    const platformType = req.query.platform || 'geared';

    // Get default failure models (these need to come from the DB)
    const failureModels = await getDefaultFailureModels(platformType);

    // Get complete default scenario from Yup schema
    let defaultScenario = ScenarioSchema.default();

    // Convert to plain object in case it has getters/setters
    defaultScenario = JSON.parse(JSON.stringify(defaultScenario));

    // Apply platform-specific overrides
    defaultScenario.settings.project.windFarm.wtgPlatformType = platformType;
    defaultScenario.settings.metrics.componentQuantities.gearboxes = platformType === 'geared' ? 20 : 0;
    defaultScenario.settings.modules.cost.failureModels = failureModels;

    // Customize default name and description
    defaultScenario.name = 'New Scenario';
    defaultScenario.description = 'Default configuration scenario';

    let schema = SuccessResponseSchema.cast({
      success: true,
      data: defaultScenario,
      message: 'Default settings retrieved successfully',
      timestamp: new Date()
    });

    res.json(formatSuccess(schema, schema.message, 'default'));
  } catch (error) {
    console.error('Error getting default parameters:', error);
    res.status(500).json(formatError(error.message));
  }
};

module.exports = {
  getDefaults
};