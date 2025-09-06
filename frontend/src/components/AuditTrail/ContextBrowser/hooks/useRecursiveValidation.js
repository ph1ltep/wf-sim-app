// frontend/src/components/AuditTrail/ContextBrowser/hooks/useRecursiveValidation.js

/**
 * @fileoverview Main API hook for recursive validation in the Context Browser.
 * Integrates with ScenarioContext and provides complete control methods for
 * starting, pausing, stopping, and managing recursive validation processes.
 */

import { useCallback, useRef, useEffect, useMemo } from 'react';
import { message } from 'antd';

import { useScenario } from '../../../../contexts/ScenarioContext';
import { ScenarioSchema } from '../../../../../schemas/yup/scenario';
import { RecursiveValidator } from '../utils/validationTraversal';
import { ValidationCache } from '../utils/validationCache';
import { ValidationRules } from '../utils/validationRules';
import { useValidationState } from './useValidationState';

/**
 * useRecursiveValidation - Main API hook for recursive validation
 * 
 * Features:
 * - Integration with ScenarioContext for data access
 * - Complete validation lifecycle management
 * - Control methods (start/pause/resume/stop/clear)
 * - Results management and filtering
 * - Performance optimization with caching
 * - Configurable validation rules and parameters
 * - Real-time progress tracking
 */
