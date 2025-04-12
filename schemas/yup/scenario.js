// schemas/yup/scenario.js
const Yup = require('yup');
const MajorComponentSchema = require('./majorComponent');
const {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
} = require('./distribution');

// Component Allocation Schema
const ComponentAllocationSchema = Yup.object().shape({
    oem: Yup.number().default(0.0),
    owner: Yup.number().default(1.0),
});

// Crane Coverage Schema
const CraneCoverageSchema = Yup.object().shape({
    oem: Yup.number().default(0.0),
    owner: Yup.number().default(1.0),
    eventCap: Yup.number().nullable().default(null),
    financialCap: Yup.number().nullable().default(null),
});

// Major Component Coverage Schema
const MajorComponentCoverageSchema = Yup.object().shape({
    oem: Yup.number().default(0.0),
    owner: Yup.number().default(1.0),
    eventCap: Yup.number().nullable().default(null),
    financialCap: Yup.number().nullable().default(null),
    components: Yup.object().shape({
        tooling: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
        manpower: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
        parts: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    }).default(() => ({
        tooling: { oem: 0.0, owner: 1.0 },
        manpower: { oem: 0.0, owner: 1.0 },
        parts: { oem: 0.0, owner: 1.0 },
    })),
});

// Scope Allocations Schema
const ScopeAllocationsSchema = Yup.object().shape({
    preventiveMaintenance: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    bladeInspections: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    remoteMonitoring: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    remoteTechnicalSupport: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    siteManagement: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    technicians: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    correctiveMinor: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    bladeIntegrityManagement: ComponentAllocationSchema.default(() => ({ oem: 0.0, owner: 1.0 })),
    craneCoverage: CraneCoverageSchema.default(() => ({ oem: 0.0, owner: 1.0, eventCap: null, financialCap: null })),
    correctiveMajor: MajorComponentCoverageSchema.default(() => ({
        oem: 0.0,
        owner: 1.0,
        eventCap: null,
        financialCap: null,
        components: { tooling: { oem: 0.0, owner: 1.0 }, manpower: { oem: 0.0, owner: 1.0 }, parts: { oem: 0.0, owner: 1.0 } },
    })),
});

// Yearly Responsibility Schema
const YearlyResponsibilitySchema = Yup.object().shape({
    year: Yup.number().required('Year is required'),
    oemContractId: Yup.string().nullable().default(null),
    oemContractName: Yup.string().nullable().default(null),
    scopeAllocations: ScopeAllocationsSchema.default(() => ({})),
    fixedFee: Yup.number().default(0),
    isPerTurbine: Yup.boolean().default(false),
});

// Simulation Result Data Point Schema
const SimResultsSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    percentile: PercentileSchema.required('Percentile is required'),
    data: Yup.array().of(DataPointSchema).default([]),
});

// Adjustment Schema
const AdjustmentSchema = Yup.object().shape({
    years: Yup.array().of(Yup.number()).required('Years are required'),
    amount: Yup.number().required('Amount is required').default(0),
    description: Yup.string(),
});

// Failure Model Schema
const FailureModelSchema = Yup.object().shape({
    designLife: Yup.number().default(20),
    componentCount: Yup.number().default(100),
    assumedFailureRate: Yup.number().default(0.01),
    majorComponent: MajorComponentSchema.required('Major component is required'),
    historicalData: Yup.object().shape({
        type: Yup.string().oneOf(['separate', 'analysis', 'none']).default('none'),
        data: Yup.array().of(Yup.object().shape({
            year: Yup.number().required('Year is required'),
            failureRate: Yup.number().required('Failure rate is required'),
        })).default([]),
    }),
});

