// backend/utils/validators.js
/**
 * Validate general simulation parameters
 * @param {Object} params - Parameters to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validateGeneralParams = (params) => {
    const errors = [];
    
    if (!params) {
      return { isValid: false, errors: ['General parameters are required'] };
    }
    
    if (!params.projectLife || params.projectLife < 1) {
      errors.push('Project life must be a positive number');
    }
    
    if (!params.loanDuration || params.loanDuration < 1) {
      errors.push('Loan duration must be a positive number');
    }
    
    if (params.loanDuration > params.projectLife) {
      errors.push('Loan duration cannot exceed project life');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate financing parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  const validateFinancingParams = (params) => {
    const errors = [];
    
    if (!params) {
      return { isValid: false, errors: ['Financing parameters are required'] };
    }
    
    if (!params.capex || params.capex <= 0) {
      errors.push('CAPEX must be a positive number');
    }
    
    if (params.devex < 0) {
      errors.push('DEVEX cannot be negative');
    }
    
    if (!params.model) {
      errors.push('Financing model is required');
    } else if (!['Balance-Sheet', 'Project-Finance'].includes(params.model)) {
      errors.push('Financing model must be either "Balance-Sheet" or "Project-Finance"');
    }
    
    if (params.model === 'Balance-Sheet') {
      if (!params.debtToEquityRatio || params.debtToEquityRatio < 0) {
        errors.push('Debt-to-Equity ratio must be a non-negative number');
      }
      
      if (!params.loanInterestRateBS || params.loanInterestRateBS < 0) {
        errors.push('Loan interest rate (BS) must be a non-negative number');
      }
    } else if (params.model === 'Project-Finance') {
      if (!params.debtToCapexRatio || params.debtToCapexRatio < 0 || params.debtToCapexRatio > 1) {
        errors.push('Debt-to-CAPEX ratio must be between 0 and 1');
      }
      
      if (!params.loanInterestRatePF || params.loanInterestRatePF < 0) {
        errors.push('Loan interest rate (PF) must be a non-negative number');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate cost parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  const validateCostParams = (params) => {
    const errors = [];
    
    if (!params) {
      return { isValid: false, errors: ['Cost parameters are required'] };
    }
    
    if (!params.annualBaseOM || params.annualBaseOM < 0) {
      errors.push('Annual base O&M must be a non-negative number');
    }
    
    if (params.escalationRate < 0) {
      errors.push('Escalation rate cannot be negative');
    }
    
    if (params.oemTerm < 0) {
      errors.push('OEM term cannot be negative');
    }
    
    if (params.fixedOMFee < 0) {
      errors.push('Fixed O&M fee cannot be negative');
    }
    
    if (params.failureEventProbability < 0 || params.failureEventProbability > 100) {
      errors.push('Failure event probability must be between 0 and 100');
    }
    
    if (params.failureEventCost < 0) {
      errors.push('Failure event cost cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  /**
   * Validate revenue parameters
   * @param {Object} params - Parameters to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  const validateRevenueParams = (params) => {
    const errors = [];
    
    if (!params) {
      return { isValid: false, errors: ['Revenue parameters are required'] };
    }
    
    if (!params.energyProduction) {
      errors.push('Energy production parameters are required');
    } else {
      if (!params.energyProduction.mean || params.energyProduction.mean <= 0) {
        errors.push('Energy production mean must be positive');
      }
      
      if (params.energyProduction.distribution === 'Normal' && params.energyProduction.std < 0) {
        errors.push('Energy production standard deviation cannot be negative');
      }
    }
    
    if (!params.electricityPrice) {
      errors.push('Electricity price parameters are required');
    } else {
      if (params.electricityPrice.type === 'fixed' && (!params.electricityPrice.value || params.electricityPrice.value <= 0)) {
        errors.push('Fixed electricity price must be positive');
      }
    }
    
    if (params.revenueDegradationRate < 0 || params.revenueDegradationRate > 100) {
      errors.push('Revenue degradation rate must be between 0 and 100');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
  
  module.exports = {
    validateGeneralParams,
    validateFinancingParams,
    validateCostParams,
    validateRevenueParams
  };