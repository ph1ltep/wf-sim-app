// frontend/src/contexts/SensitivityRegistry.js
// Fixed with proper .id references

export const SENSITIVITY_SOURCE_REGISTRY = {
    // ✅ ADD: Global data structure alignment with CashflowSourceRegistrySchema
    data: {
        projectLife: ['settings', 'general', 'projectLife'],
        numWTGs: ['settings', 'project', 'windFarm', 'numWTGs'],
        currency: ['settings', 'project', 'currency', 'local']
    },

    technical: [
        {
            id: 'availability',
            displayName: 'WTG Availability',
            description: 'Wind Turbine Availability Factor',
            category: 'technical',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'availability'],
            multipliers: [],
            transformer: null,
            displayUnit: '%',
            dependencies: {
                affects: [
                    { sourceId: 'energyRevenue', impactType: 'multiplicative' }
                ]
            }
        },
        {
            id: 'windVariability',
            displayName: 'Wind Speed',
            description: 'Wind Resource Variability',
            category: 'technical',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'windVariability'],
            multipliers: [],
            transformer: null,
            displayUnit: '%',
            dependencies: {
                affects: [
                    { sourceId: 'energyRevenue', impactType: 'multiplicative' }
                ]
            }
        },
        {
            id: 'capacityFactor',
            displayName: 'Capacity Factor',
            description: 'Net Capacity Factor',
            category: 'technical',
            hasPercentiles: false,
            path: ['settings', 'project', 'windFarm', 'capacityFactor'],
            multipliers: [],
            transformer: null,
            displayUnit: '%',
            dependencies: {
                affects: [
                    { sourceId: 'energyRevenue', impactType: 'multiplicative' }
                ]
            }
        },
        {
            id: 'degradationRate',
            displayName: 'Performance Degradation',
            description: 'Annual Performance Degradation Rate',
            category: 'technical',
            hasPercentiles: false,
            path: ['settings', 'project', 'windFarm', 'degradationRate'],
            multipliers: [],
            transformer: null,
            displayUnit: '%/year',
            dependencies: {
                affects: [
                    { sourceId: 'energyRevenue', impactType: 'multiplicative' }
                ]
            }
        }
    ],

    financial: [
        {
            id: 'debtTerm',
            displayName: 'Debt Term',
            description: 'Debt facility term length',
            category: 'financial',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'debt', 'term'],
            multipliers: [],
            transformer: null,
            displayUnit: 'years',
            dependencies: {
                affects: [
                    { sourceId: 'debtService', impactType: 'recalculation' }
                ]
            }
        },
        {
            id: 'interestRate',
            displayName: 'Interest Rate',
            description: 'Debt facility interest rate',
            category: 'financial',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'interestRate'],
            multipliers: [],
            transformer: null,
            displayUnit: '%',
            dependencies: {
                affects: [
                    { sourceId: 'debtService', impactType: 'multiplicative' }
                ]
            }
        },
        {
            id: 'equityReturn',
            displayName: 'Required Equity Return',
            description: 'Target equity return threshold',
            category: 'financial',
            hasPercentiles: false,
            path: ['settings', 'modules', 'financing', 'equity', 'targetReturn'],
            multipliers: [],
            transformer: null,
            displayUnit: '%',
            dependencies: {
                affects: [
                    { sourceId: 'discountRate', impactType: 'additive' }
                ]
            }
        }
    ],

    operational: [
        {
            id: 'insuranceCost',
            displayName: 'Insurance Cost',
            description: 'Annual Insurance Cost',
            category: 'operational',
            hasPercentiles: false,
            path: ['settings', 'project', 'costs', 'insurance'],
            multipliers: [
                {
                    id: 'insurance_escalation',
                    operation: 'compound',
                    baseYear: 1
                }
            ],
            transformer: null,
            displayUnit: '$/year',
            dependencies: {
                affects: [
                    { sourceId: 'insuranceCosts', impactType: 'additive' }
                ]
            }
        },
        {
            id: 'landLeaseCost',
            displayName: 'Land Lease Costs',
            description: 'Annual Land Lease Payments',
            category: 'operational',
            hasPercentiles: false,
            path: ['settings', 'project', 'costs', 'landLease'],
            multipliers: [
                {
                    id: 'lease_escalation',
                    operation: 'compound',
                    baseYear: 1
                }
            ],
            transformer: null,
            displayUnit: '$/year',
            dependencies: {
                affects: [
                    { sourceId: 'landLeaseCosts', impactType: 'additive' }
                ]
            }
        },
        {
            id: 'oemServiceFees',
            displayName: 'OEM Service Fees',
            description: 'Original Equipment Manufacturer Service Contract Fees',
            category: 'operational',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'oemServiceCosts'],
            multipliers: [
                {
                    id: 'escalationRate',
                    operation: 'compound',
                    baseYear: 1
                }
            ],
            transformer: null,
            displayUnit: '$/MW/year',
            dependencies: {
                affects: [
                    { sourceId: 'contractFees', impactType: 'multiplicative' }
                ]
            }
        },
        {
            id: 'majorRepairFrequency',
            displayName: 'Major Repair Frequency',
            description: 'Frequency of major component replacement events',
            category: 'operational',
            hasPercentiles: true,
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'majorRepairEvents'],
            multipliers: [],
            transformer: null,
            displayUnit: 'events/year',
            dependencies: {
                affects: [
                    { sourceId: 'majorRepairs', impactType: 'multiplicative' }
                ]
            }
        }
    ]
};