// Settings Schema
const SettingsSchema = Yup.object().shape({
    general: Yup.object().shape({
        projectName: Yup.string().default('Wind Farm Project'),
        startDate: Yup.date(),
        projectLife: Yup.number().default(20),
    }),
    project: Yup.object().shape({
        windFarm: Yup.object().shape({
            numWTGs: Yup.number().default(20),
            wtgPlatformType: Yup.string().oneOf(['geared', 'direct-drive']).default('geared'),
            mwPerWTG: Yup.number().default(3.5),
            capacityFactor: Yup.number().default(35),
            curtailmentLosses: Yup.number().default(0),
            electricalLosses: Yup.number().default(0),
        }),
        currency: Yup.object().shape({
            local: Yup.string().default('USD'),
            foreign: Yup.string().default('EUR'),
            exchangeRate: Yup.number().default(1.0),
        }),
        location: Yup.string(),
    }),
    modules: Yup.object().shape({
        financing: Yup.object().shape({
            capex: Yup.number().default(50000000),
            devex: Yup.number().default(10000000),
            model: Yup.string().oneOf(['Balance-Sheet', 'Project-Finance']).default('Balance-Sheet'),
            debtToEquityRatio: Yup.number().default(1.5),
            debtToCapexRatio: Yup.number().default(0.7),
            loanDuration: Yup.number().default(15),
            loanInterestRateBS: Yup.number().default(5),
            loanInterestRatePF: Yup.number().default(6),
            equityInvestment: Yup.number(),
            minimumDSCR: Yup.number().default(1.3),
        }),
        cost: Yup.object().shape({
            annualBaseOM: Yup.number().default(5000000),
            // Updated to be a DistributionTypeSchema of Fixed type (to match getDefaultSettings)
            escalationRate: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({
                    type: 'Fixed',
                    timeSeriesMode: false,
                    parameters: { value: 0.025 } // Matches getDefaultSettings value
                })),
                data: Yup.array().default([])
            }),
            // Removed escalationDistribution as requested
            oemTerm: Yup.number().default(5),
            fixedOMFee: Yup.number().default(4000000),
            failureEventProbability: Yup.number().default(5),
            failureEventCost: Yup.number().default(200000),
            majorRepairEvents: Yup.array().of(Yup.object().shape({
                year: Yup.number(),
                cost: Yup.number(),
                probability: Yup.number(),
            })).default([]),
            contingencyCost: Yup.number().default(0),
            adjustments: Yup.array().of(AdjustmentSchema).default([]),
            failureModels: Yup.array().of(FailureModelSchema).default([]),
        }),
        revenue: Yup.object().shape({
            energyProduction: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({
                    type: 'Normal',
                    timeSeriesMode: false,
                    parameters: { mean: 1000, stdDev: 10 } // Matches getDefaultSettings
                })),
                data: Yup.array().default([])
            }),
            electricityPrice: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({
                    type: 'Fixed',
                    timeSeriesMode: false,
                    parameters: { value: 50 } // Matches getDefaultSettings
                })),
                data: Yup.array().default([])
            }),
            revenueDegradationRate: Yup.number().default(0.5),
            downtimePerEvent: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({
                    type: 'Lognormal', // Matches getDefaultSettings
                    timeSeriesMode: false,
                    parameters: {
                        sigma: 0.3,
                        mu: Math.log(90) // Matches getDefaultSettings
                    }
                })),
                data: Yup.array().default([])
            }),
            // Updated to use GBM type
            windVariability: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({
                    type: 'GBM', // Changed to GBM type
                    timeSeriesMode: false,
                    parameters: {
                        value: 7.5, // From getDefaultSettings
                        drift: 0.02,
                        volatility: 0.1,
                        timeStep: 1
                    }
                })),
                data: Yup.array().default([])
            }),
            turbulenceIntensity: Yup.number().default(10), // Matches getDefaultSettings
            surfaceRoughness: Yup.number().default(0.03), // Matches getDefaultSettings
            kaimalScale: Yup.number().default(8.1), // Matches getDefaultSettings
            adjustments: Yup.array().of(AdjustmentSchema).default([]),
        }),
        risk: Yup.object().shape({
            insuranceEnabled: Yup.boolean().default(false),
            insurancePremium: Yup.number().default(50000),
            insuranceDeductible: Yup.number().default(10000),
            reserveFunds: Yup.number().default(0),
        }),
        contracts: Yup.object().shape({
            oemContracts: Yup.array().of(Yup.object().shape({
                id: Yup.string().required('ID is required'),
                name: Yup.string().required('Name is required'),
                years: Yup.array().of(Yup.number()).required('Years are required'),
                fixedFee: Yup.number().required('Fixed fee is required'),
                isPerTurbine: Yup.boolean().default(false),
                oemScopeId: Yup.string().required('OEM scope ID is required'),
                oemScopeName: Yup.string(),
            })).default([]),
        }),
    }),
    simulation: Yup.object().shape({
        iterations: Yup.number().default(10000), // Matches getDefaultSettings
        seed: Yup.number().default(42), // Matches getDefaultSettings
        percentiles: Yup.array().of(PercentileSchema).default(() => [
            { value: 50, description: 'primary' },
            { value: 75, description: 'upper_bound' },
            { value: 25, description: 'lower_bound' },
            { value: 10, description: 'extreme_lower' },
            { value: 90, description: 'extreme_upper' }
        ]), // Matches getDefaultSettings
    }),
    metrics: Yup.object().shape({
        totalMW: Yup.number().default(70), // Matches getDefaultSettings
        grossAEP: Yup.number().default(214032), // Matches getDefaultSettings
        netAEP: Yup.number().default(214032), // Matches getDefaultSettings
        componentQuantities: Yup.object().shape({
            blades: Yup.number().default(60), // Matches getDefaultSettings
            bladeBearings: Yup.number().default(60), // Matches getDefaultSettings
            transformers: Yup.number().default(20), // Matches getDefaultSettings
            gearboxes: Yup.number().default(20), // Platform-specific logic in controller
            generators: Yup.number().default(20), // Matches getDefaultSettings
            converters: Yup.number().default(20), // Matches getDefaultSettings
            mainBearings: Yup.number().default(20), // Matches getDefaultSettings
            yawSystems: Yup.number().default(20), // Matches getDefaultSettings
        }),
    }),
});

