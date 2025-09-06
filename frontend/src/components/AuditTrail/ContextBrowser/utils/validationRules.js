// frontend/src/components/AuditTrail/ContextBrowser/utils/validationRules.js

/**
 * @fileoverview Extensible validation rule system for the Context Browser.
 * Provides type-specific validation rules and custom rule definitions
 * that integrate with the existing Yup schema validation system.
 */

/**
 * ValidationRules - Extensible validation rule system
 * 
 * Features:
 * - Type-specific validation rules
 * - Custom rule definitions for Context Browser
 * - Integration with existing Yup schemas
 * - Performance-optimized rule evaluation
 * - Extensible rule registration system
 */
export class ValidationRules {
  constructor() {
    // Built-in validation rules organized by category
    this.rules = {
      // Type-specific validation rules
      type: new Map([
        ['string', this.createStringRule()],
        ['number', this.createNumberRule()],
        ['boolean', this.createBooleanRule()],
        ['array', this.createArrayRule()],
        ['object', this.createObjectRule()],
        ['null', this.createNullRule()],
        ['undefined', this.createUndefinedRule()]
      ]),
      
      // Context-specific business rules
      business: new Map([
        ['financial', this.createFinancialRule()],
        ['percentage', this.createPercentageRule()],
        ['distribution', this.createDistributionRule()],
        ['temporal', this.createTemporalRule()]
      ]),
      
      // Performance and size rules
      performance: new Map([
        ['size', this.createSizeRule()],
        ['depth', this.createDepthRule()],
        ['complexity', this.createComplexityRule()]
      ]),
      
      // Custom user-defined rules
      custom: new Map()
    };
    
    // Rule evaluation statistics
    this.stats = {
      evaluations: 0,
      failures: 0,
      ruleUsage: new Map()
    };
  }
  
  /**
   * Register a custom validation rule
   * @param {string} category - Rule category (type, business, performance, custom)
   * @param {string} name - Rule name
   * @param {Function} ruleFn - Rule function that returns validation result
   * @param {Object} options - Rule options and metadata
   */
  registerRule(category, name, ruleFn, options = {}) {
    if (!this.rules[category]) {
      this.rules[category] = new Map();
    }
    
    const rule = {
      name,
      fn: ruleFn,
      enabled: options.enabled !== false,
      priority: options.priority || 0,
      description: options.description || '',
      examples: options.examples || [],
      metadata: options.metadata || {}
    };
    
    this.rules[category].set(name, rule);
    console.debug(`ValidationRules: Registered ${category}/${name} rule`);
  }
  
  /**
   * Evaluate all applicable rules for a given path and value
   * @param {string} path - The data path being validated
   * @param {any} value - The value to validate
   * @param {string} type - The detected type of the value
   * @param {Object} context - Additional context for rule evaluation
   * @returns {Object} Validation result with rule-specific details
   */
  evaluateRules(path, value, type, context = {}) {
    this.stats.evaluations++;
    
    const results = {
      isValid: true,
      errors: [],
      warnings: [],
      appliedRules: [],
      skippedRules: [],
      ruleDetails: {}
    };
    
    try {
      // 1. Evaluate type-specific rules
      this.evaluateRuleCategory('type', type, path, value, context, results);
      
      // 2. Evaluate business rules based on path patterns
      this.evaluateBusinessRules(path, value, type, context, results);
      
      // 3. Evaluate performance rules
      this.evaluateRuleCategory('performance', 'size', path, value, context, results);
      
      // 4. Evaluate custom rules
      this.evaluateRuleCategory('custom', '*', path, value, context, results);
      
      // Update statistics
      if (!results.isValid) {
        this.stats.failures++;
      }
      
      return results;
      
    } catch (error) {
      console.error('ValidationRules: Error during rule evaluation:', error);
      return {
        isValid: false,
        errors: [`Rule evaluation failed: ${error.message}`],
        warnings: [],
        appliedRules: [],
        skippedRules: [],
        ruleDetails: { evaluationError: error.message }
      };
    }
  }
  
