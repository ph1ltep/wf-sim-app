/**
 * Recursive validation utilities for Context Browser
 * Provides focused functionality for:
 * 1. Recursive scanning from selected object towards leafs
 * 2. Removing invalid objects from context  
 * 3. Resetting invalid objects to schema defaults
 */

import { ScenarioSchema } from 'schemas/yup/scenario';
import { validatePath } from '../../../../utils/validate';

/**
 * Validate children one level down from a starting path (shallow validation)
 * @param {Object} contextData - The full context data
 * @param {string} startPath - Path to start validation from (empty string for root)
 * @param {Function} getValueByPath - Function to get value at path
 * @returns {Promise<Object>} Map of child paths to their validation status
 */
export const validateOneLevel = async (contextData, startPath = '', getValueByPath) => {
  const validationMap = new Map();

  // Get starting value - if startPath is empty, use entire context
  const startValue = startPath ? getValueByPath(startPath) : contextData;
  
  if (!startValue || typeof startValue !== 'object') {
    return validationMap;
  }

  // Get immediate children paths only
  const childPaths = getImmediateChildren(startValue, startPath);
  
  // Validate each immediate child
  for (const path of childPaths) {
    try {
      const value = getValueByPath(path);
      const validationResult = await validatePath(ScenarioSchema, path, value, contextData);
      
      // Skip paths that don't have schema definitions (these are expected)
      const isSchemaNotFound = validationResult.error && (
        validationResult.error.includes('The schema does not contain the path') ||
        validationResult.error.includes('failed at:') ||
        validationResult.details?.method === 'full-object' && !validationResult.isValid
      );
      
      // Only add to validation map if it's an actual validation error (not schema missing)
      if (!isSchemaNotFound && !validationResult.isValid) {
        validationMap.set(path, {
          isValid: false,
          errors: validationResult.errors || [validationResult.error],
          hasDefault: await checkHasDefault(path),
          defaultValue: await getDefaultValue(path),
          canRemove: canNodeBeRemoved(path, contextData)
        });
      } else if (validationResult.isValid) {
        // Track valid nodes too so we know they were checked
        validationMap.set(path, {
          isValid: true,
          errors: [],
          hasDefault: await checkHasDefault(path),
          defaultValue: await getDefaultValue(path),
          canRemove: false
        });
      }
      // Skip nodes where schema is not found - this is expected behavior

    } catch (error) {
      console.warn(`Validation error at path ${path}:`, error);
      // Only add actual validation errors, not schema-not-found errors
      if (!error.message.includes('schema does not contain')) {
        validationMap.set(path, {
          isValid: false,
          errors: [`Validation error: ${error.message}`],
          hasDefault: false,
          defaultValue: undefined,
          canRemove: false
        });
      }
    }
  }

  return validationMap;
};

/**
 * Remove invalid nodes from context data
 * @param {Array} nodesToRemove - Array of node objects with path and validation info
 * @param {Function} updateByPath - Function to update context at path
 * @param {Function} getValueByPath - Function to get context value at path
 * @param {Object} options - Removal options
 * @returns {Promise<Object>} Results of removal operation
 */
