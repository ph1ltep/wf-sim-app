// frontend/src/utils/cube/sources/registry.js
import {
    totalCost,
    totalDebt,
    totalCapex,
    totalRevenue,
    netCashflow,
    capexDrawdown,
    debtDrawdown,
    interestDuringConstruction,
    operationalInterest,
    operationalPrincipal,
    debtService,
    contractFees
} from './transformers';

export const CASHFLOW_SOURCE_REGISTRY = {
    // Global references available to all transformers and multipliers
    references: [
        { id: 'projectLife', path: ['settings', 'general', 'projectLife'] },
        { id: 'numWTGs', path: ['settings', 'project', 'windFarm', 'numWTGs'] },
        { id: 'currency', path: ['settings', 'project', 'currency', 'local'] }
    ],

    sources: [
        // MULTIPLIERS - Direct sources (type: 'direct', priority: 9)
        {
            id: 'escalationRate',
            priority: 9,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'escalationRate', 'results'],
            hasPercentiles: true,
            references: [],
            transformer: null,
            multipliers: [],
            metadata: {
                name: 'Escalation Rate',
                type: 'direct',
                cashflowGroup: 'none',
                category: 'escalation',
                description: 'Annual cost escalation rate applied to all cost items',
                formatter: (value) => `${(value * 100).toFixed(1)}%`
            }
        },
        {
            id: 'electricityPrice',
            priority: 9,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'electricityPrice', 'results'],
            hasPercentiles: true,
            references: [],
            transformer: null,
            multipliers: [],
            metadata: {
                name: 'Electricity Price',
                type: 'direct',
                cashflowGroup: 'none',
                category: 'pricing',
                description: 'Electricity price per MWh used to calculate revenue',
                formatter: (value) => `$${value.toFixed(0)}/MWh`
            }
        },

        // COSTS - Indirect sources (type: 'indirect', priority: 99)
        {
            id: 'capexDrawdown',
            priority: 99,
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            hasPercentiles: false,
            references: [],
            transformer: capexDrawdown,
            multipliers: [],
            metadata: {
                name: 'CAPEX Drawdown',
                type: 'indirect',
                cashflowGroup: 'cost',
                category: 'construction',
                description: 'Construction phase CAPEX drawdown schedule',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'debtDrawdown',
            priority: 99,
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] }
            ],
            transformer: debtDrawdown,
            multipliers: [],
            metadata: {
                name: 'Debt Drawdown',
                type: 'indirect',
                cashflowGroup: 'cost',
                category: 'financing',
                description: 'Debt drawdown schedule during construction',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'contractFees',
            priority: 99,
            path: ['settings', 'modules', 'contracts', 'oemContracts'],
            hasPercentiles: false,
            references: [],
            transformer: contractFees,
            multipliers: [
                { id: 'escalationRate', operation: 'compound', baseYear: 1 }
            ],
            metadata: {
                name: 'Contract Fees',
                type: 'indirect',
                cashflowGroup: 'cost',
                category: 'contracts',
                description: 'OEM service contract fees (total project costs)',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'majorRepairs',
            priority: 99,
            path: ['settings', 'modules', 'cost', 'majorRepairEvents'],
            hasPercentiles: false,
            references: [],
            transformer: (sourceData, context) => {
                // Placeholder for majorRepairsToAnnualCosts transformer
                // TODO: Implement conversion from repair events to annual costs
                return sourceData || []; // Return as-is for now
            },
            multipliers: [
                { id: 'escalationRate', operation: 'compound', baseYear: 1 }
            ],
            metadata: {
                name: 'Major Repairs',
                type: 'indirect',
                cashflowGroup: 'cost',
                category: 'maintenance',
                description: 'Major repair events and costs',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'reserveFunds',
            priority: 99,
            path: ['settings', 'modules', 'risk', 'reserveFunds'],
            hasPercentiles: false,
            references: [],
            transformer: (sourceData, context) => {
                // Placeholder for reserveFundsToProvision transformer
                // TODO: Implement conversion from reserve funds to provision
                return sourceData || []; // Return as-is for now
            },
            multipliers: [],
            metadata: {
                name: 'Reserve Funds',
                type: 'indirect',
                cashflowGroup: 'cost',
                category: 'reserves',
                description: 'Reserve fund provisions (allocated but not spent)',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },

        // REVENUES - Indirect sources (type: 'indirect', priority: 99)
        {
            id: 'energyRevenue',
            priority: 99,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction', 'results'],
            hasPercentiles: true,
            references: [],
            transformer: null,
            multipliers: [
                { id: 'electricityPrice', operation: 'multiply', baseYear: 1 },
                { id: 'escalationRate', operation: 'compound', baseYear: 1 }
            ],
            metadata: {
                name: 'Energy Revenue',
                type: 'indirect',
                cashflowGroup: 'revenue',
                category: 'energy',
                description: 'Energy production revenue (MWh × Price × Escalation)',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },

        // VIRTUAL SOURCES - Aggregated/calculated sources (type: 'virtual', priority: 999)
        // {
        //     id: 'capexDrawdown',
        //     priority: 200, // First - needed by debtDrawdown
        //     path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
        //     hasPercentiles: false,
        //     references: [],
        //     transformer: capexDrawdown,
        //     multipliers: [],
        //     metadata: {
        //         name: 'CAPEX Drawdown',
        //         type: 'virtual',
        //         cashflowGroup: 'cost',
        //         category: 'construction',
        //         description: 'Construction phase CAPEX drawdown schedule',
        //         customPercentile: 50,
        //         formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
        //     }
        // },
        {
            id: 'debtDrawdown',
            priority: 210, // After capexDrawdown
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] }
            ],
            transformer: debtDrawdown,
            multipliers: [],
            metadata: {
                name: 'Debt Drawdown',
                type: 'virtual',
                cashflowGroup: 'liability',
                category: 'financing',
                description: 'Debt drawdown schedule during construction',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'interestDuringConstruction',
            priority: 220, // After debtDrawdown
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] }
            ],
            transformer: interestDuringConstruction,
            multipliers: [],
            metadata: {
                name: 'Interest During Construction',
                type: 'virtual',
                cashflowGroup: 'cost',
                category: 'financing',
                description: 'Capitalized interest costs during construction phase',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'operationalInterest',
            priority: 230, // After IDC
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] },
                { id: 'projectLife', path: ['settings', 'general', 'projectLife'] }
            ],
            transformer: operationalInterest,
            multipliers: [],
            metadata: {
                name: 'Operational Interest',
                type: 'virtual',
                cashflowGroup: 'liability',
                category: 'financing',
                description: 'Annual interest payments during operational period',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'operationalPrincipal',
            priority: 240, // After operationalInterest
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] },
                { id: 'projectLife', path: ['settings', 'general', 'projectLife'] }
            ],
            transformer: operationalPrincipal,
            multipliers: [],
            metadata: {
                name: 'Operational Principal',
                type: 'virtual',
                cashflowGroup: 'liability',
                category: 'financing',
                description: 'Annual principal repayments during operational period',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalCapex',
            priority: 700, // After all construction sources processed
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: totalCapex,
            multipliers: [],
            metadata: {
                name: 'Total CAPEX',
                type: 'virtual',
                cashflowGroup: 'cost',
                category: 'aggregation',
                description: 'Total capital expenditure across all construction phases',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalCost',
            priority: 800, // After all individual cost sources
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: totalCost,
            multipliers: [],
            metadata: {
                name: 'Total Cost',
                type: 'virtual',
                cashflowGroup: 'cost',
                category: 'aggregation',
                description: 'Total project costs including CAPEX and OPEX',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalRevenue',
            priority: 810, // After all revenue sources
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: totalRevenue,
            multipliers: [],
            metadata: {
                name: 'Total Revenue',
                type: 'virtual',
                cashflowGroup: 'revenue',
                category: 'aggregation',
                description: 'Total project revenue from all sources',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'debtService',
            priority: 850, // After operationalInterest and operationalPrincipal
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: debtService,
            multipliers: [],
            metadata: {
                name: 'Debt Service',
                type: 'virtual',
                cashflowGroup: 'liability',
                category: 'financing',
                description: 'Annual debt service payments (principal + interest)',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'netCashflow',
            priority: 900, // After totalRevenue, totalCost, and debtService
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: netCashflow,
            multipliers: [],
            metadata: {
                name: 'Net Cashflow',
                type: 'virtual',
                cashflowGroup: 'none',
                category: 'aggregation',
                description: 'Net project cashflow (revenues - costs)',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        }
    ]
};