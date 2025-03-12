// backend/services/modules/riskModule.js
const DistributionFactory = require('../monte-carlo/distributions');

class RiskModule {
  constructor() {
    this.name = 'risk';
  }

  /**
   * Process a single iteration for the risk mitigation module
   * @param {Object} parameters - Full simulation parameters
   * @param {Object} iterationState - Current state of the iteration
   * @param {number} iterationIndex - Current iteration index
   * @returns {Object} Risk module results for this iteration
   */
  processIteration(parameters, iterationState, iterationIndex) {
    const { riskMitigation, general } = parameters;
    const projectLife = general.projectLife || 20;
    
    // Create results containers
    const result = {
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    };

    // If insurance is enabled, apply it to the annual failure costs
    if (riskMitigation.insuranceEnabled && iterationState.annualData) {
      let totalInsurancePremiums = 0;
      let totalRiskMitigated = 0;
      
      for (let year = 0; year < projectLife; year++) {
        // Add insurance premium to costs
        const insurancePremium = riskMitigation.insurancePremium || 0;
        totalInsurancePremiums += insurancePremium;
        
        // If there's a failure event cost in this year, apply the insurance deductible
        if (iterationState.annualData[year] && 
            iterationState.annualData[year].failureEventCost) {
          
          const originalFailureCost = iterationState.annualData[year].failureEventCost;
          const deductible = riskMitigation.insuranceDeductible || 0;
          
          // Calculate insurance payout (max of zero to prevent negative payouts)
          const insurancePayout = Math.max(0, originalFailureCost - deductible);
          totalRiskMitigated += insurancePayout;
          
          // Store risk mitigation data for this year
          result.annualData[year] = {
            insurancePremium,
            originalFailureCost,
            insurancePayout,
            netFailureCost: originalFailureCost - insurancePayout,
            riskMitigationRatio: originalFailureCost > 0 ? insurancePayout / originalFailureCost : 0
          };
        } else {
          // No failure event this year, still pay premium
          result.annualData[year] = {
            insurancePremium,
            originalFailureCost: 0,
            insurancePayout: 0,
            netFailureCost: 0,
            riskMitigationRatio: 0
          };
        }
      }
      
      // Calculate risk mitigation metrics
      result.metrics.totalInsurancePremiums = totalInsurancePremiums;
      result.metrics.totalRiskMitigated = totalRiskMitigated;
      result.metrics.netRiskMitigationValue = totalRiskMitigated - totalInsurancePremiums;
      result.metrics.riskMitigationROI = totalInsurancePremiums > 0 
        ? totalRiskMitigated / totalInsurancePremiums 
        : 0;
    } 
    else {
      // No risk mitigation, just fill with zeros
      for (let year = 0; year < projectLife; year++) {
        result.annualData[year] = {
          insurancePremium: 0,
          originalFailureCost: iterationState.annualData?.[year]?.failureEventCost || 0,
          insurancePayout: 0,
          netFailureCost: iterationState.annualData?.[year]?.failureEventCost || 0,
          riskMitigationRatio: 0
        };
      }
      
      // Set metrics to zero
      result.metrics.totalInsurancePremiums = 0;
      result.metrics.totalRiskMitigated = 0;
      result.metrics.netRiskMitigationValue = 0;
      result.metrics.riskMitigationROI = 0;
    }
    
    // If reserve funds are specified, model their impact
    if (riskMitigation.reserveFunds > 0 && iterationState.annualData) {
      const reserveFunds = riskMitigation.reserveFunds;
      let remainingReserve = reserveFunds;
      let totalReserveUsed = 0;
      
      for (let year = 0; year < projectLife; year++) {
        if (iterationState.annualData[year]?.cashFlowBeforeDebt < 0) {
          // Negative cash flow, use reserve if available
          const deficit = Math.abs(iterationState.annualData[year].cashFlowBeforeDebt);
          const reserveUsed = Math.min(deficit, remainingReserve);
          
          remainingReserve -= reserveUsed;
          totalReserveUsed += reserveUsed;
          
          // Update annual data with reserve fund impact
          result.annualData[year].reserveUsed = reserveUsed;
          result.annualData[year].reserveRemaining = remainingReserve;
        } else {
          // No need to use reserve this year
          result.annualData[year].reserveUsed = 0;
          result.annualData[year].reserveRemaining = remainingReserve;
        }
      }
      
      // Add reserve metrics
      result.metrics.initialReserveFunds = reserveFunds;
      result.metrics.totalReserveUsed = totalReserveUsed;
      result.metrics.remainingReserve = remainingReserve;
      result.metrics.reserveUtilizationRate = reserveFunds > 0 ? totalReserveUsed / reserveFunds : 0;
    }
    
    return result;
  }

