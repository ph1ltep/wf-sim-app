// src/components/tables/metrics/TableConfiguration.js - Updated with consolidated classes
import React from 'react';
import { Typography, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { MetricsCell } from './MetricsCell';

const { Text } = Typography;

/**
 * Render header cell with tags and tooltips - using consolidated classes
 */
const renderHeaderCell = (rowData) => {
    const { label = '', tooltip, tags = [] } = rowData;

    return (
        <div className="metric-label">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <Text strong className="cell-numerical">
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
                        {tooltip.icon === 'DollarOutlined' ? <DollarOutlined className="cell-icon" /> :
                            tooltip.icon === 'SafetyOutlined' ? <SafetyOutlined className="cell-icon" /> :
                                <InfoCircleOutlined className="cell-icon" />}
                    </Tooltip>
                )}

                {tags.length > 0 && tags.map((tag, index) => (
                    <Tag
                        key={index}
                        color={tag.color}
                        size="small"
                        className="cell-tag"
                    >
                        {tag.text}
                    </Tag>
                ))}
            </div>
        </div>
    );
};

/**
 * Generate table columns configuration for MetricsTable - using consolidated classes
 */
const generateMetricsTableColumns = (data, config, handleColumnSelect) => {
    if (!config.columns || !Array.isArray(config.columns)) {
        console.warn('generateMetricsTableColumns: No columns configuration provided');
        return [];
    }

    // Header column (fixed left)
    const headerColumn = {
        title: 'Metric',
        dataIndex: 'header',
        key: 'header',
        fixed: 'left',
        width: 200,
        className: 'table-header-cell',
        render: (_, record) => renderHeaderCell(record)
    };

    // Data columns with consolidated CSS classes
    const dataColumns = config.columns.map((columnConfig) => {
        const isSelected = config.selectedColumn === columnConfig.key;
        const isPrimary = columnConfig.primary;

        // Generate consolidated class names
        const headerClasses = ['header-clickable'];
        if (isPrimary) headerClasses.push('header-primary');
        if (isSelected) headerClasses.push('header-selected');
        if (isPrimary && isSelected) headerClasses.push('header-primary-selected');

        const cellClasses = [];
        if (isPrimary) cellClasses.push('cell-primary');
        if (isSelected) cellClasses.push('cell-selected');
        if (isPrimary && isSelected) cellClasses.push('cell-primary-selected');

        return {
            title: (
                <div
                    className={headerClasses.join(' ')}
                    onClick={() => handleColumnSelect(columnConfig.key)}
                >
                    <div className="cell-numerical">
                        {columnConfig.label}
                        {isPrimary && (
                            <span className="cell-tag" style={{
                                fontSize: '9px',
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
            width: columnConfig.width || 120,
            align: columnConfig.align || 'center',
            className: `table-data-cell ${cellClasses.join(' ')}`.trim(),
            onHeaderCell: () => ({
                className: headerClasses.join(' '),
                onClick: () => handleColumnSelect(columnConfig.key)
            }),
            onCell: (record) => ({
                className: cellClasses.join(' '),
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
 */
const evaluateThresholds = (rowData, thresholds = [], cellValue = null) => {
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

        // Use cellValue for comparison, not rowData[field]
        const value = cellValue !== null ? cellValue : rowData[field];
        const thresholdValue = threshold.value;
        const upperValue = upperField ? rowData[upperField] : threshold.upperValue;

        let matches = false;

        // Evaluate threshold condition
        switch (comparison) {
            case 'gt':
                matches = value > thresholdValue;
                break;
            case 'gte':
                matches = value >= thresholdValue;
                break;
            case 'lt':
                matches = value < thresholdValue;
                break;
            case 'lte':
                matches = value <= thresholdValue;
                break;
            case 'eq':
                matches = value === thresholdValue;
                break;
            case 'ne':
                matches = value !== thresholdValue;
                break;
            case 'between':
                matches = value >= thresholdValue && value <= upperValue;
                break;
            case 'outside':
                matches = value < thresholdValue || value > upperValue;
                break;
            default:
                console.warn(`evaluateThresholds: Unknown comparison '${comparison}'`);
                return;
        }

        if (matches && colorRule) {
            // Apply color rule
            appliedStyle = {
                ...appliedStyle,
                ...colorRule
            };

            appliedRules.push({
                field,
                comparison,
                value: thresholdValue,
                upperValue,
                priority,
                description: description || `${field} ${comparison} ${thresholdValue}`,
                colorRule
            });
        }
    });

    // Add metadata about applied rules for debugging
    appliedStyle._appliedRules = appliedRules;

    return appliedStyle;
};

/**
 * Evaluate thresholds specifically for a cell value
 */
const evaluateCellThresholds = (value, rowData, thresholds = []) => {
    if (!thresholds || thresholds.length === 0) {
        return {};
    }

    return evaluateThresholds(rowData, thresholds, value);
};

// Export all functions
export { renderHeaderCell, generateMetricsTableColumns, evaluateThresholds, evaluateCellThresholds };