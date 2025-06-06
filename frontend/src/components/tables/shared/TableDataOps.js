// src/components/tables/shared/TableDataOps.js - Core data operations only

/**
 * Core data validation and transformation functions
 */

/**
 * Validate that data is a proper array with objects
 * @param {any} data - Data to validate
 * @param {string} context - Context for error messages
 * @returns {Object} { isValid, errors, warnings }
 */
export const validateTableData = (data, context = 'table') => {
    const errors = [];
    const warnings = [];

    if (!Array.isArray(data)) {
        errors.push(`${context} data must be an array, got ${typeof data}`);
        return { isValid: false, errors, warnings };
    }

    if (data.length === 0) {
        warnings.push(`${context} data is empty`);
        return { isValid: true, errors, warnings };
    }

    data.forEach((row, index) => {
        if (!row || typeof row !== 'object') {
            errors.push(`${context} row ${index} must be an object, got ${typeof row}`);
            return;
        }

        if (!row.hasOwnProperty('key') && !row.hasOwnProperty('id')) {
            warnings.push(`${context} row ${index} missing 'key' or 'id' field - may cause rendering issues`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Ensure all rows have unique keys for Ant Design tables
 * @param {Array} data - Table data
 * @param {string} keyField - Field to use as key ('key', 'id', etc.)
 * @returns {Array} Data with ensured unique keys
 */
export const ensureUniqueKeys = (data, keyField = 'key') => {
    if (!Array.isArray(data)) return [];

    const usedKeys = new Set();

    return data.map((row, index) => {
        let rowKey = row[keyField];

        if (rowKey === undefined || rowKey === null) {
            rowKey = `row-${index}`;
        }

        let uniqueKey = rowKey;
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
 * Filter table data by search text
 * @param {Array} data - Table data
 * @param {string} searchText - Text to search for
 * @param {Array} searchFields - Fields to search in
 * @returns {Array} Filtered data
 */
export const filterTableData = (data, searchText, searchFields = []) => {
    if (!searchText || !Array.isArray(data)) return data;

    const lowercaseSearch = searchText.toLowerCase();

    return data.filter(row => {
        const fieldsToSearch = searchFields.length > 0
            ? searchFields
            : Object.keys(row).filter(key => typeof row[key] === 'string');

        return fieldsToSearch.some(field => {
            const value = row[field];
            return value && value.toString().toLowerCase().includes(lowercaseSearch);
        });
    });
};

/**
 * Sort table data by multiple fields
 * @param {Array} data - Table data
 * @param {Array} sortConfig - Array of {field, direction} objects
 * @returns {Array} Sorted data
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
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;

            if (comparison !== 0) {
                return direction === 'desc' ? -comparison : comparison;
            }
        }
        return 0;
    });
};