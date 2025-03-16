// backend/services/monte-carlo/SimulationBridge.js

/**
 * Bridge class to handle data transfer between input and output simulations
 */
class SimulationBridge {
    /**
     * Transform input simulation results for output simulation
     * 
     * @param {Object} inputResults - Input simulation results
     * @returns {Object} Transformed data for output simulation
     */
    static bridgeInputToOutput(inputResults) {
      // Extract cashflow data if available
      const cashFlows = this._extractCashFlows(inputResults);
      
      // Extract annual metrics if available
      const annualMetrics = this._extractAnnualMetrics(inputResults);
      
      return {
        cashFlows,
        annualMetrics,
        rawInputData: inputResults
      };
    }
  
    /**
     * Extract structured cash flow data from input simulation results
     * 
     * @param {Object} inputResults - Input simulation results
     * @returns {Object} Structured cash flow data
     * @private
     */
    static _extractCashFlows(inputResults) {
      const cashflows = {
        primary: [],
        upperBound: [],
        lowerBound: [],
        extremeUpper: [],
        extremeLower: []
      };
      
      // Map percentile keys to internal keys
      const keyMapping = {
        'Pprimary': 'primary',
        'Pupper_bound': 'upperBound',
        'Plower_bound': 'lowerBound',
        'Pextreme_upper': 'extremeUpper',
        'Pextreme_lower': 'extremeLower'
      };
      
      // Extract revenues
      const revenueData = inputResults?.cashflow?.annualRevenue || {};
      
      // Extract costs
      const costData = inputResults?.cashflow?.annualCosts?.total || {};
      
      // Directly use net cash flow if available
      const netCashFlowData = inputResults?.cashflow?.netCashFlow || {};
      
      // Process each percentile
      Object.entries(keyMapping).forEach(([resultKey, internalKey]) => {
        if (netCashFlowData[resultKey]) {
          // Use pre-calculated net cash flow
          cashflows[internalKey] = netCashFlowData[resultKey];
        } else if (revenueData[resultKey] && costData[resultKey]) {
          // Calculate net cash flow from revenue and cost
          const revenues = revenueData[resultKey];
          const costs = costData[resultKey];
          
          if (Array.isArray(revenues) && Array.isArray(costs) && revenues.length === costs.length) {
            cashflows[internalKey] = revenues.map((rev, i) => rev - costs[i]);
          }
        }
      });
      
      return cashflows;
    }
  
    /**
     * Extract annual metrics from input simulation results
     * 
     * @param {Object} inputResults - Input simulation results
     * @returns {Object} Structured annual metrics
     * @private
     */
    static _extractAnnualMetrics(inputResults) {
      return {
        dscr: inputResults?.cashflow?.dscr || {},
        revenue: inputResults?.cashflow?.annualRevenue || {},
        costs: inputResults?.cashflow?.annualCosts?.total || {}
      };
    }
  }
  
  module.exports = SimulationBridge;