// src/contexts/CashflowContext.jsx - Complete lazy initialization implementation
import React, { createContext, useContext, useCallback, useState, useMemo, useRef } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { getPercentileSourcesFromRegistry, createPerSourceDefaults } from '../utils/cashflowUtils';
import { transformScenarioToCashflow } from '../utils/cashflow/transform';
import { CashflowSourceRegistrySchema } from 'schemas/yup/cashflow';
import { validate } from '../utils/validate';
import { initializeCashflowSystem, isCashflowSystemReady } from '../utils/cashflow/initialization';
import useInputSim from '../hooks/useInputSim';
import { generateConstructionCostSources } from '../utils/drawdownUtils';
import { refreshAllMetrics } from '../utils/metricsUtils';
import {
    isDistributionsComplete,
    isConstructionSourcesComplete
} from '../utils/dependencies/checkFunctions';


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
    const { getValueByPath, scenarioData, updateByPath } = useScenario();
    const { updateDistributions } = useInputSim();

    // Core state
    const [loading, setLoading] = useState(false);
    const [cashflowData, setCashflowData] = useState(null);
    const [transformError, setTransformError] = useState(null);

    // Lazy initialization state
    const [isInitialized, setIsInitialized] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);

    // Refs to prevent concurrent operations and infinite loops
    const refreshTimeoutRef = useRef(null);
    const lastScenarioIdRef = useRef(null);
    const refreshInProgressRef = useRef(false);

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

    // Check if system appears ready (for UI hints)
    const systemReady = useMemo(() => {
        return scenarioData ? isCashflowSystemReady(getValueByPath) : false;
    }, [scenarioData, getValueByPath]);

    /**
     * Refresh cashflow data with dependency checking and initialization
     * @param {boolean} force - If true, refresh everything regardless of current state
     * @returns {Promise<Object|null>} Cashflow data or null on failure
     */
    const refreshCashflowData = useCallback(async (force = false) => {
        if (!scenarioData) {
            setTransformError('No active scenario available');
            setCashflowData(null);
            return null;
        }

        if (refreshInProgressRef.current) {
            console.log('⏳ Refresh already in progress, skipping');
            return null;
        }

        refreshInProgressRef.current = true;
        setLoading(true);
        setTransformError(null); // Clear previous errors

        try {
            // Step 1: Distribution Analysis
            if (force || !isDistributionsComplete(getValueByPath)) {
                console.log('🔄 Refreshing distributions...');
                const success = await updateDistributions();
                if (!success) throw new Error('Distribution refresh failed');
            } else {
                console.log('✅ Distributions already complete');
            }

            // Step 2: Construction Cost Sources
            if (force || !isConstructionSourcesComplete(getValueByPath)) {
                console.log('🔄 Refreshing construction sources...');
                const codDate = getValueByPath(['settings', 'project', 'windFarm', 'codDate']);
                const result = await updateByPath({
                    'settings.modules.cost.constructionPhase.costSources': generateConstructionCostSources(codDate)
                });
                if (!result.isValid) throw new Error('Construction sources update failed');
            } else {
                console.log('✅ Construction sources already complete');
            }

            // Step 3: Metrics Refresh
            console.log('🔄 Refreshing metrics...');
            const metricUpdates = await refreshAllMetrics(scenarioData, updateByPath);
            if (Object.keys(metricUpdates).length === 0) {
                console.warn('⚠️ No metrics were updated - this may indicate missing data');
            } else {
                console.log('✅ Metrics refreshed');
            }

            // Step 4: Transform to Cashflow Data
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
                return transformedData;
            } else {
                throw new Error('Transform returned no data');
            }

        } catch (error) {
            console.error('❌ Cashflow refresh failed:', error);
            setTransformError(error.message || 'Failed to refresh cashflow data');
            setCashflowData(null);
            message.error('Failed to refresh cashflow data');
            return null;
        } finally {
            setLoading(false);
            refreshInProgressRef.current = false;
        }
    }, [scenarioData, selectedPercentiles, getValueByPath, updateByPath]);


    // Simple update function for percentile changes
    const updatePercentileSelection = useCallback((newSelection) => {
        setSelectedPercentiles(newSelection);

        // Debounce refresh to prevent rapid firing
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
            if (cashflowData && isInitialized) {
                refreshCashflowData();
            }
        }, 100);

        return true;
    }, [cashflowData, isInitialized, refreshCashflowData]);

    // Reset initialization state when scenario changes
    React.useEffect(() => {
        const currentScenarioId = scenarioData?._id || scenarioData?.name || 'new';

        if (currentScenarioId !== lastScenarioIdRef.current) {
            lastScenarioIdRef.current = currentScenarioId;

            // Reset state for new scenario
            setIsInitialized(false);
            setCashflowData(null);
            setTransformError(null);

            console.log('📋 Scenario changed, reset cashflow initialization state');
        }
    }, [scenarioData]);

    // Update percentile defaults when scenario loads
    React.useEffect(() => {
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
    React.useEffect(() => {
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
    React.useEffect(() => {
        return () => {
            if (refreshTimeoutRef.current) {
                clearTimeout(refreshTimeoutRef.current);
            }
        };
    }, []);

    const value = {
        // Data
        cashflowData,
        loading,
        transformError,

        // Lazy initialization state
        isInitialized: !!cashflowData,
        isInitializing: loading,
        systemReady,

        // Percentiles
        availablePercentiles,
        primaryPercentile,
        percentileSources,
        selectedPercentiles,
        updatePercentileSelection,

        // Actions
        refreshCashflowData,  // For subsequent refreshes

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