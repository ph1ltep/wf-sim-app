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
    // Extract platform from query, default to 'geared'
    const platformType = req.query.platform || 'geared';

    // Get default failure models
    const failureModels = await getDefaultFailureModels(platformType);

    // Get default scenario from Yup schema
    let defaultScenario = ScenarioSchema.default();

    // Apply platform-specific overrides
    defaultScenario.settings.project.windFarm.wtgPlatformType = platformType;
    defaultScenario.settings.metrics.componentQuantities.gearboxes = platformType === 'geared' ? 20 : 0;
    defaultScenario.settings.modules.cost.failureModels = failureModels;

    // Customize default name and description
    defaultScenario.name = 'New Scenario';
    defaultScenario.description = 'Default configuration scenario';

    // Custom overrides
    defaultScenario.settings.modules.revenue.energyProduction.distribution.parameters.value = defaultScenario.settings.metrics.netAEP





    // Cast to ScenarioSchema for type safety
    const validatedScenario = ScenarioSchema.cast(defaultScenario, { stripUnknown: true });

    res.json(formatSuccess(validatedScenario, 'Default settings retrieved successfully', 'default'));
  } catch (error) {
    res.status(500).json(formatError('Failed to retrieve default settings', 500, [error.message]));
  }
};

module.exports = {
  getDefaults,
};