// src/components/AuditTrail/ContextBrowser/hooks/useContextTree.js

import { useMemo } from 'react';
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
  // Convert scenario data to tree structure
  const treeData = useMemo(() => {
    if (!scenarioData) return [];
    
    try {
      return convertToTreeData(scenarioData);
    } catch (error) {
      console.error('Error converting scenario data to tree:', error);
      return [];
    }
  }, [scenarioData]);
  
  // Flatten tree data for searching
  const flattenedData = useMemo(() => {
    try {
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
    hasData: treeData.length > 0
  };
};