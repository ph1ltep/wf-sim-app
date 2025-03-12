// backend/services/modules/costModule.js
const DistributionFactory = require('../monte-carlo/distributions');

class CostModule {
  constructor() {
    this.name = 'cost';
  }

  /**
   * Process a single iteration for the cost module
   * @param {Object} parameters - Full simulation parameters
   * @param {Object} iterationState - Current state of the iteration
   * @param {number} iterationIndex - Current iteration index
   * @returns {Object} Cost module results for this iteration
   */
  processIteration(parameters, iterationState, iterationIndex) {
    const { cost, general, annualAdjustments = [] } = parameters;
    const projectLife = general.projectLife || 20;
    
    // Create results containers
    const result = {
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    };

    // Create distribution generators
    const escalationDistribution = this._createEscalationDistribution(cost);
    
    // Process each year
    for (let year = 0; year < projectLife; year++) {
      const yearIndex = year + 1; // 1-based for business logic
      
      // Base O&M costs
      let baseOMCost = 0;
      if (yearIndex <= cost.oemTerm) {
        // During OEM term, use fixed fee
        baseOMCost = cost.fixedOMFee || 0;
      } else {
        // After OEM term, apply escalation
        const escalationRate = escalationDistribution();
        baseOMCost = cost.annualBaseOM * Math.pow(1 + escalationRate, yearIndex - cost.oemTerm);
      }
      
      // Failure events
      let failureEventCost = 0;
      const failureProbability = (cost.failureEventProbability || 0) / 100;
      if (Math.random() < failureProbability) {
        failureEventCost = cost.failureEventCost || 0;
      }
      
      // Major repairs/overhauls (deterministic or probabilistic)
      let majorRepairCost = 0;
      if (cost.majorRepairEvents) {
        for (const repair of cost.majorRepairEvents) {
          if (repair.year === yearIndex) {
            if (Math.random() < (repair.probability || 1) / 100) {
              majorRepairCost += repair.cost || 0;
            }
          }
        }
      }
      
      // Contingency costs
      const contingencyCost = cost.contingencyCost || 0;
      
      // Additional manual adjustments
      const manualAdjustment = (annualAdjustments[year]?.additionalOM || 0);
      
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
   * Run a standalone cost module simulation
   * @param {Object} parameters - Cost parameters
   * @returns {Object} Cost module results
   */
  runStandalone(parameters) {
    const projectLife = parameters.general?.projectLife || 20;
    const iterations = parameters.simulation?.iterations || 10000;
    
    // Results container
    const iterationResults = Array(iterations).fill().map(() => ({
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    }));
    
    // Run iterations
    for (let i = 0; i < iterations; i++) {
      iterationResults[i] = this.processIteration(parameters, {}, i);
    }
    
    // Calculate percentiles for metrics and annual data
    const results = {
      metrics: {},
      annualData: {
        baseOMCost: { P10: [], P50: [], P75: [], P90: [] },
        failureEventCost: { P10: [], P50: [], P75: [], P90: [] },
        majorRepairCost: { P10: [], P50: [], P75: [], P90: [] },
        totalCost: { P10: [], P50: [], P75: [], P90: [] }
      }
    };
    
    // Process metric percentiles
    const metricNames = Object.keys(iterationResults[0].metrics);
    metricNames.forEach(metric => {
      const values = iterationResults.map(iter => iter.metrics[metric]);
      results.metrics[metric] = DistributionFactory.calculatePercentiles(values);
    });
    
    // Process annual data percentiles
    for (let year = 0; year < projectLife; year++) {
      ['baseOMCost', 'failureEventCost', 'majorRepairCost', 'totalCost'].forEach(field => {
        const yearValues = iterationResults.map(iter => iter.annualData[year][field] || 0);
        const percentiles = DistributionFactory.calculatePercentiles(yearValues);
        
        results.annualData[field].P10.push(percentiles.P10);
        results.annualData[field].P50.push(percentiles.P50);
        results.annualData[field].P75.push(percentiles.P75);
        results.annualData[field].P90.push(percentiles.P90);
      });
    }
    
    return {
      success: true,
      moduleName: this.name,
      results
    };
  }
}

module.exports = CostModule;