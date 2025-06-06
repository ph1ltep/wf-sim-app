// src/components/tables/metrics/TableConfiguration.js - Configuration utilities for MetricsTable
import React from 'react';
import { Typography, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { MetricsCell } from './MetricsCell';

const { Text } = Typography;

/**
 * Render header cell with tags and tooltips (aligned with InlineEditTable pattern)
 */
const renderHeaderCell = (rowData) => {
    const { label = '', tooltip, tags = [] } = rowData;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Main label with tooltip and inline tags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <Text strong style={{ fontSize: '13px' }}>
                    {label}
                </Text>
                {tooltip && (
                    <Tooltip
                        title={tooltip.title}
                        overlay={tooltip.content && (
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                    {tooltip.title}
                                </div>
                                <div style={{ fontSize: '12px' }}>
                                    {tooltip.content}
                                </div>
                            </div>
                        )}
                    >
                        {tooltip.icon === 'DollarOutlined' ? <DollarOutlined style={{ fontSize: '12px', color: '#999' }} /> :
                            tooltip.icon === 'SafetyOutlined' ? <SafetyOutlined style={{ fontSize: '12px', color: '#999' }} /> :
                                <InfoCircleOutlined style={{ fontSize: '12px', color: '#999' }} />}
                    </Tooltip>
                )}

                {/* Inline tags that wrap as needed */}
                {tags.length > 0 && tags.map((tag, index) => (
                    <Tag
                        key={index}
                        color={tag.color}
                        size="small"
                        style={{ fontSize: '9px', lineHeight: '14px', margin: '0 2px' }}
                    >
                        {tag.text}
                    </Tag>
                ))}
            </div>
        </div>
    );
};

/**
 * Generate table columns configuration for MetricsTable (aligned with InlineEditTable pattern)
 * @param {Array} data - Table row data
 * @param {Object} config - Table configuration
 * @param {Function} handleColumnSelect - Column selection handler
 * @returns {Array} Generated column configurations
 */
export const generateMetricsTableColumns = (data, config, handleColumnSelect) => {
    if (!config.columns || !Array.isArray(config.columns)) {
        console.warn('generateMetricsTableColumns: No columns configuration provided');
        return [];
    }

    // Header column (fixed left) - similar to InlineEditTable pattern
    const headerColumn = {
        title: 'Metric',
        dataIndex: 'header',
        key: 'header',
        fixed: 'left',
        width: 200,
        render: (_, record) => renderHeaderCell(record)
    };

    // Data columns with InlineEditTable styling pattern
    const dataColumns = config.columns.map((columnConfig) => {
        const isSelected = config.selectedColumn === columnConfig.key;
        const isPrimary = columnConfig.primary;

        // Use primary blue color for consistency with InlineEditTable marker pattern
        const primaryColor = '#1677ff';

        return {
            title: (
                <div
                    style={{
                        textAlign: 'center',
                        fontWeight: isPrimary ? 600 : 500,
                        color: isPrimary ? primaryColor : '#262626',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        padding: '6px 5px', // Align with InlineEditTable padding
                        borderRadius: '4px'
                    }}
                    onClick={() => handleColumnSelect(columnConfig.key)}
                    onMouseEnter={(e) => {
                        if (!isPrimary && !isSelected) {
                            e.target.style.backgroundColor = '#f5f5f5';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!isPrimary && !isSelected) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <div style={{ fontSize: '13px' }}>
                        {columnConfig.label}
                        {isPrimary && (
                            <span style={{
                                fontSize: '9px',
                                color: primaryColor,
                                marginLeft: '4px',
                                fontWeight: 600
                            }}>
                                (Primary)
                            </span>
                        )}
                    </div>
                </div>
            ),
            dataIndex: columnConfig.key,
            key: columnConfig.key,
            width: columnConfig.width || 120, // Align with InlineEditTable width
            align: columnConfig.align || 'center',
            // ALIGNED: Use exact InlineEditTable onHeaderCell pattern
            onHeaderCell: () => ({
                style: (isPrimary || isSelected) ? {
                    backgroundColor: `${primaryColor}15`, // Same as InlineEditTable marker pattern
                    borderColor: `${primaryColor}40`,
                    borderWidth: '4px',
                    borderLeft: '0px',
                    borderRight: '0px'
                } : {},
                onClick: () => handleColumnSelect(columnConfig.key)
            }),
            // ALIGNED: Use exact InlineEditTable onCell pattern
            onCell: (record) => ({
                style: (isPrimary || isSelected) ? {
                    backgroundColor: `${primaryColor}08`, // Same as InlineEditTable marker pattern
                    borderLeft: '0px',
                    borderRight: '0px'
                } : {},
                onClick: columnConfig.selectable && config.onColumnSelect ?
                    () => handleColumnSelect(columnConfig.key, record) : undefined
            }),
            render: (value, record) => (
                <MetricsCell
                    value={value}
                    rowData={record}
                    columnConfig={columnConfig}
                    isSelected={isSelected}
                    isPrimary={isPrimary}
                />
            )
        };
    });

    return [headerColumn, ...dataColumns];
};

/**
 * Evaluate thresholds for a row and return styling information
 * @param {Object} rowData - Row data object
 * @param {Array} thresholds - Array of threshold configurations
 * @param {any} cellValue - Current cell value being evaluated (optional, for cell-specific evaluation)
 * @returns {Object} Style object with color, backgroundColor, etc.
 */
export const evaluateThresholds = (rowData, thresholds = [], cellValue = null) => {
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

        // FIXED: Use cellValue for comparison, not rowData[field]
        const value = cellValue !== null ? cellValue : rowData[field];
        const thresholdValue = rowData[field]; // This is the threshold to compare against
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

    // FIXED: Pass the cell value to evaluateThresholds
    return evaluateThresholds(rowData, thresholds, value);
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