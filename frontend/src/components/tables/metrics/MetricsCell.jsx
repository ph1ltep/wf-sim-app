// src/components/tables/metrics/MetricsCell.jsx - MINIMAL change to original
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { evaluateThresholds } from './TableConfiguration';

const { Text } = Typography;

/**
 * Format value based on column configuration - KEEP EXACTLY THE SAME
 */
const formatValue = (value, columnConfig, rowData) => {
    if (value === null || value === undefined || value === '') return null;

    // PRIORITY 1: Use columnConfig.formatter if provided (FinanceabilityConfig)
    if (columnConfig.formatter && typeof columnConfig.formatter === 'function') {
        return columnConfig.formatter(value, rowData);
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value.toString();

    // PRIORITY 2: Smart precision based on value magnitude
    let precision = 2;
    const absValue = Math.abs(numValue);

    if (absValue >= 1000000) {
        precision = 1; // Large numbers: 1 decimal
    } else if (absValue >= 1000) {
        precision = 0; // Thousands: no decimals
    } else if (absValue < 1 && absValue > 0) {
        precision = 3; // Small numbers: 3 decimals
    }

    const { format, prefix = '', suffix = '' } = columnConfig;

    switch (format) {
        case 'currency':
            return `${prefix}$${numValue.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            })}${suffix}`;
        case 'percentage':
            return `${prefix}${numValue.toFixed(precision)}%${suffix}`;
        case 'number':
        default:
            return `${prefix}${numValue.toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            })}${suffix}`;
    }
};

/**
 * MetricsCell component - EXACTLY as original with ONLY formatter prop support
 */
export const MetricsCell = ({
    value,
    formatter = null, // ONLY ADDITION: formatter prop
    rowData = {},
    columnConfig = {},
    isSelected = false,
    isPrimary = false,
    position = {}, // Not used for styling - semantic classes applied by parent
    states = {}, // Not used for styling - semantic classes applied by parent
    className = '', // Not used - wrapped in content-inner
    style = {} // Not used - wrapped in content-inner
}) => {
    // Format the display value - ONLY CHANGE: Add formatter prop priority
    const formattedValue = useMemo(() => {
        // NEW: PRIORITY 0 - Use formatter prop if provided
        if (formatter && typeof formatter === 'function') {
            try {
                return formatter(value, rowData);
            } catch (error) {
                console.error('MetricsCell: Error applying formatter prop:', error);
            }
        }

        // EXISTING: Use formatValue function (unchanged)
        return formatValue(value, columnConfig, rowData);
    }, [value, formatter, columnConfig, rowData]); // Add formatter to deps

    // UPDATED: Minimal base styling - let semantic classes handle most styling
    const cellStyle = useMemo(() => {
        const baseStyle = {
            transition: 'all 0.2s ease',
            width: '100%'
            // Removed: fontWeight, textAlign - handled by semantic classes
        };

        // Threshold styles override everything (highest precedence)
        return { ...baseStyle, ...style };
    }, [value]); // Remove thresholdStyles from dependencies, add value

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