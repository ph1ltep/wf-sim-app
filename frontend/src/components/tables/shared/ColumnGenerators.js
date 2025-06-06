// src/components/tables/shared/ColumnGenerators.js - Column generation utilities

import { formatValue } from './FormatUtils';

/**
 * Generate year column configuration
 * @param {Object} options - Column options
 * @returns {Object} Year column configuration
 */
export const createYearColumn = (options = {}) => {
    const {
        width = 100,
        fixed = 'left',
        formatYear = (year) => `Year ${year}`,
        sortable = true,
        timelineMarkers = []
    } = options;

    return {
        title: 'Year',
        dataIndex: 'year',
        key: 'year',
        fixed,
        width,
        ...(sortable && { sorter: (a, b) => a.year - b.year }),
        render: (year, record) => {
            const marker = timelineMarkers.find(m => m.year === year);

            if (marker) {
                return (
                    <div style={{
                        fontWeight: 600,
                        color: marker.color,
                        backgroundColor: `${marker.color}15`,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        textAlign: 'center'
                    }}>
                        {formatYear(year)}
                        {marker.tag && (
                            <div style={{
                                fontSize: '10px',
                                marginTop: '2px',
                                opacity: 0.8
                            }}>
                                {marker.tag}
                            </div>
                        )}
                    </div>
                );
            }

            return formatYear(year);
        }
    };
};

/**
 * Generate value column configuration with formatting
 * @param {Object} config - Column configuration
 * @returns {Object} Value column configuration
 */
export const createValueColumn = (config = {}) => {
    const {
        key,
        title,
        dataIndex = key,
        width = 120,
        align = 'right',
        formatter = null,
        valueType = 'number',
        precision = 2,
        currency = 'USD',
        sortable = true,
        editable = false
    } = config;

    const column = {
        title,
        dataIndex,
        key,
        width,
        align,
        ...(sortable && { sorter: (a, b) => (a[dataIndex] || 0) - (b[dataIndex] || 0) })
    };

    column.render = (value, record) => {
        if (formatter) {
            return formatter(value, record);
        }

        return formatValue(value, valueType, { precision, currency });
    };

    return column;
};

/**
 * Generate percentile columns from percentile array
 * @param {Array} percentiles - Array of percentile values
 * @param {Object} options - Column options
 * @returns {Array} Array of percentile column configurations
 */
export const createPercentileColumns = (percentiles, options = {}) => {
    const {
        width = 80,
        align = 'center',
        formatter = null,
        valueType = 'number',
        precision = 2,
        currency = 'USD',
        primaryPercentile = null,
        selectable = false,
        onColumnSelect = null
    } = options;

    return percentiles.map(percentile => {
        const isPrimary = percentile === primaryPercentile;
        const key = `P${percentile}`;

        return {
            title: isPrimary ? `P${percentile} (Primary)` : `P${percentile}`,
            dataIndex: key,
            key,
            width,
            align,
            render: (value, record) => {
                const formattedValue = formatter
                    ? formatter(value, record)
                    : formatValue(value, valueType, { precision, currency });

                return (
                    <span
                        style={{
                            fontWeight: isPrimary ? 600 : 400,
                            cursor: selectable ? 'pointer' : 'default'
                        }}
                        onClick={selectable && onColumnSelect ? () => onColumnSelect(percentile, key, record) : undefined}
                    >
                        {formattedValue}
                    </span>
                );
            },
            onHeaderCell: () => ({
                style: isPrimary ? {
                    backgroundColor: 'rgba(22, 119, 255, 0.15)',
                    fontWeight: 600
                } : {},
                ...(selectable && onColumnSelect && {
                    onClick: () => onColumnSelect(percentile, key, null)
                })
            })
        };
    });
};