// backend/services/modules/costModule.js
const SimulationModule = require('../monte-carlo/SimulationModule');
const DistributionFactory = require('../monte-carlo/distributions');

class CostModule extends SimulationModule {
  constructor(config = {}) {
    super('cost', config);
  }

  /**
   * Transform raw scenario data into the format needed by this module
   * @param {Object} data - Raw scenario data
   * @returns {Object} Transformed data for module use
   */
  prepareInputData(data) {
    const costParams = data.settings?.modules?.cost || {};
    const projectLife = data.settings?.general?.projectLife || 20;
    const numWTGs = data.settings?.project?.windFarm?.numWTGs || 20;
    
    // Extract annual adjustments from data
    const annualAdjustments = Array(projectLife).fill().map((_, i) => ({
      year: i + 1,
      additionalOM: 0
    }));
    
    // Process cost adjustments if they exist
    if (costParams.adjustments && Array.isArray(costParams.adjustments)) {
      costParams.adjustments.forEach(adjustment => {
        adjustment.years.forEach(year => {
          if (year >= 1 && year <= projectLife) {
            annualAdjustments[year - 1].additionalOM += adjustment.amount;
          }
        });
      });
    }
    
    // Get active OEM contract if any
    const activeContract = this._getActiveContract(data);
    
    return {
      costParams,
      projectLife,
      numWTGs,
      annualAdjustments,
      activeContract
    };
  }