// frontend/src/contexts/SensitivityRegistry.js

/**
 * Enhanced discovery function with debug tracing and simplified structure
 * @param {Object} cashflowRegistry - CASHFLOW_SOURCE_REGISTRY
 * @param {Object} sensitivityRegistry - SENSITIVITY_SOURCE_REGISTRY  
 * @returns {Array} Combined array of all sensitivity variables
 */
export const discoverAllSensitivityVariables = (cashflowRegistry, sensitivityRegistry) => {
    // ✅ DEBUG: Add call tracing
    const callId = Math.random().toString(36).substr(2, 9);
    const startTime = performance.now();

    console.log(`🔍 [${callId}] discoverAllSensitivityVariables() START`, {
        cashflowRegistry: !!cashflowRegistry,
        sensitivityRegistry: !!sensitivityRegistry,
        caller: new Error().stack.split('\n')[2]?.trim()
    });

    const variables = [];

    // Extract direct variables from CASHFLOW_SOURCE_REGISTRY
    if (cashflowRegistry) {
        ['multipliers', 'costs', 'revenues'].forEach(section => {
            if (cashflowRegistry[section]) {
                cashflowRegistry[section].forEach(source => {
                    if (source.hasPercentiles) {
                        // ✅ FIXED: Use displayName as primary, id as backup
                        variables.push({
                            id: source.id,
                            displayName: source.displayName || source.id, // ✅ Always string
                            category: source.category,
                            path: source.path,
                            source: 'direct',
                            multipliers: source.multipliers || [],
                            displayUnit: source.displayUnit || '',
                            transformer: source.transformer
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
                        // ✅ NEW STRUCTURE: Use dependencies.affects
                        const affects = source.dependencies?.affects || [];

                        variables.push({
                            id: source.id,
                            displayName: source.displayName || source.id, // ✅ Always string
                            category: source.category,
                            path: source.path,
                            source: 'indirect',
                            multipliers: source.multipliers || [],
                            affects: affects.map(dep => ({
                                sourceId: dep.sourceId,
                                impactType: dep.impactType
                            })),
                            displayUnit: source.displayUnit || '',
                            transformer: source.transformer
                        });
                    }
                });
            }
        });
    }

    const endTime = performance.now();

    // ✅ DEBUG: Show actual displayName values
    console.log('🔍 Variable names debug:', variables.map(v => ({
        id: v.id,
        displayName: v.displayName,
        nameType: typeof v.displayName,
        isObject: typeof v.displayName === 'object' ? JSON.stringify(v.displayName) : 'not object',
        path: v.path // ✅ ADD: Show the path being used
    })));

    console.log(`✅ [${callId}] discoverAllSensitivityVariables() END`, {
        duration: `${(endTime - startTime).toFixed(2)}ms`,
        totalVariables: variables.length,
        directCount: variables.filter(v => v.source === 'direct').length,
        indirectCount: variables.filter(v => v.source === 'indirect').length,
        variableNames: variables.map(v => v.displayName) // ✅ Show displayNames
    });

    return variables;
};