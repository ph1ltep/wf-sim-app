// src/components/tables/metrics/MetricsCell.jsx - Updated to use CSS classes
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { evaluateCellThresholds } from './TableConfiguration';

const { Text } = Typography;

/**
 * MetricsCell - Renders individual table cells with CSS class-based formatting
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

    // Evaluate thresholds for conditional styling (still use inline for dynamic colors)
    const thresholdStyles = useMemo(() => {
        if (!rowData.thresholds || !Array.isArray(rowData.thresholds)) {
            return {};
        }

        return evaluateCellThresholds(value, rowData, rowData.thresholds);
    }, [value, rowData]);

    // Generate CSS classes based on state and thresholds
    const cellClasses = useMemo(() => {
        const classes = ['metric-value'];

        // Add state classes
        if (isPrimary) classes.push('cell-primary');
        if (isSelected) classes.push('cell-selected');
        if (isPrimary && isSelected) classes.push('cell-primary-selected');

        // Add threshold-based classes
        if (thresholdStyles._appliedRules) {
            thresholdStyles._appliedRules.forEach(rule => {
                if (rule.description.includes('below')) classes.push('threshold-critical');
                if (rule.description.includes('covenant')) classes.push('covenant-breach');
                if (rule.description.includes('above') && rule.description.includes('target')) classes.push('threshold-good');
            });
        }

        // Add data type classes
        if (columnConfig.formatter) {
            if (rowData.key === 'npv') classes.push('value-currency');
            else if (rowData.key === 'irr' || rowData.key === 'equityIRR') classes.push('value-percentage');
            else classes.push('value-number');
        }

        // Add null value class
        if (formattedValue === '-' || formattedValue === null || formattedValue === undefined) {
            classes.push('value-null');
        }

        return classes.join(' ');
    }, [thresholdStyles, columnConfig, rowData, formattedValue, isPrimary, isSelected]);

    // Only use inline styles for threshold colors (data-driven overrides)
    const inlineStyle = useMemo(() => {
        // Remove internal properties and only keep actual CSS properties
        const { _appliedRules, ...domStyle } = thresholdStyles;
        return domStyle;
    }, [thresholdStyles]);

    // Handle empty or invalid values
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
        return (
            <Text type="secondary" className={`${cellClasses} value-null`.trim()}>
                -
            </Text>
        );
    }

    return (
        <Text className={cellClasses} style={inlineStyle}>
            {formattedValue}
        </Text>
    );
};

export default MetricsCell;