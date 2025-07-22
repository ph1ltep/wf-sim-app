// frontend/src/contexts/CubeContext.jsx - CORRECTED: Minimal dependencies + external initialization
import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { computeSourceData } from '../utils/cube/sources/processor';
import { CASHFLOW_SOURCE_REGISTRY } from '../utils/cube/sources/registry';
import { computeMetricsData } from '../utils/cube/metrics/processor';
import { METRICS_REGISTRY } from '../utils/cube/metrics/registry';
import {
    isDistributionsComplete,
    isConstructionSourcesComplete
} from '../utils/dependencies/checkFunctions';
import { generateConstructionCostSources } from '../utils/drawdownUtils';
import { get, set } from 'lodash';

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
    const { scenarioData, getValueByPath, updateByPath } = useScenario();

    // ✅ FIXED: Sequential refresh state management
    const [sourceData, setSourceData] = useState(null);
    const [metricsData, setMetricsData] = useState(null);
    const [percentileData, setPercentileData] = useState(null);
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

    // TODO: this function is messy. it shouldn't run often and it shouldn't be reading directly from source data when we can get it from registry.
    const getCustomPercentiles = useCallback(() => {
        if (!sourceData || !scenarioData) {
            console.log('⏸️ CubeContext: No sourceData or scenarioData available for getCustomPercentiles');
            return [];
        }

        // Get all sources with hasPercentiles: true
        const percentileSources = sourceData.filter(source => source.hasPercentiles === true);

        // Get selectedPercentile data from scenarioData
        const selectedPercentile = percentileData.selected //scenarioData?.simulation?.inputSim?.cashflow?.selectedPercentile;

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

    /**
    * Get percentile information for components
    * @returns {Object} Percentile configuration object
    */
    const getPercentileData = useCallback(() => {
        let p;

        if (!percentileData) {
            const selected = getValueByPath(['simulation', 'inputSim', 'cashflow', 'selectedPercentile'])?.value;
            const primary = getValueByPath(['settings', 'simulation', 'percentiles', 'primaryPercentile']) || 50;
            p = {
                selected: selected || primary,
                available: availablePercentiles,
                primary: primary,
                custom: null, //getCustomPercentiles(),
                strategy: 'unified'
            };
            setPercentileData(p);
        }

        return percentileData || p;
    }, [getValueByPath, percentileData, availablePercentiles]);

    const setSelectedPercentile = useCallback((percentile) => {
        const numericPercentile = typeof percentile === 'string' && percentile.startsWith('P')
            ? Number(percentile.slice(1))
            : Number(percentile);
        set(percentileData, 'selected', numericPercentile);
    }, [percentileData]);


    const percentileInfo = useMemo(() =>
        getPercentileData(),
        []
    );

    //const selectedPercentile = percentileInfo.selected //getValueByPath(['simulation', 'inputSim', 'cashflow', 'selectedPercentile']);
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
    }, [refreshRequested, scenarioData, getValueByPath]); // ✅ FIXED: No dependencies - same as CashflowContext

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
                        setRefreshStage('dependencies');
                        break;

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
                            const computedMetricsData = await computeMetricsData(
                                METRICS_REGISTRY,
                                availablePercentiles,
                                getValueByPath,
                                getData, // Use existing getData function as getSourceData
                                customPercentile
                            );
                            setMetricsData(computedMetricsData);
                            console.log(`✅ CubeContext: ${computedMetricsData.length} metrics computed successfully`);
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
        const { percentile, sourceId, sourceIds, metadata: metadataFilters } = filters;

        // Validate required parameters - now includes sourceIds
        if (!sourceId && !sourceIds && percentile === undefined) {
            throw new Error('getData requires either sourceId, sourceIds, or percentile parameter');
        }

        if (!sourceData || !Array.isArray(sourceData)) {
            return {};
        }

        // Optimized filtering - apply most selective filters first
        let filteredSources = sourceData;

        // Apply sourceId filter first (most selective) - single source
        if (sourceId) {
            filteredSources = filteredSources.filter(source => source.id === sourceId);
            // Early return if no source found
            if (filteredSources.length === 0) return {};
        }
        // ✅ NEW: Apply sourceIds filter (multiple sources with OR logic)
        else if (sourceIds && Array.isArray(sourceIds)) {
            filteredSources = filteredSources.filter(source => sourceIds.includes(source.id));
            // Early return if no sources found
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
            source.percentileSource.forEach(simResult => {
                const percentileKey = simResult.percentile.value;
                if (!percentileGroups.has(percentileKey)) {
                    percentileGroups.set(percentileKey, []);
                }
                // Extract data from simResult.data array
                simResult.data.forEach(dataPoint => {
                    percentileGroups.get(percentileKey).push({
                        year: dataPoint.year,
                        value: dataPoint.value
                    });
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
        // ✅ NEW: Mode 1b: Only sourceIds set (group by percentile, multiple sources)
        else if (sourceIds && Array.isArray(sourceIds) && percentile === undefined) {
            // For each source, group by percentile
            filteredSources.forEach(source => {
                const percentileGroups = new Map();
                source.percentileSource.forEach(simResult => {
                    const percentileKey = simResult.percentile.value;
                    if (!percentileGroups.has(percentileKey)) {
                        percentileGroups.set(percentileKey, []);
                    }
                    // Extract data from simResult.data array
                    simResult.data.forEach(dataPoint => {
                        percentileGroups.get(percentileKey).push({
                            year: dataPoint.year,
                            value: dataPoint.value
                        });
                    });
                });

                // Build result with percentile keys for this source
                percentileGroups.forEach((dataPoints, percentileKey) => {
                    if (!result[percentileKey]) {
                        result[percentileKey] = {
                            data: [],
                            metadata: { sources: [] }
                        };
                    }
                    result[percentileKey].data.push(...dataPoints);
                    result[percentileKey].metadata.sources.push(source.metadata);
                });
            });
        }
        // Mode 2 & 3: Percentile set (group by sourceId)
        else if (percentile !== undefined) {
            filteredSources.forEach(source => {
                // Pre-filter to specific percentile for efficiency
                const dataPoints = [];
                source.percentileSource.forEach(simResult => {
                    if (simResult.percentile.value === percentile) {
                        // Extract data from simResult.data array
                        simResult.data.forEach(dataPoint => {
                            dataPoints.push({
                                year: dataPoint.year,
                                value: dataPoint.value
                            });
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
     * Get audit trails for specific sources
     * @param {Array} sourceIds - Array of source IDs to get audit trails for
     * @returns {Object} Object with sourceId as keys and audit objects as values
     */
    const getAuditTrail = useCallback((sourceIds) => {
        if (!Array.isArray(sourceIds) || sourceIds.length === 0) {
            console.warn('⚠️ getAuditTrail: sourceIds must be a non-empty array');
            return {};
        }

        if (!sourceData || !Array.isArray(sourceData)) {
            console.warn('⚠️ getAuditTrail: No sourceData available');
            return {};
        }

        const auditTrails = {};

        sourceIds.forEach(sourceId => {
            // Find the source in sourceData
            const source = sourceData.find(item => item.id === sourceId);

            if (source) {
                // Extract audit trail if it exists
                if (source.audit && source.audit.trail) {
                    auditTrails[sourceId] = source.audit;
                } else {
                    console.warn(`⚠️ getAuditTrail: No audit trail found for source '${sourceId}'`);
                    auditTrails[sourceId] = { trail: [] };
                }
            } else {
                console.warn(`⚠️ getAuditTrail: Source '${sourceId}' not found in sourceData`);
                auditTrails[sourceId] = null;
            }
        });

        return auditTrails;
    }, [sourceData]);



    /**
     * Get comprehensive cube status for monitoring
     * @returns {Object} Cube status object
     */
    const getCubeStatus = useCallback(() => {
        return {
            isLoading,
            version: cubeVersion,
            lastRefresh,
            sourceDataCount: sourceData?.length || 0,
            metricsDataCount: metricsData?.length || 0,
            refreshRequested,
            refreshStage,
            error: cubeError,
            isDataOutOfDate
        };
    }, [
        isLoading,
        cubeVersion,
        lastRefresh,
        sourceData?.length,
        metricsData?.length,
        refreshRequested,
        refreshStage,
        cubeError,
        isDataOutOfDate
    ]);

    const contextValue = {
        // Data
        sourceData,
        metricsData,
        availablePercentiles,
        //selectedPercentile,
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
        getAuditTrail,

        getPercentileData,
        getCubeStatus,

        //Data set
        setSelectedPercentile

    };

    return (
        <CubeContext.Provider value={contextValue}>
            {children}
        </CubeContext.Provider>
    );
};

export default CubeProvider;