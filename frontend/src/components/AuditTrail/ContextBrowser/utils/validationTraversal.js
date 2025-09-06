// frontend/src/components/AuditTrail/ContextBrowser/utils/validationTraversal.js

/**
 * @fileoverview Core recursive tree traversal algorithm for Context Browser validation.
 * Integrates with existing validatePath function and provides batch processing,
 * progress tracking, and pause/resume/cancel functionality.
 */

import { validatePath } from '../../../../utils/validate';
import { getValueType } from './contextUtils';
import { defaultValidationCache } from './validationCache';
import { defaultValidationRules } from './validationRules';

/**
 * RecursiveValidator - Core recursive tree traversal algorithm
 * 
 * Features:
 * - Integration with existing validatePath function
 * - Batch processing with configurable batch sizes
 * - Progress tracking and metrics
 * - Pause/resume/cancel functionality
 * - Memory-efficient traversal for large datasets
 * - Comprehensive error handling and recovery
 */
export class RecursiveValidator {
  /**
   * @param {Object} options - Validator configuration
   * @param {Object} options.schema - Yup schema for validation
   * @param {Object} options.cache - Validation cache instance
   * @param {Object} options.rules - Validation rules instance
   * @param {number} options.batchSize - Number of validations per batch (default: 50)
   * @param {number} options.maxDepth - Maximum recursion depth (default: 20)
   * @param {number} options.batchDelayMs - Delay between batches in ms (default: 10)
   */
  constructor(options = {}) {
    this.schema = options.schema;
    this.cache = options.cache || defaultValidationCache;
    this.rules = options.rules || defaultValidationRules;
    this.batchSize = options.batchSize || 50;
    this.maxDepth = options.maxDepth || 20;
    this.batchDelayMs = options.batchDelayMs || 10;
    
    // Validation state
    this.isRunning = false;
    this.isPaused = false;
    this.isCanceled = false;
    this.currentBatch = 0;
    
    // Progress tracking
    this.progress = {
      totalNodes: 0,
      processedNodes: 0,
      validNodes: 0,
      invalidNodes: 0,
      skippedNodes: 0,
      currentDepth: 0,
      startTime: null,
      endTime: null,
      estimatedTimeRemaining: null
    };
    
    // Results collection
    this.results = {
      valid: new Map(),
      invalid: new Map(),
      warnings: new Map(),
      errors: [],
      summary: null
    };
    
    // Performance metrics
    this.metrics = {
      validationCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageValidationTime: 0,
      batchProcessingTimes: [],
      memoryUsage: []
    };
    
    // Event callbacks
    this.callbacks = {
      onProgress: null,
      onBatchComplete: null,
      onValidationResult: null,
      onComplete: null,
      onError: null,
      onPause: null,
      onResume: null,
      onCancel: null
    };
  }
  
  /**
   * Set event callback
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
    }
  }
  
  /**
   * Start recursive validation of data tree
   * @param {Object} data - Data object to validate recursively
   * @param {string} rootPath - Root path for validation (default: '')
   * @param {Object} context - Additional validation context
   * @returns {Promise<Object>} Validation results
   */
  async validate(data, rootPath = '', context = {}) {
    if (this.isRunning) {
      throw new Error('Validation already in progress. Use pause/resume or cancel first.');
    }
    
    try {
      this.initializeValidation(data, rootPath, context);
      
      // Build traversal queue
      const queue = this.buildTraversalQueue(data, rootPath);
      
      // Process validation queue
      await this.processValidationQueue(queue, context);
      
      // Finalize results
      this.finalizeValidation();
      
      return this.getResults();
      
    } catch (error) {
      this.handleValidationError(error);
      throw error;
    }
  }
  
  /**
   * Initialize validation state
   * @private
   */
  initializeValidation(data, rootPath, context) {
    this.isRunning = true;
    this.isPaused = false;
    this.isCanceled = false;
    this.currentBatch = 0;
    
    // Reset progress
    this.progress = {
      totalNodes: this.estimateNodeCount(data),
      processedNodes: 0,
      validNodes: 0,
      invalidNodes: 0,
      skippedNodes: 0,
      currentDepth: 0,
      startTime: Date.now(),
      endTime: null,
      estimatedTimeRemaining: null
    };
    
    // Clear previous results
    this.results = {
      valid: new Map(),
      invalid: new Map(),
      warnings: new Map(),
      errors: [],
      summary: null
    };
    
    // Reset metrics
    this.metrics = {
      validationCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageValidationTime: 0,
      batchProcessingTimes: [],
      memoryUsage: []
    };
    
    console.debug(`RecursiveValidator: Starting validation of ${this.progress.totalNodes} estimated nodes`);
  }
  
