// src/components/tables/metrics/TableConfiguration.js - Configuration utilities for MetricsDataTable
import React from 'react';

/**
 * Generate table columns configuration from data and config
 * @param {Array} data - Table row data
 * @param {Object} config - Table configuration
 * @returns {Array} Generated column configurations
 */
export const generateTableColumns = (data, config) => {
    if (!config.columns || !Array.isArray(config.columns)) {
        console.warn('generateTableColumns: No columns configuration provided');
        return [];
    }

    // Validate that all column keys exist in data
    const availableKeys = new Set();
    data.forEach(row => {
        Object.keys(row).forEach(key => availableKeys.add(key));
    });

    const validColumns = config.columns.filter(column => {
        if (!availableKeys.has(column.key)) {
            console.warn(`generateTableColumns: Column key '${column.key}' not found in data`);
            return false;
        }
        return true;
    });

    return validColumns;
};

/**
 * Evaluate thresholds for a row and return styling information
 * @param {Object} rowData - Row data object
 * @param {Array} thresholds - Array of threshold configurations
 * @returns {Object} Style object with color, backgroundColor, etc.
 */
export const evaluateThresholds = (rowData, thresholds = []) => {
    if (!thresholds || thresholds.length === 0) {
        return {};
    }

    // Sort thresholds by priority (higher priority first)
    const sortedThresholds = [...thresholds].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let appliedStyle = {};
    let appliedRules = [];

    sortedThresholds.forEach(threshold => {
        const { field, comparison, colorRule, upperField, priority = 0, description } = threshold;

        if (!rowData.hasOwnProperty(field)) {
            console.warn(`evaluateThresholds: Field '${field}' not found in row data`);
            return;
        }

        const value = rowData[field];
        const thresholdValue = rowData[field]; // For self-comparison scenarios
        let shouldApply = false;

        // Evaluate threshold condition
        switch (comparison) {
            case 'below':
                shouldApply = value < thresholdValue;
                break;
            case 'above':
                shouldApply = value > thresholdValue;
                break;
            case 'equals':
                shouldApply = value === thresholdValue;
                break;
            case 'not_equals':
                shouldApply = value !== thresholdValue;
                break;
            case 'between':
                if (!upperField || !rowData.hasOwnProperty(upperField)) {
                    console.warn(`evaluateThresholds: Upper field '${upperField}' required for 'between' comparison`);
                    return;
                }
                const upperValue = rowData[upperField];
                shouldApply = value >= thresholdValue && value <= upperValue;
                break;
            default:
                console.warn(`evaluateThresholds: Unknown comparison type '${comparison}'`);
                return;
        }

        // Apply color rule if condition is met
        if (shouldApply && typeof colorRule === 'function') {
            try {
                const styleResult = colorRule(value, thresholdValue, rowData);
                if (styleResult) {
                    // Merge styles, but don't override higher priority styles
                    if (typeof styleResult === 'string') {
                        // Simple color string
                        if (!appliedStyle.color) {
                            appliedStyle.color = styleResult;
                        }
                    } else if (typeof styleResult === 'object') {
                        // Style object
                        Object.keys(styleResult).forEach(styleKey => {
                            if (!appliedStyle[styleKey]) {
                                appliedStyle[styleKey] = styleResult[styleKey];
                            }
                        });
                    }

                    appliedRules.push({
                        field,
                        comparison,
                        priority,
                        description: description || `${field} ${comparison} threshold`
                    });
                }
            } catch (error) {
                console.error(`evaluateThresholds: Error applying color rule for field '${field}':`, error);
            }
        }
    });

    return {
        ...appliedStyle,
        _appliedRules: appliedRules // For debugging
    };
};

/**
 * Evaluate thresholds specifically for a cell value
 * @param {any} value - Cell value
 * @param {Object} rowData - Complete row data
 * @param {Array} thresholds - Threshold configurations
 * @returns {Object} Style object for the cell
 */
export const evaluateCellThresholds = (value, rowData, thresholds = []) => {
    if (!thresholds || thresholds.length === 0) {
        return {};
    }

    // Filter thresholds that apply to this specific value
    const relevantThresholds = thresholds.filter(threshold => {
        // For cell-specific evaluation, we compare the current value against threshold fields
        return rowData.hasOwnProperty(threshold.field);
    });

    return evaluateThresholds({ ...rowData, currentValue: value }, relevantThresholds);
};

/**
 * Get default formatters for common data types
 * @param {string} dataType - Data type ('currency', 'percentage', 'number', 'string')
 * @param {Object} options - Formatting options
 * @returns {Function} Formatter function
 */
export const getDefaultFormatter = (dataType, options = {}) => {
    const { precision = 2, currency = 'USD', suffix = '', prefix = '' } = options;

    switch (dataType) {
        case 'currency':
            return (value) => {
                if (value === null || value === undefined || isNaN(value)) return '-';
                return `${prefix}$${Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision
                })}${suffix}`;
            };
        case 'percentage':
            return (value) => {
                if (value === null || value === undefined || isNaN(value)) return '-';
                return `${prefix}${Number(value).toFixed(precision)}%${suffix}`;
            };
        case 'number':
            return (value) => {
                if (value === null || value === undefined || isNaN(value)) return '-';
                return `${prefix}${Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: precision,
                    maximumFractionDigits: precision
                })}${suffix}`;
            };
        case 'string':
        default:
            return (value) => {
                if (value === null || value === undefined) return '-';
                return `${prefix}${value}${suffix}`;
            };
    }
};

/**
 * Create common threshold configurations for financial metrics
 * @param {Object} thresholdValues - Object with threshold values
 * @returns {Array} Array of threshold configurations
 */
export const createFinancialThresholds = (thresholdValues = {}) => {
    const thresholds = [];

    // DSCR thresholds
    if (thresholdValues.dscrMin !== undefined) {
        thresholds.push({
            field: 'dscrMin',
            comparison: 'below',
            priority: 10,
            colorRule: (value, threshold) => value < threshold ? { color: '#ff4d4f', fontWeight: 'bold' } : null,
            description: 'DSCR below minimum covenant'
        });
    }

    // IRR thresholds
    if (thresholdValues.irrTarget !== undefined) {
        thresholds.push({
            field: 'irrTarget',
            comparison: 'above',
            priority: 5,
            colorRule: (value, threshold) => value > threshold ? { color: '#52c41a' } : null,
            description: 'IRR above target'
        });
    }

    // NPV thresholds
    if (thresholdValues.npvPositive !== undefined) {
        thresholds.push({
            field: 'npvPositive',
            comparison: 'above',
            priority: 5,
            colorRule: (value) => value > 0 ? { color: '#52c41a' } : { color: '#ff4d4f' },
            description: 'NPV positive/negative'
        });
    }

    return thresholds;
};

/**
 * Create column configuration for percentile data
 * @param {Array} percentiles - Array of percentile values
 * @param {number} primaryPercentile - Primary percentile to highlight
 * @param {Object} options - Additional options
 * @returns {Array} Column configurations
 */
export const createPercentileColumns = (percentiles, primaryPercentile, options = {}) => {
    const { formatter, valueField = 'percentile', selectable = true } = options;

    return percentiles.map(p => ({
        key: `P${p}`,
        label: `P${p}`,
        valueField,
        value: p,
        primary: p === primaryPercentile,
        selectable,
        formatter,
        align: 'center',
        width: 80
    }));
};