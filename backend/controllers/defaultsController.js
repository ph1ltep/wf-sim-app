const { getDefaultFailureModels } = require('./failureModelController');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { ScenarioSchema } = require('../../schemas/yup/scenario');
const { SuccessResponseSchema, ErrorResponseSchema } = require('../../schemas/yup/response');

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

    // Cast to ScenarioSchema for type safety
    const validatedScenario = ScenarioSchema.cast(defaultScenario, { stripUnknown: true });

    // Prepare response
    const response = SuccessResponseSchema.cast({
      success: true,
      data: validatedScenario,
      message: 'Default settings retrieved successfully',
      timestamp: new Date(),
    });

    res.json(formatSuccess(response, response.message, 'default'));
  } catch (error) {
    console.error('Error getting default parameters:', error);
    const errorResponse = ErrorResponseSchema.cast({
      success: false,
      error: 'Failed to retrieve default settings',
      statusCode: 500,
      errors: [error.message],
      timestamp: new Date(),
    });
    res.status(500).json(formatError(errorResponse.error, errorResponse));
  }
};

module.exports = {
  getDefaults,
};