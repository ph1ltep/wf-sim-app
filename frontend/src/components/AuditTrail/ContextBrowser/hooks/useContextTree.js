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
  
  // Convert scenario data to tree structure with performance optimization
  const treeData = useMemo(() => {
    if (!scenarioData) return [];
    
    setLoadingState({ isLoading: true, progress: 20 });
    
    try {
      // Only process top-level keys initially for better performance
      const result = convertToTreeData(scenarioData, '', 2); // Limit depth to 2 levels initially
      setLoadingState({ isLoading: false, progress: 100 });
      return result;
    } catch (error) {
      console.error('Error converting scenario data to tree:', error);
      setLoadingState({ isLoading: false, progress: 0 });
      return [];
    }
  }, [scenarioData]);
  
  // Only flatten data when needed for search (lazy)
  const flattenedData = useMemo(() => {
    if (!treeData.length) return [];
    
    try {
      // Only flatten when we actually need to search
      return flattenTreeData(treeData);
    } catch (error) {
      console.error('Error flattening tree data:', error);
      return [];
    }
  }, [treeData]);
  
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