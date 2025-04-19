// src/utils/formatUtils.js

/**
 * Formats a number with specified precision.
 * @param {number} value - Number to format
 * @param {number|null} precision - Decimal precision (null for default)
 * @returns {string} Formatted number
 */
export function formatNumber(value, precision) {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision !== null ? precision : 2
    });
}

/**
 * Formats a number compactly for large values.
 * @param {number} value - Number to format
 * @param {number|null} precision - Decimal precision (null for default)
 * @returns {string} Formatted number
 */
export function formatCompactNumber(value, precision) {
    if (typeof value !== 'number' || isNaN(value)) return '';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: precision !== null ? precision : 2,
        notation: value > 9999 ? 'compact' : 'standard',
        compactDisplay: 'short'
    });
}