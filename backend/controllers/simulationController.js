// backend/controllers/simulationController.js
const { 
  runSimulation,
  createSimulationEngine
} = require('../services/monte-carlo');

const CostModule = require('../services/modules/costModule');
const RevenueModule = require('../services/modules/revenueModule');
const FinancingModule = require('../services/modules/financingModule');
const RiskModule = require('../services/modules/riskModule');
const { generateResponsibilityMatrix } = require('../services/oemResponsibilityMatrix');
const OEMScope = require('../models/OEMScope');
const OEMContract = require('../models/OEMContract');
const { formatSuccess, formatError } = require('../utils/responseFormatter');

// Run a full simulation
const runFullSimulation = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate required parameters
    if (!settings || !settings.general || !settings.modules || !settings.project) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    // Generate OEM responsibility matrix if there are OEM contracts
    let responsibilityMatrix = null;
    const oemContracts = settings?.modules?.contracts?.oemContracts || [];
    
    if (oemContracts.length > 0) {
      // Get all OEM scope IDs referenced in contracts
      const oemScopeIds = oemContracts.map(contract => contract.oemScopeId).filter(Boolean);
      
      if (oemScopeIds.length > 0) {
        // Fetch all referenced OEM scopes
        const oemScopes = await OEMScope.find({ _id: { $in: oemScopeIds } });
        
        // Create a map of OEM scope IDs to OEM scope objects for quick lookup
        const oemScopeMap = oemScopes.reduce((map, scope) => {
          map[scope._id.toString()] = scope;
          return map;
        }, {});
        
        // Create augmented contracts with scope objects for the matrix generator
        const augmentedContracts = oemContracts.map(contract => {
          const oemScope = oemScopeMap[contract.oemScopeId];
          if (oemScope) {
            return { ...contract, oemScope };
          }
          return null;
        }).filter(Boolean);
        
        if (augmentedContracts.length > 0) {
          // Generate responsibility matrix
          responsibilityMatrix = generateResponsibilityMatrix(
            settings.general.projectLife || 20,
            settings.project.windFarm.numWTGs || 20,
            augmentedContracts
          );
        }
      }
    }
    
    // Run the simulation
    const simResults = runSimulation(settings);
    
    // Return results in the new format
    const results = {
      success: true,
      percentileInfo: settings.simulation.probabilities || simResults.percentileInfo,
      simulation: {
        inputSim: {
          cashflow: {
            annualCosts: simResults.results.intermediateData.annualCosts,
            annualRevenue: simResults.results.intermediateData.annualRevenue,
            dscr: simResults.results.intermediateData.dscr,
            netCashFlow: simResults.results.intermediateData.cashFlows
          },
          risk: {
            // We don't have specific risk outputs yet in the existing implementation
            failureRates: {},
            eventProbabilities: {}
          },
          scope: {
            responsibilityMatrix
          }
        },
        outputSim: mapToOutputSim(simResults.results.finalResults, settings.simulation.probabilities)
      }
    };
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the cost module
const runCostModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.cost || !settings.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required cost parameters' 
      });
    }
    
    // Create cost module and run
    const costModule = new CostModule();
    
    // Convert settings to format expected by the module
    const simulationParams = {
      general: {
        ...settings.general,
        ...settings.project.windFarm
      },
      cost: settings.modules.cost,
      probabilities: settings.simulation.probabilities,
      annualAdjustments: convertAdjustmentsToAnnual(
        settings.general.projectLife,
        settings.modules.cost.adjustments,
        []
      )
    };
    
    const results = costModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the revenue module
const runRevenueModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.revenue || !settings.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required revenue parameters' 
      });
    }
    
    // Create revenue module and run
    const revenueModule = new RevenueModule();
    
    // Convert settings to format expected by the module
    const simulationParams = {
      general: {
        ...settings.general,
        ...settings.project.windFarm
      },
      revenue: settings.modules.revenue,
      cost: settings.modules.cost, // Revenue module uses some cost parameters for failure probabilities
      probabilities: settings.simulation.probabilities,
      annualAdjustments: convertAdjustmentsToAnnual(
        settings.general.projectLife,
        [],
        settings.modules.revenue.adjustments
      )
    };
    
    const results = revenueModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the financing module
const runFinancingModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.financing || !settings.general) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required financing parameters' 
      });
    }
    
    // Create financing module and run
    const financingModule = new FinancingModule();
    
    // Convert settings to format expected by the module
    const simulationParams = {
      general: {
        ...settings.general,
        loanDuration: settings.modules.financing.loanDuration
      },
      financing: settings.modules.financing,
      probabilities: settings.simulation.probabilities
    };
    
    const results = financingModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

// Run just the risk mitigation module
const runRiskModule = async (req, res, next) => {
  try {
    const { settings } = req.body;
    
    // Validate parameters
    if (!settings || !settings.modules || !settings.modules.risk || !settings.general || !settings.modules.cost) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required risk mitigation parameters' 
      });
    }
    
    // Create risk module and run
    const riskModule = new RiskModule();
    
    // Convert settings to format expected by the module
    const simulationParams = {
      general: {
        ...settings.general,
        ...settings.project.windFarm
      },
      riskMitigation: settings.modules.risk,
      cost: settings.modules.cost,
      probabilities: settings.simulation.probabilities
    };
    
    const results = riskModule.runStandalone(simulationParams);
    
    res.json(results);
  } catch (error) {
    next(error);
  }
};

/**
 * Helper function to convert adjustment arrays to annual adjustments
 * @param {number} projectLife - Project lifetime in years
 * @param {Array} costAdjustments - Cost adjustments array
 * @param {Array} revenueAdjustments - Revenue adjustments array
 * @returns {Array} Annual adjustments array
 */
