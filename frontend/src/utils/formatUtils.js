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

/**
 * Rounds a number to a specified number of decimal places.
 * @param {number} number - The number to round.
 * @param {number} decimals - The number of decimal places to round to.
 * @returns {number} The rounded number.
 * @example
 * roundTo(123.45678, 2); // Returns 123.46
 */
export function roundTo(number, decimals) {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
}