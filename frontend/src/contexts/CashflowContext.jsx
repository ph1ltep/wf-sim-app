// src/contexts/CashflowContext.jsx - Complete lazy initialization implementation
import React, { createContext, useContext, useCallback, useState, useMemo, useRef, useEffect } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { getPercentileSourcesFromRegistry, createPerSourceDefaults } from '../utils/cashflowUtils';
import { transformScenarioToCashflow } from '../utils/cashflow/transform';
import { CashflowSourceRegistrySchema } from 'schemas/yup/cashflow';
import { validate } from '../utils/validate';
import useInputSim from '../hooks/useInputSim';
import { generateConstructionCostSources } from '../utils/drawdownUtils';
import { refreshAllMetrics } from '../utils/metricsUtils';
import {
    isDistributionsComplete,
    isConstructionSourcesComplete
} from '../utils/dependencies/checkFunctions';
import { calculateSensitivityAnalysis } from '../utils/finance/sensitivityAnalysis';
import { SENSITIVITY_SOURCE_REGISTRY, discoverAllSensitivityVariables } from './SensitivityRegistry';
import { SUPPORTED_METRICS } from '../utils/finance/sensitivityMetrics';
import { computeAllMetrics } from '../utils/cashflow/metrics/processor';
import { getMetricsByUsage, getMetricConfig } from '../utils/cashflow/metrics/registry';
// PHASE 2: Add direct reference helper and percentile discovery
import { discoverPercentiles } from '../utils/finance/percentileUtils';
import { getSelectedPercentileData } from '../utils/cashflow/metrics/directReference';

const CashflowContext = createContext();
export const useCashflow = () => useContext(CashflowContext);

/**
 * CASHFLOW_SOURCE_REGISTRY Structure Rules:
 * 
 * 1. All sources must have .path (primary data source) as array of strings
 * 2. Optional .references as array of path arrays for additional data
 * 3. Cannot have .references without .path
 * 4. Required fields: id, path, category, hasPercentiles, description
 * 5. Global data paths defined in .data section
 */

