// backend/services/modules/revenueModule.js
const DistributionFactory = require('../monte-carlo/distributions');

class RevenueModule {
  constructor() {
    this.name = 'revenue';
  }

  /**
   * Process a single iteration for the revenue module
   * @param {Object} parameters - Full simulation parameters
   * @param {Object} iterationState - Current state of the iteration
   * @param {number} iterationIndex - Current iteration index
   * @returns {Object} Revenue module results for this iteration
   */
  processIteration(parameters, iterationState, iterationIndex) {
    const { revenue, cost, general, annualAdjustments = [] } = parameters;
    const projectLife = general.projectLife || 20;
    
    // Create results containers
    const result = {
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    };

    // Create distribution generators
    const energyProductionDist = this._createEnergyProductionDistribution(revenue);
    const electricityPriceDist = this._createElectricityPriceDistribution(revenue);
    const downtimeDist = this._createDowntimeDistribution(revenue);
    
    // Process each year
    for (let year = 0; year < projectLife; year++) {
      const yearIndex = year + 1; // 1-based for business logic
      
      // Energy production with degradation
      const degradationFactor = Math.pow(1 - (revenue.revenueDegradationRate || 0) / 100, year);
      const baseEnergyProduction = energyProductionDist();
      const energyProduction = baseEnergyProduction * degradationFactor;
      
      // Electricity price
      const electricityPrice = electricityPriceDist();
      
      // Calculate base revenue
      let grossRevenue = energyProduction * electricityPrice;
      
      // Apply downtime due to failures (if any)
      let downtimeHours = 0;
      let revenueLoss = 0;
      
      // Check if there's a failure event in this year (use same probability as cost module)
      const failureProbability = (cost?.failureEventProbability || 0) / 100;
      if (Math.random() < failureProbability) {
        downtimeHours = downtimeDist();
        // Convert downtime to lost production (as a fraction of the year)
        const downtimeFraction = downtimeHours / 8760; // hours in a year
        revenueLoss = grossRevenue * downtimeFraction;
      }
      
      // Apply any manual revenue adjustments
      const manualAdjustment = annualAdjustments[year]?.additionalRevenue || 0;
      
      // Calculate net revenue
      const netRevenue = grossRevenue - revenueLoss + manualAdjustment;
      
      // Store annual data
      result.annualData[year] = {
        energyProduction,
        electricityPrice,
        grossRevenue,
        downtimeHours,
        revenueLoss,
        manualRevenueAdjustment: manualAdjustment,
        revenue: netRevenue
      };
    }

    // Calculate metrics
    const revenueArray = result.annualData.map(year => year.revenue);
    result.metrics.totalLifetimeRevenue = revenueArray.reduce((sum, rev) => sum + rev, 0);
    result.metrics.averageAnnualRevenue = result.metrics.totalLifetimeRevenue / projectLife;
    
    return result;
  }

  /**
   * Create a distribution for energy production based on parameters
   * @param {Object} revenueParams - Revenue parameters
   * @returns {Function} Distribution function
   */
  _createEnergyProductionDistribution(revenueParams) {
    const { energyProduction } = revenueParams;
    const distribution = energyProduction.distribution || 'Fixed';
    const baseProduction = energyProduction.mean || 1000;
    
    switch (distribution) {
      case 'Normal':
        return DistributionFactory.createDistribution('normal', {
          mean: baseProduction,
          std: energyProduction.std || (baseProduction * 0.1) // Default 10% of mean
        });
      
      case 'Triangular':
        return DistributionFactory.createDistribution('triangular', {
          min: energyProduction.min || (baseProduction * 0.8),
          mode: baseProduction,
          max: energyProduction.max || (baseProduction * 1.2)
        });
      
      case 'Uniform':
        return DistributionFactory.createDistribution('uniform', {
          min: energyProduction.min || (baseProduction * 0.8),
          max: energyProduction.max || (baseProduction * 1.2)
        });
      
      default:
        // Fixed value as fallback
        return () => baseProduction;
    }
  }

