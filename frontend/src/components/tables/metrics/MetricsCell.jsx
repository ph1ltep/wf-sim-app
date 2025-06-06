// src/components/tables/metrics/MetricsCell.jsx - Updated to use CSS-in-JS theme classes
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

    // Evaluate thresholds for conditional styling
    const thresholdStyles = useMemo(() => {
        if (!rowData.thresholds || !Array.isArray(rowData.thresholds)) {
            return {};
        }

        return evaluateCellThresholds(value, rowData, rowData.thresholds);
    }, [value, rowData]);

    // Generate CSS classes based on state and thresholds
    const cellClasses = useMemo(() => {
        const classes = ['metric-value'];

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
    }, [thresholdStyles, columnConfig, rowData, formattedValue]);

    // Combine base styles with threshold styles (for inline styles that can't be CSS classes)
    const inlineStyle = useMemo(() => {
        const baseStyle = {
            fontSize: '14px',
            lineHeight: '22px',
            fontWeight: isPrimary ? 500 : 400,
            transition: 'all 0.2s ease'
        };

        // Apply threshold styles (remove internal properties)
        const { _appliedRules, ...domStyle } = thresholdStyles;

        return { ...baseStyle, ...domStyle };
    }, [isPrimary, thresholdStyles]);

    // Handle empty or invalid values
    if (formattedValue === null || formattedValue === undefined || formattedValue === '') {
        return (
            <Text type="secondary" className={cellClasses} style={inlineStyle}>
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