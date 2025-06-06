// src/components/tables/shared/TableValidation.js - Simple, essential validation utilities

/**
 * Basic cell value validation - only what we actually need
 * @param {any} value - Value to validate
 * @param {Object} fieldConfig - Field configuration with validation rules
 * @returns {string|null} Error message or null if valid
 */
export const validateCellValue = (value, fieldConfig) => {
    // Allow empty values unless required
    if (value === null || value === undefined || value === '') {
        return fieldConfig.required ? 'This field is required' : null;
    }

    // Type-specific validation for numeric fields only
    if (['currency', 'number', 'percentage'].includes(fieldConfig.type)) {
        const num = parseFloat(value);

        if (isNaN(num)) {
            return 'Must be a number';
        }

        if (fieldConfig.validation) {
            const { min, max, precision } = fieldConfig.validation;

            if (min !== undefined && num < min) {
                return `Minimum value is ${min}`;
            }
            if (max !== undefined && num > max) {
                return `Maximum value is ${max}`;
            }
            if (precision !== undefined) {
                const decimalPlaces = (value.toString().split('.')[1] || '').length;
                if (decimalPlaces > precision) {
                    return `Maximum ${precision} decimal places allowed`;
                }
            }
        }
    }

    return null;
};

/**
 * Ensure table data has unique keys for Ant Design
 * @param {Array} data - Table data
 * @param {string} keyField - Field to use as key
 * @returns {Array} Data with unique keys
 */
export const ensureUniqueKeys = (data, keyField = 'key') => {
    if (!Array.isArray(data)) return [];

    const usedKeys = new Set();

    return data.map((row, index) => {
        let rowKey = row[keyField] || `row-${index}`;

        // Ensure uniqueness
        let uniqueKey = rowKey;
        let counter = 1;
        while (usedKeys.has(uniqueKey)) {
            uniqueKey = `${rowKey}-${counter}`;
            counter++;
        }

        usedKeys.add(uniqueKey);

        return { ...row, [keyField]: uniqueKey };
    });
};

/**
 * Basic data structure validation
 * @param {Array} data - Table data
 * @param {string} context - Context for error messages
 * @returns {Array} Array of error messages (empty if valid)
 */
export const validateTableStructure = (data, context = 'table') => {
    const errors = [];

    if (!Array.isArray(data)) {
        errors.push(`${context} data must be an array`);
        return errors;
    }

    // Check each row is an object
    data.forEach((row, index) => {
        if (!row || typeof row !== 'object') {
            errors.push(`${context} row ${index} must be an object`);
        }
    });

    return errors;
};

/**
 * Financial-specific validation (only the essentials we actually use)
 */
export const validatePercentageSum = (values, tolerance = 0.1) => {
    const total = values.reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const diff = Math.abs(total - 100);

    if (diff > tolerance) {
        return `Percentages must sum to 100% (currently ${total.toFixed(1)}%)`;
    }

    return null;
};

/**
 * Check for duplicate years in time series data
 * @param {Array} data - Data with year field
 * @returns {string|null} Error message or null
 */
export const validateUniqueYears = (data) => {
    const years = data.map(row => row.year).filter(y => y !== null && y !== undefined);
    const uniqueYears = new Set(years);

    if (years.length !== uniqueYears.size) {
        return 'Duplicate years found - each year should appear only once';
    }

    return null;
};