export const useRecursiveValidation = (options = {}) => {
  const {
    // Validation configuration
    schema = ScenarioSchema,
    enableCache = true,
    enableRules = true,
    batchSize = 50,
    maxDepth = 20,
    batchDelayMs = 10,
    
    // Cache configuration
    cacheMaxSize = 1000,
    cacheTtlMs = 5 * 60 * 1000, // 5 minutes
    
    // Performance options
    enableMetrics = true,
    enableAutoCleanup = true,
    progressUpdateInterval = 100,
    
    // Result management
    maxResultHistory = 5,
    autoStartOnDataChange = false,
    
    // Event callbacks
    onValidationStart = null,
    onValidationComplete = null,
    onValidationError = null,
    onProgressUpdate = null
  } = options;
  
  // Get scenario context
  const { scenarioData, loading: contextLoading } = useScenario();
  
  // Validation state management
  const validationState = useValidationState({
    enableMetrics,
    enableAutoCleanup,
    maxResultHistory,
    progressUpdateInterval
  });
  
  // Refs for persistent instances
  const validatorRef = useRef(null);
  const cacheRef = useRef(null);
  const rulesRef = useRef(null);
  const lastValidationId = useRef(0);
  
  // Initialize validator instances
  const initializeInstances = useCallback(() => {
    if (!cacheRef.current && enableCache) {
      cacheRef.current = new ValidationCache({
        maxSize: cacheMaxSize,
        ttlMs: cacheTtlMs,
        enableStats: enableMetrics
      });
      
      validationState.addCleanupCallback(() => {
        if (cacheRef.current) {
          cacheRef.current.destroy();
          cacheRef.current = null;
        }
      });
    }
    
    if (!rulesRef.current && enableRules) {
      rulesRef.current = new ValidationRules();
    }
    
    if (!validatorRef.current) {
      validatorRef.current = new RecursiveValidator({
        schema,
        cache: cacheRef.current,
        rules: rulesRef.current,
        batchSize,
        maxDepth,
        batchDelayMs
      });
      
      // Set up validator callbacks
      validatorRef.current.on('progress', (progressData) => {
        validationState.updateProgress(progressData);
        if (onProgressUpdate) {
          onProgressUpdate(progressData);
        }
      });
      
      validatorRef.current.on('batchComplete', (batchInfo) => {
        validationState.updateBatchProgress(batchInfo);
      });
      
      validatorRef.current.on('validationResult', ({ node, result }) => {
        validationState.addValidationResult(node.path, result);
      });
      
      validatorRef.current.on('error', (errorInfo) => {
        validationState.addValidationError(errorInfo);
      });
    }
  }, [
    schema, enableCache, enableRules, enableMetrics, batchSize, maxDepth, 
    batchDelayMs, cacheMaxSize, cacheTtlMs, validationState, onProgressUpdate
  ]);
  
  // ============================================================================
  // Control Methods
  // ============================================================================
  
  /**
   * Start recursive validation
   */
  const startValidation = useCallback(async (customData = null, customRootPath = '') => {
    if (!scenarioData && !customData) {
      message.warning('No scenario data available for validation');
      return false;
    }
    
    if (contextLoading) {
      message.warning('Please wait for scenario data to finish loading');
      return false;
    }
    
    if (!validationState.canStart) {
      message.warning('Validation is already running');
      return false;
    }
    
    try {
      // Initialize instances if needed
      initializeInstances();
      
      const dataToValidate = customData || scenarioData;
      const rootPath = customRootPath;
      
      // Generate unique validation ID
      const validationId = ++lastValidationId.current;
      
      console.debug(`useRecursiveValidation: Starting validation ${validationId}`);
      
      // Estimate total nodes for progress tracking
      const estimatedNodes = estimateNodeCount(dataToValidate);
      
      // Start validation state
      validationState.startValidation(estimatedNodes);
      
      // Callback notification
      if (onValidationStart) {
        onValidationStart({ validationId, totalNodes: estimatedNodes });
      }
      
      // Start validator
      const results = await validatorRef.current.validate(dataToValidate, rootPath, {
        parentObject: dataToValidate,
        validationId
      });
      
      // Complete validation
      validationState.completeValidation(results);
      
      // Update cache and rules stats
      if (enableCache && cacheRef.current) {
        validationState.updateCacheStats(cacheRef.current.getStats());
      }
      
      if (enableRules && rulesRef.current) {
        validationState.updateRulesStats(rulesRef.current.getStats());
      }
      
      // Update metrics
      if (enableMetrics) {
        validationState.updateMetrics(results.metrics);
      }
      
      console.debug(`useRecursiveValidation: Validation ${validationId} completed`, results.summary);
      
      // Callback notification
      if (onValidationComplete) {
        onValidationComplete({ validationId, results });
      }
      
      return true;
      
    } catch (error) {
      console.error('useRecursiveValidation: Validation failed:', error);
      
      validationState.setValidationError(error);
      
      if (onValidationError) {
        onValidationError(error);
      }
      
      return false;
    }
  }, [
    scenarioData, contextLoading, validationState, initializeInstances,
    onValidationStart, onValidationComplete, onValidationError,
    enableCache, enableRules, enableMetrics
  ]);
  
  /**
   * Pause validation
   */
  const pauseValidation = useCallback(() => {
    if (!validationState.canPause) {
      message.warning('Cannot pause validation in current state');
      return false;
    }
    
    if (validatorRef.current) {
      validatorRef.current.pause();
    }
    
    validationState.pauseValidation();
    return true;
  }, [validationState]);
  
  /**
   * Resume validation
   */
  const resumeValidation = useCallback(() => {
    if (!validationState.canResume) {
      message.warning('Cannot resume validation in current state');
      return false;
    }
    
    if (validatorRef.current) {
      validatorRef.current.resume();
    }
    
    validationState.resumeValidation();
    return true;
  }, [validationState]);
  
  /**
   * Cancel validation
   */
  const cancelValidation = useCallback(() => {
    if (!validationState.canCancel) {
      message.warning('Cannot cancel validation in current state');
      return false;
    }
    
    if (validatorRef.current) {
      validatorRef.current.cancel();
    }
    
    validationState.cancelValidation();
    return true;
  }, [validationState]);
  
  /**
   * Clear validation results and reset state
   */
  const clearValidation = useCallback(() => {
    // Cancel if running
    if (validationState.state.isRunning) {
      cancelValidation();
    }
    
    // Reset validator
    if (validatorRef.current) {
      validatorRef.current.reset();
    }
    
    // Reset state
    validationState.resetValidation();
    
    message.info('Validation results cleared');
  }, [validationState, cancelValidation]);
  
  // ============================================================================
  // Result Access Methods
  // ============================================================================
  
  /**
   * Get validation results filtered by criteria
   */
  const getResults = useCallback((filters = {}) => {
    const {
      includeValid = true,
      includeInvalid = true,
      includeWarnings = true,
      pathPattern = null,
      typeFilter = null,
      limitResults = null
    } = filters;
    
    const results = {
      valid: new Map(),
      invalid: new Map(),
      warnings: new Map(),
      errors: [...validationState.results.errors],
      summary: validationState.results.summary
    };
    
    // Apply filters and collect results
    if (includeValid) {
      validationState.results.valid.forEach((result, path) => {
        if (matchesFilters(path, result, { pathPattern, typeFilter })) {
          results.valid.set(path, result);
        }
      });
    }
    
    if (includeInvalid) {
      validationState.results.invalid.forEach((result, path) => {
        if (matchesFilters(path, result, { pathPattern, typeFilter })) {
          results.invalid.set(path, result);
        }
      });
    }
    
    if (includeWarnings) {
      validationState.results.warnings.forEach((warnings, path) => {
        if (matchesFilters(path, { warnings }, { pathPattern, typeFilter: null })) {
          results.warnings.set(path, warnings);
        }
      });
    }
    
    // Apply result limit
    if (limitResults && limitResults > 0) {
      results.valid = new Map(Array.from(results.valid).slice(0, limitResults));
      results.invalid = new Map(Array.from(results.invalid).slice(0, limitResults));
      results.warnings = new Map(Array.from(results.warnings).slice(0, limitResults));
    }
    
    return results;
  }, [validationState.results]);
  
  /**
   * Get validation result for specific path
   */
  const getResultForPath = useCallback((path) => {
    // Check in valid results
    if (validationState.results.valid.has(path)) {
      return {
        result: validationState.results.valid.get(path),
        type: 'valid'
      };
    }
    
    // Check in invalid results
    if (validationState.results.invalid.has(path)) {
      return {
        result: validationState.results.invalid.get(path),
        type: 'invalid'
      };
    }
    
    // Check warnings
    if (validationState.results.warnings.has(path)) {
      return {
        result: {
          path,
          warnings: validationState.results.warnings.get(path)
        },
        type: 'warning'
      };
    }
    
    return null;
  }, [validationState.results]);
  
  /**
   * Get validation statistics
   */
  const getValidationStats = useCallback(() => {
    return validationState.getStatistics();
  }, [validationState]);
  
  /**
   * Get validation summary
   */
  const getValidationSummary = useCallback(() => {
    return validationState.getValidationSummary();
  }, [validationState]);
  
  // ============================================================================
  // Cache and Rules Management
  // ============================================================================
  
  /**
   * Clear validation cache
   */
  const clearCache = useCallback(() => {
    if (cacheRef.current) {
      cacheRef.current.clear();
      validationState.updateCacheStats(cacheRef.current.getStats());
      message.info('Validation cache cleared');
    }
  }, [validationState]);
  
  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(() => {
    return cacheRef.current ? cacheRef.current.getStats() : null;
  }, []);
  
  /**
   * Configure validation rules
   */
  const configureRules = useCallback((ruleConfig) => {
    if (!rulesRef.current) return false;
    
    const { category, name, enabled } = ruleConfig;
    
    if (category && name && typeof enabled === 'boolean') {
      rulesRef.current.setRuleEnabled(category, name, enabled);
      message.info(`Rule ${category}/${name} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    
    return false;
  }, []);
  
  /**
   * Get available rules
   */
  const getAvailableRules = useCallback(() => {
    return rulesRef.current ? rulesRef.current.getAllRules() : null;
  }, []);
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  // Current validation state
  const isValidating = validationState.state.isRunning;
  const isPaused = validationState.state.isPaused;
  const isCompleted = validationState.state.isCompleted;
  const hasError = !!validationState.state.error;
  const hasResults = validationState.hasResults;
  
  // Progress information
  const progressInfo = useMemo(() => ({
    ...validationState.progress,
    isValidating,
    isPaused,
    isCompleted
  }), [validationState.progress, isValidating, isPaused, isCompleted]);
  
  // Control availability
  const canStart = validationState.canStart && !contextLoading;
  const canPause = validationState.canPause;
  const canResume = validationState.canResume;
  const canCancel = validationState.canCancel;
  
  // Result counts
  const resultCounts = useMemo(() => ({
    total: validationState.results.valid.size + validationState.results.invalid.size,
    valid: validationState.results.valid.size,
    invalid: validationState.results.invalid.size,
    warnings: validationState.results.warnings.size,
    errors: validationState.results.errors.length
  }), [validationState.results]);
  
  // ============================================================================
  // Auto-start Effect
  // ============================================================================
  
  useEffect(() => {
    if (autoStartOnDataChange && scenarioData && !contextLoading && canStart) {
      console.debug('useRecursiveValidation: Auto-starting validation due to data change');
      startValidation();
    }
  }, [scenarioData, contextLoading, autoStartOnDataChange, canStart, startValidation]);
  
  // ============================================================================
  // Utility Functions
  // ============================================================================
  
  /**
   * Check if path and result match filters
   */
  const matchesFilters = (path, result, { pathPattern, typeFilter }) => {
    if (pathPattern && !path.includes(pathPattern)) {
      return false;
    }
    
    if (typeFilter && result.type !== typeFilter) {
      return false;
    }
    
    return true;
  };
  
  /**
   * Estimate node count for progress tracking
   */
  const estimateNodeCount = (data, depth = 0, maxDepth = 3) => {
    if (depth > maxDepth || data === null || data === undefined) {
      return 1;
    }
    
    let count = 1;
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        count += data.reduce((sum, item) => sum + estimateNodeCount(item, depth + 1, maxDepth), 0);
      } else {
        count += Object.values(data).reduce((sum, value) => sum + estimateNodeCount(value, depth + 1, maxDepth), 0);
      }
    }
    
    return count;
  };
  
  // ============================================================================
  // Return API
  // ============================================================================
  
  return {
    // Control methods
    startValidation,
    pauseValidation,
    resumeValidation,
    cancelValidation,
    clearValidation,
    
    // Result access
    getResults,
    getResultForPath,
    getValidationStats,
    getValidationSummary,
    
    // Cache management
    clearCache,
    getCacheStats,
    
    // Rules management
    configureRules,
    getAvailableRules,
    
    // State information
    state: validationState.state,
    progress: progressInfo,
    resultCounts,
    
    // Computed flags
    isValidating,
    isPaused,
    isCompleted,
    hasError,
    hasResults,
    canStart,
    canPause,
    canResume,
    canCancel,
    
    // Raw access (for advanced usage)
    results: validationState.results,
    metrics: validationState.metrics,
    cacheStats: validationState.cacheStats,
    rulesStats: validationState.rulesStats,
    resultHistory: validationState.resultHistory,
    
    // Context information
    hasScenarioData: !!scenarioData,
    isContextLoading: contextLoading
  };
};