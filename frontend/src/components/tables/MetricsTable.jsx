// src/components/tables/MetricsTable.jsx - Updated with consolidated classes
import React, { useMemo, useCallback } from 'react';
import { Table, Typography, Tag, Tooltip } from 'antd';
import { InfoCircleOutlined, DollarOutlined, SafetyOutlined } from '@ant-design/icons';
import { useTableTheme, composeTheme, validateTableData, ensureUniqueKeys, getRowClasses } from './shared';
import { MetricsCell, generateMetricsTableColumns } from './metrics';

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

    // Data validation - ADDED
    const dataValidation = useMemo(() => {
        return validateTableData(data, 'MetricsTable');
    }, [data]);

    const tableData = useMemo(() => {
        if (!dataValidation.isValid || !Array.isArray(data)) return [];
        return ensureUniqueKeys(data, 'key');
    }, [data, dataValidation.isValid]);


    // Column selection handler
    const handleColumnSelect = useCallback((key, rowData = null, columnConfig = null) => {
        if (!config.onColumnSelect) return;
        // Pass the key (percentile) directly, not cell value
        config.onColumnSelect(key, columnConfig?.key || key, rowData);
        config.selectedColumn = key;
    }, [config]);

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

    // Generate table columns using refactored semantic engine
    const tableColumns = useMemo(() => {
        return generateMetricsTableColumns(tableData, config, handleColumnSelect);
    }, [tableData, config, handleColumnSelect]);

    // Validation checks
    if (!config.columns || !Array.isArray(config.columns)) {
        console.error('MetricsTable: config.columns is required and must be an array');
        return <div>Invalid table configuration</div>;
    }

    if (!dataValidation.isValid) {
        const errorMessage = Array.isArray(dataValidation.errors)
            ? dataValidation.errors.join(', ')
            : JSON.stringify(dataValidation.errors);
        console.error('MetricsTable validation errors:', dataValidation.errors);
        return <div>Invalid table data: {errorMessage}</div>;
    }


    return (
        <div className={finalTheme.containerClass}>
            {/* FIXED: Add missing CSS injection */}
            <style jsx global>{finalTheme.cssRules}</style>

            <Table
                className={finalTheme.tableClass}
                columns={tableColumns} // Will fix in TC tasks
                dataSource={tableData}
                loading={loading}
                rowKey="key"
                pagination={false}
                size={finalTheme.tableProps.size}
                bordered={finalTheme.tableProps.bordered}
                scroll={{ x: 'max-content' }}
                onRow={(record) => ({
                    className: getRowClasses('horizontal') // MetricsTable is always horizontal
                })}
                {...tableProps}
            />
        </div>
    );
};

export default MetricsTable;