// backend/services/modules/financingModule.js
const financial = require('financial');
const DistributionFactory = require('../monte-carlo/distributions');

class FinancingModule {
  constructor() {
    this.name = 'financing';
  }

  /**
   * Process a single iteration for the financing module
   * @param {Object} parameters - Full simulation parameters
   * @param {Object} iterationState - Current state of the iteration
   * @param {number} iterationIndex - Current iteration index
   * @returns {Object} Financing module results for this iteration
   */
  processIteration(parameters, iterationState, iterationIndex) {
    const { financing, general } = parameters;
    const projectLife = general.projectLife || 20;
    const loanDuration = general.loanDuration || 15;
    
    // Create results containers
    const result = {
      annualData: Array(projectLife).fill().map(() => ({})),
      metrics: {}
    };

    // Calculate initial cash flow (negative CAPEX and DEVEX)
    const initialInvestment = -((financing.capex || 0) + (financing.devex || 0));
    
    // Calculate debt service based on financing model
    const debtService = this._calculateDebtService(financing, loanDuration);
    
    // Calculate equity investment
    let equity;
    if (financing.model === 'Balance-Sheet') {
      equity = financing.equityInvestment || (financing.capex / (1 + financing.debtToEquityRatio));
    } else { // Project-Finance
      equity = financing.capex * (1 - financing.debtToCapexRatio);
    }
    
    // Process each year's debt service
    for (let year = 0; year < projectLife; year++) {
      const yearIndex = year + 1; // 1-based for business logic
      
      // Get debt service for this year
      const debtServiceAmount = yearIndex <= loanDuration ? debtService[year] : 0;
      
      // Store annual data
      result.annualData[year] = {
        debtService: debtServiceAmount
      };
      
      // If we have revenue and cost data from other modules, calculate DSCR
      if (iterationState.annualData && 
          iterationState.annualData[year] && 
          iterationState.annualData[year].revenue !== undefined && 
          iterationState.annualData[year].totalCost !== undefined) {
        
        const cashFlowBeforeDebt = iterationState.annualData[year].revenue - 
                                  iterationState.annualData[year].totalCost;
        
        // Calculate DSCR (Debt Service Coverage Ratio)
        const dscr = debtServiceAmount > 0 ? cashFlowBeforeDebt / debtServiceAmount : Infinity;
        
        // Store DSCR in annual data
        result.annualData[year].cashFlowBeforeDebt = cashFlowBeforeDebt;
        result.annualData[year].dscr = dscr;
        
        // Store cash flow for IRR calculation
        if (yearIndex === 1) {
          // In the first year, include the initial investment
          iterationState.cashFlows = [initialInvestment];
        }
        
        // Push this year's net cash flow to the array
        const netCashFlow = cashFlowBeforeDebt - debtServiceAmount;
        iterationState.cashFlows.push(netCashFlow);
      }
    }

    // Calculate metrics
    if (result.annualData.some(year => year.dscr !== undefined)) {
      const dscrValues = result.annualData
        .filter(year => year.dscr !== undefined && year.dscr !== Infinity)
        .map(year => year.dscr);
      
      result.metrics.minDSCR = dscrValues.length > 0 ? Math.min(...dscrValues) : Infinity;
      result.metrics.averageDSCR = dscrValues.length > 0 
        ? dscrValues.reduce((sum, val) => sum + val, 0) / dscrValues.length 
        : Infinity;
      result.metrics.dscrBelow1 = dscrValues.some(val => val < 1);
    }
    
    // Store equity information
    result.metrics.equity = equity;
    result.metrics.debtAmount = financing.model === 'Balance-Sheet' 
      ? equity * financing.debtToEquityRatio 
      : financing.capex * financing.debtToCapexRatio;
    
    return result;
  }

  /**
   * Calculate debt service schedule based on financing parameters
   * @param {Object} financingParams - Financing parameters
   * @param {number} loanDuration - Duration of the loan in years
   * @returns {Array<number>} Annual debt service amounts
   */
  _calculateDebtService(financingParams, loanDuration) {
    const debtService = Array(loanDuration).fill(0);
    
    if (financingParams.model === 'Balance-Sheet') {
      // Calculate debt amount based on equity and debt-to-equity ratio
      const equity = financingParams.equityInvestment || 
                    (financingParams.capex / (1 + financingParams.debtToEquityRatio));
      const debt = equity * financingParams.debtToEquityRatio;
      
      // Calculate annual payment using PMT formula
      const rate = financingParams.loanInterestRateBS / 100; // Convert from percentage
      const payment = financial.pmt(rate, loanDuration, debt);
      
      // Fill the debt service array with the same payment for each year
      debtService.fill(Math.abs(payment));
    } 
    else if (financingParams.model === 'Project-Finance') {
      // Calculate debt amount based on CAPEX and debt-to-CAPEX ratio
      const debt = financingParams.capex * financingParams.debtToCapexRatio;
      
      // Calculate annual payment using PMT formula
      const rate = financingParams.loanInterestRatePF / 100; // Convert from percentage
      const payment = financial.pmt(rate, loanDuration, debt);
      
      // Fill the debt service array with the same payment for each year
      debtService.fill(Math.abs(payment));
    }
    
    return debtService;
  }

  /**
   * Run a standalone financing module simulation
   * @param {Object} parameters - Financing parameters
   * @returns {Object} Financing module results
   */
  runStandalone(parameters) {
    const projectLife = parameters.general?.projectLife || 20;
    const loanDuration = parameters.general?.loanDuration || 15;
    
    // Create mock revenue and cost data
    const mockData = {
      revenue: 10000000, // $10M annual revenue
      cost: 5000000     // $5M annual cost
    };
    
    // Create mock iteration state
    const iterationState = {
      annualData: Array(projectLife).fill().map(() => ({
        revenue: mockData.revenue,
        totalCost: mockData.cost
      })),
      cashFlows: []
    };
    
    // Run a single iteration
    const result = this.processIteration(parameters, iterationState, 0);
    
    // Format results for API response
    return {
      success: true,
      moduleName: this.name,
      results: {
        metrics: result.metrics,
        annualData: {
          debtService: result.annualData.map(year => year.debtService),
          dscr: result.annualData.map(year => year.dscr || null)
        },
        scheduleSummary: {
          equityInvestment: result.metrics.equity,
          debtAmount: result.metrics.debtAmount,
          debtService: result.annualData.filter((_, i) => i < loanDuration).map(year => year.debtService),
          minimumDSCR: result.metrics.minDSCR,
          averageDSCR: result.metrics.averageDSCR
        }
      }
    };
  }
}

module.exports = FinancingModule;