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
    contractFees,
    majorRepairs,
    reserveFunds
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
                visualGroup: 'economic_factors',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
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
                visualGroup: 'ppa',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
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
                visualGroup: 'bop',
                cashflowType: 'outflow',
                accountingClass: 'capex',
                projectPhase: 'construction',
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
                visualGroup: 'financing',
                cashflowType: 'outflow',
                accountingClass: 'financing_cost',
                projectPhase: 'construction',
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
                visualGroup: 'oems',
                cashflowType: 'outflow',
                accountingClass: 'capex',
                projectPhase: 'construction',
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
            transformer: majorRepairs,
            multipliers: [
                { id: 'escalationRate', operation: 'compound', baseYear: 1 }
            ],
            metadata: {
                name: 'Major Repairs',
                type: 'indirect',
                visualGroup: 'sub_contractors',
                cashflowType: 'outflow',
                accountingClass: 'opex',
                projectPhase: 'operations',
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
            transformer: reserveFunds,
            multipliers: [],
            metadata: {
                name: 'Reserve Funds',
                type: 'indirect',
                visualGroup: 'reserves',
                cashflowType: 'outflow',
                accountingClass: 'capex',
                projectPhase: 'construction',
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
                visualGroup: 'ppa',
                cashflowType: 'inflow',
                accountingClass: 'revenue',
                projectPhase: 'operations',
                description: 'Energy production revenue (MWh × Price × Escalation)',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'interestDuringConstruction',
            priority: 220,
            path: null,
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] }
            ],
            transformer: interestDuringConstruction,
            multipliers: [],
            metadata: {
                name: 'Interest During Construction',
                type: 'virtual',
                visualGroup: 'financing',
                cashflowType: 'outflow',
                accountingClass: 'financing_cost',
                projectPhase: 'construction',
                description: 'Capitalized interest costs during construction phase',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'operationalPrincipal',
            priority: 230,
            path: null,
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
                visualGroup: 'financing',
                cashflowType: 'outflow',
                accountingClass: 'liability',
                projectPhase: 'operations',
                description: 'Annual principal repayments during operational period',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'operationalInterest',
            priority: 240,
            path: null,
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
                visualGroup: 'financing',
                cashflowType: 'outflow',
                accountingClass: 'liability',
                projectPhase: 'operations',
                description: 'Annual interest payments during operational period',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalCapex',
            priority: 700,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: totalCapex,
            multipliers: [],
            metadata: {
                name: 'Total CAPEX',
                type: 'virtual',
                visualGroup: 'aggregation',
                cashflowType: 'outflow',
                accountingClass: 'capex',
                projectPhase: 'construction',
                description: 'Total capital expenditure across all construction phases',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalCost',
            priority: 800,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: totalCost,
            multipliers: [],
            metadata: {
                name: 'Total Cost',
                type: 'virtual',
                visualGroup: 'aggregation',
                cashflowType: 'outflow',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Total project costs including CAPEX and OPEX',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalRevenue',
            priority: 810,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: totalRevenue,
            multipliers: [],
            metadata: {
                name: 'Total Revenue',
                type: 'virtual',
                visualGroup: 'aggregation',
                cashflowType: 'inflow',
                accountingClass: 'revenue',
                projectPhase: 'operations',
                description: 'Total project revenue from all sources',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'debtService',
            priority: 850,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: debtService,
            multipliers: [],
            metadata: {
                name: 'Debt Service',
                type: 'virtual',
                visualGroup: 'financing',
                cashflowType: 'outflow',
                accountingClass: 'liability',
                projectPhase: 'operations',
                description: 'Annual debt service payments (principal + interest)',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'netCashflow',
            priority: 900,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: netCashflow,
            multipliers: [],
            metadata: {
                name: 'Net Cashflow',
                type: 'virtual',
                visualGroup: 'aggregation',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Net project cashflow (revenues - costs)',
                customPercentile: 50,
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        }
    ]
};