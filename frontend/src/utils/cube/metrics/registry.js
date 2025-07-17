// Updated utils/cube/metrics/registry.js
import { calculateNPVCosts, calculateNPVEnergy, calculateProjectIRR } from './transformers';

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
            transformer: calculateNPVEnergy, // Derive MWh from revenue, then NPV
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
            transformer: null,
            operations: [
                {
                    id: 'cumulativeCashflow',
                    operation: (baseValue, percentile, source, references) => {
                        // Find first year where cumulative cashflow becomes positive
                        const positiveYear = source.find(dataPoint => dataPoint.value > 0);
                        return positiveYear ? positiveYear.year : references.projectLife; // Return year or project life if never positive
                    }
                }
            ],
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
            transformer: null,
            operations: [
                {
                    id: 'npvEnergy',
                    operation: (npvCostsValue, percentile, npvEnergyValue, references) => {
                        // LCOE = NPV of Costs / NPV of Energy (in MWh)
                        return npvEnergyValue > 0 ? (npvCostsValue / npvEnergyValue) : 0;
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

        // Simplified IRR metrics (keeping transformers for complex calculations)
        {
            id: 'projectIRR',
            priority: 100,
            dependencies: [
                { id: 'netCashflow', type: 'source' },
                { id: 'totalCapex', type: 'source' }
            ],
            aggregations: [],
            transformer: calculateProjectIRR, // Still needs transformer for IRR calculation
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
            sensitivity: {
                enabled: true,
                excludeSources: ['reserveFunds'],
                analyses: ['tornado', 'correlation']
            }
        }
    ]
};