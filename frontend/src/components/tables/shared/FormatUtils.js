// src/components/tables/shared/FormatUtils.js - Value formatting utilities

/**
 * Format value based on type
 * @param {any} value - Value to format
 * @param {string} type - Value type ('number', 'currency', 'percentage')
 * @param {Object} options - Formatting options
 * @returns {string} Formatted value
 */
export const formatValue = (value, type = 'number', options = {}) => {
    const { precision = 2, currency = 'USD', suffix = '', prefix = '' } = options;

    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }

    const numValue = Number(value);

    switch (type) {
        case 'currency':
            return `${prefix}$${numValue.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            })}${suffix}`;

        case 'percentage':
            return `${prefix}${numValue.toFixed(precision)}%${suffix}`;

        case 'number':
        default:
            return `${prefix}${numValue.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            })}${suffix}`;
    }
};

/**
 * Detect data type from values
 * @param {Array} values - Array of values to analyze
 * @returns {string} Detected type ('number', 'currency', 'percentage', 'string')
 */
export const detectValueType = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 'string';

    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return 'string';

    const isNumeric = validValues.every(v => !isNaN(Number(v)));
    if (!isNumeric) return 'string';

    const numbers = validValues.map(v => Number(v));

    const possiblePercentages = numbers.filter(n => n >= 0 && n <= 100);
    if (possiblePercentages.length / numbers.length > 0.8) return 'percentage';

    const largeCurrency = numbers.filter(n => Math.abs(n) > 1000);
    if (largeCurrency.length / numbers.length > 0.5) return 'currency';

    return 'number';
};

/**
 * Format year display with project-relative format
 * @param {number} year - Year value
 * @param {Object} options - Formatting options
 * @returns {string} Formatted year string
 */
export const formatProjectYear = (year, options = {}) => {
    const { showRelative = true, prefix = 'Year' } = options;

    if (!showRelative) return `${prefix} ${year}`;

    if (year === 0) return 'COD (Year 0)';
    if (year > 0) return `COD+${year}`;
    return `COD${year}`;
};