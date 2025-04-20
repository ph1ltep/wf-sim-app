// src/components/tables/timeSeriesColumns.js - Updated formatting
import React from 'react';
import { Tooltip } from 'antd';
import { createNumberColumn } from './columns';
import { formatNumber } from '../../utils/formatUtils';

/**
 * Creates column definitions for time series data table
 * @param {string} valueType Type of value (number, percentage, currency)
 * @param {string} valueLabel Label for the value column
 * @param {string} addonAfter Unit to display after value
 * @param {number} precision Decimal precision for values
 * @param {number} minYear Minimum allowed year
 * @param {number} maxYear Maximum allowed year
 * @returns {Array} Array of column definitions
 */
export const createTimeSeriesColumns = (
    valueType = 'number',
    valueLabel = 'Value',
    addonAfter = '',
    precision = 2,
    minYear = 0,
    maxYear = 100
) => {
    return [
        createNumberColumn('year', 'Year', {
            width: 100,
            fixed: 'left',
            sorter: true,
            defaultSortOrder: 'ascend',
            align: 'center',
            precision: 0
        }),

        createNumberColumn('value', addonAfter ? `${valueLabel} (${addonAfter})` : valueLabel, {
            width: 'auto',
            precision: precision,
            render: (value) => {
                if (value === undefined || value === null) return '-';

                let formattedValue;
                if (valueType === 'percentage') {
                    formattedValue = `${formatNumber(value, precision)}%`;
                } else if (valueType === 'currency') {
                    formattedValue = `${formatNumber(value, precision)}`;
                } else {
                    formattedValue = formatNumber(value, precision);
                }

                return <Tooltip title={`${valueLabel}: ${formattedValue}`}>{formattedValue}</Tooltip>;
            },
            sorter: (a, b) => a.value - b.value
        })
    ];
};

/**
 * Create summary row content for time series data
 * @param {Array} data Time series data points
 * @param {string} valueType Type of value
 * @param {number} precision Decimal precision
 * @param {string} addonAfter Unit to display after values
 * @returns {Object} Summary row configuration
 */
export const createTimeSeriesSummary = (data, valueType = 'number', precision = 2, addonAfter = '') => {
    if (!data || data.length === 0) {
        return null;
    }

    const values = data.map(item => item.value);
    const sum = values.reduce((acc, val) => acc + parseFloat(val || 0), 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    const formatValue = (val) => {
        if (val === undefined || val === null) return '-';

        if (valueType === 'percentage') {
            return `${formatNumber(val, precision)}%`;
        } else if (valueType === 'currency') {
            return `$${formatNumber(val, precision)}`;
        } else if (addonAfter) {
            return `${formatNumber(val, precision)} ${addonAfter}`;
        }
        return formatNumber(val, precision);
    };

    return {
        yearContent: <strong>{`${data.length} Years`}</strong>,
        valueContent: (
            <Tooltip title="Min / Avg / Max">
                <span>{`${formatValue(min)} / ${formatValue(avg)} / ${formatValue(max)}`}</span>
            </Tooltip>
        )
    };
};