// src/components/tables/metrics/MetricsDataTable.jsx - Enhanced with header selection and improved formatting
import React, { useMemo, useCallback } from 'react';
import { Table, Tooltip, Tag, Typography } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { generateTableColumns, evaluateThresholds } from './TableConfiguration';
import { MetricsCell } from './MetricsCell';
import { validateTableData } from './DataOperations';

const { Text } = Typography;

/**
 * MetricsDataTable - Generalized metrics table with column selection and conditional formatting
 * Enhanced with header selection and improved primary column styling
 */
const MetricsDataTable = ({
    data = [],
    config = {},
    loading = false,
    ...tableProps
}) => {
    // Validate data structure (moved to after hooks declaration)
    const validationErrors = useMemo(() => {
        return validateTableData(data, config);
    }, [data, config]);

    // Generate table columns
    const tableColumns = useMemo(() => {
        return generateTableColumns(data, config);
    }, [data, config]);

    // Handle column selection (both cell and header clicks)
    const handleColumnSelect = useCallback((columnKey, rowData = null) => {
        if (!config.onColumnSelect) return;

        const column = config.columns.find(col => col.key === columnKey);
        if (!column) return;

        // Pass the value from valueField, or the column key if no valueField specified
        const value = column.valueField ? column.value : columnKey;
        config.onColumnSelect(value, columnKey, rowData);
    }, [config]);

    // Render header cell with tags and tooltips (improved inline layout)
    const renderHeaderCell = useCallback((rowData) => {
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
    }, []);

    // Generate table data with row keys
    const tableData = useMemo(() => {
        return data.map((row, index) => ({
            ...row,
            rowKey: row.key || `row-${index}`
        }));
    }, [data]);

    // Build final table columns array
    const finalColumns = useMemo(() => {
        // Header column (fixed left)
        const headerColumn = {
            title: 'Metric',
            dataIndex: 'header',
            key: 'header',
            fixed: 'left',
            width: 200,
            render: (_, record) => renderHeaderCell(record)
        };

        // Data columns with enhanced primary styling
        const dataColumns = config.columns.map(columnConfig => ({
            title: (
                <div
                    style={{
                        textAlign: 'center',
                        fontWeight: columnConfig.primary ? 600 : 500,
                        color: columnConfig.primary ? '#1677ff' : '#262626',
                        backgroundColor: columnConfig.primary ? '#e6f4ff' : 'transparent',
                        padding: '8px 6px',
                        borderRadius: '6px',
                        border: columnConfig.primary ? '2px solid #91caff' : 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    onClick={() => handleColumnSelect(columnConfig.key)} // Header click selection
                    onMouseEnter={(e) => {
                        if (!columnConfig.primary) {
                            e.target.style.backgroundColor = '#f5f5f5';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!columnConfig.primary) {
                            e.target.style.backgroundColor = 'transparent';
                        }
                    }}
                >
                    <div style={{ fontSize: '13px' }}>
                        {columnConfig.label}
                    </div>
                    {columnConfig.primary && (
                        <div style={{
                            fontSize: '9px',
                            color: '#1677ff',
                            marginTop: '2px',
                            fontWeight: 600
                        }}>
                            DEV
                        </div>
                    )}
                </div>
            ),
            dataIndex: columnConfig.key,
            key: columnConfig.key,
            width: columnConfig.width || 100,
            align: columnConfig.align || 'center',
            className: config.selectedColumn === columnConfig.key ? 'selected-column' : '',
            onHeaderCell: () => ({
                style: columnConfig.primary ? {
                    backgroundColor: '#e6f4ff',
                    borderColor: '#91caff',
                    borderWidth: '2px'
                } : {},
                onClick: () => handleColumnSelect(columnConfig.key) // Header cell click
            }),
            onCell: (record) => ({
                style: {
                    cursor: columnConfig.selectable && config.onColumnSelect ? 'pointer' : 'default',
                    backgroundColor: config.selectedColumn === columnConfig.key ? '#e6f7ff' :
                        columnConfig.primary ? '#f0f8ff' : 'transparent'
                },
                onClick: columnConfig.selectable && config.onColumnSelect ?
                    () => handleColumnSelect(columnConfig.key, record) : undefined
            }),
            render: (value, record) => (
                <MetricsCell
                    value={value}
                    rowData={record}
                    columnConfig={columnConfig}
                    isSelected={config.selectedColumn === columnConfig.key}
                    isPrimary={columnConfig.primary}
                />
            )
        }));

        return [headerColumn, ...dataColumns];
    }, [config, renderHeaderCell, handleColumnSelect]);

    // Default table props
    const defaultTableProps = {
        size: config.size || 'small',
        bordered: true,
        pagination: false,
        scroll: { x: 'max-content' },
        rowKey: 'rowKey'
    };

    // NOW do validation checks after all hooks are declared
    if (!config.columns || !Array.isArray(config.columns)) {
        console.error('MetricsDataTable: config.columns is required and must be an array');
        return <div>Invalid table configuration</div>;
    }

    if (validationErrors.length > 0) {
        console.warn('MetricsDataTable validation errors:', validationErrors);
    }

    return (
        <div className="metrics-data-table">
            {/* Enhanced CSS for selected columns and primary styling */}
            <style jsx>{`
                .selected-column {
                    background-color: #e6f7ff !important;
                }
                .metrics-data-table .ant-table-thead > tr > th.selected-column {
                    background-color: #bae7ff !important;
                }
                .metrics-data-table .ant-table-thead > tr > th {
                    padding: 4px 8px !important;
                }
                .metrics-data-table .ant-table-tbody > tr > td {
                    padding: 6px 8px !important;
                }
            `}</style>

            <Table
                columns={finalColumns}
                dataSource={tableData}
                loading={loading}
                {...defaultTableProps}
                {...tableProps}
            />
        </div>
    );
};

export default MetricsDataTable;