/**
 * Simple validation utilities for Context Browser
 * Two-tier approach: schema-defined vs non-schema paths
 */

import { ScenarioSchema } from 'schemas/yup/scenario';

/**
 * Check if a path exists in the Yup schema
 * @param {string} path - Dot notation path
 * @returns {boolean} True if path exists in schema
 */
const pathExistsInSchema = (path) => {
  try {
    const Yup = require('yup');
    Yup.reach(ScenarioSchema, path);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get default value for a schema path
 * @param {string} path - Dot notation path  
 * @returns {any} Default value or undefined
 */
const getSchemaDefault = (path) => {
  try {
    const Yup = require('yup');
    const fieldSchema = Yup.reach(ScenarioSchema, path);
    if (fieldSchema.spec && fieldSchema.spec.hasOwnProperty('default')) {
      const defaultValue = fieldSchema.spec.default;
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
    return undefined;
  } catch (error) {
    return undefined;
  }
};

/**
 * Simple validation check for immediate children
 * Classifies nodes into three categories:
 * 1. SCHEMA_VALID - exists in schema and passes validation
 * 2. SCHEMA_INVALID - exists in schema but fails validation  
 * 3. NOT_IN_SCHEMA - doesn't exist in schema (can be removed)
 */
export const checkChildren = async (contextData, startPath = '', getValueByPath) => {
  const results = new Map();
  
  // Get starting value
  const startValue = startPath ? getValueByPath(startPath) : contextData;
  if (!startValue || typeof startValue !== 'object') {
    return results;
  }

  // Get immediate children paths
  const childPaths = getImmediateChildren(startValue, startPath);
  
  for (const path of childPaths) {
    const value = getValueByPath(path);
    
    // Skip primitive values - only validate objects and arrays
    if (value === null || value === undefined) {
      continue; // Skip null/undefined values
    }
    
    const valueType = typeof value;
    if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
      continue; // Skip primitive values like _id, names, counts, etc.
    }
    
    if (pathExistsInSchema(path)) {
      // Path exists in schema - validate it
      try {
        const { validatePath } = require('../../../../utils/validate');
        const validationResult = await validatePath(ScenarioSchema, path, value, contextData);
        
        if (validationResult.isValid) {
          results.set(path, {
            status: 'SCHEMA_VALID',
            message: 'Valid according to schema',
            hasDefault: getSchemaDefault(path) !== undefined,
            defaultValue: getSchemaDefault(path),
            canRemove: false,
            canReset: getSchemaDefault(path) !== undefined
          });
        } else {
          results.set(path, {
            status: 'SCHEMA_INVALID', 
            message: `Schema validation failed: ${validationResult.error}`,
            errors: validationResult.errors || [validationResult.error],
            hasDefault: getSchemaDefault(path) !== undefined,
            defaultValue: getSchemaDefault(path),
            canRemove: !isCriticalPath(path), // Allow removal of non-critical failed validation objects
            canReset: getSchemaDefault(path) !== undefined
          });
        }
      } catch (error) {
        results.set(path, {
          status: 'SCHEMA_INVALID',
          message: `Validation error: ${error.message}`,
          errors: [error.message],
          hasDefault: false,
          defaultValue: undefined,
          canRemove: !isCriticalPath(path), // Allow removal of non-critical failed validation objects
          canReset: false
        });
      }
    } else {
      // Path doesn't exist in schema - candidate for removal
      results.set(path, {
        status: 'NOT_IN_SCHEMA',
        message: 'Not defined in schema - can be removed',
        hasDefault: false,
        defaultValue: undefined,
        canRemove: !isCriticalPath(path),
        canReset: false
      });
    }
  }
  
  return results;
};

/**
 * Get immediate children paths (one level down only)
 */
const getImmediateChildren = (obj, basePath = '') => {
  const paths = [];
  
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return paths;
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = basePath ? `${basePath}[${index}]` : `[${index}]`;
      paths.push(itemPath);
    });
  } else {
    Object.keys(obj).forEach(key => {
      const keyPath = basePath ? `${basePath}.${key}` : key;
      paths.push(keyPath);
    });
  }

  return paths;
};

/**
 * Check if a path is critical and shouldn't be removed
 * Only protect essential structure, allow removal of non-schema items
 */
const isCriticalPath = (path) => {
  const exactCriticalPaths = [
    'scenario',
    'settings',
    'settings.general', 
    'settings.financial',
    'settings.project'
  ];
  
  // Only protect exact matches of critical paths, not their non-schema descendants
  // This allows removal of items like settings.marketFactors, settings.unknownField, etc.
  return exactCriticalPaths.includes(path);
};

export default checkChildren;