  /**
   * Build queue of nodes to validate
   * @private
   */
  buildTraversalQueue(data, rootPath = '', depth = 0) {
    const queue = [];
    
    const traverse = (obj, path, currentDepth) => {
      // Depth limit check
      if (currentDepth > this.maxDepth) {
        console.warn(`RecursiveValidator: Maximum depth ${this.maxDepth} reached at path: ${path}`);
        return;
      }
      
      if (obj === null || obj === undefined) {
        queue.push({
          path,
          value: obj,
          type: obj === null ? 'null' : 'undefined',
          depth: currentDepth,
          isLeaf: true
        });
        return;
      }
      
      const valueType = getValueType(obj);
      
      // Add current node to queue
      queue.push({
        path,
        value: obj,
        type: valueType.type,
        depth: currentDepth,
        isLeaf: !['object', 'array'].includes(valueType.type)
      });
      
      // Recursively process children for objects and arrays
      if (valueType.type === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
          const childPath = path ? `${path}.${key}` : key;
          traverse(value, childPath, currentDepth + 1);
        });
      } else if (valueType.type === 'array' && Array.isArray(obj)) {
        obj.forEach((value, index) => {
          const childPath = `${path}.${index}`;
          traverse(value, childPath, currentDepth + 1);
        });
      }
    };
    
    traverse(data, rootPath, depth);
    
    // Sort queue by depth for breadth-first processing
    queue.sort((a, b) => a.depth - b.depth);
    
    console.debug(`RecursiveValidator: Built traversal queue with ${queue.length} nodes`);
    return queue;
  }
  
  /**
   * Process validation queue in batches
   * @private
   */
  async processValidationQueue(queue, context) {
    const batches = this.createBatches(queue);
    
    for (let i = 0; i < batches.length; i++) {
      if (this.isCanceled) {
        console.debug('RecursiveValidator: Validation canceled');
        break;
      }
      
      // Handle pause state
      while (this.isPaused && !this.isCanceled) {
        await this.sleep(100);
      }
      
      this.currentBatch = i;
      const batch = batches[i];
      
      const batchStartTime = Date.now();
      
      // Process batch
      await this.processBatch(batch, context);
      
      const batchEndTime = Date.now();
      const batchTime = batchEndTime - batchStartTime;
      this.metrics.batchProcessingTimes.push(batchTime);
      
      // Update progress
      this.updateProgress();
      
      // Call progress callback
      if (this.callbacks.onProgress) {
        this.callbacks.onProgress(this.getProgressSnapshot());
      }
      
      // Call batch complete callback
      if (this.callbacks.onBatchComplete) {
        this.callbacks.onBatchComplete({
          batchIndex: i,
          totalBatches: batches.length,
          batchSize: batch.length,
          processingTime: batchTime
        });
      }
      
      // Add delay between batches to prevent UI blocking
      if (i < batches.length - 1 && this.batchDelayMs > 0) {
        await this.sleep(this.batchDelayMs);
      }
      
      // Track memory usage periodically
      if (i % 10 === 0) {
        this.trackMemoryUsage();
      }
    }
  }
  
  /**
   * Create batches from queue
   * @private
   */
  createBatches(queue) {
    const batches = [];
    for (let i = 0; i < queue.length; i += this.batchSize) {
      batches.push(queue.slice(i, i + this.batchSize));
    }
    return batches;
  }
  
  /**
   * Process a single batch of validations
   * @private
   */
  async processBatch(batch, context) {
    const validationPromises = batch.map(node => this.validateNode(node, context));
    
    try {
      const batchResults = await Promise.allSettled(validationPromises);
      
      batchResults.forEach((result, index) => {
        const node = batch[index];
        
        if (result.status === 'fulfilled') {
          this.handleValidationResult(node, result.value);
        } else {
          this.handleValidationError(result.reason, node);
        }
      });
      
    } catch (error) {
      console.error('RecursiveValidator: Batch processing error:', error);
      this.results.errors.push({
        type: 'batch_error',
        message: error.message,
        batch: this.currentBatch,
        timestamp: Date.now()
      });
    }
  }
  
  /**
   * Validate a single node
   * @private
   */
  async validateNode(node, context) {
    const { path, value, type } = node;
    
    this.metrics.validationCalls++;
    
    try {
      // Check cache first
      const cacheKey = this.cache.generateKey(path, this.getSchemaHash());
      
      if (this.cache.has(cacheKey)) {
        this.metrics.cacheHits++;
        const cachedResult = this.cache.get(cacheKey);
        return { ...cachedResult, fromCache: true };
      }
      
      this.metrics.cacheMisses++;
      
      const validationStartTime = Date.now();
      
      // Perform Yup validation if schema is available
      let yupResult = null;
      if (this.schema && path) {
        try {
          yupResult = await validatePath(this.schema, path, value, context.parentObject);
        } catch (error) {
          console.warn(`RecursiveValidator: Yup validation failed for ${path}:`, error);
          yupResult = {
            isValid: false,
            errors: [error.message],
            details: { method: 'error' }
          };
        }
      }
      
      // Apply validation rules
      const rulesContext = {
        ...context,
        yupResult,
        isRequired: this.isRequiredPath(path),
        parentPath: this.getParentPath(path),
        isDistribution: this.isDistributionPath(path)
      };
      
      const rulesResult = this.rules.evaluateRules(path, value, type, rulesContext);
      
      const validationEndTime = Date.now();
      const validationTime = validationEndTime - validationStartTime;
      this.updateAverageValidationTime(validationTime);
      
      // Combine results
      const combinedResult = this.combineValidationResults(yupResult, rulesResult, node);
      
      // Cache the result
      this.cache.set(cacheKey, combinedResult);
      
      return combinedResult;
      
    } catch (error) {
      console.error(`RecursiveValidator: Node validation error for ${path}:`, error);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        warnings: [],
        path,
        type,
        timestamp: Date.now(),
        validationError: error.message
      };
    }
  }
  
  /**
   * Combine Yup and rules validation results
   * @private
   */
  combineValidationResults(yupResult, rulesResult, node) {
    const { path, value, type } = node;
    
    // Start with rules result as base
    const combined = {
      isValid: rulesResult.isValid,
      errors: [...rulesResult.errors],
      warnings: [...rulesResult.warnings],
      path,
      value,
      type,
      timestamp: Date.now(),
      appliedRules: rulesResult.appliedRules,
      skippedRules: rulesResult.skippedRules,
      ruleDetails: rulesResult.ruleDetails
    };
    
    // Integrate Yup results if available
    if (yupResult) {
      // If Yup validation failed, mark combined as invalid
      if (!yupResult.isValid) {
        combined.isValid = false;
      }
      
      // Add Yup errors
      if (yupResult.errors && yupResult.errors.length > 0) {
        combined.errors.push(...yupResult.errors);
      }
      
      // Add Yup details
      combined.yupValidation = {
        isValid: yupResult.isValid,
        errors: yupResult.errors || [],
        details: yupResult.details || {}
      };
      
      // Include schema validation method
      if (yupResult.details && yupResult.details.method) {
        combined.validationMethod = yupResult.details.method;
      }
    } else {
      combined.yupValidation = null;
    }
    
    return combined;
  }
  
  /**
   * Handle validation result for a node
   * @private
   */
  handleValidationResult(node, result) {
    const { path } = node;
    
    // Store result in appropriate collection
    if (result.isValid) {
      this.results.valid.set(path, result);
      this.progress.validNodes++;
    } else {
      this.results.invalid.set(path, result);
      this.progress.invalidNodes++;
    }
    
    // Store warnings separately if present
    if (result.warnings && result.warnings.length > 0) {
      this.results.warnings.set(path, result.warnings);
    }
    
    this.progress.processedNodes++;
    
    // Update current depth tracking
    if (node.depth > this.progress.currentDepth) {
      this.progress.currentDepth = node.depth;
    }
    
    // Call validation result callback
    if (this.callbacks.onValidationResult) {
      this.callbacks.onValidationResult({ node, result });
    }
  }
  
  /**
   * Handle validation error
   * @private
   */
  handleValidationError(error, node = null) {
    const errorInfo = {
      type: 'validation_error',
      message: error.message || String(error),
      node: node ? {
        path: node.path,
        type: node.type,
        depth: node.depth
      } : null,
      timestamp: Date.now(),
      stack: error.stack
    };
    
    this.results.errors.push(errorInfo);
    
    if (node) {
      this.progress.skippedNodes++;
      this.progress.processedNodes++;
    }
    
    // Call error callback
    if (this.callbacks.onError) {
      this.callbacks.onError(errorInfo);
    }
  }
  
  /**
   * Update progress metrics
   * @private
   */
  updateProgress() {
    const now = Date.now();
    const elapsed = now - this.progress.startTime;
    
    if (this.progress.processedNodes > 0) {
      const avgTimePerNode = elapsed / this.progress.processedNodes;
      const remainingNodes = this.progress.totalNodes - this.progress.processedNodes;
      this.progress.estimatedTimeRemaining = remainingNodes * avgTimePerNode;
    }
  }
  
  /**
   * Update average validation time
   * @private
   */
  updateAverageValidationTime(newTime) {
    const currentAvg = this.metrics.averageValidationTime;
    const totalCalls = this.metrics.validationCalls;
    
    this.metrics.averageValidationTime = 
      (currentAvg * (totalCalls - 1) + newTime) / totalCalls;
  }
  
  /**
   * Track memory usage
   * @private
   */
  trackMemoryUsage() {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        batch: this.currentBatch
      });
    }
  }
  
  /**
   * Finalize validation process
   * @private
   */
  finalizeValidation() {
    this.progress.endTime = Date.now();
    this.isRunning = false;
    
    // Generate summary
    this.results.summary = this.generateSummary();
    
    console.debug('RecursiveValidator: Validation completed', this.results.summary);
    
    // Call completion callback
    if (this.callbacks.onComplete) {
      this.callbacks.onComplete(this.getResults());
    }
  }
  
  /**
   * Generate validation summary
   * @private
   */
  generateSummary() {
    const totalTime = this.progress.endTime - this.progress.startTime;
    
    return {
      totalNodes: this.progress.totalNodes,
      processedNodes: this.progress.processedNodes,
      validNodes: this.progress.validNodes,
      invalidNodes: this.progress.invalidNodes,
      skippedNodes: this.progress.skippedNodes,
      warningCount: this.results.warnings.size,
      errorCount: this.results.errors.length,
      maxDepth: this.progress.currentDepth,
      processingTime: totalTime,
      averageTimePerNode: this.progress.processedNodes > 0 
        ? totalTime / this.progress.processedNodes 
        : 0,
      cacheHitRate: this.metrics.validationCalls > 0 
        ? (this.metrics.cacheHits / this.metrics.validationCalls) * 100 
        : 0,
      batchCount: this.currentBatch + 1,
      averageBatchTime: this.metrics.batchProcessingTimes.length > 0 
        ? this.metrics.batchProcessingTimes.reduce((a, b) => a + b, 0) / this.metrics.batchProcessingTimes.length 
        : 0
    };
  }
  
  // ============================================================================
  // Control Methods
  // ============================================================================
  
  /**
   * Pause validation process
   */
  pause() {
    if (this.isRunning && !this.isPaused) {
      this.isPaused = true;
      console.debug('RecursiveValidator: Validation paused');
      
      if (this.callbacks.onPause) {
        this.callbacks.onPause(this.getProgressSnapshot());
      }
    }
  }
  
  /**
   * Resume paused validation
   */
  resume() {
    if (this.isRunning && this.isPaused) {
      this.isPaused = false;
      console.debug('RecursiveValidator: Validation resumed');
      
      if (this.callbacks.onResume) {
        this.callbacks.onResume(this.getProgressSnapshot());
      }
    }
  }
  
  /**
   * Cancel validation process
   */
  cancel() {
    if (this.isRunning) {
      this.isCanceled = true;
      this.isRunning = false;
      this.isPaused = false;
      
      console.debug('RecursiveValidator: Validation canceled');
      
      // Generate partial summary
      this.progress.endTime = Date.now();
      this.results.summary = this.generateSummary();
      
      if (this.callbacks.onCancel) {
        this.callbacks.onCancel(this.getResults());
      }
    }
  }
  
  // ============================================================================
  // Utility Methods
  // ============================================================================
  
  /**
   * Estimate node count for progress tracking
   * @private
   */
  estimateNodeCount(data, depth = 0, maxSampleDepth = 3) {
    if (depth > maxSampleDepth || data === null || data === undefined) {
      return 1;
    }
    
    let count = 1; // Current node
    
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        // Sample first few array elements for estimation
        const sampleSize = Math.min(data.length, 5);
        let avgChildCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
          avgChildCount += this.estimateNodeCount(data[i], depth + 1, maxSampleDepth);
        }
        
        if (sampleSize > 0) {
          avgChildCount = avgChildCount / sampleSize;
          count += avgChildCount * data.length;
        }
      } else {
        // Sample object properties
        const keys = Object.keys(data);
        const sampleSize = Math.min(keys.length, 5);
        let avgChildCount = 0;
        
        for (let i = 0; i < sampleSize; i++) {
          avgChildCount += this.estimateNodeCount(data[keys[i]], depth + 1, maxSampleDepth);
        }
        
        if (sampleSize > 0) {
          avgChildCount = avgChildCount / sampleSize;
          count += avgChildCount * keys.length;
        }
      }
    }
    
    return Math.round(count);
  }
  
  /**
   * Get schema hash for cache invalidation
   * @private
   */
  getSchemaHash() {
    // Simple hash based on schema presence
    // In a real implementation, you might want to hash actual schema structure
    return this.schema ? 'with-schema' : 'no-schema';
  }
  
  /**
   * Check if path is required based on schema
   * @private
   */
  isRequiredPath(path) {
    // This would need to be implemented based on actual schema structure
    // For now, return false as default
    return false;
  }
  
  /**
   * Get parent path
   * @private
   */
  getParentPath(path) {
    const parts = path.split('.');
    return parts.length > 1 ? parts.slice(0, -1).join('.') : '';
  }
  
  /**
   * Check if path represents a distribution
   * @private
   */
  isDistributionPath(path) {
    return path.includes('distribution') || path.includes('parameters');
  }
  
  /**
   * Sleep utility for async delays
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // ============================================================================
  // Public API Methods
  // ============================================================================
  
  /**
   * Get current progress snapshot
   * @returns {Object} Current progress information
   */
  getProgressSnapshot() {
    return {
      ...this.progress,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isCanceled: this.isCanceled,
      currentBatch: this.currentBatch,
      percentComplete: this.progress.totalNodes > 0 
        ? (this.progress.processedNodes / this.progress.totalNodes) * 100 
        : 0
    };
  }
  
  /**
   * Get validation results
   * @returns {Object} Complete validation results
   */
  getResults() {
    return {
      ...this.results,
      progress: this.getProgressSnapshot(),
      metrics: { ...this.metrics },
      cacheStats: this.cache.getStats(),
      rulesStats: this.rules.getStats()
    };
  }
  
  /**
   * Get validation state
   * @returns {Object} Current validation state
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isCanceled: this.isCanceled,
      progress: this.getProgressSnapshot(),
      hasResults: this.progress.processedNodes > 0
    };
  }
  
  /**
   * Clear all results and reset state
   */
  reset() {
    if (this.isRunning) {
      this.cancel();
    }
    
    // Reset all state
    this.progress = {
      totalNodes: 0,
      processedNodes: 0,
      validNodes: 0,
      invalidNodes: 0,
      skippedNodes: 0,
      currentDepth: 0,
      startTime: null,
      endTime: null,
      estimatedTimeRemaining: null
    };
    
    this.results = {
      valid: new Map(),
      invalid: new Map(),
      warnings: new Map(),
      errors: [],
      summary: null
    };
    
    this.metrics = {
      validationCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageValidationTime: 0,
      batchProcessingTimes: [],
      memoryUsage: []
    };
    
    // Optionally clear cache
    this.cache.clear();
    
    console.debug('RecursiveValidator: State reset');
  }
}