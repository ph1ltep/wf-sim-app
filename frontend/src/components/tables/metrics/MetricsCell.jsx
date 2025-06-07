// src/components/tables/metrics/MetricsCell.jsx - v3.0 CORRECTED: Class concatenation system
import React, { useMemo } from 'react';
import { Typography } from 'antd';
import { evaluateThresholds } from './TableConfiguration';

const { Text } = Typography;

/**
 * Format value based on column configuration
 */
const formatValue = (value, columnConfig) => {
    if (value === null || value === undefined || value === '') return null;

    const { format, precision = 2, prefix = '', suffix = '' } = columnConfig;

    let formattedValue = value;

    switch (format) {
        case 'currency':
            formattedValue = parseFloat(value).toLocaleString(undefined, {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            });
            break;
        case 'percentage':
            formattedValue = `${parseFloat(value).toFixed(precision)}%`;
            break;
        case 'number':
            formattedValue = parseFloat(value).toLocaleString(undefined, {
                minimumFractionDigits: precision,
                maximumFractionDigits: precision
            });
            break;
        default:
            formattedValue = value.toString();
    }

    return `${prefix}${formattedValue}${suffix}`;
};

/**
 * MetricsCell component - CORRECTED: semantic classes applied by parent (onCell)
 */
export const MetricsCell = ({
    value,
    rowData = {},
    columnConfig = {},
    isSelected = false,
    isPrimary = false,
    position = {}, // Position data (not used since classes applied by parent)
    states = {}, // State data (not used since classes applied by parent)
    className = '', // Additional classes from parent (not needed)
    style = {} // Additional styles from parent (not needed)
}) => {
    // Format the display value
    const formattedValue = useMemo(() => {
        return formatValue(value, columnConfig);
    }, [value, columnConfig]);

    // Evaluate thresholds for styling (PRESERVED: highest precedence)
    const thresholdStyles = useMemo(() => {
        if (!columnConfig.thresholds || !Array.isArray(columnConfig.thresholds)) {
            return {};
        }
        return evaluateThresholds(rowData, columnConfig.thresholds, value);
    }, [rowData, columnConfig.thresholds, value]);

    // CORRECTED: Don't generate semantic classes here - they're applied by parent onCell
    // MetricsCell focuses on content rendering and threshold styling only

    // Base cell styling with threshold overrides (threshold = highest precedence)
    const cellStyle = useMemo(() => {
        const baseStyle = {
            fontWeight: isPrimary ? 600 : 400,
            transition: 'all 0.2s ease'
        };

        // Apply threshold styles (remove internal properties for DOM)
        const { _appliedRules, _priority, ...domThresholdStyles } = thresholdStyles;

        return { ...baseStyle, ...domThresholdStyles };
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