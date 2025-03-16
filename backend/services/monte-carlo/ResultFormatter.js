// backend/services/monte-carlo/ResultFormatter.js
const DistributionFactory = require('./distributions');

/**
 * Utility class for formatting simulation results
 */
class ResultFormatter {
  /**
   * Transform simulation results to match the expected output schema
   * 
   * @param {Object} rawResults - Raw results from the simulation
   * @param {Object} percentiles - Percentile configuration
   * @param {boolean} isInputSim - Whether this is an input or output simulation
   * @returns {Object} Formatted results matching the schema requirements
   */
  static formatResults(rawResults, percentiles, isInputSim = true) {
    if (isInputSim) {
      return this.formatInputResults(rawResults, percentiles);
    } else {
      return this.formatOutputResults(rawResults, percentiles);
    }
  }

  /**
   * Format input simulation results
   * 
   * @param {Object} rawResults - Raw results from the simulation
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted input simulation results
   */
  static formatInputResults(rawResults, percentiles) {
    // Map traditional percentile keys (P50) to new format (Pprimary)
    const percentileMapping = this._getPercentileMapping(percentiles);
    
    // Initialize input simulation result structure
    const inputSim = {
      cashflow: {
        annualCosts: {
          total: {},
          components: {
            baseOM: {},
            failureRisk: {},
            majorRepairs: {},
            contingency: {}
          }
        },
        annualRevenue: {},
        dscr: {},
        netCashFlow: {}
      },
      risk: {
        failureRates: {},
        eventProbabilities: {}
      },
      scope: {
        responsibilityMatrix: null
      }
    };
    
    // Process cost module results
    if (rawResults.summary?.cost) {
      const costResults = rawResults.summary.cost;
      
      // Map total costs
      if (costResults.total) {
        Object.keys(costResults.total).forEach(oldKey => {
          const newKey = percentileMapping[oldKey] || oldKey;
          inputSim.cashflow.annualCosts.total[newKey] = costResults.total[oldKey];
        });
      }
      
      // Map component costs
      if (costResults.components) {
        Object.keys(costResults.components).forEach(component => {
          if (inputSim.cashflow.annualCosts.components[component]) {
            Object.keys(costResults.components[component]).forEach(oldKey => {
              const newKey = percentileMapping[oldKey] || oldKey;
              inputSim.cashflow.annualCosts.components[component][newKey] = 
                costResults.components[component][oldKey];
            });
          }
        });
      }
    }
    
    // Process revenue module results
    if (rawResults.summary?.revenue) {
      const revenueResults = rawResults.summary.revenue;
      
      // Map annual revenue
      if (revenueResults.annualRevenue) {
        Object.keys(revenueResults.annualRevenue).forEach(oldKey => {
          const newKey = percentileMapping[oldKey] || oldKey;
          inputSim.cashflow.annualRevenue[newKey] = revenueResults.annualRevenue[oldKey];
        });
      }
    }
    
    // Process financing module results
    if (rawResults.summary?.financing) {
      const financingResults = rawResults.summary.financing;
      
      // Map DSCR
      if (financingResults.dscr) {
        Object.keys(financingResults.dscr).forEach(oldKey => {
          const newKey = percentileMapping[oldKey] || oldKey;
          inputSim.cashflow.dscr[newKey] = financingResults.dscr[oldKey];
        });
      }
    }
    
    // Calculate and map net cash flow
    if (inputSim.cashflow.annualRevenue && inputSim.cashflow.annualCosts.total) {
      Object.keys(percentileMapping).forEach(oldKey => {
        const newKey = percentileMapping[oldKey];
        const revenueKey = Object.keys(inputSim.cashflow.annualRevenue).find(k => 
          k === newKey || k === oldKey
        );
        const costKey = Object.keys(inputSim.cashflow.annualCosts.total).find(k => 
          k === newKey || k === oldKey
        );
        
        if (revenueKey && costKey) {
          const revenue = inputSim.cashflow.annualRevenue[revenueKey];
          const cost = inputSim.cashflow.annualCosts.total[costKey];
          
          if (Array.isArray(revenue) && Array.isArray(cost) && revenue.length === cost.length) {
            inputSim.cashflow.netCashFlow[newKey] = revenue.map((rev, i) => rev - cost[i]);
          }
        }
      });
    }
    
    // Process risk module results if available
    if (rawResults.summary?.risk) {
      const riskResults = rawResults.summary.risk;
      
      // Map failure rates
      if (riskResults.failureRates) {
        Object.keys(riskResults.failureRates).forEach(oldKey => {
          const newKey = percentileMapping[oldKey] || oldKey;
          inputSim.risk.failureRates[newKey] = riskResults.failureRates[oldKey];
        });
      }
      
      // Map event probabilities
      if (riskResults.eventProbabilities) {
        Object.keys(riskResults.eventProbabilities).forEach(oldKey => {
          const newKey = percentileMapping[oldKey] || oldKey;
          inputSim.risk.eventProbabilities[newKey] = riskResults.eventProbabilities[oldKey];
        });
      }
    }
    
    // Add responsibility matrix if available
    if (rawResults.responsibilityMatrix) {
      inputSim.scope.responsibilityMatrix = rawResults.responsibilityMatrix;
    }
    
    return inputSim;
  }