// InputSim Schema
const InputSimSchema = Yup.object().shape({
    cashflow: Yup.object().shape({
        annualCosts: Yup.object().shape({
            components: Yup.object().shape({
                baseOM: PercentileSchema.default(() => ({})),
                failureRisk: PercentileSchema.default(() => ({})),
                majorRepairs: PercentileSchema.default(() => ({})),
            }),
            total: PercentileSchema.default(() => ({})),
        }),
        annualRevenue: PercentileSchema.default(() => ({})),
        dscr: PercentileSchema.default(() => ({})),
        netCashFlow: PercentileSchema.default(() => ({})),
    }),
    risk: Yup.object().shape({
        failureRates: PercentileSchema.default(() => ({})),
        eventProbabilities: PercentileSchema.default(() => ({})),
    }),
    scope: Yup.object().shape({
        responsibilityMatrix: Yup.array().of(YearlyResponsibilitySchema).nullable().default(null),
    }),
});

// OutputSim Schema
const OutputSimSchema = Yup.object().shape({
    IRR: Yup.array().of(SimResultsSchema).default([]),
    NPV: Yup.array().of(SimResultsSchema).default([]),
    paybackPeriod: Yup.array().of(SimResultsSchema).default([]),
    minDSCR: Yup.array().of(SimResultsSchema).default([]),
});

// Main Scenario Schema
const ScenarioSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    description: Yup.string(),
    settings: SettingsSchema.required(),
    simulation: Yup.object().shape({
        inputSim: InputSimSchema.default(() => ({})),
        outputSim: OutputSimSchema.default(() => ({})),
    }).required(),
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date()),
});

const ScenarioListingSchema = Yup.object().shape({
    _id: Yup.string().required('ID is required'),
    name: Yup.string().required('Name is required'),
    description: Yup.string(),
    createdAt: Yup.date(),
    updatedAt: Yup.date(),
    // Include a few key metrics for display
    metrics: Yup.object().shape({
        totalMW: Yup.number(),
        windFarmSize: Yup.number(),
        projectLife: Yup.number()
    }).default(() => ({})),
});

module.exports = {
    ScenarioSchema,
    SettingsSchema,
    InputSimSchema,
    OutputSimSchema,
    SimResultsSchema,
    ComponentAllocationSchema,
    CraneCoverageSchema,
    MajorComponentCoverageSchema,
    ScopeAllocationsSchema,
    YearlyResponsibilitySchema,
    AdjustmentSchema,
    FailureModelSchema,
    ScenarioListingSchema
};