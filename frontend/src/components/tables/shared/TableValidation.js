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

/**
 * Validate time series data structure
 * @param {Array} timeSeries - Time series data array
 * @param {string} context - Context for error messages
 * @returns {Array} Array of error messages
 */
export const validateTimeSeriesStructure = (timeSeries, context = 'time series') => {
    const errors = [];

    if (!Array.isArray(timeSeries)) {
        errors.push(`${context} must be an array`);
        return errors;
    }

    timeSeries.forEach((dataPoint, index) => {
        if (!dataPoint || typeof dataPoint !== 'object') {
            errors.push(`${context} item ${index} must be an object`);
            return;
        }

        if (typeof dataPoint.year !== 'number') {
            errors.push(`${context} item ${index} must have a numeric 'year' field`);
        }

        if (dataPoint.value !== null && dataPoint.value !== undefined && isNaN(Number(dataPoint.value))) {
            errors.push(`${context} item ${index} value must be numeric or null`);
        }
    });

    return errors;
};

/**
 * Validate year range configuration
 * @param {Object} yearRange - Year range object with min/max
 * @returns {string|null} Error message or null
 */
export const validateYearRange = (yearRange) => {
    if (!yearRange || typeof yearRange !== 'object') {
        return 'Year range must be an object with min and max properties';
    }

    if (typeof yearRange.min !== 'number' || typeof yearRange.max !== 'number') {
        return 'Year range min and max must be numbers';
    }

    if (yearRange.min >= yearRange.max) {
        return 'Year range min must be less than max';
    }

    if (yearRange.max - yearRange.min > 50) {
        return 'Year range cannot exceed 50 years (performance limitation)';
    }

    return null;
};

/**
 * Validate data field options for inline tables
 * @param {Array} dataFieldOptions - Array of field option objects
 * @returns {Array} Array of error messages
 */
export const validateDataFieldOptions = (dataFieldOptions) => {
    const errors = [];

    if (!Array.isArray(dataFieldOptions)) {
        errors.push('Data field options must be an array');
        return errors;
    }

    if (dataFieldOptions.length === 0) {
        errors.push('At least one data field option is required');
        return errors;
    }

    dataFieldOptions.forEach((option, index) => {
        if (!option || typeof option !== 'object') {
            errors.push(`Data field option ${index} must be an object`);
            return;
        }

        if (!option.value) {
            errors.push(`Data field option ${index} must have a 'value' property`);
        }

        if (!option.label) {
            errors.push(`Data field option ${index} must have a 'label' property`);
        }

        if (option.type && !['currency', 'number', 'percentage', 'string'].includes(option.type)) {
            errors.push(`Data field option ${index} has invalid type: ${option.type}`);
        }
    });

    // Check for duplicate values
    const values = dataFieldOptions.map(opt => opt.value).filter(Boolean);
    const uniqueValues = new Set(values);
    if (values.length !== uniqueValues.size) {
        errors.push('Data field options must have unique values');
    }

    return errors;
};