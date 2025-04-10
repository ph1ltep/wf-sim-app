// backend/controllers/failureModelController.js
const { Scenario } = require('../../schemas/mongoose/scenario');
const { formatSuccess, formatError } = require('../utils/responseFormatter');
const { getComponents } = require('./majorComponentController');

/**
 * Create default failure models based on components
 * @param {Array} components - Array of major components
 * @param {number} numWTGs - Number of wind turbines
 * @returns {Array} Array of failure model objects
 */
const createFailureModels = (components, numWTGs = 20) => {
  return components.map(component => ({
    designLife: 20,
    componentCount: component.quantityPerWTG * numWTGs,
    assumedFailureRate: component.defaultFailureRate / 100, // Convert from percentage
    majorComponent: {
      name: component.name,
      description: component.description,
      appliesTo: component.appliesTo,
      quantityPerWTG: component.quantityPerWTG,
      defaultFailureRate: component.defaultFailureRate
    },
    historicalData: {
      type: 'none',
      data: []
    }
  }));
};

/**
 * Get default failure models (for internal use)
 * @param {string} platformType - Platform type ('geared' or 'direct-drive')
 * @param {number} numWTGs - Number of wind turbines
 * @returns {Promise<Array>} Array of failure model objects
 */
const getDefaultFailureModels = async (platformType = 'geared', numWTGs = 20) => {
  // Get components from database
  const components = await getComponents(platformType);
  
  // Create failure models
  return createFailureModels(components, numWTGs);
};

/**
 * Generate default failure models for a scenario
 * @param {Object} req - Express request object with scenarioId
 * @param {Object} res - Express response object
 */
const generateFailureModels = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    // Find the scenario
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found'));
    }
    
    // Get platform type from scenario
    const platformType = scenario.settings?.project?.windFarm?.wtgPlatformType || 'geared';
    const numWTGs = scenario.settings?.project?.windFarm?.numWTGs || 20;
    
    // Generate default failure models
    const defaultFailureModels = await getDefaultFailureModels(platformType, numWTGs);
    
    // Set the failure models in the scenario
    if (!scenario.settings.modules.cost) {
      scenario.settings.modules.cost = {};
    }
    
    scenario.settings.modules.cost.failureModels = defaultFailureModels;
    
    // Save the scenario
    await scenario.save();
    
    res.json(formatSuccess({
      count: defaultFailureModels.length,
      models: defaultFailureModels
    }, 'Failure models generated successfully'));
    
  } catch (error) {
    console.error('Error generating failure models:', error);
    res.status(500).json(formatError('Failed to generate failure models: ' + error.message));
  }
};

/**
 * Get failure models for a specific scenario
 * @param {Object} req - Express request object with scenarioId
 * @param {Object} res - Express response object
 */
const getFailureModels = async (req, res) => {
  try {
    const { scenarioId } = req.params;
    
    // Find the scenario
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found'));
    }
    
    // Get failure models
    const failureModels = scenario.settings?.modules?.cost?.failureModels || [];
    
    res.json(formatSuccess(failureModels));
    
  } catch (error) {
    console.error('Error fetching failure models:', error);
    res.status(500).json(formatError('Failed to fetch failure models'));
  }
};

/**
 * Update a specific failure model in a scenario
 * @param {Object} req - Express request object with scenarioId and modelIndex
 * @param {Object} res - Express response object
 */
const updateFailureModel = async (req, res) => {
  try {
    const { scenarioId, modelIndex } = req.params;
    const updatedModel = req.body;
    
    // Find the scenario
    const scenario = await Scenario.findById(scenarioId);
    if (!scenario) {
      return res.status(404).json(formatError('Scenario not found'));
    }
    
    // Check if failure models exist
    if (!scenario.settings?.modules?.cost?.failureModels || 
        !Array.isArray(scenario.settings.modules.cost.failureModels) ||
        !scenario.settings.modules.cost.failureModels[modelIndex]) {
      return res.status(404).json(formatError('Failure model not found'));
    }
    
    // Update the specific model
    scenario.settings.modules.cost.failureModels[modelIndex] = {
      ...scenario.settings.modules.cost.failureModels[modelIndex],
      ...updatedModel
    };
    
    // Save the scenario
    await scenario.save();
    
    res.json(formatSuccess(scenario.settings.modules.cost.failureModels[modelIndex], 'Failure model updated successfully'));
    
  } catch (error) {
    console.error('Error updating failure model:', error);
    res.status(500).json(formatError('Failed to update failure model'));
  }
};

module.exports = {
  generateFailureModels,
  getFailureModels,
  updateFailureModel,
  getDefaultFailureModels,
  createFailureModels
};