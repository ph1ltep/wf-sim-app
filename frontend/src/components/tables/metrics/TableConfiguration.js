// src/components/tables/metrics/TableConfiguration.js - v3.0 OPTIMIZED: Eliminate double styling

import React from 'react';
import { Typography, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { MetricsCell } from './MetricsCell';
import {
    getCellClasses,
    getMarkerStyles
} from '../shared/TableThemeEngine';

const { Text } = Typography;

/**
 * Render header cell with OPTIMIZED minimal inner styling
 * NOTE: Semantic classes applied to outer <td> via onCell, not here
 */
const renderHeaderCell = (rowData) => {
    const { label = '', tooltip, tags = [] } = rowData;

    // OPTIMIZED: Simple content wrapper, no duplicate classes
    return (
        <div className="content-inner">
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

                {tags.length > 0 && tags.map((tag, index) => (
                    <Tag
                        key={index}
                        color={tag.color}
                        size="small"
                        className="content-tag"
                    >
                        {tag.text}
                    </Tag>
                ))}
            </div>
        </div>
    );
};

/**
 * Generate table columns with OPTIMIZED class hierarchy (no double styling)
 */
export const generateMetricsTableColumns = (data, config, handleColumnSelect) => {
    if (!config.columns || !Array.isArray(config.columns)) {
        console.warn('generateMetricsTableColumns: No columns configuration provided');
        return [];
    }

    const columns = [];
    const orientation = 'horizontal'; // MetricsTable is always horizontal
    const totalCols = config.columns.length + 1;
    const totalRows = data.length;

    // OPTIMIZED: Header column - semantic classes applied to outer elements only
    const headerColumn = {
        title: (
            // OPTIMIZED: Simple title content, no duplicate classes
            <div className="content-inner">
                Metric
            </div>
        ),
        dataIndex: 'header',
        key: 'header',
        fixed: 'left',
        width: 200,
        onHeaderCell: () => {
            // Apply semantic classes to <th> element
            const headerClasses = getCellClasses({
                position: {
                    rowIndex: 0,
                    colIndex: 0,
                    totalRows: 1,
                    totalCols,
                    isHeaderRow: true,
                    isHeaderCol: true,
                    orientation
                },
                states: {},
                marker: null,
                orientation
            });

            return { className: headerClasses };
        },
        onCell: (record, recordIndex) => {
            // Apply semantic classes to <td> elements (metric label cells = subheaders)
            const cellClasses = getCellClasses({
                position: {
                    rowIndex: recordIndex || 0,
                    colIndex: 0,
                    totalRows,
                    totalCols,
                    isHeaderRow: false,
                    isHeaderCol: true,
                    orientation
                },
                states: {},
                marker: null,
                orientation
            });

            return { className: cellClasses };
        },
        render: (_, record) => renderHeaderCell(record)
    };

    columns.push(headerColumn);

    // OPTIMIZED: Data columns with no double styling
    const dataColumns = config.columns.map((columnConfig, colIndex) => {
        const isSelected = config.selectedColumn === columnConfig.key;
        const isPrimary = columnConfig.primary;

        const columnStates = {
            selected: isSelected,
            primary: isPrimary
        };

        return {
            title: (
                // OPTIMIZED: Simple title content wrapper
                <div
                    className="content-inner"
                    style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s'
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
            onHeaderCell: () => {
                // Apply semantic classes to <th> element
                const headerClasses = getCellClasses({
                    position: {
                        rowIndex: 0,
                        colIndex: colIndex + 1,
                        totalRows: 1,
                        totalCols,
                        isHeaderRow: true,
                        isHeaderCol: false,
                        orientation
                    },
                    states: columnStates,
                    marker: null,
                    orientation
                });

                return {
                    className: headerClasses,
                    onClick: () => handleColumnSelect(columnConfig.key)
                };
            },
            onCell: (record, rowIndex) => {
                // Apply semantic classes to <td> elements
                const cellClasses = getCellClasses({
                    position: {
                        rowIndex: rowIndex || 0,
                        colIndex: colIndex + 1,
                        totalRows,
                        totalCols,
                        isHeaderRow: false,
                        isHeaderCol: false,
                        orientation
                    },
                    states: columnStates,
                    marker: null,
                    orientation
                });

                return {
                    className: cellClasses,
                    onClick: columnConfig.selectable && config.onColumnSelect ?
                        () => handleColumnSelect(columnConfig.key, record) : undefined
                };
            },
            render: (value, record, rowIndex) => (
                // OPTIMIZED: MetricsCell wrapped in content-inner
                <div className="content-inner">
                    <MetricsCell
                        value={value}
                        rowData={record}
                        columnConfig={columnConfig}
                        isSelected={isSelected}
                        isPrimary={isPrimary}
                        position={{
                            rowIndex: rowIndex || 0,
                            colIndex: colIndex + 1,
                            totalRows,
                            totalCols,
                            isHeaderRow: false,
                            isHeaderCol: false,
                            orientation
                        }}
                        states={columnStates}
                    />
                </div>
            )
        };
    });

    return [...columns, ...dataColumns];
};

// Keep evaluateThresholds function unchanged
export const evaluateThresholds = (rowData, thresholds = [], cellValue = null) => {
    if (!thresholds || thresholds.length === 0) {
        return {};
    }

    const sortedThresholds = [...thresholds].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let appliedStyle = {};
    let appliedRules = [];

    sortedThresholds.forEach(threshold => {
        const { field, comparison, colorRule, upperField, priority = 0, description } = threshold;

        if (!rowData.hasOwnProperty(field)) {
            console.warn(`evaluateThresholds: Field '${field}' not found in row data`);
            return;
        }

        const value = cellValue !== null ? cellValue : rowData[field];

        if (value === null || value === undefined) return;

        let conditionMet = false;
        const numValue = parseFloat(value);
        const compareValue = upperField && rowData[upperField] !== undefined
            ? parseFloat(rowData[upperField])
            : parseFloat(threshold.value || 0);

        if (isNaN(numValue) || isNaN(compareValue)) return;

        switch (comparison) {
            case 'greater_than':
                conditionMet = numValue > compareValue;
                break;
            case 'less_than':
                conditionMet = numValue < compareValue;
                break;
            case 'equal_to':
                conditionMet = Math.abs(numValue - compareValue) < 0.001;
                break;
            case 'greater_equal':
                conditionMet = numValue >= compareValue;
                break;
            case 'less_equal':
                conditionMet = numValue <= compareValue;
                break;
            default:
                console.warn(`Unknown comparison operator: ${comparison}`);
                return;
        }

        if (conditionMet && colorRule) {
            if (priority >= (appliedStyle._priority || 0)) {
                appliedStyle = {
                    color: colorRule.textColor || appliedStyle.color,
                    backgroundColor: colorRule.backgroundColor || appliedStyle.backgroundColor,
                    fontWeight: colorRule.bold ? 'bold' : appliedStyle.fontWeight,
                    _priority: priority,
                    _appliedRules: [...appliedRules, description || `${field} ${comparison} ${compareValue}`]
                };
            }
        }
    });

    return appliedStyle;
};