export const removeInvalidNodes = async (nodesToRemove, updateByPath, getValueByPath, options = {}) => {
  const { 
    confirmEach = false, // Ask for confirmation before each removal
    dryRun = false       // Just return what would be removed
  } = options;

  const results = {
    removed: [],
    skipped: [],
    errors: [],
    totalRequested: nodesToRemove.length
  };

  if (dryRun) {
    results.wouldRemove = nodesToRemove.map(node => ({
      path: node.path,
      value: node.value,
      reason: node.errors.join('; ')
    }));
    return results;
  }

  // Sort paths by depth (deepest first) to avoid removing parent before child
  const sortedNodes = [...nodesToRemove].sort((a, b) => {
    const depthA = a.path.split('.').length;
    const depthB = b.path.split('.').length;
    return depthB - depthA; // Deepest first
  });

  for (const node of sortedNodes) {
    try {
      if (confirmEach) {
        const confirmed = window.confirm(
          `Remove invalid node at '${node.path}'?\n\nErrors: ${node.errors.join(', ')}\n\nThis cannot be undone.`
        );
        if (!confirmed) {
          results.skipped.push({ path: node.path, reason: 'User cancelled' });
          continue;
        }
      }

      // Remove the node by setting its parent to undefined or removing from array
      const pathParts = node.path.split('.');
      const lastKey = pathParts.pop();
      const parentPath = pathParts.join('.');

      if (parentPath) {
        // Update parent object/array to remove this key
        await removeFromParent(parentPath, lastKey, updateByPath, getValueByPath);
      } else {
        // Can't remove root-level keys safely
        results.skipped.push({ path: node.path, reason: 'Cannot remove root-level key' });
        continue;
      }

      results.removed.push({
        path: node.path,
        value: node.value,
        errors: node.errors
      });

    } catch (error) {
      results.errors.push({
        path: node.path,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Reset invalid nodes to their schema defaults
 * @param {Array} nodesToReset - Array of node objects with default values
 * @param {Function} updateByPath - Function to update context at path
 * @param {Object} options - Reset options
 * @returns {Promise<Object>} Results of reset operation
 */
export const resetNodesToDefaults = async (nodesToReset, updateByPath, options = {}) => {
  const {
    confirmEach = false, // Ask for confirmation before each reset
    dryRun = false       // Just return what would be reset
  } = options;

  const results = {
    reset: [],
    skipped: [],
    errors: [],
    totalRequested: nodesToReset.length
  };

  if (dryRun) {
    results.wouldReset = nodesToReset.map(node => ({
      path: node.path,
      currentValue: node.value,
      defaultValue: node.defaultValue
    }));
    return results;
  }

  for (const node of nodesToReset) {
    try {
      if (!node.hasDefault) {
        results.skipped.push({ path: node.path, reason: 'No default value available' });
        continue;
      }

      if (confirmEach) {
        const confirmed = window.confirm(
          `Reset '${node.path}' to default value?\n\nCurrent: ${JSON.stringify(node.value)}\nDefault: ${JSON.stringify(node.defaultValue)}\n\nThis cannot be undone.`
        );
        if (!confirmed) {
          results.skipped.push({ path: node.path, reason: 'User cancelled' });
          continue;
        }
      }

      // Reset to default value
      const updateResult = await updateByPath(node.path, node.defaultValue);
      
      if (updateResult.isValid) {
        results.reset.push({
          path: node.path,
          oldValue: node.value,
          newValue: node.defaultValue
        });
      } else {
        results.errors.push({
          path: node.path,
          error: updateResult.error || 'Failed to apply default value'
        });
      }

    } catch (error) {
      results.errors.push({
        path: node.path,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Get immediate children paths (one level down only)
 * @private
 */
const getImmediateChildren = (obj, basePath = '') => {
  const paths = [];
  
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return paths;
  }

  if (Array.isArray(obj)) {
    // For arrays, get paths for each immediate element
    obj.forEach((item, index) => {
      const itemPath = basePath ? `${basePath}[${index}]` : `[${index}]`;
      paths.push(itemPath);
    });
  } else {
    // For objects, get paths for each immediate property
    Object.keys(obj).forEach(key => {
      const keyPath = basePath ? `${basePath}.${key}` : key;
      paths.push(keyPath);
    });
  }

  return paths;
};

/**
 * Check if a node can be safely removed
 * @private
 */
const canNodeBeRemoved = (path, contextData) => {
  // Don't allow removal of critical root-level keys
  const criticalPaths = [
    'scenario',
    'settings',
    'settings.general',
    'settings.financial', 
    'settings.project'
  ];
  
  if (criticalPaths.includes(path)) {
    return false;
  }

  // Don't allow removal of required schema fields
  // This would need more sophisticated schema inspection
  return true;
};

/**
 * Check if a schema path has a default value
 * @private  
 */
const checkHasDefault = async (path) => {
  try {
    const pathArray = path.split('.');
    let schema = ScenarioSchema;
    
    // Navigate to the schema for this path
    for (const segment of pathArray) {
      if (segment.includes('[') && segment.includes(']')) {
        // Array index - skip schema navigation for indices
        continue;
      }
      schema = schema.fields?.[segment];
      if (!schema) break;
    }
    
    return schema && schema.spec && schema.spec.hasOwnProperty('default');
  } catch (error) {
    return false;
  }
};

/**
 * Get the default value for a schema path
 * @private
 */
const getDefaultValue = async (path) => {
  try {
    const pathArray = path.split('.');
    let schema = ScenarioSchema;
    
    // Navigate to the schema for this path
    for (const segment of pathArray) {
      if (segment.includes('[') && segment.includes(']')) {
        // Array index - skip schema navigation for indices
        continue;
      }
      schema = schema.fields?.[segment];
      if (!schema) break;
    }
    
    if (schema && schema.spec && schema.spec.hasOwnProperty('default')) {
      const defaultValue = schema.spec.default;
      return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
    }
    
    return undefined;
  } catch (error) {
    return undefined;
  }
};

/**
 * Remove a key from its parent object or array
 * @private
 */
const removeFromParent = async (parentPath, keyToRemove, updateByPath, getValueByPath) => {
  // Get the parent object using the correct getter function
  const parent = getValueByPath(parentPath);
  
  if (Array.isArray(parent)) {
    // Remove from array by index
    const index = parseInt(keyToRemove.replace(/[\[\]]/g, ''), 10);
    const newArray = [...parent];
    newArray.splice(index, 1);
    await updateByPath(parentPath, newArray);
  } else if (parent && typeof parent === 'object') {
    // Remove from object by key
    const newObject = { ...parent };
    delete newObject[keyToRemove];
    await updateByPath(parentPath, newObject);
  }
};