function convertAdjustmentsToAnnual(projectLife, costAdjustments = [], revenueAdjustments = []) {
  const annualAdjustments = [];
  
  // Initialize annual adjustments array
  for (let year = 1; year <= projectLife; year++) {
    annualAdjustments.push({
      year,
      additionalOM: 0,
      additionalRevenue: 0
    });
  }
  
  // Process cost adjustments
  costAdjustments.forEach(adjustment => {
    adjustment.years.forEach(year => {
      if (year >= 1 && year <= projectLife) {
        annualAdjustments[year - 1].additionalOM += adjustment.amount;
      }
    });
  });
  
  // Process revenue adjustments
  revenueAdjustments.forEach(adjustment => {
    adjustment.years.forEach(year => {
      if (year >= 1 && year <= projectLife) {
        annualAdjustments[year - 1].additionalRevenue += adjustment.amount;
      }
    });
  });
  
  return annualAdjustments;
}

/**
 * Maps the simulation results to the new outputSim structure
 * @param {Object} finalResults - The finalResults from simulation
 * @param {Object} probabilities - The probability settings
 * @returns {Object} The new outputSim structure
 */
function mapToOutputSim(finalResults, probabilities) {
  // Define percentile mapping
  const percentileMapping = {
    P10: `Pextreme_lower`,
    P25: `Plower_bound`,
    P50: `Pprimary`,
    P75: `Pupper_bound`,
    P90: `Pextreme_upper`
  };
  
  // Map custom percentiles if defined
  if (probabilities) {
    percentileMapping[`P${probabilities.extremeLower}`] = 'Pextreme_lower';
    percentileMapping[`P${probabilities.lowerBound}`] = 'Plower_bound';
    percentileMapping[`P${probabilities.primary}`] = 'Pprimary';
    percentileMapping[`P${probabilities.upperBound}`] = 'Pupper_bound';
    percentileMapping[`P${probabilities.extremeUpper}`] = 'Pextreme_upper';
  }
  
  const outputSim = {};
  
  // Process each result category (IRR, NPV, etc.)
  Object.keys(finalResults).forEach(category => {
    if (category === 'probabilityOfDSCRBelow1') return; // Skip this field as it's being removed
    
    outputSim[category] = {};
    
    // Process each percentile within the category
    Object.keys(finalResults[category]).forEach(oldPercentile => {
      const newPercentile = percentileMapping[oldPercentile] || oldPercentile;
      outputSim[category][newPercentile] = finalResults[category][oldPercentile];
    });
  });
  
  return outputSim;
}

// Get default parameters for simulation - reused from the original controller
const getDefaultParameters = async (req, res) => {
  try {
    // Default parameters in the new schema format
    const defaults = {
      general: {
        projectName: 'Wind Farm Project',
        startDate: null,
        projectLife: 20
      },
      project: {
        windFarm: {
          numWTGs: 20,
          wtgPlatformType: 'geared',
          mwPerWTG: 3.5,
          capacityFactor: 35,
          curtailmentLosses: 0,
          electricalLosses: 0
        },
        currency: {
          local: 'USD',
          foreign: 'EUR',
          exchangeRate: 1.0
        },
        location: null
      },
      modules: {
        financing: {
          capex: 50000000,
          devex: 10000000,
          model: 'Balance-Sheet',
          debtToEquityRatio: 1.5,
          debtToCapexRatio: 0.7,
          loanInterestRateBS: 5,
          loanInterestRatePF: 6,
          minimumDSCR: 1.3,
          loanDuration: 15
        },
        cost: {
          annualBaseOM: 5000000,
          escalationRate: 2,
          escalationDistribution: 'Normal',
          oemTerm: 5,
          fixedOMFee: 4000000,
          failureEventProbability: 5,
          failureEventCost: 200000,
          majorRepairEvents: [],
          contingencyCost: 0,
          adjustments: []
        },
        revenue: {
          energyProduction: {
            distribution: 'Normal',
            mean: 1000,
            std: 100
          },
          electricityPrice: {
            type: 'fixed',
            value: 50
          },
          revenueDegradationRate: 0.5,
          downtimePerEvent: {
            distribution: 'Weibull',
            scale: 24,
            shape: 1.5
          },
          windVariabilityMethod: 'Default',
          turbulenceIntensity: 10,
          surfaceRoughness: 0.03,
          kaimalScale: 8.1,
          adjustments: []
        },
        risk: {
          insuranceEnabled: false,
          insurancePremium: 50000,
          insuranceDeductible: 10000,
          reserveFunds: 0
        },
        contracts: {
          oemContracts: []
        }
      },
      simulation: {
        iterations: 10000,
        seed: 42,
        probabilities: {
          primary: 50,       // P50 (median)
          upperBound: 75,    // P75
          lowerBound: 25,    // P25
          extremeUpper: 90,  // P90
          extremeLower: 10   // P10
        }
      },
      metrics: {
        totalMW: 70,  // 20 * 3.5
        grossAEP: 214032,  // 70 * 0.35 * 8760
        netAEP: 214032,  // Same as gross if losses are 0
        componentQuantities: {
          blades: 60,
          bladeBearings: 60,
          transformers: 20,
          gearboxes: 20,
          generators: 20,
          converters: 20,
          mainBearings: 20,
          yawSystems: 20
        }
      }
    };

    res.json(formatSuccess({ defaults }));
  } catch (error) {
    console.error('Error getting default parameters:', error);
    res.status(500).json(formatError(error.message));
  }
};

module.exports = {
  runFullSimulation,
  runCostModule,
  runRevenueModule,
  runFinancingModule,
  runRiskModule,
  getDefaultParameters
};