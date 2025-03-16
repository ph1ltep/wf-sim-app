// backend/middlewares/validateScenario.js
const { formatError } = require('../utils/responseFormatter');
const {
  validateGeneralSettings,
  validateWindFarmSettings,
  validateCurrencySettings,
  validateFinancingSettings,
  validateCostSettings,
  validateRevenueSettings,
  validateRiskSettings,
  validateContractSettings,
  validateSimulationSettings,
  validateMetricsSettings
} = require('../utils/validators');

/**
 * Validates scenario data from request body
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateScenario = (req, res, next) => {
  const { name, settings } = req.body;
  
  // Validate required fields
  if (!name) {
    return res.status(400).json(formatError('Scenario name is required'));
  }
  
  // If no settings, pass validation
  if (!settings) {
    return next();
  }
  
  // Validate top-level settings structure
  const validationErrors = [];
  
  // Validate general settings
  if (settings.general) {
    const generalResult = validateGeneralSettings(settings.general);
    if (!generalResult.isValid) {
      validationErrors.push(...generalResult.errors.map(error => `General settings: ${error}`));
    }
  } else {
    validationErrors.push('General settings are required');
  }
  
  // Validate project settings
  if (settings.project) {
    // Validate windFarm settings
    if (settings.project.windFarm) {
      const windFarmResult = validateWindFarmSettings(settings.project.windFarm);
      if (!windFarmResult.isValid) {
        validationErrors.push(...windFarmResult.errors.map(error => `Wind farm settings: ${error}`));
      }
    } else {
      validationErrors.push('Wind farm settings are required');
    }
    
    // Validate currency settings
    if (settings.project.currency) {
      const currencyResult = validateCurrencySettings(settings.project.currency);
      if (!currencyResult.isValid) {
        validationErrors.push(...currencyResult.errors.map(error => `Currency settings: ${error}`));
      }
    } else {
      validationErrors.push('Currency settings are required');
    }
  } else {
    validationErrors.push('Project settings are required');
  }
  
  // Validate modules settings
  if (settings.modules) {
    // Validate financing module
    if (settings.modules.financing) {
      const financingResult = validateFinancingSettings(settings.modules.financing);
      if (!financingResult.isValid) {
        validationErrors.push(...financingResult.errors.map(error => `Financing module: ${error}`));
      }
    } else {
      validationErrors.push('Financing module settings are required');
    }
    
    // Validate cost module
    if (settings.modules.cost) {
      const costResult = validateCostSettings(settings.modules.cost);
      if (!costResult.isValid) {
        validationErrors.push(...costResult.errors.map(error => `Cost module: ${error}`));
      }
    } else {
      validationErrors.push('Cost module settings are required');
    }
    
    // Validate revenue module
    if (settings.modules.revenue) {
      const revenueResult = validateRevenueSettings(settings.modules.revenue);
      if (!revenueResult.isValid) {
        validationErrors.push(...revenueResult.errors.map(error => `Revenue module: ${error}`));
      }
    } else {
      validationErrors.push('Revenue module settings are required');
    }
    
    // Validate risk module
    if (settings.modules.risk) {
      const riskResult = validateRiskSettings(settings.modules.risk);
      if (!riskResult.isValid) {
        validationErrors.push(...riskResult.errors.map(error => `Risk module: ${error}`));
      }
    } else {
      validationErrors.push('Risk module settings are required');
    }
    
    // Validate contracts module
    if (settings.modules.contracts) {
      const contractResult = validateContractSettings(settings.modules.contracts);
      if (!contractResult.isValid) {
        validationErrors.push(...contractResult.errors.map(error => `Contracts module: ${error}`));
      }
    }
  } else {
    validationErrors.push('Module settings are required');
  }
  
  // Validate simulation settings
  if (settings.simulation) {
    const simulationResult = validateSimulationSettings(settings.simulation);
    if (!simulationResult.isValid) {
      validationErrors.push(...simulationResult.errors.map(error => `Simulation settings: ${error}`));
    }
  } else {
    validationErrors.push('Simulation settings are required');
  }
  
  // Validate metrics settings (optional)
  if (settings.metrics) {
    const metricsResult = validateMetricsSettings(settings.metrics);
    if (!metricsResult.isValid) {
      validationErrors.push(...metricsResult.errors.map(error => `Metrics settings: ${error}`));
    }
  }
  
  // If there are validation errors, return them
  if (validationErrors.length > 0) {
    return res.status(400).json(formatError(validationErrors));
  }
  
  // If validation passes, proceed to the next middleware/controller
  next();
};

module.exports = validateScenario;