  /**
   * Format output simulation results
   * 
   * @param {Object} rawResults - Raw results from the simulation
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Formatted output simulation results
   */
  static formatOutputResults(rawResults, percentiles) {
    // Map traditional percentile keys (P50) to new format (Pprimary)
    const percentileMapping = this._getPercentileMapping(percentiles);
    
    // Initialize output simulation result structure
    const outputSim = {
      IRR: {},
      NPV: {},
      paybackPeriod: {},
      minDSCR: {}
    };
    
    // Process IRR
    if (rawResults.summary?.irr) {
      Object.keys(rawResults.summary.irr).forEach(oldKey => {
        const newKey = percentileMapping[oldKey] || oldKey;
        outputSim.IRR[newKey] = rawResults.summary.irr[oldKey];
      });
    }
    
    // Process NPV
    if (rawResults.summary?.npv) {
      Object.keys(rawResults.summary.npv).forEach(oldKey => {
        const newKey = percentileMapping[oldKey] || oldKey;
        outputSim.NPV[newKey] = rawResults.summary.npv[oldKey];
      });
    }
    
    // Process payback period
    if (rawResults.summary?.payback) {
      Object.keys(rawResults.summary.payback).forEach(oldKey => {
        const newKey = percentileMapping[oldKey] || oldKey;
        outputSim.paybackPeriod[newKey] = rawResults.summary.payback[oldKey];
      });
    }
    
    // Process min DSCR
    if (rawResults.summary?.financing?.minDSCR) {
      Object.keys(rawResults.summary.financing.minDSCR).forEach(oldKey => {
        const newKey = percentileMapping[oldKey] || oldKey;
        outputSim.minDSCR[newKey] = rawResults.summary.financing.minDSCR[oldKey];
      });
    }
    
    return outputSim;
  }

  /**
   * Format percentile-based results
   * 
   * @param {Array} values - Values to calculate percentiles for
   * @param {Object} percentiles - Percentile definitions
   * @returns {Object} Formatted percentile results
   */
  static formatPercentiles(values, percentiles) {
    // Extract percentile values
    const percentileValues = [
      percentiles.extremeLower,
      percentiles.lowerBound,
      percentiles.primary,
      percentiles.upperBound,
      percentiles.extremeUpper
    ];
    
    // Calculate percentiles
    const percentileResults = DistributionFactory.calculatePercentiles(values, percentileValues);
    
    // Map to new format
    const mappedResults = {};
    const percentileMapping = this._getPercentileMapping(percentiles);
    
    Object.entries(percentileResults).forEach(([oldKey, value]) => {
      const newKey = percentileMapping[oldKey] || oldKey;
      mappedResults[newKey] = value;
    });
    
    return mappedResults;
  }

  /**
   * Format time series data with percentiles
   * 
   * @param {Array<Array<number>>} timeSeriesData - Array of time series arrays
   * @param {Object} percentiles - Percentile definitions
   * @returns {Object} Formatted time series with percentiles
   */
  static formatTimeSeries(timeSeriesData, percentiles) {
    // Extract percentile values
    const percentileValues = [
      percentiles.extremeLower,
      percentiles.lowerBound,
      percentiles.primary,
      percentiles.upperBound,
      percentiles.extremeUpper
    ];
    
    // Initialize result structure
    const result = {};
    const percentileMapping = this._getPercentileMapping(percentiles);
    
    // Initialize arrays for each percentile
    Object.keys(percentileMapping).forEach(oldKey => {
      const newKey = percentileMapping[oldKey];
      result[newKey] = [];
    });
    
    // Calculate percentiles for each time period
    const periods = timeSeriesData[0]?.length || 0;
    
    for (let period = 0; period < periods; period++) {
      // Extract values for this period across all iterations
      const periodValues = timeSeriesData.map(series => series[period]);
      
      // Calculate percentiles
      const periodPercentiles = DistributionFactory.calculatePercentiles(
        periodValues, 
        percentileValues
      );
      
      // Store in result
      Object.entries(periodPercentiles).forEach(([oldKey, value]) => {
        const newKey = percentileMapping[oldKey];
        result[newKey].push(value);
      });
    }
    
    return result;
  }

  /**
   * Get mapping from traditional percentile keys to new format
   * 
   * @param {Object} percentiles - Percentile configuration
   * @returns {Object} Mapping from old to new keys
   * @private
   */
  static _getPercentileMapping(percentiles) {
    return {
      [`P${percentiles.extremeLower}`]: 'Pextreme_lower',
      [`P${percentiles.lowerBound}`]: 'Plower_bound',
      [`P${percentiles.primary}`]: 'Pprimary',
      [`P${percentiles.upperBound}`]: 'Pupper_bound',
      [`P${percentiles.extremeUpper}`]: 'Pextreme_upper'
    };
  }
}

module.exports = ResultFormatter;