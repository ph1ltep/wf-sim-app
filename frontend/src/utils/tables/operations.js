// src/utils/tables/operations.js - Generic table operation utilities

/**
 * Filter table data by search text across multiple fields
 * @param {Array} data - Table data
 * @param {string} searchText - Text to search for
 * @param {Array} searchFields - Fields to search in (empty = search all string fields)
 * @returns {Array} Filtered data
 */
export const filterTableData = (data, searchText, searchFields = []) => {
    if (!searchText || !Array.isArray(data)) return data;

    const lowercaseSearch = searchText.toLowerCase();

    return data.filter(row => {
        // If no specific fields specified, search all string/number fields
        const fieldsToSearch = searchFields.length > 0
            ? searchFields
            : Object.keys(row).filter(key => {
                const value = row[key];
                return typeof value === 'string' || typeof value === 'number';
            });

        return fieldsToSearch.some(field => {
            const value = row[field];
            return value && value.toString().toLowerCase().includes(lowercaseSearch);
        });
    });
};

/**
 * Sort table data by multiple fields with direction
 * @param {Array} data - Table data
 * @param {Array} sortConfig - Array of {field, direction} objects
 * @returns {Array} Sorted data (new array)
 */
export const sortTableData = (data, sortConfig) => {
    if (!Array.isArray(data) || !Array.isArray(sortConfig) || sortConfig.length === 0) {
        return data;
    }

    return [...data].sort((a, b) => {
        for (const { field, direction } of sortConfig) {
            const aVal = a[field];
            const bVal = b[field];

            let comparison = 0;

            // Handle null/undefined values
            if (aVal == null && bVal == null) continue;
            if (aVal == null) comparison = -1;
            else if (bVal == null) comparison = 1;
            else if (aVal < bVal) comparison = -1;
            else if (aVal > bVal) comparison = 1;

            if (comparison !== 0) {
                return direction === 'desc' ? -comparison : comparison;
            }
        }
        return 0;
    });
};

/**
 * Group table data by field value
 * @param {Array} data - Table data
 * @param {string} groupField - Field to group by
 * @param {Object} options - Grouping options
 * @returns {Object} Grouped data as { [groupValue]: rows[] }
 */
export const groupTableData = (data, groupField, options = {}) => {
    const { includeEmpty = false, sortGroups = true } = options;

    if (!Array.isArray(data)) return {};

    const groups = {};

    data.forEach(row => {
        const groupValue = row[groupField];

        // Handle empty values
        if ((groupValue === null || groupValue === undefined || groupValue === '') && !includeEmpty) {
            return;
        }

        const key = groupValue?.toString() || 'empty';

        if (!groups[key]) {
            groups[key] = [];
        }

        groups[key].push(row);
    });

    // Sort group keys if requested
    if (sortGroups) {
        const sortedKeys = Object.keys(groups).sort();
        const sortedGroups = {};
        sortedKeys.forEach(key => {
            sortedGroups[key] = groups[key];
        });
        return sortedGroups;
    }

    return groups;
};

/**
 * Paginate table data
 * @param {Array} data - Table data
 * @param {number} page - Current page (1-based)
 * @param {number} pageSize - Items per page
 * @returns {Object} { data, pagination: { current, pageSize, total, totalPages } }
 */
export const paginateTableData = (data, page = 1, pageSize = 10) => {
    if (!Array.isArray(data)) {
        return { data: [], pagination: { current: 1, pageSize, total: 0, totalPages: 0 } };
    }

    const total = data.length;
    const totalPages = Math.ceil(total / pageSize);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    const paginatedData = data.slice(startIndex, endIndex);

    return {
        data: paginatedData,
        pagination: {
            current: currentPage,
            pageSize,
            total,
            totalPages,
            hasNext: currentPage < totalPages,
            hasPrev: currentPage > 1
        }
    };
};

/**
 * Calculate summary statistics for numeric columns
 * @param {Array} data - Table data
 * @param {Array} numericFields - Fields to calculate stats for
 * @returns {Object} { [field]: { sum, avg, min, max, count } }
 */
export const calculateTableSummary = (data, numericFields = []) => {
    if (!Array.isArray(data) || data.length === 0) return {};

    const summary = {};

    numericFields.forEach(field => {
        const values = data
            .map(row => row[field])
            .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
            .map(val => Number(val));

        if (values.length === 0) {
            summary[field] = { sum: 0, avg: 0, min: 0, max: 0, count: 0 };
            return;
        }

        const sum = values.reduce((acc, val) => acc + val, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        summary[field] = { sum, avg, min, max, count: values.length };
    });

    return summary;
};

/**
 * Ensure unique keys for Ant Design tables
 * @param {Array} data - Table data
 * @param {string} keyField - Field to use as key
 * @param {string} prefix - Prefix for generated keys
 * @returns {Array} Data with unique keys
 */
export const ensureUniqueTableKeys = (data, keyField = 'key', prefix = 'row') => {
    if (!Array.isArray(data)) return [];

    const usedKeys = new Set();

    return data.map((row, index) => {
        let rowKey = row[keyField];

        // Generate key if missing
        if (rowKey === undefined || rowKey === null || rowKey === '') {
            rowKey = `${prefix}-${index}`;
        }

        // Ensure uniqueness
        let uniqueKey = rowKey.toString();
        let counter = 1;
        while (usedKeys.has(uniqueKey)) {
            uniqueKey = `${rowKey}-${counter}`;
            counter++;
        }

        usedKeys.add(uniqueKey);

        return {
            ...row,
            [keyField]: uniqueKey
        };
    });
};

/**
 * Transform flat data to tree structure for tree tables
 * @param {Array} data - Flat data with parent references
 * @param {Object} options - Transform options
 * @returns {Array} Tree-structured data
 */
export const transformToTreeData = (data, options = {}) => {
    const {
        keyField = 'key',
        parentKeyField = 'parentKey',
        childrenField = 'children',
        rootValue = null
    } = options;

    if (!Array.isArray(data)) return [];

    // Create lookup map
    const itemMap = new Map();
    data.forEach(item => {
        itemMap.set(item[keyField], { ...item, [childrenField]: [] });
    });

    // Build tree
    const tree = [];

    data.forEach(item => {
        const treeItem = itemMap.get(item[keyField]);
        const parentKey = item[parentKeyField];

        if (parentKey === rootValue || parentKey === null || parentKey === undefined) {
            // Root level item
            tree.push(treeItem);
        } else {
            // Child item
            const parent = itemMap.get(parentKey);
            if (parent) {
                parent[childrenField].push(treeItem);
            } else {
                // Orphaned item - add to root
                tree.push(treeItem);
            }
        }
    });

    return tree;
};

/**
 * Flatten tree data back to flat array
 * @param {Array} treeData - Tree-structured data
 * @param {Object} options - Flatten options
 * @returns {Array} Flat data array
 */
export const flattenTreeData = (treeData, options = {}) => {
    const { childrenField = 'children', includeParents = true } = options;

    const result = [];

    const traverse = (nodes, level = 0) => {
        nodes.forEach(node => {
            const { [childrenField]: children, ...nodeData } = node;

            if (includeParents || !children || children.length === 0) {
                result.push({ ...nodeData, level });
            }

            if (children && children.length > 0) {
                traverse(children, level + 1);
            }
        });
    };

    traverse(treeData);
    return result;
};