// Updated source registry with new structure: .path + .references array
export const CASHFLOW_SOURCE_REGISTRY = {
    // Global data available to all transformers
    data: {
        projectLife: ['settings', 'general', 'projectLife'],
        numWTGs: ['settings', 'project', 'windFarm', 'numWTGs'],
        currency: ['settings', 'project', 'currency', 'local']
    },

    multipliers: [
        {
            id: 'escalationRate',
            displayName: 'Escalation Rate',
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'escalationRate'],
            category: 'escalation',
            hasPercentiles: true,
            transformer: null,
            description: 'Annual cost escalation rate applied to all cost items'
        },
        {
            id: 'electricityPrice',
            displayName: 'Electricity Price',
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'electricityPrice'],
            category: 'pricing',
            hasPercentiles: true,
            transformer: null,
            description: 'Electricity price per MWh used to calculate revenue'
        }
    ],
    costs: [
        {
            id: 'capexDrawdown',
            displayName: 'CAPEX Drawdown',
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            category: 'construction',
            hasPercentiles: false,
            transformer: 'capexDrawdownToAnnualCosts',
            multipliers: [],
            description: 'Construction phase CAPEX drawdown schedule',
            displayNote: 'Construction investments occur in negative years (before COD)'
        },
        {
            id: 'debtDrawdown',
            displayName: 'Debt Drawdown',
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            references: [
                ['settings', 'modules', 'financing']
            ],
            category: 'financing',
            hasPercentiles: false,
            transformer: 'debtDrawdownToAnnualCosts',
            multipliers: [],
            description: 'Debt drawdown during construction phase (% of CAPEX)',
            displayNote: 'Debt is drawn to fund construction spending'
        },
        {
            id: 'interestDuringConstruction',
            displayName: 'CAPEX Interest',
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            references: [
                ['settings', 'modules', 'financing']
            ],
            category: 'financing',
            hasPercentiles: false,
            transformer: 'interestDuringConstruction',
            multipliers: [],
            description: 'Interest During Construction (IDC) - capitalized interest costs',
            displayNote: 'Only included if IDC capitalization is enabled'
        },
        {
            id: 'operationalInterest',
            displayName: 'OPEX Interest',
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            references: [
                ['settings', 'modules', 'financing']
            ],
            category: 'financing',
            hasPercentiles: false,
            transformer: 'operationalInterestPayments',
            multipliers: [],
            description: 'Annual interest payments during operational period',
            displayNote: 'Interest portion of debt service - used for ICR calculation'
        },
        {
            id: 'operationalPrincipal',
            displayName: 'OPEX Principal',
            path: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources'],
            references: [
                ['settings', 'modules', 'financing']
            ],
            category: 'financing',
            hasPercentiles: false,
            transformer: 'operationalPrincipalPayments',
            multipliers: [],
            description: 'Annual principal repayments during operational period',
            displayNote: 'Principal portion of debt service'
        },
        {
            id: 'contractFees',
            displayName: 'Contract Fees',
            path: ['settings', 'modules', 'contracts', 'oemContracts'],
            category: 'contracts',
            hasPercentiles: false,
            transformer: 'contractsToAnnualCosts',
            multipliers: [
                { id: 'escalationRate', operation: 'multiply', baseYear: 1 }
            ],
            description: 'OEM service contract fees (fixed or time-series based)'
        },
        {
            id: 'majorRepairs',
            displayName: 'Major Repairs',
            path: ['settings', 'modules', 'cost', 'majorRepairEvents'],
            category: 'maintenance',
            hasPercentiles: false,
            transformer: 'majorRepairsToAnnualCosts',
            multipliers: [
                { id: 'escalationRate', operation: 'multiply', baseYear: 1 }
            ],
            description: 'Major repair events and associated costs'
        },
        {
            id: 'insurancePremium',
            displayName: 'Insurance Premium',
            path: ['settings', 'modules', 'risk', 'insurancePremium'],
            category: 'insurance',
            hasPercentiles: false,
            transformer: 'fixedCostToTimeSeries',
            multipliers: [
                { id: 'escalationRate', operation: 'multiply', baseYear: 1 }
            ],
            description: 'Annual insurance premium payments'
        },
        {
            id: 'reserveFunds',
            displayName: 'Reserve Funds',
            path: ['settings', 'modules', 'risk', 'reserveFunds'],
            category: 'reserves',
            hasPercentiles: false,
            transformer: 'reserveFundsToProvision',
            multipliers: [],
            description: 'Reserve fund provisions (allocated but not spent)',
            displayNote: 'Shown as provision allocation, not immediate cash outflow'
        }
    ],
    revenues: [
        {
            id: 'energyRevenue',
            displayName: 'Energy Revenue',
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'energyProduction'],
            category: 'energy',
            hasPercentiles: true,
            transformer: null,
            multipliers: [
                { id: 'electricityPrice', operation: 'multiply', baseYear: 1 },
                { id: 'escalationRate', operation: 'multiply', baseYear: 1 }
            ],
            description: 'Energy production revenue (MWh × Price × Escalation)'
        }
    ]
};


// Simple registry validation using existing schema validation
const validateRegistry = async () => {
    try {
        const result = await validate(CashflowSourceRegistrySchema, CASHFLOW_SOURCE_REGISTRY);
        if (!result.isValid) {
            console.error('🚨 CASHFLOW_SOURCE_REGISTRY validation errors:', result.errors);
            if (process.env.NODE_ENV === 'development') {
                throw new Error(`Registry validation failed: ${result.errors.join(', ')}`);
            }
        }
        return result.isValid;
    } catch (error) {
        console.error('🚨 Registry validation error:', error);
        if (process.env.NODE_ENV === 'development') {
            throw error;
        }
        return false;
    }
};

// Validate on module load
validateRegistry();

