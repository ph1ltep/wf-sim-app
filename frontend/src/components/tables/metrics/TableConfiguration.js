// src/components/tables/metrics/TableConfiguration.js - v3.1 FIXED: Semantic engine integration

import React from 'react';
import { Typography, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { MetricsCell } from './MetricsCell';
import {
    getCellClasses,
    getMarkerStyles
} from '../shared/TableThemeEngine';
import { get } from 'lodash';

const { Text } = Typography;

/**
 * Render header cell with semantic classes applied by parent
 */
const renderHeaderCell = (rowData) => {
    const { label = '', tooltip, tags = [] } = rowData;

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
 * Generate table columns using semantic class engine
 */
// frontend/src/components/tables/metrics/TableConfiguration.js - FIXED theming integration
/**
 * Generate table columns using semantic class engine - KEEP EXACT STRUCTURE
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

    // Header column (metric labels) - using semantic classes - KEEP EXACT
    const headerColumn = {
        title: (
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

    // Data columns with semantic class engine - KEEP EXACT STRUCTURE
    const dataColumns = config.columns.map((columnConfig, colIndex) => {
        const isSelected = config.selectedColumn === columnConfig.key;

        // Use marker from config (no built-in primary logic)
        const marker = columnConfig.marker || null;

        const columnStates = { selected: isSelected };

        return {
            title: (
                <div
                    className="content-inner"
                    style={{
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => handleColumnSelect(columnConfig.value || columnConfig.key)}
                >
                    <div style={{ fontSize: '13px' }}>
                        {columnConfig.label}
                        {/* FIXED: Render marker tag instead of primary text */}
                        {marker && marker.tag && (
                            <Tag
                                className="content-tag"
                                color={marker.color}
                                size="small"
                                style={{ marginLeft: '4px' }}
                            >
                                {marker.tag}
                            </Tag>
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
                    marker,
                    orientation
                });

                return {
                    className: headerClasses,
                    style: getMarkerStyles(marker),
                    onClick: () => handleColumnSelect(columnConfig.value || columnConfig.key, null, columnConfig)
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
                    marker,
                    orientation
                });

                return {
                    className: cellClasses,
                    style: getMarkerStyles(marker),
                    onClick: columnConfig.selectable && config.onColumnSelect ?
                        () => handleColumnSelect(columnConfig.value || columnConfig.key, record, columnConfig) : undefined
                };
            },
            render: (cellData, record, rowIndex) => {
                // ONLY CHANGE: Extract value and formatter
                if (!cellData) {
                    return <span>-</span>;
                }

                const extractField = cellData._extractedField || 'value';
                const formatter = cellData._formatter;
                const rawValue = get(cellData, extractField);

                return (
                    <div className="content-inner">
                        <MetricsCell
                            value={rawValue} // Pass extracted value
                            formatter={formatter} // Pass formatter
                            rowData={record}
                            columnConfig={columnConfig}
                            isSelected={isSelected}
                            isPrimary={columnConfig.primary}
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
                );
            }
        };
    });

    return [...columns, ...dataColumns];
};

// Keep evaluateThresholds function unchanged - it's working correctly
export const evaluateThresholds = (rowData, thresholds = [], cellValue = null) => {
    if (!thresholds || thresholds.length === 0) {
        return {};
    }


    const sortedThresholds = [...thresholds].sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let appliedStyle = {};
    let appliedRules = [];

    sortedThresholds.forEach(threshold => {
        const { field, comparison, colorRule, priority = 0, description } = threshold;

        // const isDSCR = rowData.key === 'dscr';
        // if (isDSCR) {
        //     console.log('🔍 DSCR Deep Debug:', {
        //         field: field,
        //         'rowData[field]': rowData[field],
        //         'typeof rowData[field]': typeof rowData[field],
        //         'rowData[field] === undefined': rowData[field] === undefined,
        //         'rowData[field] === null': rowData[field] === null,
        //         'rowData[field] === ""': rowData[field] === "",
        //         'String(rowData[field])': String(rowData[field]),
        //         'parseFloat(rowData[field])': parseFloat(rowData[field]),
        //         'Number(rowData[field])': Number(rowData[field]),
        //         'JSON.stringify(rowData[field])': JSON.stringify(rowData[field]),
        //         'rowData keys': Object.keys(rowData),
        //         'full rowData': rowData
        //     });
        // }

        if (!rowData.hasOwnProperty(field)) {
            console.warn(`evaluateThresholds: Field '${field}' not found in row data`);
            return;
        }

        const value = cellValue !== null ? cellValue : rowData[field];

        if (value === null || value === undefined) return;

        let conditionMet = false;
        const numValue = parseFloat(cellValue !== null ? cellValue : 0); // Cell value
        const compareValue = parseFloat(rowData[field]); // Threshold reference value


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
            case 'below':  // Add support for FinanceabilityConfig usage
                conditionMet = numValue < compareValue;
                break;
            case 'above':  // Add support for FinanceabilityConfig usage
                conditionMet = numValue > compareValue;
                break;
            default:
                console.warn(`Unknown comparison operator: ${comparison}`);
                return;
        }

        if (conditionMet && colorRule) {
            if (priority >= (appliedStyle._priority || 0)) {
                const result = typeof colorRule === 'function' ?
                    colorRule(numValue, compareValue) :
                    colorRule;

                if (result) {
                    appliedStyle = {
                        color: result.color || appliedStyle.color,
                        backgroundColor: result.backgroundColor || appliedStyle.backgroundColor,
                        fontWeight: result.fontWeight || appliedStyle.fontWeight,
                        _priority: priority,
                        _appliedRules: [...appliedRules, description || `${field} ${comparison} ${compareValue}`]
                    };
                }
            }
        }
    });

    return appliedStyle;
};