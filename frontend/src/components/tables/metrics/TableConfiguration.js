// src/components/tables/metrics/TableConfiguration.js - v3.0 CORRECTED: Fix subheader vs header logic

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
 * Render header cell with CORRECTED class hierarchy
 * This is for the actual table header, not subheader
 */
const renderHeaderCell = (rowData) => {
    const { label = '', tooltip, tags = [] } = rowData;

    // CORRECTED: This is for the metric labels (first column), which should be subheaders, not headers
    const headerClasses = getCellClasses({
        position: {
            rowIndex: 0, // This will vary per cell
            colIndex: 0,
            totalRows: 1, // Will be corrected in onCell
            totalCols: 1, // Will be corrected in onCell  
            isHeaderRow: false,  // CORRECTED: This is NOT a table header row
            isHeaderCol: true,   // CORRECTED: This IS the first column (subheader)
            orientation: 'horizontal'
        },
        states: {},
        marker: null,
        orientation: 'horizontal'
    });

    return (
        <div className={headerClasses}>
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
 * Generate table columns with CORRECTED class hierarchy and mutual exclusivity
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

    // CORRECTED: Header column - this contains the metric labels (subheaders)
    const headerColumn = {
        title: 'Metric',
        dataIndex: 'header',
        key: 'header',
        fixed: 'left',
        width: 200,
        onHeaderCell: () => {
            // CORRECTED: This is the actual table header cell
            const headerClasses = getCellClasses({
                position: {
                    rowIndex: 0,
                    colIndex: 0,
                    totalRows: 1, // Header row
                    totalCols,
                    isHeaderRow: true,   // CORRECTED: This IS a table header
                    isHeaderCol: true,   // CORRECTED: This IS a header column
                    orientation
                },
                states: {},
                marker: null,
                orientation
            });

            return { className: headerClasses };
        },
        onCell: (record, recordIndex) => {
            // CORRECTED: These are the metric label cells (subheaders in first column)
            const cellClasses = getCellClasses({
                position: {
                    rowIndex: recordIndex || 0,
                    colIndex: 0,
                    totalRows,
                    totalCols,
                    isHeaderRow: false,  // CORRECTED: NOT a header row
                    isHeaderCol: true,   // CORRECTED: IS the first column (makes it subheader)
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

    // CORRECTED: Data columns with proper header vs cell distinction
    const dataColumns = config.columns.map((columnConfig, colIndex) => {
        const isSelected = config.selectedColumn === columnConfig.key;
        const isPrimary = columnConfig.primary;

        const columnStates = {
            selected: isSelected,
            primary: isPrimary
        };

        return {
            title: (
                <div
                    className={getCellClasses({
                        position: {
                            rowIndex: 0,
                            colIndex: colIndex + 1,
                            totalRows: 1, // Header row
                            totalCols,
                            isHeaderRow: true,   // CORRECTED: This IS a table header
                            isHeaderCol: false,  // CORRECTED: This is NOT the first column
                            orientation
                        },
                        states: columnStates,
                        marker: null,
                        orientation
                    })}
                    style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => handleColumnSelect(columnConfig.key)}
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
                // CORRECTED: Column headers (actual table headers)
                const headerClasses = getCellClasses({
                    position: {
                        rowIndex: 0,
                        colIndex: colIndex + 1,
                        totalRows: 1,
                        totalCols,
                        isHeaderRow: true,   // CORRECTED: IS a header row
                        isHeaderCol: false,  // CORRECTED: NOT the first column
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
                // CORRECTED: Regular data cells (not headers, not subheaders)
                const cellClasses = getCellClasses({
                    position: {
                        rowIndex: rowIndex || 0,
                        colIndex: colIndex + 1,
                        totalRows,
                        totalCols,
                        isHeaderRow: false,  // CORRECTED: NOT a header row
                        isHeaderCol: false,  // CORRECTED: NOT the first column
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