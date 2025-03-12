// backend/models/Simulation.js
const mongoose = require('mongoose');

// Schema for Cost Module
const CostSchema = new mongoose.Schema({
  annualBaseOM: { type: Number, default: 5000000 },
  escalationRate: { type: Number, default: 2 },
  escalationDistribution: { type: String, enum: ['Normal', 'Lognormal', 'Triangular', 'Uniform'], default: 'Normal' },
  oemTerm: { type: Number, default: 5 },
  fixedOMFee: { type: Number, default: 4000000 },
  failureEventProbability: { type: Number, default: 5 },
  failureEventCost: { type: Number, default: 200000 },
  majorRepairEvents: [{
    year: Number,
    cost: Number,
    probability: Number
  }],
  contingencyCost: { type: Number, default: 0 }
});

// Schema for Revenue Module
const RevenueSchema = new mongoose.Schema({
  energyProduction: {
    distribution: { type: String, enum: ['Fixed', 'Normal', 'Triangular', 'Uniform'], default: 'Normal' },
    mean: { type: Number, default: 1000 },
    std: { type: Number, default: 100 },
    min: { type: Number },
    max: { type: Number }
  },
  electricityPrice: {
    type: { type: String, enum: ['fixed', 'variable'], default: 'fixed' },
    value: { type: Number, default: 50 },
    distribution: { type: String, enum: ['Normal', 'Lognormal', 'Triangular', 'Uniform'] }
  },
  revenueDegradationRate: { type: Number, default: 0.5 },
  downtimePerEvent: {
    distribution: { type: String, enum: ['Weibull', 'Lognormal', 'Exponential'], default: 'Weibull' },
    scale: { type: Number, default: 24 },
    shape: { type: Number, default: 1.5 }
  },
  windVariabilityMethod: { type: String, enum: ['Default', 'Kaimal'], default: 'Default' },
  turbulenceIntensity: { type: Number, default: 10 },
  surfaceRoughness: { type: Number, default: 0.03 },
  kaimalScale: { type: Number, default: 8.1 }
});

// Schema for Risk Mitigation Module
const RiskMitigationSchema = new mongoose.Schema({
  insuranceEnabled: { type: Boolean, default: false },
  insurancePremium: { type: Number, default: 50000 },
  insuranceDeductible: { type: Number, default: 10000 },
  reserveFunds: { type: Number, default: 0 }
});

// Schema for Financing Module
const FinancingSchema = new mongoose.Schema({
  capex: { type: Number, default: 50000000 },
  devex: { type: Number, default: 10000000 },
  model: { type: String, enum: ['Balance-Sheet', 'Project-Finance'], default: 'Balance-Sheet' },
  debtToEquityRatio: { type: Number, default: 1.5 },
  debtToCapexRatio: { type: Number, default: 0.7 },
  loanInterestRateBS: { type: Number, default: 5 },
  loanInterestRatePF: { type: Number, default: 6 },
  equityInvestment: { type: Number },
  minimumDSCR: { type: Number, default: 1.3 }
});

// Schema for General Module
const GeneralSchema = new mongoose.Schema({
  projectLife: { type: Number, default: 20 },
  loanDuration: { type: Number, default: 15 }
});

// Schema for Simulation Settings
const SimulationSettingsSchema = new mongoose.Schema({
  iterations: { type: Number, default: 10000 },
  seed: { type: Number, default: 42 }
});

// Schema for Annual Adjustments
const AnnualAdjustmentSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  additionalOM: { type: Number, default: 0 },
  additionalRevenue: { type: Number, default: 0 }
});

// Main Simulation Schema
const SimulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  parameters: {
    general: { type: GeneralSchema, default: () => ({}) },
    financing: { type: FinancingSchema, default: () => ({}) },
    cost: { type: CostSchema, default: () => ({}) },
    revenue: { type: RevenueSchema, default: () => ({}) },
    riskMitigation: { type: RiskMitigationSchema, default: () => ({}) },
    simulation: { type: SimulationSettingsSchema, default: () => ({}) }
  },
  annualAdjustments: [AnnualAdjustmentSchema],
  results: {
    intermediateData: {
      annualCosts: {
        components: {
          baseOM: { P50: [Number], P75: [Number], P90: [Number] },
          failureRisk: { P50: [Number], P75: [Number], P90: [Number] },
          majorRepairs: { P50: [Number], P75: [Number], P90: [Number] }
        },
        total: { P50: [Number], P75: [Number], P90: [Number] }
      },
      annualRevenue: { P50: [Number], P75: [Number], P90: [Number] },
      dscr: { P50: [Number], P90: [Number] },
      cashFlows: { P50: [Number], P75: [Number], P90: [Number] }
    },
    finalResults: {
      IRR: { P50: Number, P75: Number, P90: Number },
      NPV: { P50: Number, P75: Number, P90: Number },
      paybackPeriod: { P50: Number, P75: Number, P90: Number },
      minDSCR: { P50: Number, P90: Number },
      probabilityOfDSCRBelow1: Number
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the 'updatedAt' field
SimulationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Simulation', SimulationSchema);