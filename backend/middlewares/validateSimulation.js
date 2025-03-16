// backend/middlewares/validateSimulation.js
const ValidationService = require('../services/monte-carlo/ValidationService');

/**
 * Middleware to validate simulation requests
 */
function validateSimulation(req, res, next) {
  // Extract settings from request body
  const settings = req.body.settings;
  
  // Validate scenario settings
  const validation = ValidationService.validateScenarioSettings(settings);
  
  if (!validation.isValid) {
    // Return validation errors as response
    return res.status(400).json({
      success: false,
      error: 'Simulation validation failed',
      details: validation.errors,
      validations: validation.validations
    });
  }
  
  // Validation passed, continue to next middleware
  next();
}

module.exports = validateSimulation;