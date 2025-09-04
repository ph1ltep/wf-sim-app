// src/components/AuditTrail/ContextBrowser/utils/contextUtils.js

/**
 * Context utility functions for processing and manipulating scenario data
 * in the ContextBrowser debug tool.
 * 
 * @fileoverview Provides tree data conversion, type detection, value formatting,
 * and search utilities for exploring wind farm scenario context data.
 */

/**
 * Get the display type for a value with corresponding icon
 * @param {any} value - The value to check
 * @returns {Object} Object with type and icon
 */
export const getValueType = (value) => {
  if (value === null) return { type: 'null', icon: '∅' };
  if (value === undefined) return { type: 'undefined', icon: '?' };
  if (Array.isArray(value)) return { type: 'array', icon: '📋' };
  if (typeof value === 'object') return { type: 'object', icon: '📦' };
  if (typeof value === 'string') return { type: 'string', icon: '🔤' };
  if (typeof value === 'number') return { type: 'number', icon: '🔢' };
  if (typeof value === 'boolean') return { type: 'boolean', icon: '✅' };
  if (typeof value === 'function') return { type: 'function', icon: '⚙️' };
  return { type: 'unknown', icon: '❓' };
};

/**
 * Get preview text for a value
 * @param {any} value - The value to preview
 * @param {number} maxLength - Maximum preview length
 * @returns {string} Preview text
 */
export const getValuePreview = (value, maxLength = 50) => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  if (Array.isArray(value)) {
    return `Array(${value.length})`;
  }
  
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    return `{${keys.length} keys}`;
  }
  
  if (typeof value === 'string') {
    if (value.length <= maxLength) return `"${value}"`;
    return `"${value.substring(0, maxLength - 3)}..."`;
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (typeof value === 'boolean') {
    return value.toString();
  }
  
  return String(value);
};

/**
 * Convert scenario data to tree structure
 * @param {Object} data - Scenario data object
 * @param {string} parentPath - Parent path for nested items
 * @returns {Array} Tree structure array
 */
export const convertToTreeData = (data, parentPath = '') => {
  if (!data || typeof data !== 'object') return [];
  
  const treeData = [];
  
  Object.entries(data).forEach(([key, value]) => {
    const currentPath = parentPath ? `${parentPath}.${key}` : key;
    const valueType = getValueType(value);
    const preview = getValuePreview(value);
    
    const treeNode = {
      key: currentPath,
      title: key,
      path: currentPath,
      value: value,
      type: valueType.type,
      icon: valueType.icon,
      preview: preview,
      isLeaf: !['object', 'array'].includes(valueType.type) || 
              (Array.isArray(value) && value.length === 0) ||
              (typeof value === 'object' && Object.keys(value).length === 0)
    };
    
    // Add children for objects and arrays
    if (valueType.type === 'object' && value !== null) {
      const children = convertToTreeData(value, currentPath);
      if (children.length > 0) {
        treeNode.children = children;
        treeNode.isLeaf = false;
      }
    } else if (valueType.type === 'array' && Array.isArray(value)) {
      const children = value.map((item, index) => {
        const childPath = `${currentPath}.${index}`;
        const childType = getValueType(item);
        const childPreview = getValuePreview(item);
        
        return {
          key: childPath,
          title: `[${index}]`,
          path: childPath,
          value: item,
          type: childType.type,
          icon: childType.icon,
          preview: childPreview,
          isLeaf: !['object', 'array'].includes(childType.type),
          children: childType.type === 'object' && item !== null ? 
                    convertToTreeData(item, childPath) : undefined
        };
      });
      
      if (children.length > 0) {
        treeNode.children = children;
        treeNode.isLeaf = false;
      }
    }
    
    treeData.push(treeNode);
  });
  
  return treeData;
};

/**
 * Flatten tree data for searching
 * @param {Array} treeData - Tree data array
 * @returns {Array} Flattened array with searchable fields
 */
export const flattenTreeData = (treeData) => {
  const flattened = [];
  
  const flatten = (nodes) => {
    nodes.forEach(node => {
      flattened.push({
        key: node.key,
        title: node.title,
        path: node.path,
        value: node.value,
        type: node.type,
        preview: node.preview,
        searchText: `${node.title} ${node.path} ${node.preview} ${node.type}`
      });
      
      if (node.children) {
        flatten(node.children);
      }
    });
  };
  
  flatten(treeData);
  return flattened;
};

/**
 * Find tree node by path
 * @param {Array} treeData - Tree data array
 * @param {string} targetPath - Path to find
 * @returns {Object|null} Found node or null
 */
export const findNodeByPath = (treeData, targetPath) => {
  const findInNodes = (nodes) => {
    for (const node of nodes) {
      if (node.path === targetPath) {
        return node;
      }
      if (node.children) {
        const found = findInNodes(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findInNodes(treeData);
};

/**
 * Get all parent paths for a given path
 * @param {string} path - The path to get parents for
 * @returns {Array} Array of parent paths
 */
export const getParentPaths = (path) => {
  const parts = path.split('.');
  const parents = [];
  
  for (let i = 1; i < parts.length; i++) {
    parents.push(parts.slice(0, i).join('.'));
  }
  
  return parents;
};

/**
 * Format value for editing based on type
 * @param {any} value - The value to format
 * @param {string} type - The value type
 * @returns {string} Formatted value for input
 */
export const formatValueForEdit = (value, type) => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (type === 'string') {
    return value;
  }
  
  if (type === 'number') {
    return value.toString();
  }
  
  if (type === 'boolean') {
    return value.toString();
  }
  
  // For objects and arrays, use JSON representation
  if (type === 'object' || type === 'array') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return '[Invalid JSON]';
    }
  }
  
  return String(value);
};

/**
 * Parse edited value back to appropriate type
 * @param {string} editedValue - The edited string value
 * @param {string} originalType - The original value type
 * @returns {any} Parsed value
 */
export const parseEditedValue = (editedValue, originalType) => {
  if (!editedValue && editedValue !== '0' && editedValue !== 'false') {
    return null;
  }
  
  if (originalType === 'string') {
    return editedValue;
  }
  
  if (originalType === 'number') {
    const parsed = Number(editedValue);
    return isNaN(parsed) ? null : parsed;
  }
  
  if (originalType === 'boolean') {
    return editedValue.toLowerCase() === 'true';
  }
  
  // For objects and arrays, try to parse JSON
  if (originalType === 'object' || originalType === 'array') {
    try {
      return JSON.parse(editedValue);
    } catch (e) {
      return null;
    }
  }
  
  return editedValue;
};