// src/contexts/CashflowContext.jsx - Fixed with proper error handling
import React, { createContext, useContext, useCallback, useState, useMemo, useRef } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { getPercentileSourcesFromRegistry, createPerSourceDefaults } from '../utils/cashflowUtils';
import { transformScenarioToCashflow } from '../utils/cashflow/transform';

const CashflowContext = createContext();
export const useCashflow = () => useContext(CashflowContext);

// Updated source registry with proper data sources
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
            paths: {
                financing: ['settings', 'modules', 'financing'],
                costSources: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources']
            },
            category: 'financing',
            hasPercentiles: false,
            transformer: 'debtDrawdownToAnnualCosts',
            multipliers: [],
            description: 'Debt drawdown during construction phase (% of CAPEX)',
            displayNote: 'Debt is drawn to fund construction spending'
        },
        {
            id: 'interestDuringConstruction',
            paths: {
                financing: ['settings', 'modules', 'financing'],
                costSources: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources']
            },
            category: 'financing',
            hasPercentiles: false,
            transformer: 'interestDuringConstruction',
            multipliers: [],
            description: 'Interest During Construction (IDC) - capitalized interest costs',
            displayNote: 'Only included if IDC capitalization is enabled'
        },
        {
            id: 'operationalDebtService',
            paths: {
                financing: ['settings', 'modules', 'financing'],
                costSources: ['settings', 'modules', 'cost', 'constructionPhase', 'costSources']
            },
            category: 'financing',
            hasPercentiles: false,
            transformer: 'operationalDebtService',
            multipliers: [],
            description: 'Annual debt service payments during operational period',
            displayNote: 'Includes principal and interest, starts after grace period'
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

export const CashflowProvider = ({ children }) => {
    const { getValueByPath, scenarioData } = useScenario();

    const [loading, setLoading] = useState(false);
    const [cashflowData, setCashflowData] = useState(null);
    const [transformError, setTransformError] = useState(null);

    // Use ref to prevent infinite loops
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

    // Update defaults when scenario loads - prevent infinite loop
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

    // Simple update function
    const updatePercentileSelection = useCallback((newSelection) => {
        setSelectedPercentiles(newSelection);

        // Debounce refresh to prevent rapid firing
        if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
        }

        refreshTimeoutRef.current = setTimeout(() => {
            if (cashflowData) {
                refreshCashflowData();
            }
        }, 100);

        return true;
    }, [cashflowData]);

    // Safe refresh with comprehensive error handling
    const refreshCashflowData = useCallback(async () => {
        if (!scenarioData) {
            setTransformError('No active scenario available');
            setCashflowData(null);
            return null;
        }

        if (loading) {
            console.log('Refresh already in progress, skipping');
            return null;
        }

        setLoading(true);
        setTransformError(null);

        try {
            console.log('Starting cashflow transformation with data:', {
                scenarioId: scenarioData._id || 'new',
                selectedPercentiles,
                availablePercentiles
            });

            const transformedData = await transformScenarioToCashflow(
                scenarioData,
                CASHFLOW_SOURCE_REGISTRY,
                selectedPercentiles,
                getValueByPath
            );

            if (transformedData) {
                setCashflowData(transformedData);
                message.success('Cashflow data refreshed');
                return transformedData;
            } else {
                setTransformError('Transform returned no data');
                setCashflowData(null);
                return null;
            }
        } catch (error) {
            console.error('Transform error:', error);
            setTransformError(error.message || 'Failed to transform cashflow data');
            setCashflowData(null);
            message.error('Failed to refresh cashflow data');
            return null;
        } finally {
            setLoading(false);
        }
    }, [scenarioData, selectedPercentiles, getValueByPath, loading]);

    // Auto-refresh when scenario changes - prevent infinite loop
    React.useEffect(() => {
        const currentScenarioId = scenarioData?._id || scenarioData?.name || 'new';

        // Only refresh if scenario actually changed
        if (currentScenarioId !== lastScenarioIdRef.current) {
            lastScenarioIdRef.current = currentScenarioId;

            if (scenarioData && !loading) {
                // Debounce the refresh
                if (refreshTimeoutRef.current) {
                    clearTimeout(refreshTimeoutRef.current);
                }

                refreshTimeoutRef.current = setTimeout(() => {
                    refreshCashflowData();
                }, 100);
            }
        }
    }, [scenarioData, refreshCashflowData, loading]);

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

        // Percentiles
        availablePercentiles,
        primaryPercentile,
        percentileSources,
        selectedPercentiles,
        updatePercentileSelection,

        // Actions
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