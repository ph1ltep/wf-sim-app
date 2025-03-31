// backend/models/Scenario.js
const mongoose = require('mongoose');
const { MajorComponentSchema } = require('./MajorComponent');


// Schema for Component Allocation in Responsibility Matrix
const ComponentAllocationSchema = new mongoose.Schema({
  oem: { type: Number, default: 0.0 },
  owner: { type: Number, default: 1.0 }
});

// Schema for Crane Coverage in Responsibility Matrix
const CraneCoverageSchema = new mongoose.Schema({
  oem: { type: Number, default: 0.0 },
  owner: { type: Number, default: 1.0 },
  eventCap: { type: Number, default: null },
  financialCap: { type: Number, default: null }
});

// Schema for Major Component Coverage in Responsibility Matrix
const MajorComponentCoverageSchema = new mongoose.Schema({
  oem: { type: Number, default: 0.0 },
  owner: { type: Number, default: 1.0 },
  eventCap: { type: Number, default: null },
  financialCap: { type: Number, default: null },
  components: {
    tooling: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
    manpower: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
    parts: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) }
  }
});

// Schema for Scope Allocations in Responsibility Matrix
const ScopeAllocationsSchema = new mongoose.Schema({
  preventiveMaintenance: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  bladeInspections: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  remoteMonitoring: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  remoteTechnicalSupport: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  siteManagement: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  technicians: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  correctiveMinor: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  bladeIntegrityManagement: { type: ComponentAllocationSchema, default: () => ({ oem: 0.0, owner: 1.0 }) },
  craneCoverage: { type: CraneCoverageSchema, default: () => ({ oem: 0.0, owner: 1.0, eventCap: null, financialCap: null }) },
  correctiveMajor: { type: MajorComponentCoverageSchema, default: () => ({
    oem: 0.0,
    owner: 1.0,
    eventCap: null,
    financialCap: null,
    components: {
      tooling: { oem: 0.0, owner: 1.0 },
      manpower: { oem: 0.0, owner: 1.0 },
      parts: { oem: 0.0, owner: 1.0 }
    }
  })}
});

// Schema for Yearly Responsibility in Responsibility Matrix
const YearlyResponsibilitySchema = new mongoose.Schema({
  year: { type: Number, required: true },
  oemContractId: { type: String, default: null },
  oemContractName: { type: String, default: null },
  scopeAllocations: { type: ScopeAllocationsSchema, default: () => ({}) },
  fixedFee: { type: Number, default: 0 },
  isPerTurbine: { type: Boolean, default: false }
});

// Percentile Schema - representing a percentile configuration
const PercentileSchema = new mongoose.Schema({
  value: { type: Number, required: true, min: 1, max: 99, default: 50 },
  description: { 
    type: String, 
    default: 'primary'
  },
  label: {
    type: String,
    get: function() {
      return `P${this.value}`;
    }
  }
});

// Simulation Result Data Point Schema - for storing time series data
const DataPointSchema = new mongoose.Schema({
  year: { type: Number, required: true, min: 0 },
  value: { type: Number, required: true }
});

// Simulation Results Schema - for storing a percentile-based result set
const SimResultsSchema = new mongoose.Schema({
  percentile: { type: PercentileSchema, required: true },
  data: { type: [DataPointSchema], default: [] }
});

// Schema for Adjustment
const AdjustmentSchema = new mongoose.Schema({
  years: { type: [Number], required: true },
  amount: { type: Number, required: true, default: 0 },
  description: { type: String }
});

// Define the FailureModelSchema
const FailureModelSchema = new mongoose.Schema({
  designLife: { type: Number, default: 20 },
  componentCount: { type: Number, default: 100 },
  assumedFailureRate: { type: Number, default: 0.01 },
  // Reference the imported schema (without unique constraints)
  majorComponent: { 
    type: new mongoose.Schema(
      Object.assign({}, MajorComponentSchema.obj, {
        name: { type: String, required: true, trim: true } // Remove unique constraint
      })
    ), 
    required: true 
  },
  historicalData: {
    type: {
      type: String,
      enum: ['separate', 'analysis', 'none'],
      default: 'none'
    },
    data: [{
      year: { type: Number, required: true },
      failureRate: { type: Number, required: true }
    }]
  }
});

