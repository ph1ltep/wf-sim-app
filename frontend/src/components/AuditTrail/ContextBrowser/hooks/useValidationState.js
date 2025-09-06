// frontend/src/components/AuditTrail/ContextBrowser/hooks/useValidationState.js

/**
 * @fileoverview React hook for managing validation state in the Context Browser.
 * Provides state management for validation process, progress tracking, metrics,
 * error/warning collection, and cache management integration.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { message } from 'antd';

/**
 * useValidationState - State management hook for validation process
 * 
 * Features:
 * - State management for validation process
 * - Progress tracking with real-time updates
 * - Error and warning collection
 * - Metrics aggregation and performance monitoring
 * - Cache management integration
 * - Automatic cleanup and memory management
 */
export const useValidationState = (options = {}) => {
  const {
    enableMetrics = true,
    enableAutoCleanup = true,
    maxResultHistory = 10,
    progressUpdateInterval = 100
  } = options;
  
  // Validation state
  const [validationState, setValidationState] = useState({
    isRunning: false,
    isPaused: false,
    isCanceled: false,
    isCompleted: false,
    currentBatch: 0,
    error: null
  });
  
  // Progress state
  const [progress, setProgress] = useState({
    totalNodes: 0,
    processedNodes: 0,
    validNodes: 0,
    invalidNodes: 0,
    skippedNodes: 0,
    currentDepth: 0,
    percentComplete: 0,
    estimatedTimeRemaining: null,
    startTime: null,
    endTime: null
  });
  
  // Results state
  const [results, setResults] = useState({
    valid: new Map(),
    invalid: new Map(),
    warnings: new Map(),
    errors: [],
    summary: null
  });
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    validationCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageValidationTime: 0,
    totalProcessingTime: 0,
    batchProcessingTimes: [],
    memoryUsage: []
  });
  
  // Cache statistics
  const [cacheStats, setCacheStats] = useState({
    hits: 0,
    misses: 0,
    hitRate: 0,
    currentSize: 0,
    maxSize: 0
  });
  
  // Rules statistics
  const [rulesStats, setRulesStats] = useState({
    evaluations: 0,
    failures: 0,
    successRate: 0,
    topRules: []
  });
  
  // Result history for comparison
  const [resultHistory, setResultHistory] = useState([]);
  
  // Internal refs
  const progressUpdateTimer = useRef(null);
  const lastProgressUpdate = useRef(Date.now());
  const cleanupCallbacks = useRef([]);
  
  // ============================================================================
  // State Update Methods
  // ============================================================================
  
  /**
   * Update validation state
   */
  const updateValidationState = useCallback((updates) => {
    setValidationState(prevState => ({
      ...prevState,
      ...updates
    }));
  }, []);
  
  /**
   * Update progress with throttling
   */
  const updateProgress = useCallback((progressData) => {
    const now = Date.now();
    
    // Throttle progress updates to avoid excessive re-renders
    if (now - lastProgressUpdate.current < progressUpdateInterval) {
      return;
    }
    
    lastProgressUpdate.current = now;
    
    setProgress(prevProgress => {
      const updated = { ...prevProgress, ...progressData };
      
      // Calculate percentage complete
      if (updated.totalNodes > 0) {
        updated.percentComplete = Math.round(
          (updated.processedNodes / updated.totalNodes) * 100 * 100
        ) / 100;
      }
      
      // Calculate estimated time remaining
      if (updated.processedNodes > 0 && updated.startTime) {
        const elapsed = now - updated.startTime;
        const avgTimePerNode = elapsed / updated.processedNodes;
        const remainingNodes = updated.totalNodes - updated.processedNodes;
        updated.estimatedTimeRemaining = remainingNodes * avgTimePerNode;
      }
      
      return updated;
    });
  }, [progressUpdateInterval]);
  
  /**
   * Update validation results
   */
  const updateResults = useCallback((resultUpdates) => {
    setResults(prevResults => {
      const updated = { ...prevResults };
      
      // Handle different types of result updates
      if (resultUpdates.valid) {
        if (resultUpdates.valid instanceof Map) {
          updated.valid = new Map([...updated.valid, ...resultUpdates.valid]);
        } else {
          // Assume it's a single result with path as key
          Object.entries(resultUpdates.valid).forEach(([path, result]) => {
            updated.valid.set(path, result);
          });
        }
      }
      
      if (resultUpdates.invalid) {
        if (resultUpdates.invalid instanceof Map) {
          updated.invalid = new Map([...updated.invalid, ...resultUpdates.invalid]);
        } else {
          Object.entries(resultUpdates.invalid).forEach(([path, result]) => {
            updated.invalid.set(path, result);
          });
        }
      }
      
      if (resultUpdates.warnings) {
        if (resultUpdates.warnings instanceof Map) {
          updated.warnings = new Map([...updated.warnings, ...resultUpdates.warnings]);
        } else {
          Object.entries(resultUpdates.warnings).forEach(([path, warnings]) => {
            updated.warnings.set(path, warnings);
          });
        }
      }
      
      if (resultUpdates.errors) {
        if (Array.isArray(resultUpdates.errors)) {
          updated.errors = [...updated.errors, ...resultUpdates.errors];
        } else {
          updated.errors.push(resultUpdates.errors);
        }
      }
      
      if (resultUpdates.summary) {
        updated.summary = resultUpdates.summary;
      }
      
      return updated;
    });
  }, []);
  
  /**
   * Update metrics
   */
  const updateMetrics = useCallback((metricsData) => {
    if (!enableMetrics) return;
    
    setMetrics(prevMetrics => ({
      ...prevMetrics,
      ...metricsData
    }));
  }, [enableMetrics]);
  
  /**
   * Update cache statistics
   */
  const updateCacheStats = useCallback((stats) => {
    setCacheStats(prevStats => ({
      ...prevStats,
      ...stats
    }));
  }, []);
  
  /**
   * Update rules statistics
   */
  const updateRulesStats = useCallback((stats) => {
    setRulesStats(prevStats => ({
      ...prevStats,
      ...stats
    }));
  }, []);
  
  // ============================================================================
  // Validation Control Methods
  // ============================================================================
  
  /**
   * Start validation process
   */
  const startValidation = useCallback((totalNodes = 0) => {
    console.debug('useValidationState: Starting validation');
    
    updateValidationState({
      isRunning: true,
      isPaused: false,
      isCanceled: false,
      isCompleted: false,
      currentBatch: 0,
      error: null
    });
    
    updateProgress({
      totalNodes,
      processedNodes: 0,
      validNodes: 0,
      invalidNodes: 0,
      skippedNodes: 0,
      currentDepth: 0,
      percentComplete: 0,
      estimatedTimeRemaining: null,
      startTime: Date.now(),
      endTime: null
    });
    
    // Clear previous results
    setResults({
      valid: new Map(),
      invalid: new Map(),
      warnings: new Map(),
      errors: [],
      summary: null
    });
    
    // Reset metrics
    if (enableMetrics) {
      setMetrics({
        validationCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageValidationTime: 0,
        totalProcessingTime: 0,
        batchProcessingTimes: [],
        memoryUsage: []
      });
    }
    
    message.info('Validation started');
  }, [updateValidationState, updateProgress, enableMetrics]);
  
  /**
   * Pause validation
   */
  const pauseValidation = useCallback(() => {
    console.debug('useValidationState: Pausing validation');
    
    updateValidationState({ isPaused: true });
    message.info('Validation paused');
  }, [updateValidationState]);
  
  /**
   * Resume validation
   */
  const resumeValidation = useCallback(() => {
    console.debug('useValidationState: Resuming validation');
    
    updateValidationState({ isPaused: false });
    message.info('Validation resumed');
  }, [updateValidationState]);
  
  /**
   * Cancel validation
   */
  const cancelValidation = useCallback(() => {
    console.debug('useValidationState: Canceling validation');
    
    updateValidationState({
      isCanceled: true,
      isRunning: false,
      isPaused: false
    });
    
    updateProgress(prev => ({
      ...prev,
      endTime: Date.now()
    }));
    
    message.warning('Validation canceled');
  }, [updateValidationState, updateProgress]);
  
  /**
   * Complete validation
   */
  const completeValidation = useCallback((finalResults = null) => {
    console.debug('useValidationState: Completing validation');
    
    updateValidationState({
      isRunning: false,
      isPaused: false,
      isCanceled: false,
      isCompleted: true
    });
    
    updateProgress(prev => ({
      ...prev,
      endTime: Date.now()
    }));
    
    if (finalResults) {
      updateResults(finalResults);
    }
    
    // Add to result history
    if (maxResultHistory > 0) {
      setResultHistory(prevHistory => {
        const newEntry = {
          timestamp: Date.now(),
          summary: finalResults?.summary || null,
          progress: progress,
          metrics: metrics
        };
        
        const updatedHistory = [newEntry, ...prevHistory];
        return updatedHistory.slice(0, maxResultHistory);
      });
    }
    
    message.success('Validation completed');
  }, [updateValidationState, updateProgress, updateResults, progress, metrics, maxResultHistory]);
  
  /**
   * Set validation error
   */
  const setValidationError = useCallback((error) => {
    console.error('useValidationState: Validation error:', error);
    
    updateValidationState({
      error: error.message || String(error),
      isRunning: false,
      isPaused: false
    });
    
    message.error(`Validation error: ${error.message || String(error)}`);
  }, [updateValidationState]);
  
  // ============================================================================
  // Data Processing Methods
  // ============================================================================
  
  /**
   * Add validation result for a single node
   */
  const addValidationResult = useCallback((path, result) => {
    const resultUpdate = {};
    
    if (result.isValid) {
      resultUpdate.valid = { [path]: result };
    } else {
      resultUpdate.invalid = { [path]: result };
    }
    
    if (result.warnings && result.warnings.length > 0) {
      resultUpdate.warnings = { [path]: result.warnings };
    }
    
    updateResults(resultUpdate);
    
    // Update progress counters
    updateProgress(prev => ({
      ...prev,
      processedNodes: prev.processedNodes + 1,
      validNodes: result.isValid ? prev.validNodes + 1 : prev.validNodes,
      invalidNodes: !result.isValid ? prev.invalidNodes + 1 : prev.invalidNodes
    }));
  }, [updateResults, updateProgress]);
  
  /**
   * Add validation error
   */
  const addValidationError = useCallback((error) => {
    updateResults({
      errors: [{
        ...error,
        timestamp: Date.now()
      }]
    });
  }, [updateResults]);
  
  /**
   * Update batch progress
   */
  const updateBatchProgress = useCallback((batchInfo) => {
    updateValidationState({
      currentBatch: batchInfo.batchIndex || 0
    });
    
    if (enableMetrics && batchInfo.processingTime) {
      updateMetrics(prev => ({
        ...prev,
        batchProcessingTimes: [...prev.batchProcessingTimes, batchInfo.processingTime]
      }));
    }
  }, [updateValidationState, updateMetrics, enableMetrics]);
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  /**
   * Get validation summary
   */
  const getValidationSummary = useCallback(() => {
    return {
      state: validationState,
      progress: progress,
      results: {
        totalResults: results.valid.size + results.invalid.size,
        validCount: results.valid.size,
        invalidCount: results.invalid.size,
        warningCount: results.warnings.size,
        errorCount: results.errors.length
      },
      performance: {
        totalTime: progress.endTime && progress.startTime 
          ? progress.endTime - progress.startTime 
          : null,
        averageTimePerNode: progress.processedNodes > 0 && progress.startTime
          ? (Date.now() - progress.startTime) / progress.processedNodes
          : null,
        cacheHitRate: cacheStats.hitRate
      }
    };
  }, [validationState, progress, results, cacheStats]);
  
  /**
   * Get current statistics
   */
  const getStatistics = useCallback(() => {
    return {
      validation: {
        totalNodes: progress.totalNodes,
        processedNodes: progress.processedNodes,
        percentComplete: progress.percentComplete,
        isCompleted: validationState.isCompleted
      },
      results: {
        valid: results.valid.size,
        invalid: results.invalid.size,
        warnings: results.warnings.size,
        errors: results.errors.length
      },
      performance: metrics,
      cache: cacheStats,
      rules: rulesStats
    };
  }, [progress, validationState, results, metrics, cacheStats, rulesStats]);
  
  /**
   * Check if validation has results
   */
  const hasResults = progress.processedNodes > 0 || results.errors.length > 0;
  
  /**
   * Check if validation can be started
   */
  const canStart = !validationState.isRunning;
  
  /**
   * Check if validation can be paused
   */
  const canPause = validationState.isRunning && !validationState.isPaused;
  
  /**
   * Check if validation can be resumed
   */
  const canResume = validationState.isRunning && validationState.isPaused;
  
  /**
   * Check if validation can be canceled
   */
  const canCancel = validationState.isRunning;
  
  // ============================================================================
  // Cleanup and Reset
  // ============================================================================
  
  /**
   * Reset all validation state
   */
  const resetValidation = useCallback(() => {
    console.debug('useValidationState: Resetting validation state');
    
    // Clear timers
    if (progressUpdateTimer.current) {
      clearInterval(progressUpdateTimer.current);
      progressUpdateTimer.current = null;
    }
    
    // Reset all state
    setValidationState({
      isRunning: false,
      isPaused: false,
      isCanceled: false,
      isCompleted: false,
      currentBatch: 0,
      error: null
    });
    
    setProgress({
      totalNodes: 0,
      processedNodes: 0,
      validNodes: 0,
      invalidNodes: 0,
      skippedNodes: 0,
      currentDepth: 0,
      percentComplete: 0,
      estimatedTimeRemaining: null,
      startTime: null,
      endTime: null
    });
    
    setResults({
      valid: new Map(),
      invalid: new Map(),
      warnings: new Map(),
      errors: [],
      summary: null
    });
    
    if (enableMetrics) {
      setMetrics({
        validationCalls: 0,
        cacheHits: 0,
        cacheMisses: 0,
        averageValidationTime: 0,
        totalProcessingTime: 0,
        batchProcessingTimes: [],
        memoryUsage: []
      });
    }
    
    setCacheStats({
      hits: 0,
      misses: 0,
      hitRate: 0,
      currentSize: 0,
      maxSize: 0
    });
    
    setRulesStats({
      evaluations: 0,
      failures: 0,
      successRate: 0,
      topRules: []
    });
    
    // Execute cleanup callbacks
    cleanupCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn('useValidationState: Cleanup callback error:', error);
      }
    });
    cleanupCallbacks.current = [];
  }, [enableMetrics]);
  
  /**
   * Add cleanup callback
   */
  const addCleanupCallback = useCallback((callback) => {
    cleanupCallbacks.current.push(callback);
  }, []);
  
  // ============================================================================
  // Effects
  // ============================================================================
  
  // Auto-cleanup on unmount
  useEffect(() => {
    return () => {
      if (enableAutoCleanup) {
        resetValidation();
      }
    };
  }, [enableAutoCleanup, resetValidation]);
  
  // ============================================================================
  // Return API
  // ============================================================================
  
  return {
    // State
    state: validationState,
    progress,
    results,
    metrics: enableMetrics ? metrics : null,
    cacheStats,
    rulesStats,
    resultHistory: maxResultHistory > 0 ? resultHistory : null,
    
    // Control methods
    startValidation,
    pauseValidation,
    resumeValidation,
    cancelValidation,
    completeValidation,
    setValidationError,
    resetValidation,
    
    // Data methods
    updateProgress,
    updateResults,
    updateMetrics: enableMetrics ? updateMetrics : () => {},
    updateCacheStats,
    updateRulesStats,
    addValidationResult,
    addValidationError,
    updateBatchProgress,
    
    // Computed values
    getValidationSummary,
    getStatistics,
    hasResults,
    canStart,
    canPause,
    canResume,
    canCancel,
    
    // Utilities
    addCleanupCallback
  };
};