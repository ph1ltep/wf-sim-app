// backend/controllers/defaultsController.js
const { getDefaultFailureModels } = require('./failureModelController');

/**
 * Helper function to get default settings (for internal use)
 * @param {string} platformType - Platform type ('geared' or 'direct-drive')
 * @returns {Promise<Object>} Default settings
 */
const getDefaultSettings = async (platformType = 'geared') => {
  try {
    // Get default failure models
    const failureModels = await getDefaultFailureModels(platformType);
    
    // Default settings - structured exactly like the Scenario schema
    return {
      general: {
        projectName: 'Wind Farm Project',
        startDate: null,
        projectLife: 20
      },
      project: {
        windFarm: {
          numWTGs: 20,
          wtgPlatformType: platformType,
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
          loanDuration: 15,
          loanInterestRateBS: 5,
          loanInterestRatePF: 6,
          minimumDSCR: 1.3
        },
        cost: {
          annualBaseOM: 5000000,
          escalationRate: 2,
          escalationDistribution: 'Normal',
          oemTerm: 5,
          fixedOMFee: 4000000,
          failureEventProbability: 5,
          failureEventCost: 200000,
          adjustments: [],
          failureModels: failureModels // Add the dynamically generated failure models
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
        // Percentiles as an array matching the schema definition
        percentiles: [
          { value: 50, description: 'primary' },
          { value: 75, description: 'upper_bound' },
          { value: 25, description: 'lower_bound' },
          { value: 90, description: 'extreme_upper' },
          { value: 10, description: 'extreme_lower' }
        ]
      },
      metrics: {
        totalMW: 70,
        grossAEP: 214032,
        netAEP: 214032,
        componentQuantities: {
          blades: 60,
          bladeBearings: 60,
          transformers: 20,
          gearboxes: platformType === 'geared' ? 20 : 0,
          generators: 20,
          converters: 20,
          mainBearings: 20,
          yawSystems: 20
        }
      }
    };
  } catch (error) {
    console.error('Error getting default settings:', error);
    throw error;
  }
};

/**
 * Get default parameter values for simulation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDefaults = async (req, res) => {
  try {
    // Get platform type from query parameter (default to 'geared')
    const platformType = req.query.platform || 'geared';
    
    // Get default settings using the helper function
    const settings = await getDefaultSettings(platformType);

    // Create the complete defaults object
    const defaults = {
      name: 'New Scenario',
      description: 'Default configuration scenario',
      settings,
      // New structure - simulation is null/empty by default
      simulation: {
        inputSim: null,
        outputSim: null
      }
    };

    res.json({ success: true, defaults });
  } catch (error) {
    console.error('Error getting default parameters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { 
  getDefaults, 
  getDefaultSettings
};