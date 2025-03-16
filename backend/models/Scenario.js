// backend/models/Scenario.js
const mongoose = require('mongoose');

// General settings schema
const GeneralSettingsSchema = new mongoose.Schema({
  projectName: { type: String, default: 'Wind Farm Project' },
  startDate: { type: Date },
  projectLife: { type: Number, default: 20 }
});

// Wind Farm specifications schema
const WindFarmSpecsSchema = new mongoose.Schema({
  numWTGs: { type: Number, default: 20 },
  wtgPlatformType: { type: String, enum: ['geared', 'direct-drive'], default: 'geared' },
  mwPerWTG: { type: Number, default: 3.5 },
  capacityFactor: { type: Number, default: 35 },
  curtailmentLosses: { type: Number, default: 0 },
  electricalLosses: { type: Number, default: 0 }
});

// Currency settings schema
const CurrencySettingsSchema = new mongoose.Schema({
  local: { type: String, default: 'USD' },
  foreign: { type: String, default: 'EUR' },
  exchangeRate: { type: Number, default: 1.0 }
});

// Project settings schema
const ProjectSettingsSchema = new mongoose.Schema({
  windFarm: { type: WindFarmSpecsSchema, default: () => ({}) },
  currency: { type: CurrencySettingsSchema, default: () => ({}) },
  location: { type: String }
});

// Financing module schema
const FinancingModuleSchema = new mongoose.Schema({
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
});

// Adjustment schema for cost and revenue modules
const AdjustmentSchema = new mongoose.Schema({
  years: { type: [Number], required: true },
  amount: { type: Number, required: true, default: 0 },
  description: { type: String }
});

// Cost module schema
const CostModuleSchema = new mongoose.Schema({
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
  adjustments: { type: [AdjustmentSchema], default: [] }
});

// Revenue module schema
const RevenueModuleSchema = new mongoose.Schema({
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
});

// Risk module schema
const RiskModuleSchema = new mongoose.Schema({
  insuranceEnabled: { type: Boolean, default: false },
  insurancePremium: { type: Number, default: 50000 },
  insuranceDeductible: { type: Number, default: 10000 },
  reserveFunds: { type: Number, default: 0 }
});

// OEM Contract schema
const OEMContractSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  years: { type: [Number], required: true },
  fixedFee: { type: Number, required: true },
  isPerTurbine: { type: Boolean, default: false },
  oemScopeId: { type: String, required: true },
  oemScopeName: { type: String }
});

// Contracts module schema
const ContractsModuleSchema = new mongoose.Schema({
  oemContracts: { type: [OEMContractSchema], default: [] }
});

// Modules settings schema
const ModulesSettingsSchema = new mongoose.Schema({
  financing: { type: FinancingModuleSchema, default: () => ({}) },
  cost: { type: CostModuleSchema, default: () => ({}) },
  revenue: { type: RevenueModuleSchema, default: () => ({}) },
  risk: { type: RiskModuleSchema, default: () => ({}) },
  contracts: { type: ContractsModuleSchema, default: () => ({}) }
});

// Probability settings schema
const ProbabilitySettingsSchema = new mongoose.Schema({
  primary: { type: Number, default: 50 },
  upperBound: { type: Number, default: 75 },
  lowerBound: { type: Number, default: 25 },
  extremeUpper: { type: Number, default: 90 },
  extremeLower: { type: Number, default: 10 }
});

// Simulation settings schema
const SimulationSettingsSchema = new mongoose.Schema({
  iterations: { type: Number, default: 10000 },
  seed: { type: Number, default: 42 },
  probabilities: { type: ProbabilitySettingsSchema, default: () => ({}) }
});

// Component Quantities schema
const ComponentQuantitiesSchema = new mongoose.Schema({
  blades: { type: Number, default: 60 },
  bladeBearings: { type: Number, default: 60 },
  transformers: { type: Number, default: 20 },
  gearboxes: { type: Number, default: 20 },
  generators: { type: Number, default: 20 },
  converters: { type: Number, default: 20 },
  mainBearings: { type: Number, default: 20 },
  yawSystems: { type: Number, default: 20 }
});

// Project metrics schema
const ProjectMetricsSchema = new mongoose.Schema({
  totalMW: { type: Number, default: 70 },
  grossAEP: { type: Number, default: 214032 },
  netAEP: { type: Number, default: 214032 },
  componentQuantities: { type: ComponentQuantitiesSchema, default: () => ({}) }
});

// Overall settings schema
const SettingsSchema = new mongoose.Schema({
  general: { type: GeneralSettingsSchema, default: () => ({}) },
  project: { type: ProjectSettingsSchema, default: () => ({}) },
  modules: { type: ModulesSettingsSchema, default: () => ({}) },
  simulation: { type: SimulationSettingsSchema, default: () => ({}) },
  metrics: { type: ProjectMetricsSchema, default: () => ({}) }
});

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

// Dynamic Percentile schema for annual data and metrics
const PercentileSchema = new mongoose.Schema({
  // This is a flexible schema that will hold different percentile values
  // Each percentile key (e.g., "Pprimary", "Pupper_bound") will be dynamically added
}, { strict: false });

// Schema for Input Simulation Scope
const InputSimScopeSchema = new mongoose.Schema({
  responsibilityMatrix: { type: [YearlyResponsibilitySchema], default: null }
});

// Schema for Input Simulation Cashflow
const InputSimCashflowSchema = new mongoose.Schema({
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
});

// Schema for Input Simulation Risk
const InputSimRiskSchema = new mongoose.Schema({
  failureRates: { type: PercentileSchema, default: () => ({}) },
  eventProbabilities: { type: PercentileSchema, default: () => ({}) }
});

// Schema for Input Simulation
const InputSimSchema = new mongoose.Schema({
  cashflow: { type: InputSimCashflowSchema, default: () => ({}) },
  risk: { type: InputSimRiskSchema, default: () => ({}) },
  scope: { type: InputSimScopeSchema, default: () => ({}) }
});

// Schema for Output Simulation
const OutputSimSchema = new mongoose.Schema({
  IRR: { type: PercentileSchema, default: () => ({}) },
  NPV: { type: PercentileSchema, default: () => ({}) },
  paybackPeriod: { type: PercentileSchema, default: () => ({}) },
  minDSCR: { type: PercentileSchema, default: () => ({}) }
});

// Simulation results schema
const SimulationSchema = new mongoose.Schema({
  inputSim: { type: InputSimSchema, default: () => ({}) },
  outputSim: { type: OutputSimSchema, default: () => ({}) }
});

// Main Scenario Schema
const ScenarioSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  settings: { type: SettingsSchema, default: () => ({}) },
  simulation: { type: SimulationSchema, default: () => ({}) },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save hook to update the 'updatedAt' field
ScenarioSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Scenario', ScenarioSchema);