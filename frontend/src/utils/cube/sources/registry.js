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
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'escalationRate'],
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
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'electricityPrice'],
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
            transformer: (sourceData, context) => {
                // Placeholder for capexDrawdownToAnnualCosts transformer
                // TODO: Implement conversion from drawdown schedule to annual costs
                // Access context: hasPercentiles, availablePercentiles, allReferences, processedData, options
                return sourceData || []; // Return as-is for now
            },
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
            transformer: (sourceData, context) => {
                // Placeholder for debtDrawdownToAnnualCosts transformer
                // TODO: Implement conversion from debt drawdown to annual costs
                // Can access financing data via context.allReferences.financing
                return sourceData || []; // Return as-is for now
            },
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
            transformer: (sourceData, context) => {
                // Placeholder for contractsToAnnualCosts transformer
                // TODO: Implement conversion from contracts to annual costs
                // Can use context.options for custom transformation parameters
                return sourceData || []; // Return as-is for now
            },
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
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction'],
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
        {
            id: 'totalCapex',
            priority: 999,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: (sourceData, context) => {
                // Placeholder for totalCapex calculation
                // TODO: Aggregate all CAPEX sources from context.processedData
                // Filter processedData for sources with metadata.category === 'construction'
                return []; // Return empty array for now
            },
            multipliers: [],
            metadata: {
                name: 'Total CAPEX',
                type: 'virtual',
                cashflowGroup: 'cost',
                category: 'aggregation',
                description: 'Total capital expenditure across all construction phases',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalCost',
            priority: 999,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: (sourceData, context) => {
                // Placeholder for totalCost calculation
                // TODO: Aggregate all cost sources from context.processedData
                // Filter processedData for sources with metadata.cashflowGroup === 'cost'
                return []; // Return empty array for now
            },
            multipliers: [],
            metadata: {
                name: 'Total Cost',
                type: 'virtual',
                cashflowGroup: 'cost',
                category: 'aggregation',
                description: 'Total project costs including CAPEX and OPEX',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'totalRevenue',
            priority: 999,
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: (sourceData, context) => {
                // Placeholder for totalRevenue calculation
                // TODO: Aggregate all revenue sources from context.processedData
                // Filter processedData for sources with metadata.cashflowGroup === 'revenue'
                return []; // Return empty array for now
            },
            multipliers: [],
            metadata: {
                name: 'Total Revenue',
                type: 'virtual',
                cashflowGroup: 'revenue',
                category: 'aggregation',
                description: 'Total project revenue from all sources',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'debtService',
            priority: 999,
            path: null,
            hasPercentiles: false,
            references: [
                { id: 'financing', path: ['settings', 'modules', 'financing'] }
            ],
            transformer: (sourceData, context) => {
                // Placeholder for debtService calculation
                // TODO: Calculate debt service schedule from financing parameters
                // Access financing data via context.allReferences.financing
                // Can use context.options for custom calculation parameters (e.g., amortization method)
                return []; // Return empty array for now
            },
            multipliers: [],
            metadata: {
                name: 'Debt Service',
                type: 'virtual',
                cashflowGroup: 'liability',
                category: 'financing',
                description: 'Annual debt service payments (principal + interest)',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        },
        {
            id: 'netCashflow',
            priority: 1000, // Process after all other aggregations
            path: null,
            hasPercentiles: false,
            references: [],
            transformer: (sourceData, context) => {
                // Placeholder for netCashflow calculation
                // TODO: Calculate net cashflow = totalRevenue - totalCost - debtService
                // Access aggregated data from context.processedData
                // Look for sources with ids: 'totalRevenue', 'totalCost', 'debtService'
                return []; // Return empty array for now
            },
            multipliers: [],
            metadata: {
                name: 'Net Cashflow',
                type: 'virtual',
                cashflowGroup: 'none',
                category: 'aggregation',
                description: 'Net project cashflow (revenues - costs - debt service)',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            }
        }
    ]
};