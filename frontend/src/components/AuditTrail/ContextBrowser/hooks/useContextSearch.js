// src/components/AuditTrail/ContextBrowser/hooks/useContextSearch.js

import { useState, useMemo, useCallback } from 'react';
import Fuse from 'fuse.js';
import { getParentPaths } from '../utils/contextUtils';

/**
 * @fileoverview React hook for implementing fuzzy search functionality
 * across flattened context tree data using Fuse.js.
 */

/**
 * Hook for searching through context tree data
 * @param {Array} flattenedData - Flattened tree data for searching
 * @returns {Object} Search state and utilities
 */
export const useContextSearch = (flattenedData) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!flattenedData || flattenedData.length === 0) return null;
    
    return new Fuse(flattenedData, {
      keys: [
        { name: 'title', weight: 0.4 },
        { name: 'path', weight: 0.3 },
        { name: 'preview', weight: 0.2 },
        { name: 'type', weight: 0.1 }
      ],
      threshold: 0.4, // More lenient matching
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      includeMatches: true
    });
  }, [flattenedData]);
  
  // Perform search and get results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !fuse) {
      return {
        results: [],
        matchedPaths: new Set(),
        expandedKeys: new Set(),
        hasResults: false
      };
    }
    
    const fuseResults = fuse.search(searchQuery);
    const matchedPaths = new Set();
    const expandedKeys = new Set();
    
    // Extract matched paths and calculate expanded keys
    fuseResults.forEach(result => {
      const path = result.item.path;
      matchedPaths.add(path);
      
      // Add all parent paths to expanded keys
      const parentPaths = getParentPaths(path);
      parentPaths.forEach(parentPath => {
        expandedKeys.add(parentPath);
      });
    });
    
    return {
      results: fuseResults,
      matchedPaths,
      expandedKeys,
      hasResults: fuseResults.length > 0
    };
  }, [searchQuery, fuse]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);
  
  // Check if a node matches search
  const isNodeMatched = useCallback((nodePath) => {
    return searchResults.matchedPaths.has(nodePath);
  }, [searchResults.matchedPaths]);
  
  // Check if a node should be visible (matches search or has matching children)
  const isNodeVisible = useCallback((node, allNodes) => {
    if (!searchQuery.trim()) return true;
    
    // If this node matches, it's visible
    if (isNodeMatched(node.path)) return true;
    
    // If any descendant matches, this node should be visible
    const hasMatchingDescendant = allNodes.some(otherNode => 
      otherNode.path.startsWith(node.path + '.') && isNodeMatched(otherNode.path)
    );
    
    return hasMatchingDescendant;
  }, [searchQuery, isNodeMatched]);
  
  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    clearSearch,
    isNodeMatched,
    isNodeVisible,
    hasActiveSearch: !!searchQuery.trim()
  };
};