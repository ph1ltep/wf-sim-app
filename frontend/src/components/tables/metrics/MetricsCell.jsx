// src/components/tables/metrics/MetricsCell.jsx - Cell rendering component for MetricsDataTable
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { evaluateCellThresholds } from './TableConfiguration';

const { Text } = Typography;

/**
 * MetricsCell - Renders individual table cells with formatting and conditional styling
 * 
 * @param {any} value - Cell value to display
 * @param {Object} rowData - Complete row data object
 * @param {Object} columnConfig - Column configuration object
 * @param {boolean} isSelected - Whether this column is currently selected
 * @param {boolean} isPrimary - Whether this is the primary column
 */
export const MetricsCell = ({
    value,
    rowData,
    columnConfig,
    isSelected = false,
    isPrimary = false
}) => {
    // Apply formatting if formatter is provided
    const formattedValue = useMemo(() => {
        if (columnConfig.formatter && typeof columnConfig.formatter === 'function') {
            try {
                return columnConfig.formatter(value, rowData);
            } catch (error) {
                console.error('MetricsCell: Error applying formatter:', error);
                return value;
            }
        }

        // Default formatting for null/undefined values
        if (value === null || value === undefined) {
            return '-';
        }

        return value;
    }, [value, rowData, columnConfig.formatter]);

    // Evaluate thresholds for conditional styling
    const thresholdStyles = useMemo(() => {
        if (!rowData.thresholds || !Array.isArray(rowData.thresholds)) {
            return {};
        }

        return evaluateCellThresholds(value, rowData, rowData.thresholds);
    }, [value, rowData]);

    // Combine base styles with threshold styles
    const cellStyle = useMemo(() => {
        const baseStyle = {
            fontSize: '14px', // Ant Design standard - align with InlineEditTable
            lineHeight: '22px', // Ant Design standard - align with InlineEditTable
            fontWeight: isPrimary ? 500 : 400, // Align with InlineEditTable weight scale
            transition: 'all 0.2s ease'
        };

        // Apply threshold styles
        const combinedStyle = { ...baseStyle, ...thresholdStyles };

        // Remove internal properties that shouldn't be applied to DOM
        const { _appliedRules, ...domStyle } = combinedStyle;

        return domStyle;
    }, [isPrimary, thresholdStyles]);

    // Handle empty or invalid values
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
        return (
            <Text type="secondary" style={cellStyle}>
                -
            </Text>
        );
    }

    return (
        <Text style={cellStyle}>
            {formattedValue}
        </Text>
    );
};

export default MetricsCell;