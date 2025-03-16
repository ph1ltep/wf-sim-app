// backend/services/modules/irrModule.js
const SimulationModule = require('../monte-carlo/SimulationModule');
const FinancialFormatter = require('../monte-carlo/FinancialFormatter');
const financial = require('financial');

class IRRModule extends SimulationModule {
  constructor(config = {}) {
    super('irr', config);
  }
  
  prepareInputData(data) {
    // Extract relevant data for IRR calculation
    return {
      projectLife: data.project?.life || 20,
      bridgeData: data.bridgeData,
      settings: data.settings
    };
  }
  
  processIteration(context, state, iterationIndex) {
    const { projectLife, bridgeData } = context;
    
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
    
    // Calculate IRR using financial library
    let irr;
    try {
      irr = financial.irr(cashFlows);
      // Handle invalid IRR (e.g., when all cash flows are negative)
      if (isNaN(irr) || !isFinite(irr) || irr < -1 || irr > 1) {
        irr = 0;
      }
    } catch (error) {
      console.warn('Error calculating IRR:', error);
      irr = 0;
    }
    
    return {
      irr,
      cashFlows
    };
  }
  
  formatResults(iterations, percentiles) {
    // Extract IRR values from iterations
    const irrValues = iterations.map(iter => iter.irr).filter(val => !isNaN(val) && isFinite(val));
    
    // Format using the financial formatter
    return FinancialFormatter.formatIRR(irrValues, percentiles);
  }
}

module.exports = IRRModule;