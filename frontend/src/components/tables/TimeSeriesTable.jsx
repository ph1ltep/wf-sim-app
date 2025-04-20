// src/components/tables/TimeSeriesTable.jsx
import React, { useMemo } from 'react';
import { Typography, Space, Tooltip } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';
import EditableTable from './EditableTable';
import { createTimeSeriesColumns, createTimeSeriesSummary } from './timeSeriesColumns';
import { useScenario } from '../../contexts/ScenarioContext';

const { Text } = Typography;

/**
 * Time Series Table component for editing year/value data points
 * Built on top of EditableTable to leverage context integration
 * 
 * @param {string[]} path Path to the data array in context
 * @param {string} valueLabel Label for the value column
 * @param {string} valueType Type of value (number, percentage, currency)
 * @param {number} precision Decimal precision for values
 * @param {string} addonAfter Unit to display after values
 * @param {number} minYear Minimum allowed year
 * @param {number} maxYear Maximum allowed year
 * @param {React.ReactNode} additionalFormFields Additional form fields to render in add/edit modal
 * @param {boolean} disableEditing Whether to disable editing functionality
 * @param {Object} tableProps Additional props to pass to EditableTable
 */
const TimeSeriesTable = ({
    path,
    valueLabel = 'Value',
    valueType = 'number',
    precision = 2,
    addonAfter = '',
    minYear = 1900,
    maxYear = 2100,
    additionalFormFields = null,
    disableEditing = false,
    dataCount,
    showDataCount = true,
    ...tableProps
}) => {
    // Create time series columns
    const columns = useMemo(() => {
        return createTimeSeriesColumns(
            valueType,
            valueLabel,
            addonAfter,
            precision,
            minYear,
            maxYear
        );
    }, [valueType, valueLabel, addonAfter, precision, minYear, maxYear]);

    // Custom render for summary
    const renderSummary = (dataSource) => {
        // Ensure dataSource is an array
        if (!dataSource || !Array.isArray(dataSource) || dataSource.length === 0) {
            return null;
        }

        const summary = createTimeSeriesSummary(dataSource, valueType, precision);
        if (!summary) return null;

        return {
            year: summary.yearContent,
            value: summary.valueContent
        };
    };

    // Create form fields for year and value inputs
    const formFields = useMemo(() => {
        // Import the field components only if we need them
        const { NumberField } = require('../contextFields');

        const baseFields = (
            <>
                <NumberField
                    path="year"
                    label="Year"
                    min={minYear}
                    max={maxYear}
                    step={1}
                    precision={0}
                    required
                />

                {valueType === 'percentage' ? (
                    <NumberField
                        path="value"
                        label={valueLabel}
                        addonAfter="%"
                        min={0}
                        max={100}
                        step={0.1}
                        precision={precision}
                        required
                    />
                ) : valueType === 'currency' ? (
                    <NumberField
                        path="value"
                        label={valueLabel}
                        prefix="$"
                        step={1}
                        precision={precision}
                        required
                    />
                ) : (
                    <NumberField
                        path="value"
                        label={valueLabel}
                        addonAfter={addonAfter}
                        step={1}
                        precision={precision}
                        required
                    />
                )}

                {additionalFormFields}
            </>
        );

        return baseFields;
    }, [valueType, valueLabel, addonAfter, precision, minYear, maxYear, additionalFormFields]);

    // Calculate data count
    const actualDataCount = typeof dataCount === 'number' ? dataCount : null;

    // Get data from context with proper fallback
    const { getValueByPath } = useScenario();
    const timeSeriesData = useMemo(() => {
        const data = getValueByPath(path, []);
        // Ensure we always have a valid array for the Table component
        return Array.isArray(data) ? data : [];
    }, [getValueByPath, path]);

    return (
        <div className="time-series-table">
            <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Space>
                        <LineChartOutlined />
                        <Text strong>Time Series Data</Text>
                        {showDataCount && actualDataCount !== null && (
                            <Text type="secondary">({actualDataCount} points)</Text>
                        )}
                    </Space>
                </div>

                <EditableTable
                    path={path}
                    columns={columns}
                    formFields={formFields}
                    itemName="Data Point"
                    addButtonText="Add Year"
                    keyField="year" // Use year as the key field
                    tableSize="small"
                    showSummary={true}
                    renderSummary={renderSummary}
                    pagination={false}
                    showAddButton={!disableEditing}
                    autoActions={!disableEditing}
                    // Ensure dataSource is valid (added for debugging)
                    initialData={[]} // Provide a default empty array to EditableTable
                    {...tableProps}
                />
            </Space>
        </div>
    );
};

export default TimeSeriesTable;