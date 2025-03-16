// backend/services/modules/costModule.js
const DistributionFactory = require('../monte-carlo/distributions');

class CostModule {
  constructor() {
    this.name = 'cost';
  }

  /**
   * Process a single iteration for the cost module
   * @param {Object} context - Context object with scenario settings
   * @param {Object} iterationState - Current state of the iteration
   * @param {number} iterationIndex - Current iteration index
   * @returns {Object} Cost module results for this iteration
   */
  processIteration(context, iterationState, iterationIndex) {
    const { settings, annualAdjustments, projectLife } = context;
    const costParams = settings.modules.cost;
    
    // Create results containers
    const result = {
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    };

    // Create distribution generators
    const escalationDistribution = this._createEscalationDistribution(costParams);
    
    // Get active OEM contract if any
    const activeContract = this._getActiveContract(settings);
    
    // Process each year
    for (let year = 0; year < projectLife; year++) {
      const yearIndex = year + 1; // 1-based for business logic
      
      // Determine if this year is covered by OEM contract
      const contractCoverage = this._getContractCoverageForYear(yearIndex, settings);
      
      // Base O&M costs
      let baseOMCost = 0;
      if (contractCoverage) {
        // During OEM contract period, use fixed fee
        baseOMCost = contractCoverage.isPerTurbine 
          ? contractCoverage.fixedFee * context.numWTGs 
          : contractCoverage.fixedFee;
      } else {
        // After OEM contract period, apply escalation
        const escalationRate = escalationDistribution();
        const oemEndYear = activeContract ? Math.max(...activeContract.years) : (costParams.oemTerm || 0);
        baseOMCost = costParams.annualBaseOM * Math.pow(1 + (escalationRate || 0), yearIndex - oemEndYear);
      }
      
      // Failure events
      let failureEventCost = 0;
      const failureProbability = (costParams.failureEventProbability || 0) / 100;
      if (Math.random() < failureProbability) {
        failureEventCost = costParams.failureEventCost || 0;
      }
      
      // Major repairs/overhauls (deterministic or probabilistic)
      let majorRepairCost = 0;
      // Add any scheduled major repairs for this year
      // This could be enhanced further to look at specific years in settings
      
      // Contingency costs
      const contingencyCost = costParams.contingencyCost || 0;
      
      // Additional manual adjustments from annualAdjustments
      const manualAdjustment = annualAdjustments[year].additionalOM || 0;
      
      // Calculate total cost for this year
      const totalCost = baseOMCost + failureEventCost + majorRepairCost + contingencyCost + manualAdjustment;
      
      // Store annual data
      result.annualData[year] = {
        baseOMCost,
        failureEventCost,
        majorRepairCost,
        contingencyCost,
        manualOMAdjustment: manualAdjustment,
        totalCost
      };
    }

    // Calculate metrics
    const totalCostArray = result.annualData.map(year => year.totalCost);
    result.metrics.totalLifetimeCost = totalCostArray.reduce((sum, cost) => sum + cost, 0);
    result.metrics.averageAnnualCost = result.metrics.totalLifetimeCost / projectLife;
    
    return result;
  }

  /**
   * Create a distribution for cost escalation based on parameters
   * @param {Object} costParams - Cost parameters
   * @returns {Function} Distribution function
   */
  _createEscalationDistribution(costParams) {
    const escalationType = costParams.escalationDistribution || 'Normal';
    const baseRate = (costParams.escalationRate || 2) / 100; // Convert from percentage
    
    switch (escalationType) {
      case 'Normal':
        return DistributionFactory.createDistribution('normal', {
          mean: baseRate,
          std: baseRate * 0.25 // Standard deviation at 25% of the mean
        });
      
      case 'Lognormal':
        return DistributionFactory.createDistribution('lognormal', {
          mean: Math.log(baseRate),
          sigma: 0.2
        });
      
      case 'Triangular':
        return DistributionFactory.createDistribution('triangular', {
          min: baseRate * 0.5,
          mode: baseRate,
          max: baseRate * 1.5
        });
      
      case 'Uniform':
        return DistributionFactory.createDistribution('uniform', {
          min: baseRate * 0.5,
          max: baseRate * 1.5
        });
      
      default:
        // Fixed value as fallback
        return () => baseRate;
    }
  }

  /**
   * Get the active OEM contract for the simulation
   * @param {Object} settings - Scenario settings
   * @returns {Object|null} Active OEM contract or null
   */
  _getActiveContract(settings) {
    const oemContracts = settings.modules.contracts?.oemContracts || [];
    if (oemContracts.length === 0) return null;
    
    // Check if there's a contract ID in cost settings
    const costParams = settings.modules.cost;
    const contractId = costParams.oemContractId;
    
    if (contractId) {
      // Find the referenced contract
      return oemContracts.find(contract => contract.id === contractId) || null;
    }
    
    // Otherwise, find the contract that covers the most years
    return [...oemContracts].sort((a, b) => 
      (b.years?.length || 0) - (a.years?.length || 0)
    )[0] || null;
  }

  /**
   * Get contract coverage for a specific year
   * @param {number} year - The year to check
   * @param {Object} settings - Scenario settings
   * @returns {Object|null} Contract coverage or null
   */
  _getContractCoverageForYear(year, settings) {
    const oemContracts = settings.modules.contracts?.oemContracts || [];
    
    for (const contract of oemContracts) {
      if (contract.years && contract.years.includes(year)) {
        return {
          fixedFee: contract.fixedFee || 0,
          isPerTurbine: contract.isPerTurbine || false
        };
      }
    }
    
    return null;
  }
}

module.exports = CostModule;