  /**
   * Process a single iteration for the cost module
   * @param {Object} context - Prepared context for this module
   * @param {Object} state - Current iteration state
   * @param {number} iterationIndex - Current iteration index
   * @returns {Object} Cost results for this iteration
   */
  processIteration(context, state, iterationIndex) {
    const { costParams, projectLife, numWTGs, annualAdjustments, activeContract } = context;
    
    // Create results containers
    const result = {
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    };

    // Create distribution generators
    const escalationDistribution = this._createEscalationDistribution(costParams);
    
    // Process each year
    for (let year = 0; year < projectLife; year++) {
      const yearIndex = year + 1; // 1-based for business logic
      
      // Determine if this year is covered by OEM contract
      const contractCoverage = this._getContractCoverageForYear(yearIndex, activeContract);
      
      // Base O&M costs
      let baseOMCost = 0;
      if (contractCoverage) {
        // During OEM contract period, use fixed fee
        baseOMCost = contractCoverage.isPerTurbine 
          ? contractCoverage.fixedFee * numWTGs 
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
      
      // Contingency costs
      const contingencyCost = costParams.contingencyCost || 0;
      
      // Additional manual adjustments
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
   * Format module results for output
   * @param {Array} iterations - Raw iteration results
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted results
   */
  formatResults(iterations, percentiles) {
    // Extract project life from the first iteration
    const projectLife = iterations[0]?.annualData?.length || 20;
    
    // Extract percentile values
    const percentileValues = [
      percentiles.extremeLower,
      percentiles.lowerBound,
      percentiles.primary,
      percentiles.upperBound,
      percentiles.extremeUpper
    ];
    
    // Create percentile labels (P10, P50, etc.)
    const percentileLabels = percentileValues.map(p => `P${p}`);
    
    // Map traditional percentile keys (P50) to new format (Pprimary)
    const percentileMapping = {
      [`P${percentiles.extremeLower}`]: 'Pextreme_lower',
      [`P${percentiles.lowerBound}`]: 'Plower_bound',
      [`P${percentiles.primary}`]: 'Pprimary',
      [`P${percentiles.upperBound}`]: 'Pupper_bound',
      [`P${percentiles.extremeUpper}`]: 'Pextreme_upper'
    };
    
    // Initialize results structure
    const formattedResults = {
      total: {},
      components: {
        baseOM: {},
        failureRisk: {},
        majorRepairs: {},
        contingency: {}
      },
      metrics: {}
    };
    
    // Initialize arrays for each percentile and cost component
    percentileLabels.forEach(label => {
      formattedResults.total[label] = Array(projectLife).fill(0);
      formattedResults.components.baseOM[label] = Array(projectLife).fill(0);
      formattedResults.components.failureRisk[label] = Array(projectLife).fill(0);
      formattedResults.components.majorRepairs[label] = Array(projectLife).fill(0);
      formattedResults.components.contingency[label] = Array(projectLife).fill(0);
    });
    
    // Process annual data
    for (let year = 0; year < projectLife; year++) {
      // Extract data for this year across all iterations
      const yearTotalCost = iterations.map(iter => iter.annualData[year].totalCost);
      const yearBaseOMCost = iterations.map(iter => iter.annualData[year].baseOMCost);
      const yearFailureEventCost = iterations.map(iter => iter.annualData[year].failureEventCost);
      const yearMajorRepairCost = iterations.map(iter => iter.annualData[year].majorRepairCost);
      const yearContingencyCost = iterations.map(iter => iter.annualData[year].contingencyCost);
      
      // Calculate percentiles for each component
      const totalPercentiles = DistributionFactory.calculatePercentiles(yearTotalCost, percentileValues);
      const baseOMPercentiles = DistributionFactory.calculatePercentiles(yearBaseOMCost, percentileValues);
      const failurePercentiles = DistributionFactory.calculatePercentiles(yearFailureEventCost, percentileValues);
      const repairPercentiles = DistributionFactory.calculatePercentiles(yearMajorRepairCost, percentileValues);
      const contingencyPercentiles = DistributionFactory.calculatePercentiles(yearContingencyCost, percentileValues);
      
      // Store percentiles in the formatted results
      percentileLabels.forEach(label => {
        formattedResults.total[label][year] = totalPercentiles[label];
        formattedResults.components.baseOM[label][year] = baseOMPercentiles[label];
        formattedResults.components.failureRisk[label][year] = failurePercentiles[label];
        formattedResults.components.majorRepairs[label][year] = repairPercentiles[label];
        formattedResults.components.contingency[label][year] = contingencyPercentiles[label];
      });
    }
    
    // Process metrics
    const totalCostMetrics = iterations.map(iter => iter.metrics.totalLifetimeCost);
    const avgAnnualCostMetrics = iterations.map(iter => iter.metrics.averageAnnualCost);
    
    formattedResults.metrics.totalLifetimeCost = DistributionFactory.calculatePercentiles(
      totalCostMetrics, 
      percentileValues
    );
    
    formattedResults.metrics.averageAnnualCost = DistributionFactory.calculatePercentiles(
      avgAnnualCostMetrics, 
      percentileValues
    );
    
    // Map to new format
    const newFormatResults = {
      total: {},
      components: {
        baseOM: {},
        failureRisk: {},
        majorRepairs: {},
        contingency: {}
      },
      metrics: {
        totalLifetimeCost: {},
        averageAnnualCost: {}
      }
    };
    
    // Convert to new format for total
    Object.entries(formattedResults.total).forEach(([oldKey, values]) => {
      const newKey = percentileMapping[oldKey] || oldKey;
      newFormatResults.total[newKey] = values;
    });
    
    // Convert to new format for components
    Object.keys(formattedResults.components).forEach(component => {
      Object.entries(formattedResults.components[component]).forEach(([oldKey, values]) => {
        const newKey = percentileMapping[oldKey] || oldKey;
        newFormatResults.components[component][newKey] = values;
      });
    });
    
    // Convert to new format for metrics
    Object.keys(formattedResults.metrics).forEach(metric => {
      Object.entries(formattedResults.metrics[metric]).forEach(([oldKey, value]) => {
        const newKey = percentileMapping[oldKey] || oldKey;
        newFormatResults.metrics[metric][newKey] = value;
      });
    });
    
    return newFormatResults;
  }

  /**
   * Validate module-specific inputs
   * @param {Object} data - Input data to validate
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateInputs(data) {
    const errors = [];
    const costParams = data.settings?.modules?.cost;
    
    if (!costParams) {
      return { isValid: false, errors: ['Cost parameters are required'] };
    }
    
    if (!costParams.annualBaseOM || costParams.annualBaseOM < 0) {
      errors.push('Annual base O&M must be a non-negative number');
    }
    
    if (costParams.escalationRate < 0) {
      errors.push('Escalation rate cannot be negative');
    }
    
    if (costParams.oemTerm < 0) {
      errors.push('OEM term cannot be negative');
    }
    
    if (costParams.fixedOMFee < 0) {
      errors.push('Fixed O&M fee cannot be negative');
    }
    
    if (costParams.failureEventProbability < 0 || costParams.failureEventProbability > 100) {
      errors.push('Failure event probability must be between 0 and 100');
    }
    
    if (costParams.failureEventCost < 0) {
      errors.push('Failure event cost cannot be negative');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a distribution for cost escalation based on parameters
   * @param {Object} costParams - Cost parameters
   * @returns {Function} Distribution function
   * @private
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
   * @param {Object} data - Full scenario data
   * @returns {Object|null} Active OEM contract or null
   * @private
   */
  _getActiveContract(data) {
    const oemContracts = data.settings?.modules?.contracts?.oemContracts || [];
    if (oemContracts.length === 0) return null;
    
    // Check if there's a contract ID in cost settings
    const costParams = data.settings?.modules?.cost;
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
   * @param {Object} activeContract - Active contract data
   * @returns {Object|null} Contract coverage or null
   * @private
   */
  _getContractCoverageForYear(year, activeContract) {
    if (!activeContract) return null;
    
    if (activeContract.years && activeContract.years.includes(year)) {
      return {
        fixedFee: activeContract.fixedFee || 0,
        isPerTurbine: activeContract.isPerTurbine || false
      };
    }
    
    return null;
  }
}

module.exports = CostModule;