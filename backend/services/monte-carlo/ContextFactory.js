// backend/services/monte-carlo/ContextFactory.js
const OEMScope = require('../../models/OEMScope');

/**
 * Factory class for creating standardized simulation contexts
 */
class ContextFactory {
  /**
   * Create a standardized input simulation context from scenario settings
   * @param {Object} settings - Scenario settings
   * @param {Array} oemScopes - Optional pre-fetched OEM scopes
   * @returns {Object} Standardized input context
   */
  static async createInputContext(settings, oemScopes = null) {
    // Load OEM scopes if not provided
    let scopesData = oemScopes;
    if (!scopesData && settings?.modules?.contracts?.oemContracts) {
      const oemContracts = settings.modules.contracts.oemContracts;
      const oemScopeIds = oemContracts
        .map(contract => contract.oemScopeId)
        .filter(Boolean);
      
      if (oemScopeIds.length > 0) {
        scopesData = await OEMScope.find({ _id: { $in: oemScopeIds } });
      }
    }

    // Create contract map for easier lookups
    const contractMap = new Map();
    const oemScopeMap = new Map();
    
    // Map OEM scopes by id
    if (scopesData && Array.isArray(scopesData)) {
      scopesData.forEach(scope => {
        oemScopeMap.set(scope._id.toString(), scope);
      });
    }
    
    // Process contracts and link to their scopes
    if (settings?.modules?.contracts?.oemContracts) {
      settings.modules.contracts.oemContracts.forEach(contract => {
        // Enhance contract with full scope data if available
        const enhancedContract = { ...contract };
        
        if (contract.oemScopeId && oemScopeMap.has(contract.oemScopeId)) {
          enhancedContract.scope = oemScopeMap.get(contract.oemScopeId);
        }
        
        // Add to map
        contractMap.set(contract.id, enhancedContract);
        
        // Also map contracts to years they cover
        if (contract.years && Array.isArray(contract.years)) {
          contract.years.forEach(year => {
            if (!contractMap.has(`year_${year}`)) {
              contractMap.set(`year_${year}`, []);
            }
            contractMap.get(`year_${year}`).push(enhancedContract);
          });
        }
      });
    }

    // Build annual adjustments
    const projectLife = settings?.general?.projectLife || 20;
    const annualAdjustments = Array(projectLife).fill().map((_, i) => ({
      year: i + 1,
      additionalOM: 0,
      additionalRevenue: 0
    }));
    
    // Process cost adjustments
    if (settings?.modules?.cost?.adjustments) {
      settings.modules.cost.adjustments.forEach(adjustment => {
        adjustment.years.forEach(year => {
          if (year >= 1 && year <= projectLife) {
            annualAdjustments[year - 1].additionalOM += adjustment.amount;
          }
        });
      });
    }
    
    // Process revenue adjustments
    if (settings?.modules?.revenue?.adjustments) {
      settings.modules.revenue.adjustments.forEach(adjustment => {
        adjustment.years.forEach(year => {
          if (year >= 1 && year <= projectLife) {
            annualAdjustments[year - 1].additionalRevenue += adjustment.amount;
          }
        });
      });
    }

    // Prepare the context
    return {
      // Project information
      project: {
        name: settings?.general?.projectName || 'Wind Farm Project',
        life: projectLife,
        numWTGs: settings?.project?.windFarm?.numWTGs || 20,
        mwPerWTG: settings?.project?.windFarm?.mwPerWTG || 3.5,
        capacityFactor: settings?.project?.windFarm?.capacityFactor || 35,
        curtailmentLosses: settings?.project?.windFarm?.curtailmentLosses || 0,
        electricalLosses: settings?.project?.windFarm?.electricalLosses || 0,
        totalMW: (settings?.project?.windFarm?.numWTGs || 20) * 
                 (settings?.project?.windFarm?.mwPerWTG || 3.5)
      },
      
      // Financial settings
      financial: {
        currency: settings?.project?.currency?.local || 'USD',
        foreignCurrency: settings?.project?.currency?.foreign || 'EUR',
        exchangeRate: settings?.project?.currency?.exchangeRate || 1.0,
        capex: settings?.modules?.financing?.capex || 50000000,
        devex: settings?.modules?.financing?.devex || 10000000,
        loanTenor: settings?.modules?.financing?.loanDuration || 15,
        financingModel: settings?.modules?.financing?.model || 'Balance-Sheet',
        debtToEquityRatio: settings?.modules?.financing?.debtToEquityRatio || 1.5,
        debtToCapexRatio: settings?.modules?.financing?.debtToCapexRatio || 0.7,
        interestRateBS: settings?.modules?.financing?.loanInterestRateBS || 5,
        interestRatePF: settings?.modules?.financing?.loanInterestRatePF || 6,
        minimumDSCR: settings?.modules?.financing?.minimumDSCR || 1.3
      },
      
      // Cost settings
      cost: {
        annualBaseOM: settings?.modules?.cost?.annualBaseOM || 5000000,
        escalationRate: settings?.modules?.cost?.escalationRate || 2,
        escalationDistribution: settings?.modules?.cost?.escalationDistribution || 'Normal',
        oemTerm: settings?.modules?.cost?.oemTerm || 5,
        fixedOMFee: settings?.modules?.cost?.fixedOMFee || 4000000,
        failureEventProbability: settings?.modules?.cost?.failureEventProbability || 5,
        failureEventCost: settings?.modules?.cost?.failureEventCost || 200000,
        contingencyCost: settings?.modules?.cost?.contingencyCost || 0,
        activeContractId: settings?.modules?.cost?.oemContractId || null
      },
      
      // Revenue settings
      revenue: {
        energyProduction: settings?.modules?.revenue?.energyProduction || {
          distribution: 'Normal',
          mean: 1000,
          std: 100
        },
        electricityPrice: settings?.modules?.revenue?.electricityPrice || {
          type: 'fixed',
          value: 50
        },
        revenueDegradationRate: settings?.modules?.revenue?.revenueDegradationRate || 0.5,
        downtimePerEvent: settings?.modules?.revenue?.downtimePerEvent || {
          distribution: 'Weibull',
          scale: 24,
          shape: 1.5
        },
        windVariabilityMethod: settings?.modules?.revenue?.windVariabilityMethod || 'Default',
        turbulenceIntensity: settings?.modules?.revenue?.turbulenceIntensity || 10,
        surfaceRoughness: settings?.modules?.revenue?.surfaceRoughness || 0.03,
        kaimalScale: settings?.modules?.revenue?.kaimalScale || 8.1
      },
      
      // Risk mitigation settings
      risk: {
        insuranceEnabled: settings?.modules?.risk?.insuranceEnabled || false,
        insurancePremium: settings?.modules?.risk?.insurancePremium || 50000,
        insuranceDeductible: settings?.modules?.risk?.insuranceDeductible || 10000,
        reserveFunds: settings?.modules?.risk?.reserveFunds || 0
      },
      
      // Annual adjustments
      annualAdjustments,
      
      // Contracts and OEM scopes
      contracts: {
        all: Array.from(contractMap.values()).filter(v => !Array.isArray(v)),
        byId: contractMap,
        activeContractId: settings?.modules?.cost?.oemContractId || null,
        oemScopes: Array.from(oemScopeMap.values())
      },
      
      // Original settings reference (for any direct access needs)
      settings
    };
  }