  /**
   * Run a standalone risk mitigation module simulation
   * @param {Object} parameters - Risk mitigation parameters
   * @returns {Object} Risk mitigation module results
   */
  runStandalone(parameters) {
    const projectLife = parameters.general?.projectLife || 20;
    const iterations = parameters.simulation?.iterations || 10000;
    const failureEventProbability = parameters.cost?.failureEventProbability || 5;
    const failureEventCost = parameters.cost?.failureEventCost || 200000;
    
    // Results container
    const iterationResults = [];
    
    // Run iterations
    for (let i = 0; i < iterations; i++) {
      // Create mock iteration state with random failure events
      const mockIterationState = {
        annualData: Array(projectLife).fill().map(() => {
          // Simulate failure events based on probability
          const hasFailure = Math.random() < (failureEventProbability / 100);
          return {
            failureEventCost: hasFailure ? failureEventCost : 0,
            cashFlowBeforeDebt: 1000000 - (hasFailure ? failureEventCost : 0) // Simplified cash flow
          };
        })
      };
      
      // Process this iteration
      const result = this.processIteration(parameters, mockIterationState, i);
      iterationResults.push(result);
    }
    
    // Calculate percentiles for metrics
    const results = {
      metrics: {},
      annualData: {
        insurancePremium: { P50: Array(projectLife).fill(0) },
        insurancePayout: { P10: [], P50: [], P90: [] },
        netFailureCost: { P10: [], P50: [], P90: [] },
        reserveUsed: parameters.riskMitigation.reserveFunds > 0 ? { P10: [], P50: [], P90: [] } : null
      }
    };
    
    // Process metric percentiles
    const metricNames = Object.keys(iterationResults[0].metrics);
    metricNames.forEach(metric => {
      const values = iterationResults.map(iter => iter.metrics[metric]);
      results.metrics[metric] = DistributionFactory.calculatePercentiles(values);
    });
    
    // Process annual data percentiles
    for (let year = a; year < projectLife; year++) {
      ['insurancePayout', 'netFailureCost'].forEach(field => {
        const yearValues = iterationResults.map(iter => iter.annualData[year][field] || 0);
        const percentiles = DistributionFactory.calculatePercentiles(yearValues);
        
        results.annualData[field].P10.push(percentiles.P10);
        results.annualData[field].P50.push(percentiles.P50);
        results.annualData[field].P90.push(percentiles.P90);
      });
      
      // Set fixed insurance premium values
      results.annualData.insurancePremium.P50[year] = 
        parameters.riskMitigation.insuranceEnabled ? 
        parameters.riskMitigation.insurancePremium : 0;
      
      // Process reserve data if applicable
      if (parameters.riskMitigation.reserveFunds > 0) {
        const reserveValues = iterationResults.map(iter => iter.annualData[year].reserveUsed || 0);
        const percentiles = DistributionFactory.calculatePercentiles(reserveValues);
        
        results.annualData.reserveUsed.P10.push(percentiles.P10);
        results.annualData.reserveUsed.P50.push(percentiles.P50);
        results.annualData.reserveUsed.P90.push(percentiles.P90);
      }
    }
    
    return {
      success: true,
      moduleName: this.name,
      results
    };
  }
}

module.exports = RiskModule;