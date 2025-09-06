// frontend/src/components/AuditTrail/ContextBrowser/validation/index.js

/**
 * @fileoverview Main exports for Context Browser recursive validation system.
 * Provides easy access to all validation utilities, hooks, and components.
 */

// Core validation utilities
export { ValidationCache, defaultValidationCache } from '../utils/validationCache';
export { ValidationRules, defaultValidationRules } from '../utils/validationRules';
export { RecursiveValidator } from '../utils/validationTraversal';

// React hooks
export { useValidationState } from '../hooks/useValidationState';
export { useRecursiveValidation } from '../hooks/useRecursiveValidation';

/**
 * Quick start configuration for typical use cases
 */
export const ValidationPresets = {
  /**
   * Default configuration for most use cases
   */
  default: {
    enableCache: true,
    enableRules: true,
    enableMetrics: true,
    batchSize: 50,
    maxDepth: 20,
    batchDelayMs: 10,
    cacheMaxSize: 1000,
    cacheTtlMs: 5 * 60 * 1000, // 5 minutes
    progressUpdateInterval: 100
  },
  
  /**
   * High-performance configuration for large datasets
   */
  performance: {
    enableCache: true,
    enableRules: true,
    enableMetrics: false, // Disabled for performance
    batchSize: 100, // Larger batches
    maxDepth: 15, // Reduced depth limit
    batchDelayMs: 5, // Shorter delays
    cacheMaxSize: 2000, // Larger cache
    cacheTtlMs: 10 * 60 * 1000, // 10 minutes
    progressUpdateInterval: 200 // Less frequent updates
  },
  
  /**
   * Development configuration with detailed logging
   */
  development: {
    enableCache: true,
    enableRules: true,
    enableMetrics: true,
    batchSize: 25, // Smaller batches for easier debugging
    maxDepth: 25, // Higher depth limit
    batchDelayMs: 50, // Longer delays for observation
    cacheMaxSize: 500,
    cacheTtlMs: 2 * 60 * 1000, // 2 minutes
    progressUpdateInterval: 50, // More frequent updates
    autoStartOnDataChange: false, // Manual control
    maxResultHistory: 10 // Keep more history
  },
  
  /**
   * Minimal configuration for basic validation
   */
  minimal: {
    enableCache: false,
    enableRules: false,
    enableMetrics: false,
    batchSize: 50,
    maxDepth: 10,
    batchDelayMs: 0,
    progressUpdateInterval: 500
  }
};