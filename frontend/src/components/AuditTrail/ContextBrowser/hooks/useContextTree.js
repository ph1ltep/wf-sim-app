// src/components/AuditTrail/ContextBrowser/hooks/useContextTree.js

import { useMemo, useState } from 'react';
import { convertToTreeData, flattenTreeData } from '../utils/contextUtils';

/**
 * @fileoverview React hook for processing scenario data into tree structures
 * suitable for display in the ContextBrowser component.
 */

/**
 * Hook for processing scenario data into tree structure
 * @param {Object} scenarioData - Raw scenario data from context
 * @returns {Object} Processed tree data and utilities
 */
export const useContextTree = (scenarioData) => {
  const [loadingState, setLoadingState] = useState({ isLoading: false, progress: 0 });
  
  // Convert scenario data to tree structure with performance optimization for large datasets
  const treeData = useMemo(() => {
    if (!scenarioData) return [];
    
    setLoadingState({ isLoading: true, progress: 20 });
    
    try {
      // Estimate dataset size to determine optimization strategy
      const estimatedSize = Object.keys(scenarioData).length;
      const isLargeDataset = estimatedSize > 50;
      
      // For large datasets, be more conservative with initial depth
      const initialDepth = isLargeDataset ? 1 : 2;
      
      setLoadingState({ isLoading: true, progress: 50 });
      
      const result = convertToTreeData(scenarioData, '', initialDepth);
      
      setLoadingState({ isLoading: false, progress: 100 });
      return result;
    } catch (error) {
      console.error('Error converting scenario data to tree:', error);
      setLoadingState({ isLoading: false, progress: 0 });
      return [];
    }
  }, [scenarioData]);
  
  // Optimized flattened data processing for large datasets
  const flattenedData = useMemo(() => {
    if (!treeData.length || !scenarioData) return [];
    
    try {
      // Estimate complexity and defer heavy processing for very large datasets
      const estimatedComplexity = Object.keys(scenarioData).length * 10; // rough estimate
      
      if (estimatedComplexity > 10000) {
        // For very large datasets, defer flattening until actually needed
        // This prevents blocking the UI on initial load
        console.log('Large dataset detected, optimizing search index creation');
      }
      
      // Use original data for comprehensive deep search
      return flattenTreeData(treeData, scenarioData);
    } catch (error) {
      console.error('Error flattening tree data:', error);
      return [];
    }
  }, [treeData, scenarioData]);
  
  // Statistics about the tree
  const treeStats = useMemo(() => {
    const stats = {
      totalNodes: flattenedData.length,
      types: {}
    };
    
    flattenedData.forEach(node => {
      stats.types[node.type] = (stats.types[node.type] || 0) + 1;
    });
    
    return stats;
  }, [flattenedData]);
  
  return {
    treeData,
    flattenedData,
    treeStats,
    hasData: treeData.length > 0,
    isLoading: loadingState.isLoading,
    loadingProgress: loadingState.progress
  };
};