  /**
   * Create a standardized output simulation context
   * @param {Object} settings - Scenario settings
   * @param {Object} inputSimData - Input simulation data
   * @returns {Object} Standardized output context
   */
  static createOutputContext(settings, inputSimData) {
    // Basic project info
    const projectLife = settings?.general?.projectLife || 20;
    
    // Extract annual data from input simulation if available
    const annualCashFlows = [];
    if (inputSimData?.cashflow?.annualCosts?.total && 
        inputSimData?.cashflow?.annualRevenue) {
      
      // Use primary percentile (P50 equivalent)
      const costs = inputSimData.cashflow.annualCosts.total.Pprimary || [];
      const revenues = inputSimData.cashflow.annualRevenue.Pprimary || [];
      
      for (let year = 0; year < Math.min(costs.length, revenues.length); year++) {
        annualCashFlows.push({
          year: year + 1,
          revenue: revenues[year] || 0,
          cost: costs[year] || 0,
          netCashFlow: (revenues[year] || 0) - (costs[year] || 0)
        });
      }
    } else {
      // Create placeholder cash flows if input data not available
      for (let year = 0; year < projectLife; year++) {
        annualCashFlows.push({
          year: year + 1,
          revenue: 0,
          cost: 0,
          netCashFlow: 0
        });
      }
    }
    
    return {
      // Project information
      project: {
        name: settings?.general?.projectName || 'Wind Farm Project',
        life: projectLife,
        numWTGs: settings?.project?.windFarm?.numWTGs || 20,
        totalMW: (settings?.project?.windFarm?.numWTGs || 20) * 
                 (settings?.project?.windFarm?.mwPerWTG || 3.5)
      },
      
      // Financial settings
      financial: {
        capex: settings?.modules?.financing?.capex || 50000000,
        devex: settings?.modules?.financing?.devex || 10000000,
        loanTenor: settings?.modules?.financing?.loanDuration || 15,
        financingModel: settings?.modules?.financing?.model || 'Balance-Sheet',
        debtToEquityRatio: settings?.modules?.financing?.debtToEquityRatio || 1.5,
        debtToCapexRatio: settings?.modules?.financing?.debtToCapexRatio || 0.7,
        interestRateBS: settings?.modules?.financing?.loanInterestRateBS || 5,
        interestRatePF: settings?.modules?.financing?.loanInterestRatePF || 6,
        minimumDSCR: settings?.modules?.financing?.minimumDSCR || 1.3
      },
      
      // Cash flow data
      cashFlow: {
        annual: annualCashFlows,
        initialInvestment: -((settings?.modules?.financing?.capex || 50000000) + 
                            (settings?.modules?.financing?.devex || 10000000))
      },
      
      // Percentile information
      percentiles: settings?.simulation?.probabilities || {
        primary: 50,
        upperBound: 75,
        lowerBound: 25,
        extremeUpper: 90,
        extremeLower: 10
      },
      
      // Raw input data reference (if needed)
      inputSimData,
      
      // Original settings reference
      settings
    };
  }

  /**
   * Create a brief context for responsibilty matrix generation
   * @param {Object} settings - Scenario settings
   * @param {Array} oemScopes - Pre-fetched OEM scopes
   * @returns {Object} Responsibility matrix context
   */
  static createResponsibilityContext(settings, oemScopes) {
    return {
      projectLife: settings?.general?.projectLife || 20,
      numWTGs: settings?.project?.windFarm?.numWTGs || 20,
      oemContracts: settings?.modules?.contracts?.oemContracts || [],
      oemScopes: oemScopes || []
    };
  }
}

module.exports = ContextFactory;