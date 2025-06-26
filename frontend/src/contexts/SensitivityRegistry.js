// frontend/src/contexts/SensitivityRegistry.js
// Fixed with proper .id references

import { name } from "plotly.js/lib/scatter";

export const SENSITIVITY_SOURCE_REGISTRY = {
    technical: [
        {
            id: 'availability',
            name: 'WTG Availability',
            description: 'Wind Turbine Availability Factor',
            category: 'technical',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'availability'],
            affects: ['energyRevenue'], // References specific .id from CASHFLOW_SOURCE_REGISTRY
            multipliers: [],
            data: {
                units: '%',
                impactType: 'multiplicative'
            }
        },
        {
            id: 'windVariability',
            name: 'Wind Speed',
            description: 'Wind Resource Variability',
            category: 'technical',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'],
            affects: ['energyRevenue'], // References specific .id
            multipliers: [],
            data: {
                units: '%',
                impactType: 'multiplicative'
            }
        },
        {
            id: 'capacityFactor',
            name: 'Capacity Factor',
            description: 'Net Capacity Factor',
            category: 'technical',
            hasPercentiles: false,
            path: ['settings', 'project', 'windFarm', 'capacityFactor'],
            affects: ['energyRevenue'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'multiplicative'
            }
        },
        {
            id: 'degradationRate',
            name: 'Performance Degradation',
            description: 'Annual Performance Degradation Rate',
            category: 'technical',
            hasPercentiles: false,
            path: ['settings', 'project', 'windFarm', 'degradationRate'],
            affects: ['energyRevenue'],
            multipliers: [],
            data: {
                units: '%/year',
                impactType: 'time_series_modifier'
            }
        }
    ],

    financial: [
        {
            id: 'costOfEquity',
            name: 'Cost of Equity',
            description: 'Cost of Equity',
            category: 'financing',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'costOfEquity'],
            affects: ['equityReturns'], // Specific financing calculation IDs
            multipliers: [],
            data: {
                units: '%',
                impactType: 'recalculation'
            }
        },
        {
            id: 'debtRatio',
            name: 'Debt Ratio',
            description: 'Debt to Total Capital Ratio',
            category: 'financing',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'debtRatio'],
            affects: ['debtService'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'recalculation'
            }
        },
        {
            id: 'interestRate',
            name: 'Debt Interest Rate',
            description: 'Debt Interest Rate',
            category: 'financing',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'interestRate'],
            affects: ['debtService'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'recalculation'
            }
        },
        {
            id: 'taxRate',
            name: 'Corp Tax Rate',
            description: 'Corporate Tax Rate',
            category: 'financing',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'taxRate'],
            affects: ['taxShield'],
            multipliers: [],
            data: {
                units: '%',
                impactType: 'recalculation'
            }
        }
    ],

    operational: [
        {
            id: 'insuranceCost',
            name: 'Insurance Costs',
            description: 'Annual Insurance Cost',
            category: 'operational',
            hasPercentiles: false,
            path: ['settings', 'project', 'costs', 'insurance'],
            affects: ['insuranceCosts'], // Specific cost entry ID
            multipliers: [
                {
                    id: 'insurance_escalation',
                    operation: 'compound',
                    path: ['settings', 'modules', 'cost', 'insuranceEscalation']
                }
            ],
            data: {
                units: '$/year',
                impactType: 'additive'
            }
        },
        {
            id: 'landLeaseCost',
            name: 'Land Lease Costs',
            description: 'Annual Land Lease Payments',
            category: 'operational',
            hasPercentiles: false,
            path: ['settings', 'project', 'costs', 'landLease'],
            affects: ['landLeaseCosts'],
            multipliers: [
                {
                    id: 'lease_escalation',
                    operation: 'compound',
                    path: ['settings', 'modules', 'cost', 'leaseEscalation']
                }
            ],
            data: {
                units: '$/year',
                impactType: 'additive'
            }
        }
    ]
};

/**
 * Discover all variables with separate registry parameters
 * @param {Object} cashflowRegistry - CASHFLOW_SOURCE_REGISTRY
 * @param {Object} sensitivityRegistry - SENSITIVITY_SOURCE_REGISTRY
 * @returns {Array} Combined array of all sensitivity variables
 */
export const discoverAllSensitivityVariables = (cashflowRegistry, sensitivityRegistry) => {
    const variables = [];

    // Extract direct variables from CASHFLOW_SOURCE_REGISTRY
    if (cashflowRegistry) {
        ['multipliers', 'costs', 'revenues'].forEach(section => {
            if (cashflowRegistry[section]) {
                cashflowRegistry[section].forEach(source => {
                    if (source.hasPercentiles) {
                        variables.push({
                            id: source.id,
                            label: source.description || source.id,
                            category: source.category,
                            path: source.path,
                            hasPercentiles: true,
                            variableType: section.slice(0, -1),
                            source: 'direct',
                            registryCategory: section,
                            multipliers: source.multipliers || [],
                            units: source.data?.units || '',
                            displayCategory: source.category || section.slice(0, -1)
                        });
                    }
                });
            }
        });
    }

    // Extract indirect variables from SENSITIVITY_SOURCE_REGISTRY
    if (sensitivityRegistry) {
        ['technical', 'financial', 'operational'].forEach(section => {
            if (sensitivityRegistry[section]) {
                sensitivityRegistry[section].forEach(source => {
                    if (source.hasPercentiles) {
                        variables.push({
                            id: source.id,
                            label: source.description || source.id,
                            category: source.category,
                            path: source.path,
                            hasPercentiles: true,
                            variableType: source.category,
                            source: 'indirect',
                            registryCategory: section,
                            affects: source.affects || [],
                            multipliers: source.multipliers || [],
                            units: source.data?.units || '',
                            impactType: source.data?.impactType || 'multiplicative',
                            displayCategory: source.category || section
                        });
                    }
                });
            }
        });
    }

    return variables;
};

// Rest of utility functions remain the same...