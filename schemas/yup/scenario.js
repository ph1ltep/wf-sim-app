// schemas/yup/scenario.js
const Yup = require('yup');
const MajorComponentSchema = require('./majorComponent');
const {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
    SimulationInfoSchema,
} = require('./distribution');

const { ComponentFailureModelingSchema } = require('./componentFailureRates');

// Market Factor Schema
const MarketFactorSchema = Yup.object().shape({
    id: Yup.string().required('Market factor ID is required'),
    name: Yup.string().required('Market factor name is required'),
    description: Yup.string().default(''),
    distribution: DistributionTypeSchema.required('Distribution is required'),
    isDefault: Yup.boolean().default(false)
});

// Default market factors array
const DEFAULT_MARKET_FACTORS = [
    {
        id: 'baseEscalationRate',
        name: 'Base Escalation Rate',
        description: 'Default cost escalation for all operations',
        distribution: {
            key: 'baseEscalationRate',
            type: 'fixed',
            timeSeriesMode: false,
            parameters: {
                value: 1.0,
                drift: 2.5
            },
            timeSeriesParameters: {
                value: []
            },
            metadata: {
                percentileDirection: 'ascending'
            }
        },
        isDefault: true
    }
];

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
const CostSourcesSchema = Yup.object().shape({
    id: Yup.string().required('ID is required'),
    name: Yup.string().required('Name is required'),
    totalAmount: Yup.number().default(0),
    drawdownSchedule: Yup.array().of(DataPointSchema).default([])
});

