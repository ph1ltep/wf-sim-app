// frontend/src/hooks/useSensitivityAnalysis.js - Simplified hook

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useScenario } from '../contexts/ScenarioContext';
import { useCashflow } from '../contexts/CashflowContext';
import { calculateDynamicSensitivity } from '../utils/finance/sensitivityAnalysis';
import { discoverPercentiles, getDefaultSensitivityRange } from '../utils/finance/percentileUtils';

/**
 * Simplified hook for managing sensitivity analysis
 */
export const useSensitivityAnalysis = (options = {}) => {
    const { defaultMetric = 'npv' } = options;

    // Context hooks
    const { getValueByPath } = useScenario();
    const { cashflowData, refreshCashflowData } = useCashflow();

    // Local state
    const [selectedMetric, setSelectedMetric] = useState(defaultMetric);
    const [customPercentileRange, setCustomPercentileRange] = useState(null);
    const [loading, setLoading] = useState(false);
    const [sensitivityResults, setSensitivityResults] = useState([]);

    // Discover percentiles
    const percentileData = useMemo(() => {
        return discoverPercentiles(getValueByPath);
    }, [getValueByPath]);

    // Active percentile configuration
    const activePercentileConfig = useMemo(() => {
        if (customPercentileRange) {
            return customPercentileRange;
        }

        const defaultRange = getDefaultSensitivityRange(
            percentileData.availableValues,
            percentileData.primaryPercentile
        );

        return {
            lowerPercentile: defaultRange.lowerPercentile,
            upperPercentile: defaultRange.upperPercentile,
            basePercentile: percentileData.primaryPercentile,
            confidenceInterval: defaultRange.confidenceLevel
        };
    }, [customPercentileRange, percentileData]);

    // Extract variables from cashflow data
    const availableVariables = useMemo(() => {
        if (!cashflowData?.lineItems) return [];

        return cashflowData.lineItems
            .filter(item => item.metadata?.hasPercentileVariation)
            .map(item => ({
                id: item.id,
                label: item.name,
                category: item.category,
                hasPercentiles: true,
                path: ['simulation', 'inputSim', 'distributionAnalysis', item.id],
                description: item.metadata?.description || item.name
            }));
    }, [cashflowData]);

    // Simple cashflow engine wrapper
    const cashflowEngine = useCallback((scenarioOverrides) => {
        // Simplified: return existing finance metrics
        // In real implementation, this would recalculate with overrides
        return cashflowData?.financeMetrics || {};
    }, [cashflowData]);

    // Calculate sensitivity
    const calculateSensitivity = useCallback(async () => {
        if (!cashflowData || availableVariables.length === 0) {
            return [];
        }

        setLoading(true);

        try {
            const distributionAnalysis = getValueByPath(['simulation', 'inputSim', 'distributionAnalysis'], {});

            const results = calculateDynamicSensitivity({
                variables: availableVariables,
                distributionAnalysis,
                cashflowEngine,
                basePercentile: activePercentileConfig.basePercentile,
                lowerPercentile: activePercentileConfig.lowerPercentile,
                upperPercentile: activePercentileConfig.upperPercentile,
                targetMetric: selectedMetric
            });

            setSensitivityResults(results);
            return results;

        } catch (error) {
            console.error('Sensitivity calculation failed:', error);
            setSensitivityResults([]);
            return [];
        } finally {
            setLoading(false);
        }
    }, [availableVariables, activePercentileConfig, selectedMetric, getValueByPath, cashflowEngine]);

    // Auto-calculate when dependencies change
    useEffect(() => {
        if (cashflowData && availableVariables.length > 0) {
            calculateSensitivity();
        }
    }, [selectedMetric, activePercentileConfig, cashflowData]);

    // Handle percentile range changes
    const updatePercentileRange = useCallback((lowerPercentile, upperPercentile) => {
        setCustomPercentileRange({
            lowerPercentile,
            upperPercentile,
            basePercentile: percentileData.primaryPercentile,
            confidenceInterval: upperPercentile - lowerPercentile
        });
    }, [percentileData.primaryPercentile]);

    return {
        // Configuration
        selectedMetric,
        setSelectedMetric,
        percentileConfig: activePercentileConfig,
        updatePercentileRange,

        // Data
        availableVariables,
        sensitivityResults,

        // State
        loading,
        canCalculate: availableVariables.length > 0,

        // Actions
        calculateSensitivity,
        refresh: refreshCashflowData,

        // Integration
        percentileData,
        cashflowData
    };
};

export default useSensitivityAnalysis;