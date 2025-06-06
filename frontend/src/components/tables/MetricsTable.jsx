// src/components/tables/MetricsTable.jsx - Fix validation error handling
import React, { useMemo, useCallback } from 'react';
import { Table, Typography, Tooltip, Tag } from 'antd'; // Add Tag import
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTableTheme, composeTheme } from './shared/TableTheme';
import { ensureUniqueKeys, validateTableData } from './shared/TableDataOps';
import { MetricsCell } from './metrics/MetricsCell';

const { Text } = Typography;

/**
 * MetricsTable - Completely generic metrics table with shared theme integration
 * No finance-specific logic - purely driven by config
 */
const MetricsTable = ({
    data = [],
    config = {},
    loading = false,
    theme = 'metrics',
    customTheme = null,
    additionalCSS = '',
    containerClassName = '',
    tableClassName = '',
    ...tableProps
}) => {
    // Theme composition: base theme + card overrides
    const baseTableTheme = useTableTheme(customTheme || theme);
    const finalTheme = useMemo(() => {
        if (!additionalCSS && !containerClassName && !tableClassName) {
            return baseTableTheme;
        }

        return composeTheme(baseTableTheme, {
            containerClass: containerClassName,
            tableClass: tableClassName,
            additionalCSS
        });
    }, [baseTableTheme, additionalCSS, containerClassName, tableClassName]);

    // FIXED: Validate data structure using shared utilities
    const dataValidation = useMemo(() => {
        const validation = validateTableData(data, 'MetricsTable');
        return validation;
    }, [data]);

    // Ensure unique keys using shared utility
    const tableData = useMemo(() => {
        return ensureUniqueKeys(data, 'key');
    }, [data]);

    // Handle column selection (both cell and header clicks)
    const handleColumnSelect = useCallback((columnKey, rowData = null) => {
        if (!config.onColumnSelect) return;

        const column = config.columns.find(col => col.key === columnKey);
        if (!column) return;

        // Pass the value from valueField, or the column key if no valueField specified
        const value = column.valueField ? column.value : columnKey;
        config.onColumnSelect(value, columnKey, rowData);
    }, [config]);

    // Render metric header with tooltips and tags
    const renderMetricHeader = useCallback((record) => {
        const { label = '', tooltip, tags = [] } = record;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                    {/* FIXED: Use Ant Design Tag component with smaller font */}
                    {tags.length > 0 && tags.map((tag, index) => (
                        <Tag
                            key={index}
                            color={tag.color}
                            size="small"
                            style={{
                                fontSize: finalTheme.theme.name === 'compact' ? '9px' : '10px',
                                lineHeight: '14px',
                                margin: '0 2px'
                            }}
                        >
                            {tag.text}
                        </Tag>
                    ))}
                </div>
            </div>
        );
    }, [finalTheme]); // Add finalTheme dependency

    // Generate table columns using shared theme utilities
    const tableColumns = useMemo(() => {
        if (!config.columns || !Array.isArray(config.columns)) {
            return [];
        }

        // Header column (fixed left) - using shared pattern
        const headerColumn = {
            title: 'Metric',
            dataIndex: 'label',
            key: 'header',
            fixed: 'left',
            width: 200,
            render: (_, record) => renderMetricHeader(record)
        };

        // Data columns with shared theme integration
        const dataColumns = config.columns.map((columnConfig) => {
            const isSelected = config.selectedColumn === columnConfig.key;
            const isPrimary = columnConfig.primary;

            return {
                title: (
                    <div
                        style={{
                            textAlign: 'center',
                            fontWeight: isPrimary ? 600 : 500,
                            color: isPrimary ? finalTheme.token.colorPrimary : '#262626',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            padding: '6px 5px',
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
                                    color: finalTheme.token.colorPrimary,
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
                // Use shared theme utilities for header styling
                onHeaderCell: () => ({
                    className: isSelected ? 'selected-column-header' : '',
                    style: finalTheme.getHeaderStyle(isSelected, isPrimary),
                    onClick: () => handleColumnSelect(columnConfig.key)
                }),
                // Use shared theme utilities for cell styling
                onCell: (record) => ({
                    style: finalTheme.getSelectionStyle(isSelected, isPrimary),
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
    }, [config, handleColumnSelect, finalTheme, renderMetricHeader]);

    // Validation checks
    if (!config.columns || !Array.isArray(config.columns)) {
        console.error('MetricsTable: config.columns is required and must be an array');
        return <div>Invalid table configuration</div>;
    }

    // FIXED: Handle validation errors properly
    if (!dataValidation.isValid) {
        const errorMessage = Array.isArray(dataValidation.errors)
            ? dataValidation.errors.join(', ')
            : JSON.stringify(dataValidation.errors);
        console.error('MetricsTable validation errors:', dataValidation.errors);
        return <div>Invalid table data: {errorMessage}</div>;
    }

    return (
        <div className={finalTheme.containerClass}>
            {/* Apply theme CSS globally */}
            <style jsx global>{finalTheme.cssRules}</style>

            <Table
                className={finalTheme.tableClass}
                columns={tableColumns}
                dataSource={tableData}
                loading={loading}
                rowKey="key"
                pagination={false}
                size={finalTheme.tableProps.size}
                bordered={finalTheme.tableProps.bordered}
                scroll={{ x: 'max-content' }}
                {...tableProps}
            />
        </div>
    );
};

export default MetricsTable;