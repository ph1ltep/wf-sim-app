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
  contingencyCost: { type: Number, default: 0 },
  oemContractId: { type: String }
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
  minimumDSCR: { type: Number, default: 1.3 },
  loanDuration: { type: Number, default: 15 }
});

// Schema for General Module
const GeneralSchema = new mongoose.Schema({
  projectName: { type: String, default: 'Wind Farm Project' },
  startDate: { type: Date },
  projectLife: { type: Number, default: 20 },
  loanDuration: { type: Number, default: 15 },
  numWTGs: { type: Number, default: 20 },
  wtgPlatformType: { type: String, enum: ['geared', 'direct-drive'], default: 'geared' },
  mwPerWTG: { type: Number, default: 3.5 },
  capacityFactor: { type: Number, default: 35 },
  curtailmentLosses: { type: Number, default: 0 },
  electricalLosses: { type: Number, default: 0 }
});

// Schema for Simulation Settings
const SimulationSettingsSchema = new mongoose.Schema({
  iterations: { type: Number, default: 10000 },
  seed: { type: Number, default: 42 }
});

// Schema for Probability Settings
const ProbabilitySettingsSchema = new mongoose.Schema({
  primary: { type: Number, default: 50 },
  upperBound: { type: Number, default: 75 },
  lowerBound: { type: Number, default: 25 },
  extremeUpper: { type: Number, default: 90 },
  extremeLower: { type: Number, default: 10 }
});

// Schema for Component Quantities
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

// Project Metrics Schema
const ProjectMetricsSchema = new mongoose.Schema({
  totalMW: { type: Number, default: 70 },
  grossAEP: { type: Number, default: 214032 },
  netAEP: { type: Number, default: 214032 },
  componentQuantities: { type: ComponentQuantitiesSchema, default: () => ({}) }
});

// Schema for Annual Adjustments
const AnnualAdjustmentSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  additionalOM: { type: Number, default: 0 },
  additionalRevenue: { type: Number, default: 0 }
});

// Schema for Scenario details
const ScenarioSchema = new mongoose.Schema({
  name: { type: String, default: 'Default Scenario' },
  description: { type: String, default: 'Default configuration scenario' },
  scenarioType: { type: String, default: 'base' },
  location: { type: String },
  currency: { type: String, default: 'USD' },
  foreignCurrency: { type: String, default: 'EUR' },
  exchangeRate: { type: Number, default: 1.0 }
});

// Dynamic Percentile schema for annual data and metrics
const PercentileSchema = new mongoose.Schema({
  // This is a flexible schema that will hold different percentile values
  // Each percentile key (e.g., "P50", "P75") will be dynamically added
}, { strict: false });

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

// Schema for OEM Contract
const OEMContractSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  startYear: { type: Number, required: true },
  endYear: { type: Number, required: true },
  fixedFee: { type: Number, required: true },
  isPerTurbine: { type: Boolean, default: false },
  oemScopeId: { type: String, required: true },
  oemScopeName: { type: String }
});

// Main Simulation Schema
const SimulationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  parameters: {
    general: { type: GeneralSchema, default: () => ({}) },
    projectMetrics: { type: ProjectMetricsSchema, default: () => ({}) },
    financing: { type: FinancingSchema, default: () => ({}) },
    cost: { type: CostSchema, default: () => ({}) },
    revenue: { type: RevenueSchema, default: () => ({}) },
    riskMitigation: { type: RiskMitigationSchema, default: () => ({}) },
    simulation: { type: SimulationSettingsSchema, default: () => ({}) },
    probabilities: { type: ProbabilitySettingsSchema, default: () => ({}) },
    scenario: { type: ScenarioSchema, default: () => ({}) }
  },
  // Array of OEM scopes - referenced by OEM contracts
  oemScopes: { 
    type: [OEMScopeSchema], 
    default: () => [] 
  },
  // Array of OEM contracts specific to this simulation instance
  oemContracts: { 
    type: [OEMContractSchema], 
    default: () => [] 
  },
  annualAdjustments: {
    type: [AnnualAdjustmentSchema],
    default: function() {
      // Create default annual adjustments for each year of project life
      const projectLife = this.parameters?.general?.projectLife || 20;
      return Array(projectLife).fill().map((_, i) => ({
        year: i + 1,
        additionalOM: 0,
        additionalRevenue: 0
      }));
    }
  },
  percentileInfo: { type: ProbabilitySettingsSchema, default: () => ({
    primary: 50,
    upperBound: 75,
    lowerBound: 25,
    extremeUpper: 90,
    extremeLower: 10
  }) },
  results: {
    intermediateData: {
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
      cashFlows: { type: PercentileSchema, default: () => ({}) },
      // OEM responsibility matrix inside intermediateData, can be null
      oemResponsibilityMatrix: {
        type: [YearlyResponsibilitySchema],
        default: null
      }
    },
    finalResults: {
      IRR: { type: PercentileSchema, default: () => ({}) },
      NPV: { type: PercentileSchema, default: () => ({}) },
      paybackPeriod: { type: PercentileSchema, default: () => ({}) },
      minDSCR: { type: PercentileSchema, default: () => ({}) },
      probabilityOfDSCRBelow1: { type: Number, default: 0 }
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