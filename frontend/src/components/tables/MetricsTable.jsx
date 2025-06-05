// src/components/tables/MetricsTable.jsx - Renamed and moved from metrics/MetricsDataTable.jsx
import React, { useMemo, useCallback } from 'react';
import { Table, Typography } from 'antd';
import { generateMetricsTableColumns } from './metrics/TableConfiguration';
import { validateTableData } from './metrics/DataOperations';

const { Text } = Typography;

/**
 * MetricsTable - Generalized metrics table with column selection and conditional formatting
 * Aligned with InlineEditTable patterns for consistency
 */
const MetricsTable = ({
    data = [],
    config = {},
    loading = false,
    ...tableProps
}) => {
    // Validate data structure
    const validationErrors = useMemo(() => {
        return validateTableData(data, config);
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

    // Generate table columns using aligned pattern
    const tableColumns = useMemo(() => {
        if (!config.columns || !Array.isArray(config.columns)) {
            return [];
        }

        return generateMetricsTableColumns(
            data,
            config,
            handleColumnSelect
        );
    }, [data, config, handleColumnSelect]);

    // Generate table data with row keys
    const tableData = useMemo(() => {
        return data.map((row, index) => ({
            ...row,
            rowKey: row.key || `row-${index}`
        }));
    }, [data]);

    // Default table props
    const defaultTableProps = {
        size: config.size || 'small',
        bordered: true,
        pagination: false,
        scroll: { x: 'max-content' },
        rowKey: 'rowKey'
    };

    // Validation checks
    if (!config.columns || !Array.isArray(config.columns)) {
        console.error('MetricsTable: config.columns is required and must be an array');
        return <div>Invalid table configuration</div>;
    }

    if (validationErrors.length > 0) {
        console.warn('MetricsTable validation errors:', validationErrors);
    }

    return (
        <div className="metrics-table">
            {/* ALIGNED: CSS to match InlineEditTable spacing and patterns */}
            <style jsx>{`
                .metrics-table .ant-table-thead > tr > th {
                    padding: 4px 8px !important; /* Align with InlineEditTable */
                    border-bottom: 1px solid #f0f0f0 !important;
                }
                .metrics-table .ant-table-tbody > tr > td {
                    padding: 6px 8px !important; /* Align with InlineEditTable */
                }
                .metrics-table .ant-table-thead {
                    background: #fafafa;
                }
                /* Remove gap between header and body - align with InlineEditTable */
                .metrics-table .ant-table-thead > tr > th::before {
                    display: none !important;
                }
                .metrics-table .ant-table-container {
                    border-top: none !important;
                }
                /* REMOVED: Custom selection indicators to use InlineEditTable pattern only */
            `}</style>

            <Table
                columns={tableColumns}
                dataSource={tableData}
                loading={loading}
                {...defaultTableProps}
                {...tableProps}
            />
        </div>
    );
};

export default MetricsTable;