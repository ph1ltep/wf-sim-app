// src/components/AuditTrail/ContextBrowser/hooks/useContextSearch.js

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { getParentPaths } from '../utils/contextUtils';

/**
 * @fileoverview React hook for VSCode-style search functionality
 * with case-insensitive string matching and navigation controls.
 */

/**
 * Hook for searching through context tree data with VSCode-style navigation
 * @param {Array} flattenedData - Flattened tree data for searching
 * @returns {Object} Search state and utilities
 */
export const useContextSearch = (flattenedData) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  // Performance optimization: cache search index for large datasets
  const searchIndexRef = useRef(new Map());
  const lastDataRef = useRef(null);
  
  // Create search index for large datasets (9000+ items)
  const searchIndex = useMemo(() => {
    // If data hasn't changed and we have a cached index, use it
    if (flattenedData === lastDataRef.current && searchIndexRef.current.size > 0) {
      return searchIndexRef.current;
    }
    
    if (!flattenedData || flattenedData.length === 0) {
      searchIndexRef.current = new Map();
      return searchIndexRef.current;
    }
    
    // For large datasets, create a search index for better performance
    const isLargeDataset = flattenedData.length > 1000;
    const index = new Map();
    
    if (isLargeDataset) {
      // Process in batches to avoid blocking the UI
      const batchSize = 100;
      let processed = 0;
      
      const processBatch = () => {
        const end = Math.min(processed + batchSize, flattenedData.length);
        
        for (let i = processed; i < end; i++) {
          const node = flattenedData[i];
          // Only search key names (node.title), not values or other fields
          const searchText = (node.title || '').toLowerCase();
          
          index.set(node.path, { node, index: i, searchText });
        }
        
        processed = end;
        
        if (processed < flattenedData.length) {
          // Continue processing in next frame
          requestAnimationFrame(processBatch);
        }
      };
      
      processBatch();
    } else {
      // For smaller datasets, process synchronously
      flattenedData.forEach((node, i) => {
        // Only search key names (node.title), not values or other fields
        // This gives VS Code Ctrl+F behavior - matching only the actual key names
        const searchText = (node.title || '').toLowerCase();
        
        index.set(node.path, { node, index: i, searchText });
      });
    }
    
    lastDataRef.current = flattenedData;
    searchIndexRef.current = index;
    return index;
  }, [flattenedData]);
  
  // Optimized search using pre-built index for large datasets
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchIndex.size === 0) {
      return {
        results: [],
        matches: [],
        matchedPaths: new Set(),
        expandedKeys: new Set(),
        hasResults: false,
        currentMatch: null,
        totalMatches: 0
      };
    }
    
    const query = searchQuery.trim().toLowerCase();
    const matches = [];
    const matchedPaths = new Set();
    const expandedKeys = new Set();
    
    // Use the pre-built search index for better performance
    // VS Code-style partial matching - search text must contain the query
    for (const [path, { node, index, searchText }] of searchIndex.entries()) {
      if (searchText.includes(query)) {
        matches.push({
          node,
          index,
          path: node.path
        });
        
        // IMPORTANT: Only add the exact matching node path to matchedPaths
        // This prevents child nodes from being highlighted when their parent matches
        matchedPaths.add(node.path);
        
        // Add parent paths to expanded keys so we can navigate to the match
        const parentPaths = getParentPaths(node.path);
        parentPaths.forEach(parentPath => {
          expandedKeys.add(parentPath);
        });
      }
    }
    
    return {
      results: matches,
      matches,
      matchedPaths,
      expandedKeys,
      hasResults: matches.length > 0,
      currentMatch: matches.length > 0 ? matches[Math.min(currentMatchIndex, matches.length - 1)] : null,
      totalMatches: matches.length
    };
  }, [searchQuery, searchIndex, currentMatchIndex]);
  
  // Navigation functions
  const goToNextMatch = useCallback(() => {
    if (searchResults.totalMatches > 0) {
      setCurrentMatchIndex(prev => (prev + 1) % searchResults.totalMatches);
    }
  }, [searchResults.totalMatches]);
  
  const goToPreviousMatch = useCallback(() => {
    if (searchResults.totalMatches > 0) {
      setCurrentMatchIndex(prev => prev === 0 ? searchResults.totalMatches - 1 : prev - 1);
    }
  }, [searchResults.totalMatches]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setCurrentMatchIndex(0);
  }, []);
  
  // Set search query and reset index
  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    setCurrentMatchIndex(0);
  }, []);
  
  // Check if a node matches search
  const isNodeMatched = useCallback((nodePath) => {
    return searchResults.matchedPaths.has(nodePath);
  }, [searchResults.matchedPaths]);
  
  // Check if a node is the current highlighted match
  const isCurrentMatch = useCallback((nodePath) => {
    return searchResults.currentMatch?.path === nodePath;
  }, [searchResults.currentMatch]);
  
  // Get the required expanded keys for the current match
  const getRequiredExpansions = useCallback(() => {
    if (!searchResults.currentMatch) return new Set();
    
    const currentMatchPath = searchResults.currentMatch.path;
    const requiredExpansions = new Set();
    
    // Use the same parent path logic as the search results
    const parentPaths = getParentPaths(currentMatchPath);
    parentPaths.forEach(parentPath => {
      requiredExpansions.add(parentPath);
    });
    
    return requiredExpansions;
  }, [searchResults.currentMatch]);
  
  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    searchResults,
    clearSearch,
    isNodeMatched,
    isCurrentMatch,
    getRequiredExpansions,
    hasActiveSearch: !!searchQuery.trim(),
    // Navigation
    currentMatchIndex,
    goToNextMatch,
    goToPreviousMatch,
    currentMatch: searchResults.currentMatch,
    totalMatches: searchResults.totalMatches
  };
};