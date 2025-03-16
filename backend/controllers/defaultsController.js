// backend/controllers/defaultsController.js
/**
 * Get default parameter values for simulation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDefaults = async (req, res) => {
  try {
    const defaults = {
      name: 'New Scenario',
      description: 'Default configuration scenario',
      settings: {
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
            adjustments: [] 
          },
          revenue: {
            energyProduction: {
              distribution: 'Normal',
              mean: 1000,
              std: 100,
              min: null,
              max: null
            },
            electricityPrice: {
              type: 'fixed',
              value: 50,
              distribution: null
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
            primary: 50,
            upperBound: 75,
            lowerBound: 25,
            extremeUpper: 90,
            extremeLower: 10
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
      },
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

module.exports = { getDefaults };