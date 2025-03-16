// backend/utils/validators.js
/**
 * Validate general settings
 * @param {Object} generalSettings - General settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateGeneralSettings = (generalSettings) => {
  const errors = [];
  
  if (!generalSettings) {
    return { isValid: false, errors: ['General settings are required'] };
  }
  
  if (!generalSettings.projectLife || generalSettings.projectLife < 1) {
    errors.push('Project life must be a positive number');
  }
  
  // Any other general setting validations can be added here
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate project windFarm settings
 * @param {Object} windFarmSettings - WindFarm settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateWindFarmSettings = (windFarmSettings) => {
  const errors = [];
  
  if (!windFarmSettings) {
    return { isValid: false, errors: ['Wind farm settings are required'] };
  }
  
  if (!windFarmSettings.numWTGs || windFarmSettings.numWTGs < 1) {
    errors.push('Number of wind turbines must be a positive number');
  }
  
  if (!windFarmSettings.mwPerWTG || windFarmSettings.mwPerWTG <= 0) {
    errors.push('Megawatts per turbine must be a positive number');
  }

  if (windFarmSettings.capacityFactor < 0 || windFarmSettings.capacityFactor > 100) {
    errors.push('Capacity factor must be between 0 and 100 percent');
  }
  
  if (windFarmSettings.curtailmentLosses < 0 || windFarmSettings.curtailmentLosses > 100) {
    errors.push('Curtailment losses must be between 0 and 100 percent');
  }
  
  if (windFarmSettings.electricalLosses < 0 || windFarmSettings.electricalLosses > 100) {
    errors.push('Electrical losses must be between 0 and 100 percent');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate currency settings
 * @param {Object} currencySettings - Currency settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateCurrencySettings = (currencySettings) => {
  const errors = [];
  
  if (!currencySettings) {
    return { isValid: false, errors: ['Currency settings are required'] };
  }
  
  if (!currencySettings.local) {
    errors.push('Local currency is required');
  }
  
  if (!currencySettings.foreign) {
    errors.push('Foreign currency is required');
  }
  
  if (!currencySettings.exchangeRate || currencySettings.exchangeRate <= 0) {
    errors.push('Exchange rate must be a positive number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate financing module settings
 * @param {Object} financingSettings - Financing settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateFinancingSettings = (financingSettings) => {
  const errors = [];
  
  if (!financingSettings) {
    return { isValid: false, errors: ['Financing settings are required'] };
  }
  
  if (!financingSettings.capex || financingSettings.capex <= 0) {
    errors.push('CAPEX must be a positive number');
  }
  
  if (financingSettings.devex < 0) {
    errors.push('DEVEX cannot be negative');
  }
  
  if (!financingSettings.model) {
    errors.push('Financing model is required');
  } else if (!['Balance-Sheet', 'Project-Finance'].includes(financingSettings.model)) {
    errors.push('Financing model must be either "Balance-Sheet" or "Project-Finance"');
  }
  
  if (financingSettings.model === 'Balance-Sheet') {
    if (!financingSettings.debtToEquityRatio || financingSettings.debtToEquityRatio < 0) {
      errors.push('Debt-to-Equity ratio must be a non-negative number for Balance-Sheet model');
    }
    
    if (!financingSettings.loanInterestRateBS || financingSettings.loanInterestRateBS < 0) {
      errors.push('Loan interest rate (BS) must be a non-negative number');
    }
  } else if (financingSettings.model === 'Project-Finance') {
    if (!financingSettings.debtToCapexRatio || financingSettings.debtToCapexRatio < 0 || financingSettings.debtToCapexRatio > 1) {
      errors.push('Debt-to-CAPEX ratio must be between 0 and 1 for Project-Finance model');
    }
    
    if (!financingSettings.loanInterestRatePF || financingSettings.loanInterestRatePF < 0) {
      errors.push('Loan interest rate (PF) must be a non-negative number');
    }
  }
  
  if (!financingSettings.loanDuration || financingSettings.loanDuration < 1) {
    errors.push('Loan duration must be a positive number');
  }
  
  if (financingSettings.minimumDSCR < 1) {
    errors.push('Minimum DSCR should be at least 1.0');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate cost module settings
 * @param {Object} costSettings - Cost settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateCostSettings = (costSettings) => {
  const errors = [];
  
  if (!costSettings) {
    return { isValid: false, errors: ['Cost settings are required'] };
  }
  
  if (!costSettings.annualBaseOM || costSettings.annualBaseOM < 0) {
    errors.push('Annual base O&M must be a non-negative number');
  }
  
  if (costSettings.escalationRate < 0) {
    errors.push('Escalation rate cannot be negative');
  }
  
  if (costSettings.oemTerm < 0) {
    errors.push('OEM term cannot be negative');
  }
  
  if (costSettings.fixedOMFee < 0) {
    errors.push('Fixed O&M fee cannot be negative');
  }
  
  if (costSettings.failureEventProbability < 0 || costSettings.failureEventProbability > 100) {
    errors.push('Failure event probability must be between 0 and 100');
  }
  
  if (costSettings.failureEventCost < 0) {
    errors.push('Failure event cost cannot be negative');
  }
  
  // Validate adjustments if present
  if (costSettings.adjustments && Array.isArray(costSettings.adjustments)) {
    costSettings.adjustments.forEach((adjustment, index) => {
      if (!adjustment.years || !Array.isArray(adjustment.years) || adjustment.years.length === 0) {
        errors.push(`Adjustment #${index+1}: Years array must not be empty`);
      }
      
      if (adjustment.amount === undefined) {
        errors.push(`Adjustment #${index+1}: Amount is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate revenue module settings
 * @param {Object} revenueSettings - Revenue settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateRevenueSettings = (revenueSettings) => {
  const errors = [];
  
  if (!revenueSettings) {
    return { isValid: false, errors: ['Revenue settings are required'] };
  }
  
  // Validate energy production
  if (!revenueSettings.energyProduction) {
    errors.push('Energy production parameters are required');
  } else {
    const { energyProduction } = revenueSettings;
    
    if (!energyProduction.mean || energyProduction.mean <= 0) {
      errors.push('Energy production mean must be positive');
    }
    
    if (energyProduction.distribution === 'Normal' && energyProduction.std < 0) {
      errors.push('Energy production standard deviation cannot be negative');
    }
    
    if (['Triangular', 'Uniform'].includes(energyProduction.distribution)) {
      if (energyProduction.min === undefined || energyProduction.max === undefined) {
        errors.push('Min and max values are required for Triangular/Uniform distributions');
      } else if (energyProduction.min >= energyProduction.max) {
        errors.push('Min value must be less than max value');
      }
    }
  }
  
  // Validate electricity price
  if (!revenueSettings.electricityPrice) {
    errors.push('Electricity price parameters are required');
  } else {
    const { electricityPrice } = revenueSettings;
    
    if (electricityPrice.type === 'fixed' && (!electricityPrice.value || electricityPrice.value <= 0)) {
      errors.push('Fixed electricity price must be positive');
    }
    
    if (electricityPrice.type === 'variable' && !electricityPrice.distribution) {
      errors.push('Distribution type is required for variable electricity price');
    }
  }
  
  if (revenueSettings.revenueDegradationRate < 0 || revenueSettings.revenueDegradationRate > 100) {
    errors.push('Revenue degradation rate must be between 0 and 100');
  }
  
  // Validate downtime configuration
  if (revenueSettings.downtimePerEvent) {
    const { downtimePerEvent } = revenueSettings;
    
    if (!['Weibull', 'Lognormal', 'Exponential'].includes(downtimePerEvent.distribution)) {
      errors.push('Downtime distribution must be Weibull, Lognormal, or Exponential');
    }
    
    if (downtimePerEvent.scale <= 0) {
      errors.push('Downtime scale parameter must be positive');
    }
    
    if (downtimePerEvent.distribution === 'Weibull' && downtimePerEvent.shape <= 0) {
      errors.push('Weibull shape parameter must be positive');
    }
  }
  
  // Validate adjustments if present
  if (revenueSettings.adjustments && Array.isArray(revenueSettings.adjustments)) {
    revenueSettings.adjustments.forEach((adjustment, index) => {
      if (!adjustment.years || !Array.isArray(adjustment.years) || adjustment.years.length === 0) {
        errors.push(`Adjustment #${index+1}: Years array must not be empty`);
      }
      
      if (adjustment.amount === undefined) {
        errors.push(`Adjustment #${index+1}: Amount is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate risk module settings
 * @param {Object} riskSettings - Risk settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateRiskSettings = (riskSettings) => {
  const errors = [];
  
  if (!riskSettings) {
    return { isValid: false, errors: ['Risk settings are required'] };
  }
  
  if (riskSettings.insuranceEnabled) {
    if (!riskSettings.insurancePremium || riskSettings.insurancePremium < 0) {
      errors.push('Insurance premium must be a non-negative number when insurance is enabled');
    }
    
    if (!riskSettings.insuranceDeductible || riskSettings.insuranceDeductible < 0) {
      errors.push('Insurance deductible must be a non-negative number when insurance is enabled');
    }
  }
  
  if (riskSettings.reserveFunds < 0) {
    errors.push('Reserve funds cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate contract module settings
 * @param {Object} contractSettings - Contract settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateContractSettings = (contractSettings) => {
  const errors = [];
  
  if (!contractSettings) {
    return { isValid: false, errors: ['Contract settings are required'] };
  }
  
  // Validate OEM contracts if present
  if (contractSettings.oemContracts && Array.isArray(contractSettings.oemContracts)) {
    contractSettings.oemContracts.forEach((contract, index) => {
      if (!contract.id) {
        errors.push(`OEM Contract #${index+1}: ID is required`);
      }
      
      if (!contract.name) {
        errors.push(`OEM Contract #${index+1}: Name is required`);
      }
      
      if (!contract.years || !Array.isArray(contract.years) || contract.years.length === 0) {
        errors.push(`OEM Contract #${index+1}: Years array must not be empty`);
      }
      
      if (contract.fixedFee === undefined || contract.fixedFee < 0) {
        errors.push(`OEM Contract #${index+1}: Fixed fee must be a non-negative number`);
      }
      
      if (!contract.oemScopeId) {
        errors.push(`OEM Contract #${index+1}: OEM scope ID is required`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate simulation settings
 * @param {Object} simulationSettings - Simulation settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateSimulationSettings = (simulationSettings) => {
  const errors = [];
  
  if (!simulationSettings) {
    return { isValid: false, errors: ['Simulation settings are required'] };
  }
  
  if (!simulationSettings.iterations || simulationSettings.iterations < 100) {
    errors.push('At least 100 iterations are required for reliable results');
  }
  
  if (!simulationSettings.seed) {
    errors.push('Random seed is required for reproducible results');
  }
  
  // Validate probability settings if present
  if (simulationSettings.probabilities) {
    const { probabilities } = simulationSettings;
    
    if (probabilities.primary < 1 || probabilities.primary > 99) {
      errors.push('Primary probability must be between 1 and 99');
    }
    
    if (probabilities.upperBound <= probabilities.primary || probabilities.upperBound > 99) {
      errors.push('Upper bound probability must be greater than primary and not more than 99');
    }
    
    if (probabilities.lowerBound >= probabilities.primary || probabilities.lowerBound < 1) {
      errors.push('Lower bound probability must be less than primary and at least 1');
    }
    
    if (probabilities.extremeUpper <= probabilities.upperBound || probabilities.extremeUpper > 99) {
      errors.push('Extreme upper probability must be greater than upper bound and not more than 99');
    }
    
    if (probabilities.extremeLower >= probabilities.lowerBound || probabilities.extremeLower < 1) {
      errors.push('Extreme lower probability must be less than lower bound and at least 1');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate project metrics
 * @param {Object} metricsSettings - Metrics settings to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateMetricsSettings = (metricsSettings) => {
  const errors = [];
  
  if (!metricsSettings) {
    return { isValid: false, errors: ['Metrics settings are required'] };
  }
  
  if (metricsSettings.totalMW < 0) {
    errors.push('Total MW cannot be negative');
  }
  
  if (metricsSettings.grossAEP < 0) {
    errors.push('Gross AEP cannot be negative');
  }
  
  if (metricsSettings.netAEP < 0) {
    errors.push('Net AEP cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
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
};