  /**
   * Evaluate rules in a specific category
   * @private
   */
  evaluateRuleCategory(category, ruleKey, path, value, context, results) {
    const categoryRules = this.rules[category];
    if (!categoryRules) return;
    
    // For wildcard or specific rule evaluation
    const rulesToEvaluate = ruleKey === '*' 
      ? Array.from(categoryRules.values())
      : categoryRules.has(ruleKey) 
        ? [categoryRules.get(ruleKey)]
        : [];
    
    rulesToEvaluate.forEach(rule => {
      if (!rule.enabled) {
        results.skippedRules.push(`${category}/${rule.name} (disabled)`);
        return;
      }
      
      try {
        const ruleResult = rule.fn(path, value, context);
        this.updateRuleUsageStats(category, rule.name);
        
        if (ruleResult) {
          results.appliedRules.push(`${category}/${rule.name}`);
          results.ruleDetails[`${category}/${rule.name}`] = ruleResult;
          
          if (!ruleResult.isValid) {
            results.isValid = false;
            if (ruleResult.errors) {
              results.errors.push(...ruleResult.errors);
            }
          }
          
          if (ruleResult.warnings) {
            results.warnings.push(...ruleResult.warnings);
          }
        } else {
          results.skippedRules.push(`${category}/${rule.name} (not applicable)`);
        }
        
      } catch (ruleError) {
        console.warn(`ValidationRules: Rule ${category}/${rule.name} failed:`, ruleError);
        results.skippedRules.push(`${category}/${rule.name} (error: ${ruleError.message})`);
      }
    });
  }
  
  /**
   * Evaluate business rules based on path patterns
   * @private
   */
  evaluateBusinessRules(path, value, type, context, results) {
    const businessRules = this.rules.business;
    
    // Apply rules based on path patterns
    if (path.includes('financial') || path.includes('cost') || path.includes('revenue')) {
      const rule = businessRules.get('financial');
      if (rule && rule.enabled) {
        this.evaluateRuleCategory('business', 'financial', path, value, context, results);
      }
    }
    
    if (path.includes('percent') || path.includes('rate') || path.endsWith('Rate')) {
      const rule = businessRules.get('percentage');
      if (rule && rule.enabled) {
        this.evaluateRuleCategory('business', 'percentage', path, value, context, results);
      }
    }
    
    if (path.includes('distribution') || context.isDistribution) {
      const rule = businessRules.get('distribution');
      if (rule && rule.enabled) {
        this.evaluateRuleCategory('business', 'distribution', path, value, context, results);
      }
    }
    
    if (path.includes('date') || path.includes('time') || type === 'date') {
      const rule = businessRules.get('temporal');
      if (rule && rule.enabled) {
        this.evaluateRuleCategory('business', 'temporal', path, value, context, results);
      }
    }
  }
  
  // ============================================================================
  // Built-in Rule Definitions
  // ============================================================================
  
