// frontend/src/contexts/CubeContext.jsx - CORRECTED: Minimal dependencies + external initialization
import React, { createContext, useContext, useCallback, useState, useEffect, useMemo } from 'react';
import { message } from 'antd';
import { useScenario } from './ScenarioContext';
import { computeSourceData } from '../utils/cube/sources/processor';
import { CASHFLOW_SOURCE_REGISTRY } from '../utils/cube/sources/registry';
import { computeMetricsData } from '../utils/cube/metrics/processor';
import { METRICS_REGISTRY } from '../utils/cube/metrics/registry';
import { computeSensitivityMatrices } from 'utils/cube/sensitivity/processor';
import { SENSITIVITY_ANALYSES_REGISTRY } from '../utils/cube/sensitivity/registry';
import {
    isDistributionsComplete,
    isConstructionSourcesComplete
} from '../utils/dependencies/checkFunctions';
import { generateConstructionCostSources } from '../utils/drawdownUtils';
import { get, set } from 'lodash';

const CubeContext = createContext();
export const useCube = () => useContext(CubeContext);

export const CubeProvider = ({ children }) => {
    const { scenarioData, getValueByPath, updateByPath } = useScenario();

    // ✅ FIXED: Sequential refresh state management
    const [sourceData, setSourceData] = useState(null);
    const [metricsData, setMetricsData] = useState(null);
    const [sensitivityData, setSensitivityData] = useState(null); // CubeSensitivityDataSchema
    const [percentileInfo, setPercentileInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshRequested, setRefreshRequested] = useState(false);
    const [refreshStage, setRefreshStage] = useState('idle');
    const [lastRefresh, setLastRefresh] = useState(null);
    const [cubeVersion, setCubeVersion] = useState(null);
    const [cubeError, setCubeError] = useState(null);

    const selectedPercentile = percentileInfo?.selected;
    const availablePercentiles = percentileInfo?.available;
    const primaryPercentile = percentileInfo?.primary;

    // Clean getPercentileData - returns the single object
    const getPercentileData = useCallback(() => {
        return percentileInfo;
    }, [percentileInfo]);

    // Clean setSelectedPercentile - updates both persistent and local
    const setSelectedPercentile = useCallback(async (percentile) => {
        const numericPercentile = typeof percentile === 'string' && percentile.startsWith('P')
            ? Number(percentile.slice(1))
            : Number(percentile);

        if (await updatePercentileData({ selected: numericPercentile })) {
            console.log(`✅ Percentile ${numericPercentile} selected successfully`);
        } else {
            console.error(`❌ Failed to select percentile ${numericPercentile}`);
        }
    }, [updateByPath]);

    /**
     * Update percentileData with partial or full updates
     * @param {Object} updates - Partial or full percentileData object to merge
     * @returns {Promise<boolean>} Success status
     * 
     * Examples:
     * await updatePercentileData({ selected: 75 });
     * await updatePercentileData({ strategy: 'perSource', custom: { energyRevenue: 90 } });
     * await updatePercentileData({ selected: 50, strategy: 'unified', custom: {} });
     */
    const updatePercentileData = useCallback(async (updates = {}) => {
        try {
            // Get current percentileData
            const currentPercentileData = percentileInfo || getValueByPath(['simulation', 'inputSim', 'cashflow', 'percentileData']);

            if (!currentPercentileData) {
                console.warn('updatePercentileData: No existing percentileData found');
                return false;
            }

            // Merge updates with existing data
            const mergedData = {
                ...currentPercentileData,
                ...updates
            };

            // Special handling for custom percentiles - deep merge if both are objects
            if (updates.custom !== undefined && currentPercentileData.custom &&
                typeof updates.custom === 'object' && typeof currentPercentileData.custom === 'object' &&
                updates.custom !== null && currentPercentileData.custom !== null) {

                mergedData.custom = {
                    ...currentPercentileData.custom,
                    ...updates.custom
                };
            }

            // Save to ScenarioContext (persistent)
            await updateByPath(['simulation', 'inputSim', 'cashflow', 'percentileData'], mergedData);

            // Update local state (performance)
            setPercentileInfo(mergedData);

            console.log('✅ updatePercentileData: Updated', Object.keys(updates));
            return true;

        } catch (error) {
            console.error('❌ updatePercentileData: Failed to update:', error);
            return false;
        }
    }, [percentileInfo, getValueByPath, updateByPath, setPercentileInfo]);

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


    const initializeCustomPercentiles = useCallback((existingCustom = {}, primaryPercentile = 50) => {
        // Get sources with percentiles from registry (always scan registry)
        const registrySources = CASHFLOW_SOURCE_REGISTRY.sources
            .filter(source => source.hasPercentiles === true)
            .map(source => source.id);

        const customPercentiles = {};

        // For each registry source with percentiles
        registrySources.forEach(sourceId => {
            // Use existing value if available, otherwise use primary percentile
            customPercentiles[sourceId] = existingCustom[sourceId] || primaryPercentile;
        });

        return customPercentiles;
    }, []);

    const initializePercentileInfo = useCallback(async (force = false) => {
        console.log('🔄 CubeContext: Stage 1 - Initializing percentile info...');

        let existingPercentileData = null;

        if (!force) {
            // Try to load from ScenarioContext first
            existingPercentileData = getValueByPath(['simulation', 'inputSim', 'cashflow', 'percentileData']);
        }

        if (!existingPercentileData) {
            // Get available percentiles from scenario settings
            const availableFromSettings = getValueByPath(['settings', 'simulation', 'percentiles'])
            const available = availableFromSettings.map(p => p.value) || [10, 25, 50, 75, 90];
            const sortedAvailable = available.sort((a, b) => a - b);

            // Use center item from available array
            const centerIndex = Math.floor((sortedAvailable.length - 1) / 2);
            const defaultPercentile = sortedAvailable[centerIndex];

            const initializedCustom = initializeCustomPercentiles({}, defaultPercentile);

            const newPercentileData = {
                selected: defaultPercentile,
                available: sortedAvailable,
                primary: defaultPercentile,
                custom: initializedCustom,
                strategy: 'unified'
            };

            // Save to ScenarioContext
            await updateByPath(['simulation', 'inputSim', 'cashflow', 'percentileData'], newPercentileData);
            existingPercentileData = newPercentileData;
            console.log(`✅ CubeContext: ${force ? 'Force created' : 'Initialized'} percentile data`);
        } else {
            console.log('✅ CubeContext: Loaded existing percentile data from scenario');
        }

        return existingPercentileData;
    }, [getValueByPath, updateByPath, scenarioData?.settings?.simulation?.percentiles]);

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

                        const percentileData = await initializePercentileInfo();
                        setPercentileInfo(percentileData);

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
                                percentileInfo,
                                getValueByPath,
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
                                percentileInfo,
                                getValueByPath,
                                getData, // Use existing getData function as getSourceData
                            );
                            setMetricsData(computedMetricsData);
                            console.log(`✅ CubeContext: ${computedMetricsData.length} metrics computed successfully`);
                            setRefreshStage('sensitivity');
                        } catch (error) {
                            console.error('❌ CubeContext: Failed to compute metrics data:', error);
                            throw error;
                        }
                        break;

                    case 'sensitivity':
                        console.log('🔄 CubeContext: Stage 4 - Computing sensitivity matrices...');
                        try {
                            const computedSensitivityData = await computeSensitivityMatrices(
                                getMetric, // Access to all computed metrics
                                SENSITIVITY_ANALYSES_REGISTRY,
                                percentileInfo, // Use same percentiles as metrics system
                                METRICS_REGISTRY // Access to sensitivity configuration
                            );
                            setSensitivityData(computedSensitivityData);
                            console.log('✅ CubeContext: Sensitivity matrices computed successfully');
                            setRefreshStage('complete');
                        } catch (error) {
                            console.error('❌ CubeContext: Failed to compute sensitivity data:', error);
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
    }, [refreshStage, refreshRequested, percentileInfo, getValueByPath, updateByPath, initializePercentileInfo]); // ✅ FIXED: ONLY control flow dependencies

    const triggerRefresh = useCallback(() => {
        refreshCubeData();
    }, [refreshCubeData]);

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


    // In CubeContext.jsx - Add this function

    /**
     * Get source metadata with flexible filtering options
     * @param {Object} filters - Filter parameters
     * @param {string} [filters.sourceId] - Single source ID
     * @param {string[]} [filters.sourceIds] - Multiple source IDs
     * @param {Object} [filters.metadata] - Filter by metadata fields (exact matches)
     * @returns {Object} Dynamic-key object where key=sourceId, value=CubeSourceMetadataSchema
     * @throws {Error} If no filter parameters provided
     * 
     * Examples:
     * const energyMeta = getSourceMetadata({ sourceId: 'energyRevenue' });
     * const revenueMeta = getSourceMetadata({ sourceIds: ['energyRevenue', 'capacityRevenue'] });
     * const costMeta = getSourceMetadata({ metadata: { cashflowGroup: 'cost' } });
     */
    const getSourceMetadata = useCallback((filters = {}) => {
        const { sourceId, sourceIds, metadata: metadataFilters } = filters;

        // Validation - require at least one filter parameter
        if (!sourceId && !sourceIds && !metadataFilters) {
            throw new Error('getSourceMetadata requires at least one filter parameter: sourceId, sourceIds, or metadata');
        }

        // Use registry as source of truth for metadata (always available, even before sourceData)
        const registrySources = CASHFLOW_SOURCE_REGISTRY.sources;

        if (!registrySources || !Array.isArray(registrySources)) {
            console.warn('⚠️ getSourceMetadata: Registry sources not available');
            return {};
        }

        // Optimized filtering - apply most selective filters first
        let filteredSources = registrySources;

        // Apply sourceId filter first (most selective) - single source
        if (sourceId) {
            filteredSources = filteredSources.filter(source => source.id === sourceId);
            // Early return if no source found
            if (filteredSources.length === 0) return {};
        }
        // Apply sourceIds filter (multiple sources with OR logic)
        else if (sourceIds && Array.isArray(sourceIds)) {
            if (sourceIds.length === 0) return {}; // Empty array = no results

            // Use Set for O(1) lookup performance
            const sourceIdSet = new Set(sourceIds);
            filteredSources = filteredSources.filter(source => sourceIdSet.has(source.id));

            // Early return if no sources found
            if (filteredSources.length === 0) return {};
        }

        // Apply metadata filters (moderately selective)
        if (metadataFilters && typeof metadataFilters === 'object') {
            const filterEntries = Object.entries(metadataFilters);
            if (filterEntries.length > 0) {
                filteredSources = filteredSources.filter(source => {
                    return filterEntries.every(([key, value]) =>
                        source.metadata && source.metadata[key] === value
                    );
                });
                // Early return if no sources match metadata filters
                if (filteredSources.length === 0) return {};
            }
        }

        // Build result object with sourceId as key, metadata as value
        const result = {};
        filteredSources.forEach(source => {
            result[source.id] = {
                ...source.metadata, // Spread the metadata object
                // sourceId: source.id, // Add sourceId for convenience
                // hasPercentiles: source.hasPercentiles // Add hasPercentiles flag
            };
        });

        return result;
    }, []); // No dependencies - registry is static

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

    // In CubeContext.jsx, add getMetric method (similar to existing getData)
    const getMetric = useCallback((filters = {}) => {
        if (!metricsData || metricsData.length === 0) {
            console.warn('⚠️ CubeContext: No metrics data available');
            return {};
        }

        const { metricIds, percentile, percentiles } = filters;

        // If specific percentile requested
        if (percentile !== undefined) {
            const result = {};

            metricsData.forEach(metricDataItem => {
                const metricId = metricDataItem.id;

                // Filter by metricIds if specified
                if (metricIds && !metricIds.includes(metricId)) return;

                // Find percentile data
                const percentileResult = metricDataItem.percentileMetrics.find(
                    pm => pm.percentile.value === percentile
                );

                if (percentileResult) {
                    if (!result[metricId]) result[metricId] = {};
                    result[metricId][percentile] = {
                        value: percentileResult.value,
                        metadata: percentileResult.metadata
                    };
                }
            });

            return result;
        }

        // If multiple percentiles or all data requested
        const result = {};

        metricsData.forEach(metricDataItem => {
            const metricId = metricDataItem.id;

            // Filter by metricIds if specified
            if (metricIds && !metricIds.includes(metricId)) return;

            result[metricId] = {};

            metricDataItem.percentileMetrics.forEach(pm => {
                // Filter by percentiles if specified
                if (percentiles && !percentiles.includes(pm.percentile)) return;

                result[metricId][pm.percentile] = {
                    value: pm.value,
                    metadata: pm.metadata
                };
            });
        });

        return result;
    }, [metricsData]);

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
            sensitivityDataCount: sensitivityData?.percentileMatrices?.length || 0,
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
        sensitivityData,

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
        getMetric,
        getAuditTrail,
        getSourceMetadata,
        getPercentileData,
        getCubeStatus,

        //Data set
        setSelectedPercentile,
        updatePercentileData

    };

    return (
        <CubeContext.Provider value={contextValue}>
            {children}
        </CubeContext.Provider>
    );
};

export default CubeProvider;