// src/components/tables/timeSeriesColumns.js
import React from 'react';
import { InputNumber, Form, Tooltip } from 'antd';
import {
    createTextColumn,
    createNumberColumn
} from './columns';

/**
 * Creates column definitions for time series data table
 * @param {string} valueType Type of value (number, percentage, currency)
 * @param {string} valueLabel Label for the value column
 * @param {string} addonAfter Unit text to display after value
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
    minYear = 1900,
    maxYear = 2100
) => {
    return [
        createNumberColumn('year', 'Year', {
            width: 90,
            sorter: true,
            defaultSortOrder: 'ascend',
            align: 'center'
        }),

        createNumberColumn('value', `${valueLabel}${addonAfter ? ` (${addonAfter})` : ''}`, {
            width: 150,
            precision: precision,
            render: (value) => {
                if (value === undefined || value === null) return '-';

                let formattedValue;
                if (valueType === 'percentage') {
                    formattedValue = `${parseFloat(value).toFixed(precision)}%`;
                } else if (valueType === 'currency') {
                    formattedValue = `${parseFloat(value).toFixed(precision)}`;
                } else {
                    formattedValue = parseFloat(value).toFixed(precision);
                    if (addonAfter) {
                        formattedValue += ` ${addonAfter}`;
                    }
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
 * @returns {Object} Summary row configuration
 */
export const createTimeSeriesSummary = (data, valueType = 'number', precision = 2) => {
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
            return `${parseFloat(val).toFixed(precision)}%`;
        } else if (valueType === 'currency') {
            return `$${parseFloat(val).toFixed(precision)}`;
        }
        return parseFloat(val).toFixed(precision);
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