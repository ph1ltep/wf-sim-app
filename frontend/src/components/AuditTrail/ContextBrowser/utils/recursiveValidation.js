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
 * Recursively validate all nodes from a starting path down to leaf nodes
 * @param {Object} contextData - The full context data
 * @param {string} startPath - Path to start validation from (empty string for root)
 * @param {Function} getValueByPath - Function to get value at path
 * @param {Function} onProgress - Progress callback (current, total, path)
 * @returns {Promise<Object>} Validation results with invalid nodes and cleanup options
 */
export const validateRecursively = async (contextData, startPath = '', getValueByPath, onProgress = null) => {
  const results = {
    validNodes: [],
    invalidNodes: [],
    totalScanned: 0,
    canRemove: [], // Nodes that can be safely removed
    canReset: []   // Nodes that have schema defaults available
  };

  // Get starting value - if startPath is empty, use entire context
  const startValue = startPath ? getValueByPath(startPath) : contextData;
  
  if (!startValue) {
    throw new Error(`No data found at path: ${startPath}`);
  }

  // Collect all paths to validate
  const pathsToValidate = collectAllPaths(startValue, startPath);
  
  // Progress tracking
  let processed = 0;
  const total = pathsToValidate.length;

  // Validate each path
  for (const path of pathsToValidate) {
    try {
      const value = getValueByPath(path);
      const validationResult = await validatePath(ScenarioSchema, path, value, contextData);
      
      const nodeResult = {
        path,
        value,
        isValid: validationResult.isValid,
        errors: validationResult.errors || [],
        canRemove: canNodeBeRemoved(path, contextData),
        hasDefault: await checkHasDefault(path),
        defaultValue: await getDefaultValue(path)
      };

      if (validationResult.isValid) {
        results.validNodes.push(nodeResult);
      } else {
        results.invalidNodes.push(nodeResult);
        
        // Track cleanup options
        if (nodeResult.canRemove) {
          results.canRemove.push(nodeResult);
        }
        if (nodeResult.hasDefault) {
          results.canReset.push(nodeResult);
        }
      }

      results.totalScanned++;
      processed++;

      // Report progress
      if (onProgress) {
        onProgress(processed, total, path);
      }

    } catch (error) {
      console.warn(`Validation error at path ${path}:`, error);
      // Continue with other paths even if one fails
    }
  }

  return results;
};

/**
 * Remove invalid nodes from context data
 * @param {Array} nodesToRemove - Array of node objects with path and validation info
 * @param {Function} updateByPath - Function to update context at path
 * @param {Object} options - Removal options
 * @returns {Promise<Object>} Results of removal operation
 */
export const removeInvalidNodes = async (nodesToRemove, updateByPath, options = {}) => {
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
        await removeFromParent(parentPath, lastKey, updateByPath);
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
 * Collect all paths in an object/array recursively
 * @private
 */
const collectAllPaths = (obj, basePath = '', visited = new WeakSet()) => {
  const paths = [];
  
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    if (basePath) paths.push(basePath);
    return paths;
  }

  // Prevent circular references
  if (visited.has(obj)) {
    return paths;
  }
  visited.add(obj);

  // Add current path if it's not root
  if (basePath) {
    paths.push(basePath);
  }

  if (Array.isArray(obj)) {
    // For arrays, collect paths for each element
    obj.forEach((item, index) => {
      const itemPath = basePath ? `${basePath}[${index}]` : `[${index}]`;
      paths.push(...collectAllPaths(item, itemPath, visited));
    });
  } else {
    // For objects, collect paths for each property
    Object.keys(obj).forEach(key => {
      const keyPath = basePath ? `${basePath}.${key}` : key;
      paths.push(...collectAllPaths(obj[key], keyPath, visited));
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
const removeFromParent = async (parentPath, keyToRemove, updateByPath) => {
  // Get the parent object
  const parent = await updateByPath(parentPath, undefined, { getOnly: true });
  
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