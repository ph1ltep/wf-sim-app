// backend/controllers/defaultsController.js
/**
 * Get default parameter values for simulation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getDefaults = async (req, res) => {
  try {
    const defaults = {
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
    
    res.json({ success: true, defaults });
  } catch (error) {
    console.error('Error getting default parameters:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { getDefaults };