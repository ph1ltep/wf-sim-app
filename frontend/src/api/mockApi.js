// src/api/mockApi.js
const mockDefaultParameters = {
    general: {
      projectLife: 20,
      loanDuration: 15
    },
    financing: {
      capex: 50000000,
      devex: 10000000,
      model: 'Balance-Sheet',
      debtToEquityRatio: 1.5,
      debtToCapexRatio: 0.7,
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
      failureEventCost: 200000
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
      kaimalScale: 8.1
    },
    riskMitigation: {
      insuranceEnabled: false,
      insurancePremium: 50000,
      insuranceDeductible: 10000,
      reserveFunds: 0
    },
    simulation: {
      iterations: 10000,
      seed: 42
    },
    annualAdjustments: Array(20).fill().map((_, i) => ({
      year: i + 1,
      additionalOM: 0,
      additionalRevenue: 0
    }))
  };
  
  // Mock API functions
  export const getDefaultParameters = () => {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        resolve({ success: true, defaults: mockDefaultParameters });
      }, 500);
    });
  };
  
  export const runSimulation = (parameters) => {
    return new Promise((resolve) => {
      // Simulate API delay
      setTimeout(() => {
        // Create mock results based on parameters
        const mockResults = {
          intermediateData: {
            annualCosts: {
              total: {
                P50: Array(parameters.general.projectLife).fill().map((_, i) => 5000000 + i * 100000),
                P75: Array(parameters.general.projectLife).fill().map((_, i) => 5500000 + i * 120000),
                P90: Array(parameters.general.projectLife).fill().map((_, i) => 6000000 + i * 150000)
              },
              components: {
                baseOM: {
                  P50: Array(parameters.general.projectLife).fill().map((_, i) => 4000000 + i * 80000),
                  P75: Array(parameters.general.projectLife).fill().map((_, i) => 4200000 + i * 90000),
                  P90: Array(parameters.general.projectLife).fill().map((_, i) => 4500000 + i * 100000)
                },
                failureRisk: {
                  P50: Array(parameters.general.projectLife).fill().map(() => 800000 * Math.random()),
                  P75: Array(parameters.general.projectLife).fill().map(() => 1000000 * Math.random()),
                  P90: Array(parameters.general.projectLife).fill().map(() => 1200000 * Math.random())
                }
              }
            },
            annualRevenue: {
              P50: Array(parameters.general.projectLife).fill().map((_, i) => 8000000 - i * 100000),
              P75: Array(parameters.general.projectLife).fill().map((_, i) => 7500000 - i * 120000),
              P90: Array(parameters.general.projectLife).fill().map((_, i) => 7000000 - i * 150000)
            },
            dscr: {
              P50: Array(parameters.general.projectLife).fill().map(() => 1.3 + Math.random() * 0.5),
              P90: Array(parameters.general.projectLife).fill().map(() => 1.1 + Math.random() * 0.3)
            }
          },
          finalResults: {
            IRR: {
              P50: 10.5,
              P75: 8.7,
              P90: 6.2
            },
            NPV: {
              P50: 25000000,
              P75: 18000000,
              P90: 12000000
            },
            paybackPeriod: {
              P50: 7.5,
              P75: 8.3,
              P90: 9.1
            },
            minDSCR: {
              P50: 1.35,
              P90: 1.15
            },
            probabilityOfDSCRBelow1: 0.05
          }
        };
        
        resolve({ success: true, results: mockResults });
      }, 1500);
    });
  };