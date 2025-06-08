// src/components/tables/metrics/MetricsCell.jsx - v3.0 OPTIMIZED: No duplicate styling

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
 * MetricsCell component - OPTIMIZED: semantic classes applied by parent <td>
 * This component focuses purely on content rendering and threshold styling
 */
export const MetricsCell = ({
    value,
    rowData = {},
    columnConfig = {},
    isSelected = false,
    isPrimary = false,
    position = {}, // Not used - classes applied by parent
    states = {}, // Not used - classes applied by parent
    className = '', // Not used - wrapped in content-inner
    style = {} // Not used - wrapped in content-inner
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

    // OPTIMIZED: Only threshold styling applied directly to content
    // Semantic styling handled by parent <td> element
    const cellStyle = useMemo(() => {
        const baseStyle = {
            fontWeight: isPrimary ? 600 : 400,
            transition: 'all 0.2s ease',
            width: '100%',
            textAlign: 'inherit' // Inherit from parent
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