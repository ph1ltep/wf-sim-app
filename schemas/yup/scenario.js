// schemas/yup/scenario.js
const Yup = require('yup');
const MajorComponentSchema = require('./majorComponent');
const {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
} = require('./distributionSchemas');

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
}).default(() => ({}));

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
            escalationRate: Yup.number().default(2),
            escalationDistribution: Yup.string().oneOf(['Normal', 'Lognormal', 'Triangular', 'Uniform']).default('Normal'),
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
                distribution: DistributionTypeSchema.default(() => ({ type: 'Normal', parameters: { mean: 1000, stdDev: 100 } })),
            }),
            electricityPrice: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({ type: 'Fixed', parameters: { value: 50 } })),
            }),
            revenueDegradationRate: Yup.number().default(0.5),
            downtimePerEvent: Yup.object().shape({
                distribution: DistributionTypeSchema.default(() => ({ type: 'Weibull', parameters: { scale: 24, shape: 1.5 } })),
            }),
            windVariability: Yup.object().shape({
                distribution: Yup.array().of(SimResultsSchema).default([]),
            }),
            turbulenceIntensity: Yup.number().default(10),
            surfaceRoughness: Yup.number().default(0.03),
            kaimalScale: Yup.number().default(8.1),
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
    simulation: SimSettingsSchema.default(() => ({})),
    metrics: Yup.object().shape({
        totalMW: Yup.number().default(70),
        grossAEP: Yup.number().default(214032),
        netAEP: Yup.number().default(214032),
        componentQuantities: Yup.object().shape({
            blades: Yup.number().default(60),
            bladeBearings: Yup.number().default(60),
            transformers: Yup.number().default(20),
            gearboxes: Yup.number().default(20),
            generators: Yup.number().default(20),
            converters: Yup.number().default(20),
            mainBearings: Yup.number().default(20),
            yawSystems: Yup.number().default(20),
        }),
    }),
}).default(() => ({}));

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
}).default(() => ({}));

// OutputSim Schema
const OutputSimSchema = Yup.object().shape({
    IRR: Yup.array().of(SimResultsSchema).default([]),
    NPV: Yup.array().of(SimResultsSchema).default([]),
    paybackPeriod: Yup.array().of(SimResultsSchema).default([]),
    minDSCR: Yup.array().of(SimResultsSchema).default([]),
}).default(() => ({}));

// Main Scenario Schema
const ScenarioSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    description: Yup.string(),
    settings: SettingsSchema.default(() => ({})),
    simulation: Yup.object().shape({
        inputSim: InputSimSchema.default(() => ({})),
        outputSim: OutputSimSchema.default(() => ({})),
    }).default(() => ({})),
    createdAt: Yup.date().default(() => new Date()),
    updatedAt: Yup.date().default(() => new Date()),
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
};