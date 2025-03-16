// backend/services/modules/npvModule.js
const SimulationModule = require('../monte-carlo/SimulationModule');
const FinancialFormatter = require('../monte-carlo/FinancialFormatter');
const financial = require('financial');

class NPVModule extends SimulationModule {
  constructor(config = {}) {
    super('npv', config);
  }
  
  prepareInputData(data) {
    // Extract relevant data for NPV calculation
    return {
      projectLife: data.project?.life || 20,
      bridgeData: data.bridgeData,
      settings: data.settings,
      discountRate: data.settings?.modules?.financing?.discountRate || 0.08 // Default 8%
    };
  }
  
  processIteration(context, state, iterationIndex) {
    const { projectLife, bridgeData, discountRate } = context;
    
    // Get cash flows for this iteration
    let cashFlows = [];
    
    if (bridgeData && bridgeData.cashFlows && bridgeData.cashFlows.primary) {
      // Use predetermined cash flows from input simulation
      cashFlows = [bridgeData.cashFlows.initialInvestment, ...bridgeData.cashFlows.primary];
    } else {
      // Generate mock cash flows if bridge data not available
      const initialInvestment = -(context.settings?.modules?.financing?.capex || 50000000);
      cashFlows = [initialInvestment];
      
      // Generate random annual cash flows
      for (let year = 0; year < projectLife; year++) {
        // Mock cash flow that starts negative and becomes positive
        const baseFlow = -initialInvestment * 0.2 + year * initialInvestment * 0.05;
        const randomFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
        cashFlows.push(baseFlow * randomFactor);
      }
    }
    
    // Calculate NPV using financial library
    let npv;
    try {
      npv = financial.npv(discountRate, cashFlows);
    } catch (error) {
      console.warn('Error calculating NPV:', error);
      npv = 0;
    }
    
    return {
      npv,
      cashFlows,
      discountRate
    };
  }
  
  formatResults(iterations, percentiles) {
    // Extract NPV values from iterations
    const npvValues = iterations.map(iter => iter.npv).filter(val => !isNaN(val) && isFinite(val));
    
    // Format using the financial formatter
    return FinancialFormatter.formatNPV(npvValues, percentiles);
  }
}

module.exports = NPVModule;