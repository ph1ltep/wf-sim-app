// frontend/src/contexts/CubeContext.jsx
import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { computeSourceData } from '../utils/cube/processor';
import { CASHFLOW_SOURCE_REGISTRY } from '../utils/cube/registry';

const CubeContext = createContext();
export const useCube = () => useContext(CubeContext);

/**
 * Extract sources with percentiles from cube registry (optimized)
 * @param {Object} registry - CASHFLOW_SOURCE_REGISTRY
 * @returns {Array} Array of {id, type, category} objects for sources with percentiles
 */
const getPercentileSourcesFromCubeRegistry = (registry) => {
    return registry.sources
        .filter(source => source.hasPercentiles)
        .map(source => ({
            id: source.id,
            type: source.metadata.type,
            category: source.metadata.category
        }));
};

export const CubeProvider = ({ children }) => {
    const { scenario, scenarioData, getValueByPath } = useScenario();

    // State management
    const [sourceData, setSourceData] = useState(null);
    const [metricsData, setMetricsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [cubeVersion, setCubeVersion] = useState(null);

    // Percentile handling
    const availablePercentiles = scenarioData?.settings?.simulation?.percentiles?.map(p => p.value) || [10, 25, 50, 75, 90];

    // Optimized percentile sources (memoized)
    const percentileSources = useMemo(() =>
        getPercentileSourcesFromCubeRegistry(CASHFLOW_SOURCE_REGISTRY),
        []
    );

    /**
     * Custom percentile configuration
     * @type {Object|null} Format: {sourceId: percentileValue} e.g. {"escalationRate": 25, "energyRevenue": 75}
     */
    const [customPercentile, setCustomPercentile] = useState(null);

    // Track if data is out of date
    const isDataOutOfDate = useMemo(() => {
        if (!scenarioData || !lastRefresh) return false;

        // Compare current scenario version with last refresh version
        const currentVersion = scenarioData.metadata?.lastModified || scenarioData.metadata?.version;
        return currentVersion !== cubeVersion;
    }, [scenarioData, lastRefresh, cubeVersion]);

    /**
     * Update custom percentile configuration
     */
    const updateCustomPercentile = useCallback((updates) => {
        setCustomPercentile(prev => {
            if (!prev) return updates;
            return { ...prev, ...updates };
        });
    }, []);

    /**
     * Main refresh function - manages refresh states and dependencies
     */
    const refreshCubeData = useCallback(async () => {
        if (!scenarioData || !getValueByPath) {
            console.log('⏸️ CubeContext: Waiting for scenario data...');
            return;
        }

        // Prevent multiple simultaneous refreshes
        if (isRefreshing) {
            console.log('⏸️ CubeContext: Refresh already in progress, skipping...');
            return;
        }

        console.log('🔄 CubeContext: Starting cube data refresh...');
        setIsRefreshing(true);
        setIsLoading(true);

        try {
            // Reset dependent states
            setSourceData(null);
            setMetricsData(null);

            // Trigger the refresh cascade via state changes
            setRefreshTrigger(prev => prev + 1);

        } catch (error) {
            console.error('❌ CubeContext: Error during cube data refresh:', error);
            message.error('Failed to refresh cube data: ' + error.message);
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [scenarioData, getValueByPath, isRefreshing]);

    /**
     * Trigger refresh manually
     */
    const triggerRefresh = useCallback(() => {
        refreshCubeData();
    }, [refreshCubeData]);

    /**
     * Serial refresh effect with proper dependency ordering
     */
    useEffect(() => {
        if (!scenarioData || !getValueByPath || !isRefreshing) return;

        const refreshStage = (() => {
            if (!sourceData) return 'sources';
            if (!metricsData) return 'metrics';
            return 'complete';
        })();

        const executeRefreshStage = async () => {
            switch (refreshStage) {
                case 'sources':
                    console.log('🔄 CubeContext: Computing source data...');
                    try {
                        const computedSourceData = await computeSourceData(
                            CASHFLOW_SOURCE_REGISTRY,
                            availablePercentiles,
                            getValueByPath,
                            customPercentile
                        );
                        setSourceData(computedSourceData);
                        console.log('✅ CubeContext: Source data computed successfully');
                    } catch (error) {
                        console.error('❌ CubeContext: Failed to compute source data:', error);
                        message.error('Failed to compute source data: ' + error.message);
                        setIsLoading(false);
                        setIsRefreshing(false);
                    }
                    break;

                case 'metrics':
                    console.log('🔄 CubeContext: Computing metrics data...');
                    try {
                        // TODO: Implement metrics computation
                        // const computedMetricsData = await computeMetricsData(sourceData);
                        // setMetricsData(computedMetricsData);
                        setMetricsData({}); // Placeholder
                        console.log('✅ CubeContext: Metrics data computed (placeholder)');
                    } catch (error) {
                        console.error('❌ CubeContext: Failed to compute metrics data:', error);
                        message.error('Failed to compute metrics data: ' + error.message);
                        setIsLoading(false);
                        setIsRefreshing(false);
                    }
                    break;

                case 'complete':
                    console.log('✅ CubeContext: All cube data refreshed');
                    setIsLoading(false);
                    setIsRefreshing(false);
                    setLastRefresh(new Date());
                    // Store current scenario version
                    setCubeVersion(scenarioData.metadata?.lastModified || scenarioData.metadata?.version);
                    break;

                default:
                    console.log('⏸️ CubeContext: Unknown refresh stage');
                    setIsLoading(false);
                    setIsRefreshing(false);
            }
        };

        executeRefreshStage();
    }, [scenarioData, getValueByPath, availablePercentiles, refreshTrigger, sourceData, metricsData, isRefreshing, customPercentile]);

    /**
     * Get filtered cube data with flexible filtering options
     * @param {Object} filters - Filter parameters
     * @param {number} [filters.percentile] - Filter by percentile value
     * @param {string} [filters.sourceId] - Filter by source ID
     * @param {Object} [filters.metadata] - Filter by metadata fields (exact matches)
     * @returns {Object} CubeSourceDataResponseSchema - Filtered data with dynamic keys
     * @throws {Error} If neither sourceId nor percentile is provided
     * ✅ Valid calls
     * const energyData = getData({ sourceId: 'energyRevenue' });
     * const medianData = getData({ percentile: 50 });
     * const specificData = getData({ sourceId: 'energyRevenue', percentile: 50 });
     * const costSources = getData({ percentile: 50, metadata: { cashflowGroup: 'cost' } });
     * // ❌ Invalid calls - will throw error
     * const invalidData = getData({}); // Error: requires either sourceId or percentile
     * const invalidData2 = getData({ metadata: { category: 'energy' } }); // Error: requires either sourceId or percentile 
    */
    const getData = useCallback((filters = {}) => {
        const { percentile, sourceId, metadata: metadataFilters } = filters;

        // Validate required parameters
        if (!sourceId && percentile === undefined) {
            throw new Error('getData requires either sourceId or percentile parameter');
        }

        if (!sourceData || !Array.isArray(sourceData)) {
            return {};
        }

        // Optimized filtering - apply most selective filters first
        let filteredSources = sourceData;

        // Apply sourceId filter first (most selective)
        if (sourceId) {
            filteredSources = filteredSources.filter(source => source.id === sourceId);
            // Early return if no source found
            if (filteredSources.length === 0) return {};
        }

        // Apply metadata filters second (moderately selective)
        if (metadataFilters && typeof metadataFilters === 'object') {
            const filterEntries = Object.entries(metadataFilters);
            if (filterEntries.length > 0) {
                filteredSources = filteredSources.filter(source => {
                    return filterEntries.every(([key, value]) =>
                        source.metadata[key] === value
                    );
                });
                // Early return if no sources match metadata filters
                if (filteredSources.length === 0) return {};
            }
        }

        const result = {};

        // Mode 1: Only sourceId set (group by percentile)
        if (sourceId && percentile === undefined) {
            const source = filteredSources[0]; // Already filtered to single source

            // Group by percentile for efficiency
            const percentileGroups = new Map();
            source.percentileSource.forEach(item => {
                const percentileKey = item.percentile.value;
                if (!percentileGroups.has(percentileKey)) {
                    percentileGroups.set(percentileKey, []);
                }
                percentileGroups.get(percentileKey).push({
                    year: item.year,
                    value: item.value
                });
            });

            // Build result with percentile keys
            percentileGroups.forEach((dataPoints, percentileKey) => {
                result[percentileKey] = {
                    data: dataPoints,
                    metadata: source.metadata
                };
            });
        }
        // Mode 2 & 3: Percentile set (group by sourceId)
        else if (percentile !== undefined) {
            filteredSources.forEach(source => {
                // Pre-filter to specific percentile for efficiency
                const dataPoints = [];
                source.percentileSource.forEach(item => {
                    if (item.percentile.value === percentile) {
                        dataPoints.push({
                            year: item.year,
                            value: item.value
                        });
                    }
                });

                // Only add to result if we found data for this percentile
                if (dataPoints.length > 0) {
                    result[source.id] = {
                        data: dataPoints,
                        metadata: source.metadata
                    };
                }
            });
        }

        return result;
    }, [sourceData]);



    /**
     * Context value object
     */
    const contextValue = {
        // Data
        sourceData,
        metricsData,
        availablePercentiles,
        percentileSources,

        // Custom percentile management
        customPercentile,
        setCustomPercentile,
        updateCustomPercentile,

        // State
        isLoading,
        isRefreshing,
        lastRefresh,
        isDataOutOfDate,

        // Actions
        refreshCubeData,
        triggerRefresh,

        // Data access
        getData,

        // Utilities
        getValueByPath
    };

    return (
        <CubeContext.Provider value={contextValue}>
            {children}
        </CubeContext.Provider>
    );
};