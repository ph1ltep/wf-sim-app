// frontend/src/contexts/CubeContext.jsx - CORRECTED: Minimal dependencies + external initialization
import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { computeSourceData } from '../utils/cube/sources/processor';
import { CASHFLOW_SOURCE_REGISTRY } from '../utils/cube/sources/registry';

const CubeContext = createContext();
export const useCube = () => useContext(CubeContext);

/**
 * Extract sources with percentiles from cube registry (optimized)
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
    const { scenarioData, getValueByPath } = useScenario();

    // ✅ FIXED: Sequential refresh state management
    const [sourceData, setSourceData] = useState(null);
    const [metricsData, setMetricsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshRequested, setRefreshRequested] = useState(false);
    const [refreshStage, setRefreshStage] = useState('idle');
    const [lastRefresh, setLastRefresh] = useState(null);
    const [cubeVersion, setCubeVersion] = useState(null);
    const [cubeError, setCubeError] = useState(null);

    // ✅ FIXED: Static configuration - computed once, never changes
    const availablePercentiles = useMemo(() =>
        scenarioData?.settings?.simulation?.percentiles?.map(p => p.value) || [10, 25, 50, 75, 90],
        [] // ✅ No dependencies - static once computed
    );

    const selectedPercentile = getValueByPath(['simulation', 'inputSim', 'cashflow', 'selectedPercentile']);
    const percentileSources = useMemo(() =>
        getPercentileSourcesFromCubeRegistry(CASHFLOW_SOURCE_REGISTRY),
        [] // ✅ Static registry - never changes
    );

    // Custom percentile configuration
    const [customPercentile, setCustomPercentile] = useState(null);

    const updateCustomPercentile = useCallback((updates) => {
        setCustomPercentile(prev => {
            if (!prev) return updates;
            return { ...prev, ...updates };
        });
    }, []);

    // Check if data is out of date (informational only)
    const isDataOutOfDate = useMemo(() => {
        if (!scenarioData || !lastRefresh || !cubeVersion) return false;
        const currentVersion = scenarioData.metadata?.lastModified || scenarioData.metadata?.version;
        return currentVersion !== cubeVersion;
    }, [scenarioData?.metadata?.lastModified, scenarioData?.metadata?.version, lastRefresh, cubeVersion]);

    /**
     * ✅ FIXED: Deliberate refresh initiation only - same as CashflowContext
     */
    const refreshCubeData = useCallback(async (force = false) => {
        if (refreshRequested && !force) {
            console.log('⏭️ CubeContext: Refresh already in progress, skipping...');
            return;
        }

        if (!scenarioData || !getValueByPath) {
            console.log('⏸️ CubeContext: Scenario data not available for refresh');
            return;
        }

        try {
            console.log('🔄 CubeContext: Starting deliberate cube data refresh...');
            setRefreshRequested(true);
            setIsLoading(true);
            setCubeError(null);
            setRefreshStage('initialization');

            // Sequential execution handled by useEffect switch/case pattern

        } catch (error) {
            console.error('❌ CubeContext: Refresh initiation failed:', error);
            setCubeError(error.message);
            setIsLoading(false);
            setRefreshRequested(false);
            setRefreshStage('idle');
        }
    }, []); // ✅ FIXED: No dependencies - same as CashflowContext

    /**
     * ✅ FIXED: MINIMAL dependencies - only control flow
     * Follows exact same pattern as CashflowContext
     */
    useEffect(() => {
        if (!refreshRequested || !scenarioData) return;

        const executeStage = async () => {
            try {
                switch (refreshStage) {
                    case 'initialization':
                        console.log('🔄 CubeContext: Stage 1 - Initialization...');
                        setSourceData(null);
                        setMetricsData(null);
                        setRefreshStage('sources');
                        break;

                    case 'sources':
                        console.log('🔄 CubeContext: Stage 2 - Computing source data...');
                        try {
                            const computedSourceData = await computeSourceData(
                                CASHFLOW_SOURCE_REGISTRY,
                                availablePercentiles,
                                getValueByPath,
                                customPercentile
                            );
                            setSourceData(computedSourceData);
                            console.log('✅ CubeContext: Source data computed successfully');
                            setRefreshStage('metrics');
                        } catch (error) {
                            console.error('❌ CubeContext: Failed to compute source data:', error);
                            throw error;
                        }
                        break;

                    case 'metrics':
                        console.log('🔄 CubeContext: Stage 3 - Computing metrics data...');
                        try {
                            // TODO: Implement metrics computation when ready
                            setMetricsData({});
                            console.log('✅ CubeContext: Metrics data computed (placeholder)');
                            setRefreshStage('complete');
                        } catch (error) {
                            console.error('❌ CubeContext: Failed to compute metrics data:', error);
                            throw error;
                        }
                        break;

                    case 'complete':
                        console.log('✅ CubeContext: Stage 4 - Refresh complete');
                        setLastRefresh(new Date());
                        setCubeVersion(scenarioData.metadata?.lastModified || scenarioData.metadata?.version);
                        setIsLoading(false);
                        setRefreshRequested(false);
                        setRefreshStage('idle');
                        console.log('✅ CubeContext: All cube data refreshed successfully');
                        break;

                    case 'idle':
                    default:
                        break;
                }
            } catch (error) {
                console.error('❌ CubeContext: Error during refresh stage:', refreshStage, error);
                setCubeError(error.message);
                message.error(`Failed to refresh cube data at ${refreshStage} stage: ${error.message}`);

                setSourceData(null);
                setMetricsData(null);
                setIsLoading(false);
                setRefreshRequested(false);
                setRefreshStage('idle');
            }
        };

        executeStage();
    }, [refreshStage, refreshRequested]); // ✅ FIXED: ONLY control flow dependencies

    const triggerRefresh = useCallback(() => {
        refreshCubeData();
    }, [refreshCubeData]);

    /**
     * ✅ REMOVED: No auto-initialization in context
     * Initialization will happen in CashflowAnalysis.jsx like CashflowContext
     */

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

    const getCustomPercentiles = useCallback(() => {
        if (!sourceData || !scenarioData) {
            console.log('⏸️ CubeContext: No sourceData or scenarioData available for getCustomPercentiles');
            return [];
        }

        // Get all sources with hasPercentiles: true
        const percentileSources = sourceData.filter(source => source.hasPercentiles === true);

        // Get selectedPercentile data from scenarioData
        const selectedPercentile = scenarioData?.settings?.simulation?.inputSim?.selectedPercentile;

        if (!selectedPercentile) {
            console.log('⏸️ CubeContext: No selectedPercentile found in scenarioData');
            return [];
        }

        const defaultValue = selectedPercentile.value;
        const customPercentileArray = selectedPercentile.customPercentile || [];

        // Create the result array
        const result = percentileSources.map(source => {
            // Look for matching customPercentile entry
            const customEntry = customPercentileArray.find(entry => entry.sourceId === source.id);

            // Use custom percentile if found, otherwise use default
            const percentileValue = customEntry ? customEntry.percentile : defaultValue;

            return {
                sourceId: source.id,
                percentile: percentileValue
            };
        });

        console.log('✅ CubeContext: getCustomPercentiles result:', result);
        return result;
    }, [sourceData, scenarioData]);

    const contextValue = {
        // Data
        sourceData,
        metricsData,
        availablePercentiles,
        selectedPercentile,
        percentileSources,

        // Custom percentile management
        customPercentile,
        setCustomPercentile,
        updateCustomPercentile,
        getCustomPercentiles,

        // State - ✅ Same interface as CashflowContext
        isLoading,
        error: cubeError,
        refreshStage: refreshRequested ? refreshStage : 'idle',
        isRefreshing: refreshRequested,
        lastRefresh,
        isDataOutOfDate,

        // Actions
        refreshCubeData,
        triggerRefresh,

        // Data access
        getData,

        // Utilities
        //getValueByPath
    };

    return (
        <CubeContext.Provider value={contextValue}>
            {children}
        </CubeContext.Provider>
    );
};

export default CubeProvider;