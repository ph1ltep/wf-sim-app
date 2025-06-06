// src/components/tables/shared/TableDataOps.js - Common data operations for all table types

/**
 * Common data validation functions
 */

/**
 * Validate that data is a proper array with objects
 * @param {any} data - Data to validate
 * @param {string} context - Context for error messages
 * @returns {Object} { isValid, errors, warnings }
 */
export const validateTableData = (data, context = 'table') => {
    const errors = [];
    const warnings = [];

    // Check data is array
    if (!Array.isArray(data)) {
        errors.push(`${context} data must be an array, got ${typeof data}`);
        return { isValid: false, errors, warnings };
    }

    // Check for empty data
    if (data.length === 0) {
        warnings.push(`${context} data is empty`);
        return { isValid: true, errors, warnings };
    }

    // Validate each row
    data.forEach((row, index) => {
        if (!row || typeof row !== 'object') {
            errors.push(`${context} row ${index} must be an object, got ${typeof row}`);
            return;
        }

        // Check for key field (required for Ant Design tables)
        if (!row.hasOwnProperty('key') && !row.hasOwnProperty('id')) {
            warnings.push(`${context} row ${index} missing 'key' or 'id' field - may cause rendering issues`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Ensure all rows have unique keys for Ant Design tables
 * @param {Array} data - Table data
 * @param {string} keyField - Field to use as key ('key', 'id', etc.)
 * @returns {Array} Data with ensured unique keys
 */
export const ensureUniqueKeys = (data, keyField = 'key') => {
    if (!Array.isArray(data)) return [];

    const usedKeys = new Set();

    return data.map((row, index) => {
        let rowKey = row[keyField];

        // Generate key if missing
        if (rowKey === undefined || rowKey === null) {
            rowKey = `row-${index}`;
        }

        // Ensure uniqueness
        let uniqueKey = rowKey;
        let counter = 1;
        while (usedKeys.has(uniqueKey)) {
            uniqueKey = `${rowKey}-${counter}`;
            counter++;
        }

        usedKeys.add(uniqueKey);

        return {
            ...row,
            [keyField]: uniqueKey
        };
    });
};

/**
 * Common data transformation functions
 */

/**
 * Transform time series data to table format
 * @param {Array} timeSeriesData - Array of {year, value} objects
 * @param {Object} options - Transformation options
 * @returns {Array} Transformed table data
 */
export const transformTimeSeriesForTable = (timeSeriesData, options = {}) => {
    const {
        keyPrefix = 'ts',
        addMetadata = false,
        fillMissingYears = false,
        yearRange = null
    } = options;

    if (!Array.isArray(timeSeriesData)) return [];

    let processedData = [...timeSeriesData];

    // Fill missing years if requested
    if (fillMissingYears && yearRange) {
        const dataMap = new Map(timeSeriesData.map(item => [item.year, item.value]));
        processedData = [];

        for (let year = yearRange.min; year <= yearRange.max; year++) {
            processedData.push({
                year,
                value: dataMap.get(year) || null
            });
        }
    }

    // Transform to table format
    return processedData.map((item, index) => ({
        key: `${keyPrefix}-${item.year || index}`,
        year: item.year,
        value: item.value,
        ...(addMetadata && {
            metadata: {
                originalIndex: index,
                hasValue: item.value !== null && item.value !== undefined
            }
        })
    }));
};

/**
 * Transform percentile data map to table format
 * @param {Map} percentileDataMap - Map of percentile -> data arrays
 * @param {Array} selectedPercentiles - Percentiles to include
 * @param {Object} options - Transformation options
 * @returns {Array} Table data with percentile columns
 */
export const transformPercentileMapForTable = (percentileDataMap, selectedPercentiles, options = {}) => {
    const {
        keyPrefix = 'pct',
        metricName = 'value',
        formatter = null
    } = options;

    if (!percentileDataMap || typeof percentileDataMap.get !== 'function') {
        return [];
    }

    // Get all unique years across all percentiles
    const allYears = new Set();
    selectedPercentiles.forEach(percentile => {
        const data = percentileDataMap.get(percentile);
        if (Array.isArray(data)) {
            data.forEach(point => allYears.add(point.year));
        }
    });

    // Create table rows - one per year
    return Array.from(allYears).sort((a, b) => a - b).map(year => {
        const row = {
            key: `${keyPrefix}-${year}`,
            year,
            metricName
        };

        // Add data for each percentile
        selectedPercentiles.forEach(percentile => {
            const data = percentileDataMap.get(percentile);
            const point = Array.isArray(data) ? data.find(p => p.year === year) : null;
            const value = point ? point.value : null;

            row[`P${percentile}`] = formatter ? formatter(value) : value;
        });

        return row;
    });
};

/**
 * Common column generation functions
 */

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
        valueType = 'number', // 'number', 'currency', 'percentage'
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

    // Apply formatting
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

/**
 * Common formatting functions
 */

/**
 * Format value based on type
 * @param {any} value - Value to format
 * @param {string} type - Value type ('number', 'currency', 'percentage')
 * @param {Object} options - Formatting options
 * @returns {string} Formatted value
 */
export const formatValue = (value, type = 'number', options = {}) => {
    const { precision = 2, currency = 'USD', suffix = '', prefix = '' } = options;

    if (value === null || value === undefined || isNaN(value)) {
        return '-';
    }

    const numValue = Number(value);

    switch (type) {
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
 * Detect data type from values
 * @param {Array} values - Array of values to analyze
 * @returns {string} Detected type ('number', 'currency', 'percentage', 'string')
 */
export const detectValueType = (values) => {
    if (!Array.isArray(values) || values.length === 0) return 'string';

    const validValues = values.filter(v => v !== null && v !== undefined);
    if (validValues.length === 0) return 'string';

    // Check if all are numbers
    const isNumeric = validValues.every(v => !isNaN(Number(v)));
    if (!isNumeric) return 'string';

    const numbers = validValues.map(v => Number(v));

    // Check for percentage patterns (values between 0-100)
    const possiblePercentages = numbers.filter(n => n >= 0 && n <= 100);
    if (possiblePercentages.length / numbers.length > 0.8) return 'percentage';

    // Check for currency patterns (larger numbers)
    const largeCurrency = numbers.filter(n => Math.abs(n) > 1000);
    if (largeCurrency.length / numbers.length > 0.5) return 'currency';

    return 'number';
};

/**
 * Utility functions for common table operations
 */

/**
 * Filter table data by search text
 * @param {Array} data - Table data
 * @param {string} searchText - Text to search for
 * @param {Array} searchFields - Fields to search in
 * @returns {Array} Filtered data
 */
export const filterTableData = (data, searchText, searchFields = []) => {
    if (!searchText || !Array.isArray(data)) return data;

    const lowercaseSearch = searchText.toLowerCase();

    return data.filter(row => {
        // If no specific fields specified, search all string fields
        const fieldsToSearch = searchFields.length > 0
            ? searchFields
            : Object.keys(row).filter(key => typeof row[key] === 'string');

        return fieldsToSearch.some(field => {
            const value = row[field];
            return value && value.toString().toLowerCase().includes(lowercaseSearch);
        });
    });
};

/**
 * Sort table data by multiple fields
 * @param {Array} data - Table data
 * @param {Array} sortConfig - Array of {field, direction} objects
 * @returns {Array} Sorted data
 */
export const sortTableData = (data, sortConfig) => {
    if (!Array.isArray(data) || !Array.isArray(sortConfig) || sortConfig.length === 0) {
        return data;
    }

    return [...data].sort((a, b) => {
        for (const { field, direction } of sortConfig) {
            const aVal = a[field];
            const bVal = b[field];

            let comparison = 0;
            if (aVal < bVal) comparison = -1;
            if (aVal > bVal) comparison = 1;

            if (comparison !== 0) {
                return direction === 'desc' ? -comparison : comparison;
            }
        }
        return 0;
    });
};