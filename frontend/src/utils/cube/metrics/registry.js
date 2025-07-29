// Updated utils/cube/metrics/registry.js
import {
    calculateNPVCosts,
    calculateNPVEnergy,
    calculateProjectIRR,
    calculateEquityIRR,
    calculatePaybackPeriod,
    extractPercentileMetric
} from './transformers';

export const METRICS_REGISTRY = {
    references: [
        { id: 'financing', path: ['settings', 'modules', 'financing'] },
        { id: 'projectLife', path: ['settings', 'general', 'projectLife'] },
        { id: 'currency', path: ['settings', 'project', 'currency', 'local'] }
    ],

    metrics: [
        // NPV of Costs (building block for LCOE)
        {
            id: 'npvCosts',
            priority: 80,
            dependencies: [
                { id: 'totalCost', type: 'source' },
                { id: 'financing', type: 'reference' }
            ],
            aggregations: [
                {
                    sourceId: 'totalCost', operation: 'npv', outputKey: 'npvValue', isDefault: true,
                    parameters: { discountRate: (refs, metrics) => (refs.financing.costOfEquity) / 100 },
                    filter: (year, value, refs) => year >= 0 // Include all years including construction
                }
            ],
            transformer: null, // Simple NPV calculation
            operations: [],
            metadata: {
                name: 'NPV of Costs',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Net present value of all project costs',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            },
            sensitivity: { enabled: false } // Building block metric
        },

        // NPV of Energy Production (building block for LCOE)
        {
            id: 'npvEnergy',
            priority: 90,
            dependencies: [
                { id: 'energyRevenue', type: 'source' },
                { id: 'financing', type: 'reference' }
            ],
            aggregations: [
                {
                    sourceId: 'energyRevenue', operation: 'npv', outputKey: 'npvValue', isDefault: true,
                    parameters: { discountRate: (refs, metrics) => (refs.financing.costOfEquity) / 100 },
                    filter: (year, value, refs) => year >= 0 // Include all years including construction
                }
            ],
            transformer: null, //calculateNPVEnergy, // Derive MWh from revenue, then NPV
            operations: [],
            metadata: {
                name: 'NPV of Energy',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Net present value of energy production in MWh',
                formatter: (value) => `${(value / 1000).toFixed(0)}k MWh`
            },
            sensitivity: { enabled: false } // Building block metric
        },

        // DSCR Metrics using virtual source + aggregations
        {
            id: 'dscrMetrics',
            priority: 200,
            dependencies: [
                { id: 'dscr', type: 'source' }
            ],
            aggregations: [
                { sourceId: 'dscr', operation: 'min', outputKey: 'min', isDefault: true, filter: (year, value, refs) => year > 0 && year <= refs.financing.loanDuration },
                { sourceId: 'dscr', operation: 'max', outputKey: 'max', isDefault: false, filter: (year, value, refs) => year > 0 && year <= refs.financing.loanDuration },
                { sourceId: 'dscr', operation: 'mean', outputKey: 'avg', isDefault: false, filter: (year, value, refs) => year > 0 && year <= refs.financing.loanDuration }
            ],
            transformer: null, // Use aggregations only
            operations: [],
            metadata: {
                name: 'DSCR Metrics',
                type: 'direct',
                visualGroup: 'risk',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Debt service coverage ratio statistics',
                formatter: (value) => `${value.toFixed(2)}x`
            },
            thresholds: [
                { when: 'below', priority: 6, styleRule: (value, limits) => value < limits.financing.minimumDSCR ? { color: '#ff4d4f', fontWeight: 600 } : null },
                { when: 'between', priority: 5, styleRule: (value, limits) => value >= (limits.financing.minimumDSCR - 0.0) && value <= (limits.financing.minimumDSCR + 0.1) ? { color: '#faad14' } : null }
            ],
            sensitivity: {
                enabled: true,
                excludeSources: [],
                analyses: ['tornado', 'correlation']
            }
        },

        // Payback Period using cumulative cashflow + operations
        {
            id: 'paybackPeriod',
            priority: 130,
            dependencies: [
                { id: 'cumulativeCashflow', type: 'source' }
            ],
            aggregations: [],
            transformer: calculatePaybackPeriod,
            operations: [],
            metadata: {
                name: 'Payback Period',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Years to recover initial investment',
                formatter: (value) => `${value.toFixed(1)} years`
            },
            sensitivity: {
                enabled: true,
                excludeSources: ['reserveFunds'],
                analyses: ['tornado', 'correlation']
            }
        },

        // LCOE using operations between NPV metrics
        {
            id: 'lcoe',
            priority: 250,
            dependencies: [
                { id: 'npvCosts', type: 'metric' },
                { id: 'npvEnergy', type: 'metric' }
            ],
            aggregations: [],
            transformer: (dependencies, context) => {
                return dependencies.metrics.npvCosts.percentileMetrics
            },
            operations: [
                {
                    id: 'npvEnergy',
                    operation: (npvCost, percentile, npvEnergyValue, refs, metrics) => {
                        // LCOE = NPV of Costs / NPV of Energy (in MWh)
                        const npvCostsValue = extractPercentileMetric(metrics.npvCosts, percentile);
                        return npvEnergyValue > 0 ? (npvCost / npvEnergyValue) : 0;
                    }
                }
            ],
            metadata: {
                name: 'Levelized Cost of Energy',
                type: 'indirect',
                visualGroup: 'efficiency',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Levelized cost of energy production',
                formatter: (value) => `$${value.toFixed(2)}/MWh`
            },
            sensitivity: {
                enabled: true,
                excludeSources: ['reserveFunds'],
                analyses: ['tornado', 'correlation']
            }
        },
        {
            id: 'projectIRR',
            priority: 100,
            dependencies: [
                { id: 'projectCashflow', type: 'source' },
                { id: 'projectIRRTarget', type: 'reference', path: ['settings', 'modules', 'financing', 'projectIRRTarget'] }
            ],
            aggregations: [],
            transformer: calculateProjectIRR,
            operations: [],
            metadata: {
                name: 'Project IRR',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Internal rate of return for project cash flows',
                formatter: (value) => `${value.toFixed(2)}%`
            },
            thresholds: [
                { when: 'above', priority: 5, styleRule: (value, limits) => value > limits.projectIRRTarget ? { color: '#52c41a' } : null },
                { when: 'below', priority: 6, styleRule: (value, limits) => value < limits.projectIRRTarget ? { color: '#ff4d4f', fontWeight: 600 } : null },
                { when: 'equal', priority: 7, styleRule: (value, limits) => value === limits.projectIRRTarget ? { color: '#faad14' } : null },
                { when: 'notEqual', priority: 8, styleRule: (value, limits) => value !== limits.projectIRRTarget ? { color: '#1890ff' } : null },
                { when: 'between', priority: 4, styleRule: (value, limits) => value >= (limits.projectIRRTarget - 0.25) && value <= (limits.projectIRRTarget + 0.25) ? { color: '#faad14' } : null }],
            sensitivity: {
                enabled: true,
                excludeSources: ['reserveFunds'],
                analyses: ['tornado', 'correlation']
            }
        },
        {
            id: 'equityIRR',
            priority: 110,
            dependencies: [
                { id: 'equityCashflow', type: 'source' }
            ],
            aggregations: [],
            transformer: calculateEquityIRR,
            operations: [],
            metadata: {
                name: 'Equity IRR',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Internal rate of return for equity investors',
                formatter: (value) => `${value.toFixed(2)}%`
            },
            thresholds: [
                { when: 'above', priority: 5, styleRule: (value, limits) => value > limits.financing.equityIRRTarget ? { color: '#52c41a' } : null },
                { when: 'below', priority: 6, styleRule: (value, limits) => value < limits.financing.equityIRRTarget ? { color: '#ff4d4f', fontWeight: 600 } : null },
                { when: 'between', priority: 4, styleRule: (value, limits) => value >= (limits.financing.equityIRRTarget - 0.25) && value <= (limits.financing.equityIRRTarget + 0.25) ? { color: '#faad14' } : null }
            ],
            sensitivity: {
                enabled: true,
                excludeSources: ['reserveFunds'],
                analyses: ['tornado', 'correlation']
            }
        },
        {
            id: 'projectNPV',
            priority: 120,
            dependencies: [
                { id: 'projectCashflow', type: 'source' },
                { id: 'financing', type: 'reference' }
            ],
            aggregations: [
                {
                    sourceId: 'projectCashflow', operation: 'npv', outputKey: 'npvValue', isDefault: true,
                    parameters: { discountRate: (refs, metrics) => (refs.financing.costOfEquity || 8) / 100 }
                }
            ],
            transformer: null, // Use aggregation result only
            operations: [],
            metadata: {
                name: 'Project NPV',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Net present value of project cash flows',
                formatter: (value) => `$${(value / 1000000).toFixed(1)}M`
            },
            sensitivity: {
                enabled: true,
                excludeSources: ['reserveFunds'],
                analyses: ['tornado', 'correlation']
            }
        },
        {
            id: 'paybackPeriod',
            priority: 220,
            dependencies: [
                { id: 'cumulativeCashflow', type: 'source' }
            ],
            aggregations: [], // No aggregations - use transformer
            transformer: calculatePaybackPeriod,
            operations: [],
            metadata: {
                name: 'Payback Period',
                type: 'direct',
                visualGroup: 'profitability',
                cashflowType: 'none',
                accountingClass: 'none',
                projectPhase: 'operations',
                description: 'Simple payback period in years (when cumulative cashflow becomes positive)',
                formatter: (value) => value > 0 ? `${value} years` : 'No payback'
            },
            thresholds: [
                {
                    when: 'below', priority: 8, styleRule: (value, limits) => {
                        return value > 0 && value <= limits.financing?.maxPaybackPeriod ? { color: '#52c41a', fontWeight: 600 } : null;
                    }
                }
            ],
            sensitivity: { enabled: false }
        },
    ]
};