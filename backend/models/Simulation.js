// backend/models/Simulation.js
const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parameters: {
    general: {
      projectLife: Number,
      loanDuration: Number,
    },
    financing: {
      capex: Number,
      devex: Number,
      model: String,
      debtToEquityRatio: Number,
      debtToCapexRatio: Number,
      loanInterestRateBS: Number,
      loanInterestRatePF: Number,
      equityInvestment: Number,
    },
    cost: {
      annualBaseOM: Number,
      escalationRate: Number,
      escalationDistribution: String,
      oemTerm: Number,
      fixedOMFee: Number,
      failureEventProbability: Number,
      failureEventCost: Number,
    },
    revenue: {
      energyProduction: { distribution: String, mean: Number, std: Number, min: Number, max: Number },
      electricityPrice: { type: String, value: Number },
      revenueDegradationRate: Number,
      downtimePerEvent: { distribution: String, scale: Number, shape: Number },
      windVariabilityMethod: String,
      turbulenceIntensity: Number,
      surfaceRoughness: Number,
      kaimalScale: Number,
    },
    riskMitigation: {
      insuranceEnabled: Boolean,
      insurancePremium: Number,
      insuranceDeductible: Number,
    },
    simulation: {
      iterations: Number,
      seed: Number,
    },
    annualAdjustments: [{ additionalOM: Number, additionalRevenue: Number }],
  },
  results: {
    intermediateData: {
      annualCosts: { total: { P50: [Number], P75: [Number], P90: [Number] } },
      annualRevenue: { P50: [Number], P75: [Number], P90: [Number] },
      dscr: { P50: [Number] },
    },
    finalResults: {
      IRR: { P50: Number, P75: Number, P90: Number },
    },
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Simulation', SimulationSchema);