// Settings schema - extracted to be reusable
const SettingsSchema = new mongoose.Schema({
  // General settings
  general: {
    projectName: { type: String, default: 'Wind Farm Project' },
    startDate: { type: Date },
    projectLife: { type: Number, default: 20 }
  },
  
  // Project settings
  project: {
    // Wind Farm specifications
    windFarm: {
      numWTGs: { type: Number, default: 20 },
      wtgPlatformType: { type: String, enum: ['geared', 'direct-drive'], default: 'geared' },
      mwPerWTG: { type: Number, default: 3.5 },
      capacityFactor: { type: Number, default: 35 },
      curtailmentLosses: { type: Number, default: 0 },
      electricalLosses: { type: Number, default: 0 }
    },
    
    // Currency settings
    currency: {
      local: { type: String, default: 'USD' },
      foreign: { type: String, default: 'EUR' },
      exchangeRate: { type: Number, default: 1.0 }
    },
    
    location: { type: String }
  },
  
  // Modules settings
  modules: {
    // Financing module
    financing: {
      capex: { type: Number, default: 50000000 },
      devex: { type: Number, default: 10000000 },
      model: { type: String, enum: ['Balance-Sheet', 'Project-Finance'], default: 'Balance-Sheet' },
      debtToEquityRatio: { type: Number, default: 1.5 },
      debtToCapexRatio: { type: Number, default: 0.7 },
      loanDuration: { type: Number, default: 15 },
      loanInterestRateBS: { type: Number, default: 5 },
      loanInterestRatePF: { type: Number, default: 6 },
      equityInvestment: { type: Number },
      minimumDSCR: { type: Number, default: 1.3 }
    },
    
    // Cost module
    cost: {
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
      contingencyCost: { type: Number, default: 0 },
      adjustments: { type: [AdjustmentSchema], default: [] },
      // Changed to an array of FailureModelSchema
      failureModels: { type: [FailureModelSchema], default: [] }
    },
    
    // Revenue module
    revenue: {
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
      kaimalScale: { type: Number, default: 8.1 },
      adjustments: { type: [AdjustmentSchema], default: [] }
    },
    
    // Risk module
    risk: {
      insuranceEnabled: { type: Boolean, default: false },
      insurancePremium: { type: Number, default: 50000 },
      insuranceDeductible: { type: Number, default: 10000 },
      reserveFunds: { type: Number, default: 0 }
    },
    
    // Contracts module
    contracts: {
      oemContracts: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        years: { type: [Number], required: true },
        fixedFee: { type: Number, required: true },
        isPerTurbine: { type: Boolean, default: false },
        oemScopeId: { type: String, required: true },
        oemScopeName: { type: String }
      }]
    }
  },
  
  // Simulation settings
  simulation: {
    iterations: { type: Number, default: 10000 },
    seed: { type: Number, default: 42 },
    percentiles: { 
      type: [PercentileSchema], 
      default: [
        { value: 50, description: 'primary' },
        { value: 75, description: 'upper_bound' },
        { value: 25, description: 'lower_bound' },
        { value: 90, description: 'extreme_upper' },
        { value: 10, description: 'extreme_lower' }
      ]
    },
    primaryPercentileIndex: { type: Number, default: 50 } // Index pointing to the primary percentile in the array  
  },
  
  // Project metrics
  metrics: {
    totalMW: { type: Number, default: 70 },
    grossAEP: { type: Number, default: 214032 },
    netAEP: { type: Number, default: 214032 },
    componentQuantities: {
      blades: { type: Number, default: 60 },
      bladeBearings: { type: Number, default: 60 },
      transformers: { type: Number, default: 20 },
      gearboxes: { type: Number, default: 20 },
      generators: { type: Number, default: 20 },
      converters: { type: Number, default: 20 },
      mainBearings: { type: Number, default: 20 },
      yawSystems: { type: Number, default: 20 }
    }
  }
});

// InputSim schema - extracted to be reusable
const InputSimSchema = new mongoose.Schema({
  // Cashflow results
  cashflow: {
    annualCosts: {
      components: {
        baseOM: { type: PercentileSchema, default: () => ({}) },
        failureRisk: { type: PercentileSchema, default: () => ({}) },
        majorRepairs: { type: PercentileSchema, default: () => ({}) }
      },
      total: { type: PercentileSchema, default: () => ({}) }
    },
    annualRevenue: { type: PercentileSchema, default: () => ({}) },
    dscr: { type: PercentileSchema, default: () => ({}) },
    netCashFlow: { type: PercentileSchema, default: () => ({}) }
  },
  
  // Risk results
  risk: {
    failureRates: { type: PercentileSchema, default: () => ({}) },
    eventProbabilities: { type: PercentileSchema, default: () => ({}) }
  },
  
  // Scope/responsibility matrix
  scope: {
    responsibilityMatrix: { type: [YearlyResponsibilitySchema], default: null }
  }
});

// OutputSim schema - extracted to be reusable
const OutputSimSchema = new mongoose.Schema({
  IRR: { type: [SimResultsSchema], default: [] },
  NPV: { type: [SimResultsSchema], default: [] },
  paybackPeriod: { type: [SimResultsSchema], default: [] },
  minDSCR: { type: [SimResultsSchema], default: [] }
});

// Main Scenario Schema
const ScenarioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  settings: { type: SettingsSchema, default: () => ({}) },
  simulation: {
    inputSim: { type: InputSimSchema, default: () => ({}) },
    outputSim: { type: OutputSimSchema, default: () => ({}) }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the 'updatedAt' field
ScenarioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = {
  Scenario: mongoose.model('Scenario', ScenarioSchema),
  SettingsSchema,
  InputSimSchema,
  OutputSimSchema
};