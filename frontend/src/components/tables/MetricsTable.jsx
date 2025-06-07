// src/components/tables/MetricsTable.jsx - Updated with consolidated classes
import React, { useMemo, useCallback } from 'react';
import { Table, Typography, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTableTheme, composeTheme, validateTableData, ensureUniqueKeys } from './shared';
import { MetricsCell } from './metrics/MetricsCell';

const { Text } = Typography;

/**
 * MetricsTable - Enhanced metrics table with consolidated CSS classes
 */
const MetricsTable = ({
    data = [],
    config = {},
    loading = false,
    theme = 'metrics',
    customTheme = null,
    additionalStyles = {},
    additionalCSS = '',
    containerClassName = '',
    tableClassName = '',
    ...tableProps
}) => {
    // Theme composition: base theme + overrides
    const baseTableTheme = useTableTheme(customTheme || theme);
    const finalTheme = useMemo(() => {
        return composeTheme(baseTableTheme, {
            additionalStyles,
            additionalCSS,
            containerClassName,
            tableClassName
        });
    }, [baseTableTheme, additionalStyles, additionalCSS, containerClassName, tableClassName]);

    // Data validation
    const dataValidation = useMemo(() => {
        return validateTableData(data);
    }, [data]);

    const tableData = useMemo(() => {
        if (!dataValidation.isValid || !Array.isArray(data)) return [];
        return data.map((row, index) => ({
            ...row,
            key: row.key || `row-${index}`
        }));
    }, [data, dataValidation.isValid]);

    // Column selection handler
    const handleColumnSelect = useCallback((columnKey, rowData = null) => {
        if (!config.onColumnSelect) return;
        const value = rowData && rowData[columnKey] !== undefined ?
            rowData[columnKey] :
            columnKey;
        config.onColumnSelect(value, columnKey, rowData);
    }, [config]);

    // Generate CSS classes for columns based on state - CONSOLIDATED
    const getColumnClasses = useCallback((columnConfig, isSelected, isPrimary) => {
        const classes = [];

        if (columnConfig.selectable) classes.push('header-clickable');
        if (isPrimary) classes.push('cell-primary');
        if (isSelected) classes.push('cell-selected');
        if (isPrimary && isSelected) classes.push('cell-primary-selected');

        return classes.length > 0 ? classes.join(' ') : undefined;
    }, []);

    // Generate CSS classes for headers based on state - CONSOLIDATED  
    const getHeaderClasses = useCallback((columnConfig, isSelected, isPrimary) => {
        const classes = ['header-clickable']; // Always clickable for metrics

        if (isPrimary) classes.push('header-primary');
        if (isSelected) classes.push('header-selected');
        if (isPrimary && isSelected) classes.push('header-primary-selected');

        return classes.join(' ');
    }, []);

    // Render metric header with consolidated classes
    const renderMetricHeader = useCallback((record) => {
        const { label = '', tooltip, tags = [] } = record;

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
    }, []);

    // Generate table columns using consolidated classes
    const tableColumns = useMemo(() => {
        if (!config.columns || !Array.isArray(config.columns)) {
            return [];
        }

        // Header column (fixed left) - using consolidated classes
        const headerColumn = {
            title: 'Metric',
            dataIndex: 'label',
            key: 'header',
            fixed: 'left',
            width: 200,
            className: 'table-header-cell',
            render: (_, record) => renderMetricHeader(record)
        };

        // Data columns with consolidated CSS classes
        const dataColumns = config.columns.map((columnConfig) => {
            const isSelected = config.selectedColumn === columnConfig.key;
            const isPrimary = columnConfig.primary;

            return {
                title: (
                    <div
                        className={getHeaderClasses(columnConfig, isSelected, isPrimary)}
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
                className: `table-data-cell ${getColumnClasses(columnConfig, isSelected, isPrimary) || ''}`.trim(),
                // Use consolidated CSS classes for cell styling
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