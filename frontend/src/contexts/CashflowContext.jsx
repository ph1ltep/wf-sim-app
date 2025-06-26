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
import { SENSITIVITY_SOURCE_REGISTRY } from './SensitivityRegistry';
import { name } from 'plotly.js/lib/scatter';


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
            path: ['simulation', 'inputSim', 'distributionAnalysis', 'escalationRate'],
            category: 'escalation',
            hasPercentiles: true,
            transformer: null,
            description: 'Annual cost escalation rate applied to all cost items'
        },
        {
            id: 'electricityPrice',
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
            name: 'CAPEX Drawdown',
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
            name: 'Debt Drawdown',
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
            name: 'CAPEX Interest',
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
            name: 'OPEX Interest',
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
            name: 'OPEX Principal',
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
            name: 'Contract Fees',
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
            name: 'Major Repairs',
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
            name: 'Insurance Premium',
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
            name: 'Reserve Funds',
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
            name: 'Energy Revenue',
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

    // State management
    const [cashflowData, setCashflowData] = useState(null);
    const [sensitivityData, setSensitivityData] = useState(null); // NEW: Sensitivity data state
    const [loading, setLoading] = useState(false);
    const [transformError, setTransformError] = useState(null);

    // Refresh state management
    const [refreshRequested, setRefreshRequested] = useState(false);
    const [forceRefresh, setForceRefresh] = useState(false);
    const [refreshStage, setRefreshStage] = useState('idle'); // Add 'sensitivity' to existing stages
    const refreshTimeoutRef = useRef(null);
    const lastScenarioIdRef = useRef(null);

    // Basic percentile info with error handling
    const availablePercentiles = useMemo(() => {
        try {
            if (!scenarioData) return [];
            const percentiles = getValueByPath(['settings', 'simulation', 'percentiles'], []);
            if (!Array.isArray(percentiles)) return [];
            return percentiles
                .map(p => p?.value)
                .filter(v => typeof v === 'number')
                .sort((a, b) => a - b);
        } catch (error) {
            console.error('Error getting available percentiles:', error);
            return [10, 25, 50, 75, 90]; // Fallback
        }
    }, [scenarioData, getValueByPath]);

    const primaryPercentile = useMemo(() => {
        try {
            if (!scenarioData) return 50;
            const primary = getValueByPath(['settings', 'simulation', 'primaryPercentile'], 50);
            return typeof primary === 'number' ? primary : 50;
        } catch (error) {
            console.error('Error getting primary percentile:', error);
            return 50;
        }
    }, [scenarioData, getValueByPath]);

    const percentileSources = useMemo(() => {
        try {
            return getPercentileSourcesFromRegistry(CASHFLOW_SOURCE_REGISTRY);
        } catch (error) {
            console.error('Error getting percentile sources:', error);
            return [];
        }
    }, []);

    // Simple percentile selection state
    const [selectedPercentiles, setSelectedPercentiles] = useState(() => ({
        strategy: 'unified',
        unified: 50,
        perSource: {}
    }));

    // NEW: Sequential refresh effect
    useEffect(() => {
        if (!refreshRequested || !scenarioData) return;

        const runStage = async () => {
            try {
                setLoading(true);
                setTransformError(null);

                switch (refreshStage) {
                    case 'distributions':
                        if (forceRefresh || !isDistributionsComplete(getValueByPath)) {
                            console.log('🔄 Refreshing distributions...');
                            const success = await updateDistributions();
                            if (!success) throw new Error('Distribution refresh failed');
                        } else {
                            console.log('✅ Distributions already complete');
                        }
                        setRefreshStage('construction');
                        break;

                    case 'construction':
                        if (forceRefresh || !isConstructionSourcesComplete(getValueByPath)) {
                            console.log('🔄 Refreshing construction sources...');
                            const codDate = getValueByPath(['settings', 'project', 'windFarm', 'codDate']);
                            const generatedSources = generateConstructionCostSources(codDate);
                            const result = await updateByPath({
                                'settings.modules.cost.constructionPhase.costSources': generatedSources
                            });
                            if (!result.isValid) {
                                throw new Error('Construction sources update failed: ' + (result.error || 'Unknown error'));
                            }
                            console.log('✅ Construction sources updated successfully');
                        } else {
                            console.log('✅ Construction sources already complete');
                        }
                        setRefreshStage('metrics');
                        break;

                    case 'metrics':
                        console.log('🔄 Refreshing metrics...');
                        const metricUpdates = await refreshAllMetrics(scenarioData, updateByPath);
                        if (Object.keys(metricUpdates).length === 0) {
                            console.warn('⚠️ No metrics were updated - this may indicate missing data');
                        } else {
                            console.log('✅ Metrics refreshed');
                        }
                        setRefreshStage('transform');
                        break;

                    case 'transform':
                        console.log('🔄 Transforming to cashflow data...');
                        const transformedData = await transformScenarioToCashflow(
                            scenarioData,
                            CASHFLOW_SOURCE_REGISTRY,
                            selectedPercentiles,
                            getValueByPath
                        );
                        if (transformedData) {
                            setCashflowData(transformedData);
                            message.success('Cashflow data refreshed successfully');
                        } else {
                            throw new Error('Transform returned no data');
                        }
                        setRefreshStage('sensitivity'); // NEW: Move to sensitivity stage
                        break;

                    case 'sensitivity':
                        // NEW: Compute sensitivity analysis
                        console.log('🔄 Computing sensitivity analysis...');
                        try {
                            const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis']);

                            if (distributionAnalysis && scenarioData) {
                                // Create simulation config for sensitivity analysis
                                const simulationConfig = {
                                    percentiles: availablePercentiles,
                                    primaryPercentile: primaryPercentile
                                };

                                const sensitivityResults = calculateSensitivityAnalysis({
                                    cashflowRegistry: CASHFLOW_SOURCE_REGISTRY,
                                    sensitivityRegistry: SENSITIVITY_SOURCE_REGISTRY,
                                    targetMetric: 'npv', // Default metric for context computation
                                    simulationConfig,
                                    distributionAnalysis,
                                    getValueByPath
                                });

                                setSensitivityData({
                                    baseData: sensitivityResults,
                                    computedAt: new Date().toISOString(),
                                    simulationConfig,
                                    distributionAnalysis
                                });
                                console.log('✅ Sensitivity analysis computed:', sensitivityResults.length, 'variables');
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
                        setForceRefresh(false);
                        setRefreshStage('idle');
                        setLoading(false);
                        return;
                }
            } catch (error) {
                console.error('❌ Refresh failed at stage:', refreshStage, error);
                setTransformError(error.message || 'Failed to refresh cashflow data');
                setCashflowData(null);
                setSensitivityData(null);
                message.error(`Failed at ${refreshStage} stage: ${error.message}`);

                // Reset on error
                setRefreshRequested(false);
                setForceRefresh(false);
                setRefreshStage('idle');
                setLoading(false);
            }
        };

        runStage();
    }, [refreshStage, refreshRequested, forceRefresh, scenarioData, selectedPercentiles, getValueByPath, updateByPath, updateDistributions, availablePercentiles, primaryPercentile]);

    // NEW: Simple public interface (replaces old refreshCashflowData)
    const refreshCashflowData = useCallback((force = false) => {
        if (refreshRequested) {
            console.log('⏳ Refresh already in progress, skipping');
            return;
        }

        console.log('🚀 Starting', force ? 'forced' : 'smart', 'cashflow refresh...');
        setForceRefresh(force);
        setRefreshRequested(true);
        setRefreshStage('distributions');
    }, [refreshRequested]);

    // Simple update function for percentile changes
    const updatePercentileSelection = useCallback((newSelection) => {
        setSelectedPercentiles(newSelection);

        // Debounce refresh to prevent rapid firing
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
            if (cashflowData) {
                refreshCashflowData(false);
            }
        }, 100);

        return true;
    }, [cashflowData, refreshCashflowData]);

    // Reset initialization state when scenario changes
    useEffect(() => {
        const currentScenarioId = scenarioData?._id || scenarioData?.name || 'new';

        if (currentScenarioId !== lastScenarioIdRef.current) {
            lastScenarioIdRef.current = currentScenarioId;

            // Reset state for new scenario
            setCashflowData(null);
            setSensitivityData(null);
            setTransformError(null);
            setRefreshRequested(false);
            setRefreshStage('idle');

            console.log('📋 Scenario changed, reset cashflow state');
        }
    }, [scenarioData]);

    // Update percentile defaults when scenario loads
    useEffect(() => {
        if (primaryPercentile && percentileSources.length > 0) {
            setSelectedPercentiles(prev => {
                // Only update if actually different
                const newUnified = primaryPercentile;
                const newPerSource = createPerSourceDefaults(percentileSources, primaryPercentile);

                if (prev.unified === newUnified &&
                    JSON.stringify(prev.perSource) === JSON.stringify(newPerSource)) {
                    return prev; // No change needed
                }

                return {
                    strategy: prev.strategy,
                    unified: newUnified,
                    perSource: newPerSource
                };
            });
        }
    }, [primaryPercentile, percentileSources]);

    // Log percentile changes for debugging
    useEffect(() => {
        if (selectedPercentiles && scenarioData) {
            console.log('🔄 Percentile selection changed:', {
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
        // Data
        cashflowData,
        sensitivityData,
        loading,
        transformError,

        // NEW: Stage tracking for UI feedback
        refreshStage: refreshRequested ? refreshStage : 'idle',
        isRefreshing: refreshRequested,

        // Percentiles
        availablePercentiles,
        primaryPercentile,
        percentileSources,
        selectedPercentiles,
        updatePercentileSelection,

        // Actions - single refresh method
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