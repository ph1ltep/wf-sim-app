// frontend/src/components/AuditTrail/ContextBrowser/utils/validationCache.js

/**
 * @fileoverview LRU cache with TTL support for validation results.
 * Provides efficient caching of validation results to avoid redundant validations
 * during recursive tree traversal in the Context Browser.
 */

/**
 * ValidationCache - LRU cache with TTL for validation results
 * 
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) support for cache entries
 * - Hit/miss tracking and statistics
 * - Memory-efficient with configurable size limits
 * - Automatic cleanup of expired entries
 */
export class ValidationCache {
  /**
   * @param {Object} options - Cache configuration options
   * @param {number} options.maxSize - Maximum number of entries (default: 1000)
   * @param {number} options.ttlMs - Time to live in milliseconds (default: 5 minutes)
   * @param {boolean} options.enableStats - Enable hit/miss statistics (default: true)
   */
  constructor({ maxSize = 1000, ttlMs = 5 * 60 * 1000, enableStats = true } = {}) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.enableStats = enableStats;
    
    // Use Map for LRU behavior (insertion order preserved)
    this.cache = new Map();
    
    // Statistics tracking
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expired: 0,
      totalRequests: 0
    };
    
    // Cleanup timer for expired entries
    this.cleanupTimer = null;
    this.startCleanupTimer();
  }
  
  /**
   * Generate cache key from path and schema hash
   * @param {string} path - Validation path
   * @param {string} schemaHash - Hash of schema for cache invalidation
   * @returns {string} Cache key
   */
  generateKey(path, schemaHash = 'default') {
    return `${path}:${schemaHash}`;
  }
  
  /**
   * Get validation result from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached validation result or null if not found/expired
   */
  get(key) {
    if (this.enableStats) {
      this.stats.totalRequests++;
    }
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }
    
    // Check if entry is expired
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      if (this.enableStats) {
        this.stats.expired++;
        this.stats.misses++;
      }
      return null;
    }
    
    // Move to end (most recently used) for LRU
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    if (this.enableStats) {
      this.stats.hits++;
    }
    
    return entry.value;
  }
  
  /**
   * Set validation result in cache
   * @param {string} key - Cache key
   * @param {Object} value - Validation result to cache
   */
  set(key, value) {
    const now = Date.now();
    const entry = {
      value,
      createdAt: now,
      expiresAt: now + this.ttlMs,
      accessCount: 1
    };
    
    // Remove if already exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // Add new entry
    this.cache.set(key, entry);
    
    // Enforce size limit with LRU eviction
    if (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
  
  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is valid
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      if (this.enableStats) {
        this.stats.expired++;
      }
      return false;
    }
    
    return true;
  }
  
  /**
   * Remove entry from cache
   * @param {string} key - Cache key to remove
   * @returns {boolean} True if entry was removed
   */
  delete(key) {
    return this.cache.delete(key);
  }
  
  /**
   * Clear all entries from cache
   */
  clear() {
    this.cache.clear();
    if (this.enableStats) {
      this.resetStats();
    }
  }
  
  /**
   * Evict least recently used entry
   * @private
   */
  evictLRU() {
    const firstKey = this.cache.keys().next().value;
    if (firstKey) {
      this.cache.delete(firstKey);
      if (this.enableStats) {
        this.stats.evictions++;
      }
    }
  }
  
  /**
   * Start periodic cleanup timer for expired entries
   * @private
   */
  startCleanupTimer() {
    // Clean up every 2 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, 2 * 60 * 1000);
  }
  
  /**
   * Clean up expired entries
   * @private
   */
  cleanupExpired() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      if (this.enableStats) {
        this.stats.expired++;
      }
    });
    
    if (expiredKeys.length > 0) {
      console.debug(`ValidationCache: Cleaned up ${expiredKeys.length} expired entries`);
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      currentSize: this.cache.size,
      maxSize: this.maxSize,
      memoryUsageBytes: this.estimateMemoryUsage()
    };
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expired: 0,
      totalRequests: 0
    };
  }
  
  /**
   * Estimate memory usage of cache (rough approximation)
   * @returns {number} Estimated memory usage in bytes
   * @private
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimate: key size + entry metadata + value JSON size
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += 100; // Entry metadata overhead
      totalSize += JSON.stringify(entry.value).length * 2;
    }
    
    return totalSize;
  }
  
  /**
   * Get cache entries for debugging
   * @returns {Array} Array of cache entries with metadata
   */
  getEntries() {
    const entries = [];
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      entries.push({
        key,
        value: entry.value,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        isExpired: now > entry.expiresAt,
        ageMs: now - entry.createdAt,
        accessCount: entry.accessCount
      });
    }
    
    return entries;
  }
  
  /**
   * Destroy cache and cleanup resources
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
  
  /**
   * Resize cache to new maximum size
   * @param {number} newMaxSize - New maximum size
   */
  resize(newMaxSize) {
    this.maxSize = newMaxSize;
    
    // Evict entries if current size exceeds new limit
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }
  
  /**
   * Update TTL for all future entries
   * @param {number} newTtlMs - New TTL in milliseconds
   */
  updateTTL(newTtlMs) {
    this.ttlMs = newTtlMs;
  }
}

/**
 * Default validation cache instance
 * Can be imported and used across components
 */
export const defaultValidationCache = new ValidationCache({
  maxSize: 1000,
  ttlMs: 5 * 60 * 1000, // 5 minutes
  enableStats: true
});