// backend/services/monte-carlo/ValidationService.js
const { validateGeneralSettings, validateWindFarmSettings, validateCurrencySettings,
    validateFinancingSettings, validateCostSettings, validateRevenueSettings,
    validateRiskSettings, validateContractSettings, validateSimulationSettings } = require('../../utils/validators');
  
  /**
   * Service for validating simulation data at various stages
   */
  class ValidationService {
    /**
     * Validate complete scenario settings
     * @param {Object} settings - Scenario settings to validate
     * @returns {Object} Validation result with isValid flag and errors array
     */
    static validateScenarioSettings(settings) {
      const errors = [];
      
      // Check if settings exists
      if (!settings) {
        return { isValid: false, errors: ['Settings object is required'] };
      }
      
      // Validate each section
      const validations = [
        { name: 'General settings', result: validateGeneralSettings(settings.general) },
        { name: 'Wind farm settings', result: validateWindFarmSettings(settings.project?.windFarm) },
        { name: 'Currency settings', result: validateCurrencySettings(settings.project?.currency) },
        { name: 'Financing settings', result: validateFinancingSettings(settings.modules?.financing) },
        { name: 'Cost settings', result: validateCostSettings(settings.modules?.cost) },
        { name: 'Revenue settings', result: validateRevenueSettings(settings.modules?.revenue) },
        { name: 'Risk settings', result: validateRiskSettings(settings.modules?.risk) },
        { name: 'Contract settings', result: validateContractSettings(settings.modules?.contracts) },
        { name: 'Simulation settings', result: validateSimulationSettings(settings.simulation) }
      ];
      
      // Collect all errors
      validations.forEach(validation => {
        if (!validation.result.isValid) {
          errors.push(`${validation.name} validation failed:`);
          validation.result.errors.forEach(err => errors.push(`  - ${err}`));
        }
      });
      
      return {
        isValid: errors.length === 0,
        errors,
        validations: validations.map(v => ({ name: v.name, ...v.result }))
      };
    }
  
    /**
     * Validate input simulation context
     * @param {Object} context - Input simulation context
     * @returns {Object} Validation result
     */
    static validateInputContext(context) {
      const errors = [];
      
      // Check if context exists
      if (!context) {
        return { isValid: false, errors: ['Input context is required'] };
      }
      
      // Check required properties
      if (!context.project) {
        errors.push('Project information is missing');
      } else {
        if (context.project.life <= 0) {
          errors.push('Project life must be positive');
        }
        if (context.project.numWTGs <= 0) {
          errors.push('Number of wind turbines must be positive');
        }
      }
      
      // Check cost module context
      if (!context.cost) {
        errors.push('Cost parameters are missing');
      } else {
        if (context.cost.annualBaseOM < 0) {
          errors.push('Annual base O&M cost cannot be negative');
        }
        if (context.cost.escalationRate < 0) {
          errors.push('Cost escalation rate cannot be negative');
        }
      }
      
      // Check revenue module context
      if (!context.revenue) {
        errors.push('Revenue parameters are missing');
      } else {
        if (!context.revenue.energyProduction) {
          errors.push('Energy production parameters are missing');
        }
        if (!context.revenue.electricityPrice) {
          errors.push('Electricity price parameters are missing');
        }
      }
      
      // Check annual adjustments
      if (!context.annualAdjustments || !Array.isArray(context.annualAdjustments)) {
        errors.push('Annual adjustments must be an array');
      } else if (context.annualAdjustments.length !== context.project.life) {
        errors.push(`Annual adjustments length (${context.annualAdjustments.length}) must match project life (${context.project.life})`);
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Validate output simulation context
     * @param {Object} context - Output simulation context
     * @returns {Object} Validation result
     */
    static validateOutputContext(context) {
      const errors = [];
      
      // Check if context exists
      if (!context) {
        return { isValid: false, errors: ['Output context is required'] };
      }
      
      // Check required properties
      if (!context.project) {
        errors.push('Project information is missing');
      } else {
        if (context.project.life <= 0) {
          errors.push('Project life must be positive');
        }
      }
      
      // Check financial settings
      if (!context.financial) {
        errors.push('Financial parameters are missing');
      } else {
        if (context.financial.capex <= 0) {
          errors.push('CAPEX must be positive');
        }
        if (context.financial.loanTenor <= 0) {
          errors.push('Loan tenor must be positive');
        }
      }
      
      // Check cash flow data
      if (!context.cashFlow) {
        errors.push('Cash flow data is missing');
      } else {
        if (!context.cashFlow.annual || !Array.isArray(context.cashFlow.annual)) {
          errors.push('Annual cash flows must be an array');
        } else if (context.cashFlow.annual.length !== context.project.life) {
          errors.push(`Annual cash flows length (${context.cashFlow.annual.length}) must match project life (${context.project.life})`);
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Validate input simulation results
     * @param {Object} results - Input simulation results
     * @returns {Object} Validation result
     */
    static validateInputResults(results) {
      const errors = [];
      
      // Check if results exists
      if (!results) {
        return { isValid: false, errors: ['Input results are required'] };
      }
      
      // Check basic structure
      if (!results.cashflow) {
        errors.push('Cash flow results are missing');
      } else {
        // Check annualCosts
        if (!results.cashflow.annualCosts) {
          errors.push('Annual costs are missing');
        } else {
          if (!results.cashflow.annualCosts.total) {
            errors.push('Total annual costs are missing');
          }
          if (!results.cashflow.annualCosts.components) {
            errors.push('Cost components are missing');
          }
        }
        
        // Check annualRevenue
        if (!results.cashflow.annualRevenue) {
          errors.push('Annual revenue is missing');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Validate output simulation results
     * @param {Object} results - Output simulation results
     * @returns {Object} Validation result
     */
    static validateOutputResults(results) {
      const errors = [];
      
      // Check if results exists
      if (!results) {
        return { isValid: false, errors: ['Output results are required'] };
      }
      
      // Check basic structure
      if (!results.IRR) {
        errors.push('IRR results are missing');
      }
      if (!results.NPV) {
        errors.push('NPV results are missing');
      }
      if (!results.paybackPeriod) {
        errors.push('Payback period results are missing');
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  
    /**
     * Validate module iteration results
     * @param {Object} moduleResults - Module iteration results
     * @param {string} moduleName - Name of the module
     * @returns {Object} Validation result
     */
    static validateModuleResults(moduleResults, moduleName) {
      const errors = [];
      
      // Check if results exist
      if (!moduleResults) {
        return { isValid: false, errors: [`${moduleName} results are required`] };
      }
      
      // Module-specific validation
      switch (moduleName) {
        case 'cost':
          if (!moduleResults.annualData || !Array.isArray(moduleResults.annualData)) {
            errors.push('Cost annual data must be an array');
          }
          if (!moduleResults.metrics) {
            errors.push('Cost metrics are missing');
          }
          break;
        
        case 'revenue':
          if (!moduleResults.annualData || !Array.isArray(moduleResults.annualData)) {
            errors.push('Revenue annual data must be an array');
          }
          if (!moduleResults.metrics) {
            errors.push('Revenue metrics are missing');
          }
          break;
        
        case 'financing':
          if (!moduleResults.annualData || !Array.isArray(moduleResults.annualData)) {
            errors.push('Financing annual data must be an array');
          }
          break;
        
        case 'irr':
          if (moduleResults.irr === undefined) {
            errors.push('IRR value is missing');
          }
          if (!moduleResults.cashFlows || !Array.isArray(moduleResults.cashFlows)) {
            errors.push('Cash flows must be an array');
          }
          break;
        
        case 'npv':
          if (moduleResults.npv === undefined) {
            errors.push('NPV value is missing');
          }
          if (!moduleResults.cashFlows || !Array.isArray(moduleResults.cashFlows)) {
            errors.push('Cash flows must be an array');
          }
          break;
        
        case 'payback':
          if (moduleResults.paybackPeriod === undefined) {
            errors.push('Payback period is missing');
          }
          break;
        
        case 'risk':
          // Risk module specific validations
          break;
        
        default:
          // Generic validation for unknown modules
          if (!moduleResults.annualData && !moduleResults.metrics) {
            errors.push(`${moduleName} results must have annualData or metrics`);
          }
      }
      
      return {
        isValid: errors.length === 0,
        errors
      };
    }
  }
  
  module.exports = ValidationService;