export const CashflowProvider = ({ children }) => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();
    const { updateDistributions } = useInputSim();

    // Core data state
    const [sensitivityData, setSensitivityData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [transformError, setTransformError] = useState(null);

    // Refresh cycle state
    const [refreshRequested, setRefreshRequested] = useState(false);
    const [refreshStage, setRefreshStage] = useState('idle');
    const refreshTimeoutRef = useRef(null);

    // Unified metrics state (Phase 1 completed)
    const [computedMetrics, setComputedMetrics] = useState(null);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metricsError, setMetricsError] = useState(null);

    // PHASE 2: Enhanced percentile discovery using percentileUtils
    const { percentiles, primaryPercentile, availableValues } = useMemo(() => {
        if (!scenarioData) {
            return {
                percentiles: [],
                primaryPercentile: 50,
                availableValues: [10, 25, 50, 75, 90]
            };
        }

        try {
            return discoverPercentiles(getValueByPath);
        } catch (error) {
            console.error('Error discovering percentiles:', error);
            return {
                percentiles: [
                    { value: 50, description: 'primary' },
                    { value: 75, description: 'upper_bound' },
                    { value: 25, description: 'lower_bound' },
                    { value: 10, description: 'extreme_lower' },
                    { value: 90, description: 'extreme_upper' },
                ],
                primaryPercentile: 50,
                availableValues: [10, 25, 50, 75, 90]
            };
        }
    }, [scenarioData, getValueByPath]);

    // Extract available percentiles for compatibility
    const availablePercentiles = availableValues;

    const percentileSources = useMemo(() => getPercentileSourcesFromRegistry(CASHFLOW_SOURCE_REGISTRY), []);
    const [selectedPercentiles, setSelectedPercentiles] = useState({
        strategy: 'unified',
        unified: primaryPercentile || 50,
        perSource: createPerSourceDefaults(percentileSources, primaryPercentile || 50)
    });

    // PHASE 2: Convert cashflowData from state to computed property
    const cashflowData = useMemo(() => {
        if (!computedMetrics) return null;

        try {
            const selectedData = getSelectedPercentileData(computedMetrics, selectedPercentiles);
            if (selectedData) {
                console.log('✅ Direct reference: cashflowData computed for',
                    selectedPercentiles.strategy === 'unified'
                        ? `P${selectedPercentiles.unified}`
                        : 'per-source'
                );
            }
            return selectedData;
        } catch (error) {
            console.error('❌ Error generating selected percentile data:', error);
            return null;
        }
    }, [computedMetrics, selectedPercentiles]);

    // PHASE 2: Sequential and controlled refresh cycle
    const refreshCashflowData = useCallback(async (force = false) => {
        if (refreshRequested && !force) {
            console.log('⏭️ Refresh already in progress, skipping...');
            return;
        }

        try {
            setRefreshRequested(true);
            setLoading(true);
            setTransformError(null);
            setRefreshStage('dependencies');

            // Sequential execution handled by useEffect switch/case

        } catch (error) {
            console.error('❌ Refresh initiation failed:', error);
            setTransformError(error.message);
            setLoading(false);
            setRefreshRequested(false);
            setRefreshStage('idle');
        }
    }, []);

    // PHASE 2: Enhanced sequential refresh cycle with switch/case pattern
    useEffect(() => {
        if (!refreshRequested || !scenarioData) return;

        const executeStage = async () => {
            try {
                switch (refreshStage) {
                    case 'dependencies':
                        console.log('🔍 Checking dependencies...');

                        // ✅ FIXED: Call with only getValueByPath
                        if (!isDistributionsComplete(getValueByPath)) {
                            throw new Error('Distributions not complete - missing required distribution data');
                        }

                        // ✅ FIXED: Call with only getValueByPath
                        if (!isConstructionSourcesComplete(getValueByPath)) {
                            console.log('🏗️ Generating construction sources...');
                            const constructionSources = generateConstructionCostSources(scenarioData, getValueByPath);
                            await updateByPath(['settings', 'modules', 'cost', 'constructionPhase', 'costSources'], constructionSources);
                            console.log('✅ Construction sources generated');
                        }

                        console.log('✅ Dependencies validated');
                        setRefreshStage('transform');
                        break;

                    case 'transform':
                        console.log('🔄 Transforming to cashflow data...');

                        try {
                            const transformedData = await transformScenarioToCashflow(
                                scenarioData,
                                CASHFLOW_SOURCE_REGISTRY,
                                selectedPercentiles,
                                getValueByPath
                            );

                            if (transformedData) {
                                // Store transformed data for metrics computation
                                // Note: This will eventually be used by the metrics stage
                                console.log('✅ Cashflow transformation completed');
                            } else {
                                throw new Error('Transform returned no data');
                            }
                        } catch (error) {
                            console.error('❌ Transform failed:', error);
                            throw error; // Let it bubble up to main error handler
                        }

                        setRefreshStage('metrics');
                        break;

                    case 'metrics':
                        console.log('📊 Computing unified metrics system...');

                        try {
                            setMetricsLoading(true);
                            setMetricsError(null);

                            if (scenarioData && availablePercentiles.length > 0) {
                                console.log('🔄 Starting two-tier metrics computation...');

                                // PHASE 2: Two-tier metrics computation
                                // TODO: Integrate actual computeAllMetrics when ready
                                // const allMetrics = await computeAllMetrics(
                                //     transformedData,  // cashflowData from transform stage
                                //     scenarioData,     // scenario data for parameters
                                //     { selectedPercentiles, getValueByPath }  // options
                                // );

                                // TEMPORARY: Placeholder to prevent breakage
                                console.log('⚠️ computeAllMetrics integration pending - using placeholder');
                                const allMetrics = new Map();

                                if (allMetrics && allMetrics.size > 0) {
                                    setComputedMetrics(allMetrics);
                                    console.log(`✅ Unified metrics computed: ${allMetrics.size} metrics across scenarios`);

                                    // Log available scenarios for debugging
                                    const sampleMetric = allMetrics.values().next().value;
                                    if (sampleMetric) {
                                        const scenarios = Object.keys(sampleMetric);
                                        console.log(`📈 Available scenarios: ${scenarios.join(', ')}`);
                                    }
                                } else {
                                    console.log('⚠️ No metrics computed from unified system');
                                    setComputedMetrics(new Map()); // Empty map instead of null
                                }
                            } else {
                                setComputedMetrics(new Map());
                                console.log('⚠️ No scenario data or percentiles available for metrics computation');
                            }
                        } catch (error) {
                            console.error('❌ Unified metrics computation failed:', error);
                            setMetricsError(error.message);
                            setComputedMetrics(new Map());
                        } finally {
                            setMetricsLoading(false);
                        }

                        // PHASE 2: Keep parallel old system during transition (temporary)
                        try {
                            const metricUpdates = await refreshAllMetrics(scenarioData, updateByPath);
                            if (Object.keys(metricUpdates).length === 0) {
                                console.warn('⚠️ Legacy metrics: No metrics were updated');
                            } else {
                                console.log('✅ Legacy metrics: Parallel system updated for comparison');
                            }
                        } catch (error) {
                            console.warn('⚠️ Legacy metrics system failed:', error);
                        }

                        setRefreshStage('sensitivity');
                        break;

                    case 'sensitivity':
                        console.log('🔄 Computing sensitivity analysis...');
                        try {
                            const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis']);

                            if (distributionAnalysis && scenarioData) {
                                const simulationConfig = {
                                    percentiles: getValueByPath(['settings', 'simulation', 'percentiles']) || [],
                                    primaryPercentile: primaryPercentile
                                };

                                // ✅ ONLY FIX: Use SUPPORTED_METRICS instead of hardcoded array
                                const sensitivityResults = {};
                                const supportedMetrics = Object.keys(SUPPORTED_METRICS);

                                for (const metric of supportedMetrics) {
                                    try {
                                        const results = calculateSensitivityAnalysis({
                                            cashflowRegistry: CASHFLOW_SOURCE_REGISTRY,
                                            sensitivityRegistry: SENSITIVITY_SOURCE_REGISTRY,
                                            targetMetric: metric,
                                            simulationConfig,
                                            distributionAnalysis,
                                            getValueByPath
                                        });

                                        sensitivityResults[metric] = results;
                                        console.log(`✅ ${metric.toUpperCase()} sensitivity: ${results.length} variables`);
                                    } catch (error) {
                                        console.error(`❌ Error calculating sensitivity for ${metric}:`, error);
                                        sensitivityResults[metric] = [];
                                    }
                                }

                                setSensitivityData({
                                    ...sensitivityResults,
                                    metadata: {
                                        computedAt: new Date().toISOString(),
                                        simulationConfig,
                                        totalVariables: Object.values(sensitivityResults).reduce((sum, results) => sum + results.length, 0),
                                        metrics: supportedMetrics
                                    }
                                });

                                console.log('✅ Sensitivity analysis computed for metrics:', supportedMetrics.join(', '));
                            } else {
                                console.warn('⚠️ No distribution analysis available for sensitivity computation');
                                setSensitivityData(null);
                            }
                        } catch (error) {
                            console.error('❌ Sensitivity computation failed:', error);
                            setSensitivityData(null);
                        }
                        setRefreshStage('complete');
                        break;

                    case 'complete':
                        // Reset and finish
                        console.log('✅ Cashflow refresh complete (with sensitivity data)');
                        setRefreshRequested(false);
                        //setForceRefresh(false);
                        setRefreshStage('idle');
                        setLoading(false);
                        return;

                    default:
                        console.warn('Unknown refresh stage:', refreshStage);
                        setRefreshStage('idle');
                        setRefreshRequested(false);
                        setLoading(false);
                        break;
                }
            } catch (error) {
                console.error(`❌ Error in ${refreshStage} stage:`, error);
                setTransformError(error.message);
                message.error(`Refresh failed at ${refreshStage}: ${error.message}`);

                // Reset state on error
                setLoading(false);
                setRefreshRequested(false);
                setRefreshStage('idle');
            }
        };

        executeStage();
    }, [refreshStage, refreshRequested, scenarioData, selectedPercentiles, getValueByPath, updateByPath, availablePercentiles, percentiles, primaryPercentile]);

    // PHASE 2: Enhanced percentile selection with instant switching
    const updatePercentileSelection = useCallback((newSelection) => {
        console.log('🎯 Percentile selection changed:', {
            from: selectedPercentiles.strategy,
            to: newSelection.strategy,
            unified: newSelection.unified,
            perSourceCount: Object.keys(newSelection.perSource || {}).length
        });

        setSelectedPercentiles(newSelection);
        // PHASE 2: No need to refresh data - cashflowData will update automatically via useMemo
        console.log('⚡ Instant percentile switch - no recomputation needed');
    }, [selectedPercentiles]);

    // Debug logging for percentile changes
    useEffect(() => {
        if (selectedPercentiles && availablePercentiles.length > 0) {
            console.log('🎯 Current percentile selection:', {
                strategy: selectedPercentiles.strategy,
                unified: selectedPercentiles.unified,
                perSourceCount: Object.keys(selectedPercentiles.perSource).length
            });

            // Validate unified mode
            if (selectedPercentiles.strategy === 'unified') {
                const isValidPercentile = availablePercentiles.includes(selectedPercentiles.unified);
                if (!isValidPercentile) {
                    console.warn('⚠️ Invalid unified percentile:', selectedPercentiles.unified, 'Available:', availablePercentiles);
                } else {
                    console.log('✅ Valid unified percentile:', selectedPercentiles.unified);
                }
            }
        }
    }, [selectedPercentiles, availablePercentiles, scenarioData]);

    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    const value = {
        // PHASE 2: Enhanced data access
        cashflowData, // Now computed property with instant percentile switching
        sensitivityData,
        setSensitivityData,
        loading,
        transformError,

        // Enhanced stage tracking for UI feedback
        refreshStage: refreshRequested ? refreshStage : 'idle',
        isRefreshing: refreshRequested,

        // Percentiles with enhanced switching
        availablePercentiles,
        primaryPercentile,
        percentileSources,
        selectedPercentiles,
        updatePercentileSelection, // Enhanced with instant switching

        // Unified metrics data (Phase 1)
        computedMetrics,
        metricsLoading,
        metricsError,

        // Actions - enhanced refresh method
        refreshCashflowData,

        // Config
        sourceRegistry: CASHFLOW_SOURCE_REGISTRY
    };

    return (
        <CashflowContext.Provider value={value}>
            {children}
        </CashflowContext.Provider>
    );
};

export default CashflowProvider;