// Settings Schema
const SettingsSchema = Yup.object().shape({
    general: Yup.object().shape({
        projectName: Yup.string().default('Wind Farm Project'),
        projectLife: Yup.number().default(20),
        startDate: Yup.date(),
    }),
    project: Yup.object().shape({
        equipment: Yup.object().shape({
            blades: Yup.object().shape({
                bladeLength: Yup.number().default(68),
                lepType: Yup.string().default('No LEP'),
                lepRepairEnabled: Yup.boolean().default(false),
                lepRepairInterval: Yup.number().default(10),
                lepRepairEffectiveness: Yup.number().default(90),
                lepLength: Yup.number().default(13),
                lepInPowerCurve: Yup.boolean().default(false),
                nominalTipSpeed: Yup.number().default(88),
                velocityExponent: Yup.number().default(8.0),
            }),
            failureRates: ComponentFailureModelingSchema
        }),
        economics: Yup.object().shape({
            marketFactors: Yup.object().shape({
                // Market factor definitions (moved from settings.marketFactors)
                factors: Yup.mixed().default(() => {
                    // Convert default array to object with dynamic keys
                    return DEFAULT_MARKET_FACTORS.reduce((acc, factor) => {
                        acc[factor.id] = factor;
                        return acc;
                    }, {});
                }),
                // Cost category to market factor mappings (moved from failureRates.costCategoryFactors)
                costCategoryFactors: Yup.object().shape({
                    material: Yup.string().default('baseEscalationRate'),
                    labor: Yup.string().default('baseEscalationRate'),
                    tooling: Yup.string().default('baseEscalationRate'),
                    crane: Yup.string().default('baseEscalationRate'),
                    contractsLocal: Yup.string().default('baseEscalationRate'),
                    contractsForeign: Yup.string().default('baseEscalationRate'),
                    other: Yup.string().default('baseEscalationRate')
                }).default(() => ({
                    material: 'baseEscalationRate',
                    labor: 'baseEscalationRate',
                    tooling: 'baseEscalationRate',
                    crane: 'baseEscalationRate',
                    contractsLocal: 'baseEscalationRate',
                    contractsForeign: 'baseEscalationRate',
                    other: 'baseEscalationRate'
                }))
            }),
            revenue: Yup.object().shape({
                energyProduction: DistributionTypeSchema.default(() => ({
                    key: 'energyProduction',
                    type: 'normal',
                    timeSeriesMode: false,
                    parameters: {
                        value: 100000,
                        stdDev: 10
                    },
                    metadata: {
                        percentileDirection: 'descending' // Higher percentiles = lower production = more conservative
                    }
                })),
                electricityPrice: DistributionTypeSchema.default(() => ({
                    key: 'electricityPrice',
                    type: 'gbm', // Changed to GBM type
                    timeSeriesMode: false,
                    parameters: {
                        value: 50,
                        drift: 4,
                        volatility: 2,
                        timeStep: 1
                    },
                    metadata: {
                        percentileDirection: 'descending' // Higher percentiles = lower prices = more conservative
                    }
                }))
            })
        }),
        windFarm: Yup.object().shape({
            numWTGs: Yup.number().default(20),
            wtgPlatformType: Yup.string().oneOf(['geared', 'direct-drive']).default('geared'),
            mwPerWTG: Yup.number().default(3.5),
            capacityFactor: Yup.number().default(35),
            curtailmentLosses: Yup.number().default(0),
            electricalLosses: Yup.number().default(0),
            // Project timeline dates - set relative to today
            devDate: Yup.date().default(() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() - 2); // 2 years ago (4 years before default COD)
                return date;
            }),
            ntpDate: Yup.date().default(() => {
                const date = new Date();
                date.setFullYear(date.getFullYear()); // Current year (2 years before default COD)
                return date;
            }),
            codDate: Yup.date().default(() => {
                const date = new Date();
                date.setFullYear(date.getFullYear() + 2); // 2 years from now
                return date;
            }),
            baseDate: Yup.date().default(() => {
                const date = new Date();
                date.setFullYear(date.getFullYear()); // 2 years from now
                return date;
            }),
        }),
        currency: Yup.object().shape({
            local: Yup.string().default('USD'),
            foreign: Yup.string().default('EUR'),
            exchangeRate: Yup.number().default(1.0),
        }),
        location: Yup.string(),
        environment: Yup.object().shape({
            siteConditions: Yup.object().shape({
                turbulenceIntensity: Yup.number().default(0.16),
                surfaceRoughness: Yup.number().default(0.03),
                kaimalScale: Yup.number().default(8.1),
                airDensity: Yup.number().default(1.225),
                windShearExponent: Yup.number().default(0.14),
                salinityLevel: Yup.string().oneOf(['low', 'moderate', 'high', 'marine']).default('moderate'),
                startStopCyclesPerYear: Yup.number().default(200)
            }),
            weather: Yup.object().shape({
                windVariability: DistributionTypeSchema.default(() => ({
                    key: 'windVariability',
                    type: 'weibull',
                    timeSeriesMode: false,
                    parameters: {
                        value: 7.5,
                        scale: 7.9,
                        shape: 1.8
                    },
                    metadata: {
                        percentileDirection: 'descending' // Higher percentiles = lower wind speeds = more conservative
                    }
                })),
                temperatureRange: Yup.number().default(60),
                dailyTempSwing: Yup.number().default(15),
                relativeHumidity: Yup.number().min(0).max(1).default(0.65),
                rainfallAmount: DistributionTypeSchema.default(() => ({
                    key: 'rainfallAmount',
                    type: 'gamma',
                    timeSeriesMode: false,
                    parameters: {
                        value: 1200,
                        scale: 12,
                        shape: 100,
                        stdDev: 10
                    },
                    metadata: {
                        percentileDirection: 'ascending' // Higher percentiles = lower production = more conservative
                    }
                }))
            })
        }),
    }),
    modules: Yup.object().shape({
        financing: Yup.object().shape({
            model: Yup.string().oneOf(['Balance-Sheet', 'Project-Finance']).default('Project-Finance'),
            loanDuration: Yup.number().default(15),
            minimumDSCR: Yup.number().default(1.3),
            costOfConstructionDebt: Yup.number().default(4),
            costOfOperationalDebt: Yup.number().default(5),
            debtFinancingRatio: Yup.number().min(0).max(100).default(70),
            effectiveTaxRate: Yup.number().default(25),
            costOfEquity: Yup.number().default(5),
            gracePeriod: Yup.number().default(1),

            idcCapitalization: Yup.boolean().default(true),
            equityTiming: Yup.string().oneOf(['upfront', 'progressive', 'atCOD']).default('progressive'),
            amortizationType: Yup.string().oneOf(['bullet', 'amortizing']).default('amortizing'),

            equityIRRTarget: Yup.number().default(12),
            projectIRRTarget: Yup.number().default(10),
            targetPaybackPeriod: Yup.number().default(8),
        }),
        cost: Yup.object().shape({
            //annualBaseOM: Yup.number().default(5000000),
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
            constructionPhase: Yup.object().shape({
                costSources: Yup.array().of(CostSourcesSchema).default([])
            }),
        }),
        revenue: Yup.object().shape({
            revenueDegradationRate: Yup.number().default(0.5),
            downtimePerEvent: DistributionTypeSchema.default(() => ({
                key: 'downtimePerEvent',
                type: 'lognormal', // Matches getDefaultSettings
                timeSeriesMode: false,
                parameters: {
                    value: 90,
                    sigma: 0.3,
                    mu: Math.round(Math.log(90) * 100) / 100,
                },
                metadata: {
                    percentileDirection: 'ascending' // Higher percentiles = more downtime = more conservative (cost-like)
                }
            })),
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
                fixedFeeTimeSeries: Yup.array().of(DataPointSchema).default([]),
                isPerTurbine: Yup.boolean().default(false),
                oemScopeId: Yup.string().required('OEM scope ID is required'),
                oemScopeName: Yup.string().default(''),
                escalation: Yup.object().shape({
                    minValue: Yup.number().default(0),
                    maxValue: Yup.number().default(0),
                    useMin: Yup.boolean().default(false),
                    useMax: Yup.boolean().default(false),
                }),
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
            { value: 90, description: 'extreme_upper' },
        ]),
        primaryPercentile: Yup.number().min(1).max(99).default(50) // Matches getDefaultSettings
    }),
    metrics: Yup.object().shape({
        totalMW: Yup.number().default(70), // Matches getDefaultSettings
        grossAEP: Yup.number().default(214032), // Matches getDefaultSettings
        netAEP: Yup.number().default(214032), // Matches getDefaultSettings
        debtToEquityRatio: Yup.number().default(1.5), // Matches getDefaultSettings
        wacc: Yup.number().default(5), // Matches getDefaultSettings
        totalCapex: Yup.number().default(0),
        devYear: Yup.number().default(-4),
        ntpYear: Yup.number().default(-2),
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

const PercentileDataSchema = Yup.object().shape({
    selected: Yup.number().min(0).max(100).default(50),
    available: Yup.array().of(Yup.number()).default([10, 25, 50, 75, 90]),
    custom: Yup.mixed().nullable().default(null), // Custom percentiles per source
    primary: Yup.number().min(0).max(100).default(50),
    strategy: Yup.string().oneOf(['unified', 'perSource']).default('unified'),
});

// InputSim Schema
const InputSimSchema = Yup.object().shape({
    distributionAnalysis: Yup.object().shape({
        energyProduction: SimulationInfoSchema.nullable().default(null),
        electricityPrice: SimulationInfoSchema.nullable().default(null),
        windVariability: SimulationInfoSchema.nullable().default(null),
        downtimePerEvent: SimulationInfoSchema.nullable().default(null),
        escalationRate: SimulationInfoSchema.nullable().default(null),
        rainfallAmount: SimulationInfoSchema.nullable().default(null),
        craneMarketFactor: SimulationInfoSchema.nullable().default(null),
        laborMarketFactor: SimulationInfoSchema.nullable().default(null),
        escalationVariability: SimulationInfoSchema.nullable().default(null)
    }),
    cashflow: Yup.object().shape({
        percentileData: PercentileDataSchema.nullable().default(null),
        selectedPercentile: Yup.object().shape({
            strategy: Yup.string().oneOf(['unified', 'perSource']).default('unified'),
            value: Yup.number().min(0).max(100).default(50),
            customPercentile: Yup.mixed().default({}), // Custom percentiles per source, empty by default
            // customPercentile: Yup.array().of(Yup.object().shape({
            //     key: Yup.string().required('Source key is required'),
            //     value: Yup.mixed().required('Custom percentile value is required')
            // })).default([]),
        }),
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
    // Dynamic keys for market factor IDs - using mixed() instead of lazy() for Mongoose compatibility
    marketFactors: Yup.mixed().default({}),
    // Dynamic keys for failure rate component IDs - following marketFactors pattern
    failureRates: Yup.mixed().default({}),
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
        inputSim: InputSimSchema.required(),
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
    details: Yup.object().shape({
        projectName: Yup.string(),
        totalMW: Yup.number(),
        windFarmSize: Yup.number(),
        projectLife: Yup.number(),
        numWTGs: Yup.number(),
        mwPerWTG: Yup.number(),
        capacityFactor: Yup.number(),
        currency: Yup.string(),
        startDate: Yup.date(),
        netAEP: Yup.number()
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
    ScenarioListingSchema,
    CostSourcesSchema
};