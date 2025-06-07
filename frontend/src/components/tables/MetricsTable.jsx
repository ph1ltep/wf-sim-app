// src/components/tables/MetricsTable.jsx - Updated to use CSS-in-JS theme system
import React, { useMemo, useCallback } from 'react';
import { Table, Typography, Tooltip, Tag } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTableTheme, composeTheme } from './shared/TableThemeEngine';
import { ensureUniqueKeys, validateTableData } from './shared/TableDataOps';
import { MetricsCell } from './metrics/MetricsCell';

const { Text } = Typography;

/**
 * MetricsTable - Generic metrics table with CSS-in-JS theme integration
 */
const MetricsTable = ({
    data = [],
    config = {},
    loading = false,
    theme = 'metrics', // Default to metrics theme
    customTheme = null,
    additionalCSS = '',
    additionalStyles = {},
    containerClassName = '',
    tableClassName = '',
    ...tableProps
}) => {
    // Theme composition: base theme + card overrides
    const baseTableTheme = useTableTheme(customTheme || theme);
    const finalTheme = useMemo(() => {
        if (!additionalCSS && !additionalStyles && !containerClassName && !tableClassName) {
            return baseTableTheme;
        }

        return composeTheme(baseTableTheme, {
            containerClass: containerClassName,
            tableClass: tableClassName,
            additionalCSS,
            additionalStyles
        });
    }, [baseTableTheme, additionalCSS, additionalStyles, containerClassName, tableClassName]);


    console.log('🎨 Theme Debug:', {
        themeName: finalTheme.theme?.name,
        containerClass: finalTheme.containerClass,
        cssRules: finalTheme.cssRules,
        styles: finalTheme.styles
    });

    // Validate data structure using shared utilities
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

    // Generate CSS classes for columns based on state
    const getColumnClasses = useCallback((columnConfig, isSelected, isPrimary) => {
        const classes = [];

        if (columnConfig.selectable) classes.push('cell-selectable');
        if (isPrimary) classes.push('cell-primary');
        if (isSelected) classes.push('cell-selected');
        if (isPrimary && isSelected) classes.push('cell-primary-selected');

        return classes.length > 0 ? classes.join(' ') : undefined;
    }, []);

    // Generate CSS classes for headers based on state
    const getHeaderClasses = useCallback((columnConfig, isSelected, isPrimary) => {
        const classes = [];

        if (columnConfig.selectable) classes.push('header-selectable');
        if (isPrimary) classes.push('header-primary');
        if (isSelected) classes.push('header-selected');
        if (isPrimary && isSelected) classes.push('header-primary-selected');

        return classes.length > 0 ? classes.join(' ') : undefined;
    }, []);

    // Render metric header with tooltips and tags
    const renderMetricHeader = useCallback((record) => {
        const { label = '', tooltip, tags = [] } = record;

        return (
            <div className="metric-label">
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
                            className="metric-tag"
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
    }, [finalTheme]);

    // Generate table columns using CSS-in-JS theme system
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
            className: 'table-header-cell metric-label-column',
            render: (_, record) => renderMetricHeader(record)
        };

        // Data columns with CSS-in-JS theme integration
        const dataColumns = config.columns.map((columnConfig) => {
            const isSelected = config.selectedColumn === columnConfig.key;
            const isPrimary = columnConfig.primary;

            return {
                title: (
                    <div
                        className={getHeaderClasses(columnConfig, isSelected, isPrimary)}
                        style={{
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            padding: '6px 5px',
                            borderRadius: '4px'
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
                className: `table-data-cell ${getColumnClasses(columnConfig, isSelected, isPrimary) || ''}`.trim(),
                // Use CSS classes instead of inline styles for selection
                onHeaderCell: () => ({
                    className: getHeaderClasses(columnConfig, isSelected, isPrimary),
                    onClick: () => handleColumnSelect(columnConfig.key)
                }),
                onCell: (record) => ({
                    className: getColumnClasses(columnConfig, isSelected, isPrimary),
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
    }, [config, handleColumnSelect, renderMetricHeader, getColumnClasses, getHeaderClasses]);

    // Validation checks
    if (!config.columns || !Array.isArray(config.columns)) {
        console.error('MetricsTable: config.columns is required and must be an array');
        return <div>Invalid table configuration</div>;
    }

    // Handle validation errors properly
    if (!dataValidation.isValid) {
        const errorMessage = Array.isArray(dataValidation.errors)
            ? dataValidation.errors.join(', ')
            : JSON.stringify(dataValidation.errors);
        console.error('MetricsTable validation errors:', dataValidation.errors);
        return <div>Invalid table data: {errorMessage}</div>;
    }

    return (
        <div className={`${finalTheme.containerClass}`.trim()}>
            {/* Apply theme CSS globally */}
            <style jsx global>{finalTheme.cssRules}</style>

            <Table
                className={`${finalTheme.tableClass}`.trim()}
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