  /**
   * Create a distribution for electricity price based on parameters
   * @param {Object} revenueParams - Revenue parameters
   * @returns {Function} Distribution function
   */
  _createElectricityPriceDistribution(revenueParams) {
    const { electricityPrice } = revenueParams;
    const isFixed = electricityPrice.type === 'fixed';
    const basePrice = electricityPrice.value || 50;
    
    if (isFixed) {
      return () => basePrice;
    }
    
    // For variable prices
    const distribution = electricityPrice.distribution || 'Normal';
    
    switch (distribution) {
      case 'Normal':
        return DistributionFactory.createDistribution('normal', {
          mean: basePrice,
          std: basePrice * 0.1 // Default 10% of mean
        });
      
      case 'Lognormal':
        return DistributionFactory.createDistribution('lognormal', {
          mean: Math.log(basePrice),
          sigma: 0.1
        });
      
      case 'Triangular':
        return DistributionFactory.createDistribution('triangular', {
          min: basePrice * 0.7,
          mode: basePrice,
          max: basePrice * 1.3
        });
      
      case 'Uniform':
        return DistributionFactory.createDistribution('uniform', {
          min: basePrice * 0.7,
          max: basePrice * 1.3
        });
      
      default:
        // Fixed value as fallback
        return () => basePrice;
    }
  }

  /**
   * Create a distribution for downtime hours based on parameters
   * @param {Object} revenueParams - Revenue parameters
   * @returns {Function} Distribution function
   */
  _createDowntimeDistribution(revenueParams) {
    const { downtimePerEvent } = revenueParams;
    
    if (!downtimePerEvent) {
      return () => 24; // Default 24 hours if not specified
    }
    
    const distribution = downtimePerEvent.distribution || 'Weibull';
    
    switch (distribution) {
      case 'Weibull':
        return DistributionFactory.createDistribution('weibull', {
          scale: downtimePerEvent.scale || 24,
          shape: downtimePerEvent.shape || 1.5
        });
      
      case 'Lognormal':
        return DistributionFactory.createDistribution('lognormal', {
          mean: Math.log(downtimePerEvent.scale || 24),
          sigma: downtimePerEvent.shape || 0.5
        });
      
      case 'Exponential':
        return DistributionFactory.createDistribution('exponential', {
          lambda: 1 / (downtimePerEvent.scale || 24)
        });
      
      default:
        // Fixed value as fallback
        return () => downtimePerEvent.scale || 24;
    }
  }

  /**
   * Run a standalone revenue module simulation
   * @param {Object} parameters - Revenue parameters
   * @returns {Object} Revenue module results
   */
  runStandalone(parameters) {
    const projectLife = parameters.general?.projectLife || 20;
    const iterations = parameters.simulation?.iterations || 10000;
    
    // Get percentile values from parameters or use defaults
    const percentiles = this._getPercentileValues(parameters);
    const percentileValues = [
      percentiles.extremeLower,
      percentiles.lowerBound,
      percentiles.primary,
      percentiles.upperBound,
      percentiles.extremeUpper
    ];
    
    // Create percentile labels (P10, P50, etc.)
    const percentileLabels = percentileValues.map(p => `P${p}`);
    
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
        energyProduction: {},
        electricityPrice: {},
        grossRevenue: {},
        revenueLoss: {},
        revenue: {}
      }
    };
    
    // Initialize percentile arrays
    percentileLabels.forEach(label => {
      Object.keys(results.annualData).forEach(field => {
        results.annualData[field][label] = [];
      });
    });
    
    // Process metric percentiles
    const metricNames = Object.keys(iterationResults[0].metrics);
    metricNames.forEach(metric => {
      const values = iterationResults.map(iter => iter.metrics[metric]);
      results.metrics[metric] = DistributionFactory.calculatePercentiles(values, percentileValues);
    });
    
    // Process annual data percentiles
    for (let year = 0; year < projectLife; year++) {
      Object.keys(results.annualData).forEach(field => {
        const yearValues = iterationResults.map(iter => iter.annualData[year][field] || 0);
        const percentiles = DistributionFactory.calculatePercentiles(yearValues, percentileValues);
        
        // Add values for each percentile
        percentileLabels.forEach(label => {
          results.annualData[field][label].push(percentiles[label]);
        });
      });
    }
    
    return {
      success: true,
      moduleName: this.name,
      percentileInfo: percentiles, // Include percentile info for reference
      results
    };
  }
  
  /**
   * Get percentile values from parameters or use defaults
   * @param {Object} parameters - Simulation parameters
   * @returns {Object} Percentile values
   */
  _getPercentileValues(parameters) {
    // Get probability values from parameters or use defaults
    const probabilities = parameters.probabilities || {};
    
    return {
      primary: probabilities.primary || 50,      // Default: P50 (median)
      upperBound: probabilities.upperBound || 75, // Default: P75
      lowerBound: probabilities.lowerBound || 25, // Default: P25
      extremeLower: probabilities.extremeLower || 10, // Default: P10
      extremeUpper: probabilities.extremeUpper || 90  // Default: P90
    };
  }
}

module.exports = RevenueModule;