  /**
   * Create string validation rule
   * @private
   */
  createStringRule() {
    return {
      name: 'string',
      fn: (path, value, context) => {
        if (typeof value !== 'string') return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check for empty strings in required contexts
        if (value.length === 0 && context.isRequired) {
          result.isValid = false;
          result.errors.push('String value is required but empty');
        }
        
        // Check for excessively long strings
        if (value.length > 10000) {
          result.warnings.push('String value is very long and may impact performance');
        }
        
        // Check for potentially problematic characters
        if (/[\x00-\x1F\x7F-\x9F]/.test(value)) {
          result.warnings.push('String contains control characters that may cause issues');
        }
        
        return result;
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create number validation rule
   * @private
   */
  createNumberRule() {
    return {
      name: 'number',
      fn: (path, value, context) => {
        if (typeof value !== 'number') return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check for NaN
        if (isNaN(value)) {
          result.isValid = false;
          result.errors.push('Number value is NaN');
          return result;
        }
        
        // Check for Infinity
        if (!isFinite(value)) {
          result.isValid = false;
          result.errors.push('Number value is infinite');
          return result;
        }
        
        // Check for precision issues with very small/large numbers
        if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
          result.warnings.push('Number exceeds safe integer precision');
        }
        
        if (Math.abs(value) > 0 && Math.abs(value) < Number.MIN_VALUE) {
          result.warnings.push('Number is extremely small and may lose precision');
        }
        
        return result;
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create boolean validation rule
   * @private
   */
  createBooleanRule() {
    return {
      name: 'boolean',
      fn: (path, value, context) => {
        if (typeof value !== 'boolean') return null;
        
        return { isValid: true, errors: [], warnings: [] };
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create array validation rule
   * @private
   */
  createArrayRule() {
    return {
      name: 'array',
      fn: (path, value, context) => {
        if (!Array.isArray(value)) return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check for very large arrays
        if (value.length > 10000) {
          result.warnings.push(`Array has ${value.length} items, which may impact performance`);
        }
        
        // Check for sparse arrays
        if (value.length > 0 && value.filter(x => x !== undefined).length < value.length) {
          result.warnings.push('Array contains undefined elements (sparse array)');
        }
        
        return result;
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create object validation rule
   * @private
   */
  createObjectRule() {
    return {
      name: 'object',
      fn: (path, value, context) => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check for very large objects
        const keyCount = Object.keys(value).length;
        if (keyCount > 1000) {
          result.warnings.push(`Object has ${keyCount} properties, which may impact performance`);
        }
        
        // Check for circular references (simple check)
        try {
          JSON.stringify(value);
        } catch (error) {
          if (error.message.includes('circular')) {
            result.warnings.push('Object may contain circular references');
          }
        }
        
        return result;
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create null validation rule
   * @private
   */
  createNullRule() {
    return {
      name: 'null',
      fn: (path, value, context) => {
        if (value !== null) return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check if null is appropriate in this context
        if (context.isRequired) {
          result.isValid = false;
          result.errors.push('Value is null but required');
        }
        
        return result;
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create undefined validation rule
   * @private
   */
  createUndefinedRule() {
    return {
      name: 'undefined',
      fn: (path, value, context) => {
        if (value !== undefined) return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check if undefined is appropriate in this context
        if (context.isRequired) {
          result.isValid = false;
          result.errors.push('Value is undefined but required');
        }
        
        return result;
      },
      enabled: true,
      priority: 1
    };
  }
  
  /**
   * Create financial validation rule
   * @private
   */
  createFinancialRule() {
    return {
      name: 'financial',
      fn: (path, value, context) => {
        if (typeof value !== 'number') return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check for negative values where inappropriate
        if (value < 0 && (path.includes('cost') || path.includes('price'))) {
          result.warnings.push('Financial value is negative, verify this is intentional');
        }
        
        // Check for unrealistic values
        if (Math.abs(value) > 1e12) {
          result.warnings.push('Financial value is extremely large, verify accuracy');
        }
        
        // Check precision for currency values
        if (path.includes('cost') || path.includes('price')) {
          const decimalPlaces = (value.toString().split('.')[1] || '').length;
          if (decimalPlaces > 2) {
            result.warnings.push('Currency value has more than 2 decimal places');
          }
        }
        
        return result;
      },
      enabled: true,
      priority: 2
    };
  }
  
  /**
   * Create percentage validation rule
   * @private
   */
  createPercentageRule() {
    return {
      name: 'percentage',
      fn: (path, value, context) => {
        if (typeof value !== 'number') return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Determine if this should be 0-1 or 0-100 range
        const isRatio = path.includes('ratio') || path.includes('factor');
        const maxValue = isRatio ? 1 : 100;
        
        if (value < 0) {
          result.warnings.push('Percentage/rate value is negative');
        }
        
        if (value > maxValue) {
          result.warnings.push(`Value ${value} exceeds expected maximum ${maxValue} for ${isRatio ? 'ratio' : 'percentage'}`);
        }
        
        return result;
      },
      enabled: true,
      priority: 2
    };
  }
  
  /**
   * Create distribution validation rule
   * @private
   */
  createDistributionRule() {
    return {
      name: 'distribution',
      fn: (path, value, context) => {
        if (typeof value !== 'object' || value === null) return null;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Check for required distribution properties
        if (!value.type) {
          result.errors.push('Distribution missing type property');
          result.isValid = false;
        }
        
        if (!value.parameters) {
          result.errors.push('Distribution missing parameters property');
          result.isValid = false;
        }
        
        // Check for valid distribution types
        const validTypes = ['fixed', 'normal', 'triangular', 'uniform', 'beta', 'lognormal'];
        if (value.type && !validTypes.includes(value.type)) {
          result.warnings.push(`Unknown distribution type: ${value.type}`);
        }
        
        return result;
      },
      enabled: true,
      priority: 2
    };
  }
  
  /**
   * Create temporal validation rule
   * @private
   */
  createTemporalRule() {
    return {
      name: 'temporal',
      fn: (path, value, context) => {
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Handle various date formats
        let dateValue = value;
        if (typeof value === 'string') {
          dateValue = new Date(value);
        } else if (typeof value === 'number') {
          // Assume timestamp
          dateValue = new Date(value);
        } else if (!(value instanceof Date)) {
          return null; // Not a temporal value
        }
        
        // Check for invalid dates
        if (isNaN(dateValue.getTime())) {
          result.isValid = false;
          result.errors.push('Invalid date value');
          return result;
        }
        
        // Check for reasonable date ranges (1900-2100)
        const year = dateValue.getFullYear();
        if (year < 1900 || year > 2100) {
          result.warnings.push(`Date year ${year} is outside typical range (1900-2100)`);
        }
        
        return result;
      },
      enabled: true,
      priority: 2
    };
  }
  
  /**
   * Create size validation rule for performance
   * @private
   */
  createSizeRule() {
    return {
      name: 'size',
      fn: (path, value, context) => {
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Estimate memory footprint
        let estimatedSize = 0;
        try {
          estimatedSize = JSON.stringify(value).length * 2; // Rough UTF-16 estimate
        } catch (e) {
          estimatedSize = 1000; // Default estimate for non-serializable objects
        }
        
        // Warn about large values
        if (estimatedSize > 100000) { // 100KB
          result.warnings.push(`Large value detected (${Math.round(estimatedSize/1024)}KB), may impact performance`);
        }
        
        return result;
      },
      enabled: true,
      priority: 0
    };
  }
  
  /**
   * Create depth validation rule
   * @private
   */
  createDepthRule() {
    return {
      name: 'depth',
      fn: (path, value, context) => {
        const pathDepth = path.split('.').length;
        
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Warn about deeply nested paths
        if (pathDepth > 10) {
          result.warnings.push(`Deep nesting detected (${pathDepth} levels), consider restructuring`);
        }
        
        return result;
      },
      enabled: true,
      priority: 0
    };
  }
  
  /**
   * Create complexity validation rule
   * @private
   */
  createComplexityRule() {
    return {
      name: 'complexity',
      fn: (path, value, context) => {
        const result = { isValid: true, errors: [], warnings: [] };
        
        // Calculate complexity score based on type and structure
        let complexityScore = 0;
        
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            complexityScore += value.length;
            value.forEach(item => {
              if (typeof item === 'object' && item !== null) {
                complexityScore += Object.keys(item).length;
              }
            });
          } else {
            complexityScore += Object.keys(value).length;
            Object.values(value).forEach(val => {
              if (typeof val === 'object' && val !== null) {
                complexityScore += Array.isArray(val) ? val.length : Object.keys(val).length;
              }
            });
          }
        }
        
        // Warn about high complexity
        if (complexityScore > 100) {
          result.warnings.push(`High complexity score (${complexityScore}), may impact validation performance`);
        }
        
        return result;
      },
      enabled: true,
      priority: 0
    };
  }
  
  // ============================================================================
  // Statistics and Management
  // ============================================================================
  
  /**
   * Update rule usage statistics
   * @private
   */
  updateRuleUsageStats(category, ruleName) {
    const key = `${category}/${ruleName}`;
    const current = this.stats.ruleUsage.get(key) || 0;
    this.stats.ruleUsage.set(key, current + 1);
  }
  
  /**
   * Get validation rule statistics
   * @returns {Object} Rule usage and performance statistics
   */
  getStats() {
    const successRate = this.stats.evaluations > 0 
      ? ((this.stats.evaluations - this.stats.failures) / this.stats.evaluations) * 100 
      : 0;
    
    const ruleUsageArray = Array.from(this.stats.ruleUsage.entries())
      .map(([rule, count]) => ({ rule, count }))
      .sort((a, b) => b.count - a.count);
    
    return {
      evaluations: this.stats.evaluations,
      failures: this.stats.failures,
      successRate: Math.round(successRate * 100) / 100,
      topRules: ruleUsageArray.slice(0, 10),
      totalRegisteredRules: this.getTotalRuleCount()
    };
  }
  
  /**
   * Get total number of registered rules
   * @private
   */
  getTotalRuleCount() {
    return Object.values(this.rules).reduce((total, categoryMap) => {
      return total + categoryMap.size;
    }, 0);
  }
  
  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      evaluations: 0,
      failures: 0,
      ruleUsage: new Map()
    };
  }
  
  /**
   * Enable or disable a specific rule
   * @param {string} category - Rule category
   * @param {string} ruleName - Rule name
   * @param {boolean} enabled - Whether to enable the rule
   */
  setRuleEnabled(category, ruleName, enabled) {
    const categoryRules = this.rules[category];
    if (categoryRules && categoryRules.has(ruleName)) {
      categoryRules.get(ruleName).enabled = enabled;
      console.debug(`ValidationRules: ${enabled ? 'Enabled' : 'Disabled'} rule ${category}/${ruleName}`);
    }
  }
  
  /**
   * Get all registered rules with their metadata
   * @returns {Object} All rules organized by category
   */
  getAllRules() {
    const allRules = {};
    
    Object.entries(this.rules).forEach(([category, categoryMap]) => {
      allRules[category] = {};
      categoryMap.forEach((rule, name) => {
        allRules[category][name] = {
          name: rule.name,
          enabled: rule.enabled,
          priority: rule.priority,
          description: rule.description,
          examples: rule.examples,
          metadata: rule.metadata
        };
      });
    });
    
    return allRules;
  }
}

/**
 * Default validation rules instance
 * Can be imported and used across components
 */
export const defaultValidationRules = new ValidationRules();