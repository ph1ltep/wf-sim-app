// backend/services/monte-carlo/utils.js
const MonteCarloEngine = require('./engine');
const DistributionFactory = require('./distributions');

// Module classes will be imported and attached here
const CostModule = require('../modules/costModule');
const RevenueModule = require('../modules/revenueModule');
const FinancingModule = require('../modules/financingModule');
const RiskModule = require('../modules/riskModule');

/**
 * Create a fully configured Monte Carlo simulation engine
 * @param {Object} options - Simulation options
 * @returns {MonteCarloEngine} Configured engine instance
 */
function createSimulationEngine(options = {}) {
  const engine = new MonteCarloEngine({
    iterations: options.iterations || 10000,
    seed: options.seed || 42,
    ...options
  });
  
  // Register all modules
  engine.registerModule('cost', new CostModule())
        .registerModule('revenue', new RevenueModule())
        .registerModule('financing', new FinancingModule())
        .registerModule('risk', new RiskModule());
  
  return engine;
}

/**
 * Get percentile values from parameters or use defaults
 * @param {Object} probabilities - Probability settings
 * @returns {Object} Percentile values
 */
function getPercentileValues(probabilities = {}) {
  return {
    primary: probabilities.primary || 50,      // Default: P50 (median)
    upperBound: probabilities.upperBound || 75, // Default: P75
    lowerBound: probabilities.lowerBound || 25, // Default: P25
    extremeLower: probabilities.extremeLower || 10, // Default: P10
    extremeUpper: probabilities.extremeUpper || 90  // Default: P90
  };
}

/**
 * Convert from the new scenario schema structure to simulation parameters
 * @param {Object} settings - Scenario settings using the new schema structure
 * @returns {Object} Parameters in the format expected by the simulation engine
 */
function convertToSimulationParams(settings) {
  // Extract modules from settings
  const { general, project, modules, simulation } = settings;
  
  // If any of the required sections is missing, provide defaults
  if (!general) general = { projectLife: 20 };
  if (!project) project = { 
    windFarm: { numWTGs: 20, mwPerWTG: 3.5, capacityFactor: 35 },
    currency: { local: 'USD', foreign: 'EUR', exchangeRate: 1.0 }
  };
  if (!modules) modules = {
    financing: { capex: 50000000, devex: 10000000, model: 'Balance-Sheet', debtToEquityRatio: 1.5, loanDuration: 15 },
    cost: { annualBaseOM: 5000000, escalationRate: 2, oemTerm: 5, fixedOMFee: 4000000, failureEventProbability: 5 },
    revenue: { 
      energyProduction: { distribution: 'Normal', mean: 1000, std: 100 },
      electricityPrice: { type: 'fixed', value: 50 }
    },
    risk: { insuranceEnabled: false, reserveFunds: 0 },
    contracts: { oemContracts: [] }
  };
  if (!simulation) simulation = { iterations: 10000, seed: 42, probabilities: {} };

  // Extract relevant contracts from the contracts module
  const oemContracts = modules?.contracts?.oemContracts || [];
  let costModule = { ...modules.cost };
  
  // Find contracts that apply to each year and update cost parameters
  if (oemContracts.length > 0) {
    // Get the most extensive OEM contract (covering the most years)
    const mostExtensiveContract = [...oemContracts].sort((a, b) => 
      (b.years?.length || 0) - (a.years?.length || 0)
    )[0];
    
    if (mostExtensiveContract) {
      // Find the maximum year
      const maxYear = mostExtensiveContract.years && mostExtensiveContract.years.length > 0 ? 
        Math.max(...mostExtensiveContract.years) : 
        (mostExtensiveContract.endYear || 5);
      
      // Update OEM term and fixed fee
      costModule.oemTerm = maxYear;
      costModule.fixedOMFee = mostExtensiveContract.isPerTurbine ? 
        mostExtensiveContract.fixedFee * (project.windFarm?.numWTGs || 20) : 
        mostExtensiveContract.fixedFee;
        
      // Set OEM contract ID reference
      costModule.oemContractId = mostExtensiveContract.id;
    }
  }
  
  // Convert cost and revenue adjustments to annual adjustments
  const annualAdjustments = [];
  const projectLife = general.projectLife || 20;
  
  // Initialize annual adjustments array
  for (let year = 1; year <= projectLife; year++) {
    annualAdjustments.push({
      year,
      additionalOM: 0,
      additionalRevenue: 0
    });
  }
  
  // Process cost adjustments
  if (modules.cost.adjustments && modules.cost.adjustments.length > 0) {
    modules.cost.adjustments.forEach(adjustment => {
      adjustment.years.forEach(year => {
        if (year >= 1 && year <= projectLife) {
          annualAdjustments[year - 1].additionalOM += adjustment.amount;
        }
      });
    });
  }
  
  // Process revenue adjustments
  if (modules.revenue.adjustments && modules.revenue.adjustments.length > 0) {
    modules.revenue.adjustments.forEach(adjustment => {
      adjustment.years.forEach(year => {
        if (year >= 1 && year <= projectLife) {
          annualAdjustments[year - 1].additionalRevenue += adjustment.amount;
        }
      });
    });
  }
  
  return {
    general: {
      projectName: general.projectName || 'Wind Farm Project',
      startDate: general.startDate || null,
      projectLife: general.projectLife || 20,
      loanDuration: modules.financing.loanDuration || 15,
      ...project.windFarm
    },
    financing: {
      ...modules.financing,
      // Ensure consistent loan duration between general and financing
      loanDuration: modules.financing.loanDuration || 15
    },
    cost: costModule,
    revenue: modules.revenue,
    riskMitigation: modules.risk,
    simulation: {
      iterations: simulation.iterations || 10000,
      seed: simulation.seed || 42
    },
    probabilities: simulation.probabilities || {
      primary: 50,
      upperBound: 75,
      lowerBound: 25,
      extremeLower: 10,
      extremeUpper: 90
    },
    annualAdjustments: annualAdjustments,
    scenario: {
      name: general.projectName || 'Wind Farm Project',
      description: '',
      scenarioType: 'base',
      currency: project.currency?.local || 'USD',
      foreignCurrency: project.currency?.foreign || 'EUR',
      exchangeRate: project.currency?.exchangeRate || 1.0,
      location: project.location
    }
  };
}

module.exports = {
  MonteCarloEngine,
  DistributionFactory,
  createSimulationEngine,
  getPercentileValues,
  convertToSimulationParams
};