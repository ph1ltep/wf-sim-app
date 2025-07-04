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

/**
 * Initialize selectedPercentiles object with all percentile sources
 * @param {Array} percentileSources - Array of source objects with percentiles
 * @param {number} primaryPercentile - Default percentile value
 * @returns {Object} Object mapping sourceId to percentile value
 */
const initializeSelectedPercentiles = (percentileSources, primaryPercentile) => {
    const selectedPercentiles = {};
    percentileSources.forEach(source => {
        selectedPercentiles[source.id] = primaryPercentile;
    });
    return selectedPercentiles;
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
    const [scenarioVersion, setScenarioVersion] = useState(null);
    
    // Percentile handling
    const availablePercentiles = scenarioData?.settings?.simulation?.percentiles?.map(p => p.value) || [10, 25, 50, 75, 90];
    const primaryPercentile = scenarioData?.settings?.simulation?.primaryPercentile || 50;
    
    // Optimized percentile sources (memoized)
    const percentileSources = useMemo(() => 
        getPercentileSourcesFromCubeRegistry(CASHFLOW_SOURCE_REGISTRY), 
        []
    );
    
    // Simplified selectedPercentiles - persists across refreshes
    const [selectedPercentiles, setSelectedPercentiles] = useState({});
    
    // Track if data is out of date
    const isDataOutOfDate = useMemo(() => {
        if (!scenarioData || !lastRefresh) return false;
        
        // Compare current scenario version with last refresh version
        const currentVersion = scenarioData.metadata?.lastModified || scenarioData.metadata?.version;
        return currentVersion !== scenarioVersion;
    }, [scenarioData, lastRefresh, scenarioVersion]);
    
    /**
     * Update selected percentiles for specific sources
     */
    const updateSelectedPercentiles = useCallback((updates) => {
        setSelectedPercentiles(prev => ({
            ...prev,
            ...updates
        }));
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
            if (Object.keys(selectedPercentiles).length === 0) return 'init_percentiles';
            if (!sourceData) return 'sources';
            if (!metricsData) return 'metrics';
            return 'complete';
        })();
        
        const executeRefreshStage = async () => {
            switch (refreshStage) {
                case 'init_percentiles':
                    console.log('🔄 CubeContext: Initializing selectedPercentiles...');
                    try {
                        const initialPercentiles = initializeSelectedPercentiles(percentileSources, primaryPercentile);
                        setSelectedPercentiles(initialPercentiles);
                        console.log('✅ CubeContext: selectedPercentiles initialized');
                    } catch (error) {
                        console.error('❌ CubeContext: Failed to initialize selectedPercentiles:', error);
                        setIsLoading(false);
                        setIsRefreshing(false);
                    }
                    break;
                    
                case 'sources':
                    console.log('🔄 CubeContext: Computing source data...');
                    try {
                        const computedSourceData = await computeSourceData(
                            CASHFLOW_SOURCE_REGISTRY,
                            availablePercentiles,
                            getValueByPath
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
                    setScenarioVersion(scenarioData.metadata?.lastModified || scenarioData.metadata?.version);
                    break;
                    
                default:
                    console.log('⏸️ CubeContext: Unknown refresh stage');
                    setIsLoading(false);
                    setIsRefreshing(false);
            }
        };
        
        executeRefreshStage();
    }, [scenarioData, getValueByPath, availablePercentiles, refreshTrigger, sourceData, metricsData, isRefreshing, selectedPercentiles, percentileSources, primaryPercentile]);
    
    /**
     * Context value object
     */
    const contextValue = {
        // Data
        sourceData,
        metricsData,
        availablePercentiles,
        percentileSources,
        
        // Percentile management
        selectedPercentiles,
        updateSelectedPercentiles,
        primaryPercentile,
        
        // State
        isLoading,
        isRefreshing,
        lastRefresh,
        isDataOutOfDate,
        
        // Actions
        refreshCubeData,
        triggerRefresh,
        
        // Utilities
        getValueByPath
    };
    
    return (
        <CubeContext.Provider value={contextValue}>
            {children}
        </CubeContext.Provider>
    );
};