// backend/services/modules/paybackModule.js
const SimulationModule = require('../monte-carlo/SimulationModule');
const FinancialFormatter = require('../monte-carlo/FinancialFormatter');

class PaybackModule extends SimulationModule {
  constructor(config = {}) {
    super('payback', config);
  }
  
  prepareInputData(data) {
    // Extract relevant data for payback calculation
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
    
    // Calculate payback period
    let paybackPeriod = null;
    let cumulativeCashFlow = cashFlows[0]; // Initial investment (negative)
    let yearOfPayback = -1;
    
    for (let year = 1; year < cashFlows.length; year++) {
      const previousCumulativeCashFlow = cumulativeCashFlow;
      cumulativeCashFlow += cashFlows[year];
      
      if (previousCumulativeCashFlow < 0 && cumulativeCashFlow >= 0) {
        // Payback occurs during this year - calculate fraction of year
        const fractionOfYear = Math.abs(previousCumulativeCashFlow) / 
                               (cashFlows[year]);
        
        paybackPeriod = year - 1 + fractionOfYear;
        yearOfPayback = year;
        break;
      }
    }
    
    // If still negative at end of project life, no payback
    if (paybackPeriod === null) {
      paybackPeriod = projectLife;
    }
    
    return {
      paybackPeriod,
      yearOfPayback,
      cashFlows
    };
  }
  
  formatResults(iterations, percentiles) {
    // Extract payback values from iterations
    const paybackValues = iterations.map(iter => iter.paybackPeriod)
                                   .filter(val => !isNaN(val) && isFinite(val));
    
    // Format using the financial formatter
    return FinancialFormatter.formatPayback(paybackValues, percentiles);
  }
}

module.exports = PaybackModule;