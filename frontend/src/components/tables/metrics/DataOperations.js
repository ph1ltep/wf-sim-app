// src/components/tables/metrics/DataOperations.js - Data validation and transformation utilities

/**
 * Validate table data structure and configuration
 * @param {Array} data - Table row data
 * @param {Object} config - Table configuration
 * @returns {Array} Array of validation error messages
 */
export const validateTableData = (data, config) => {
    const errors = [];

    // Check data is array
    if (!Array.isArray(data)) {
        errors.push('Data must be an array');
        return errors;
    }

    // Check config exists
    if (!config || typeof config !== 'object') {
        errors.push('Config must be an object');
        return errors;
    }

    // Check columns configuration
    if (!config.columns || !Array.isArray(config.columns)) {
        errors.push('Config.columns must be an array');
        return errors;
    }

    // Validate each row has required fields
    data.forEach((row, index) => {
        if (!row || typeof row !== 'object') {
            errors.push(`Row ${index} must be an object`);
            return;
        }

        // Check required fields
        const requiredFields = ['key', 'label'];
        requiredFields.forEach(field => {
            if (!row.hasOwnProperty(field) || row[field] === null || row[field] === undefined) {
                errors.push(`Row ${index} missing required field: ${field}`);
            }
        });

        // Check that row has data for defined columns
        config.columns.forEach(column => {
            if (!row.hasOwnProperty(column.key)) {
                errors.push(`Row ${index} missing data for column: ${column.key}`);
            }
        });
    });

    // Validate column configurations
    config.columns.forEach((column, index) => {
        if (!column.key) {
            errors.push(`Column ${index} missing required 'key' property`);
        }
        if (!column.label) {
            errors.push(`Column ${index} missing required 'label' property`);
        }
    });

    // Check for duplicate row keys
    const rowKeys = data.map(row => row.key).filter(key => key);
    const uniqueKeys = new Set(rowKeys);
    if (rowKeys.length !== uniqueKeys.size) {
        errors.push('Duplicate row keys found');
    }

    // Check for duplicate column keys
    const columnKeys = config.columns.map(col => col.key).filter(key => key);
    const uniqueColumnKeys = new Set(columnKeys);
    if (columnKeys.length !== uniqueColumnKeys.size) {
        errors.push('Duplicate column keys found');
    }

    return errors;
};

/**
 * Extract single value from financial data based on metric type
 * @param {string} metricKey - The metric key (irr, npv, minDSCR, etc.)
 * @param {any} rawData - The raw data for this metric
 * @param {number} percentile - The percentile to extract
 * @returns {number|null} Extracted value
 */
const extractMetricValue = (metricKey, rawData, percentile) => {
    // Handle null/undefined data
    if (!rawData) return null;

    // Handle Map objects (most financial metrics)
    if (rawData && typeof rawData.get === 'function') {
        const percentileData = rawData.get(percentile);

        if (percentileData === null || percentileData === undefined) {
            return null;
        }

        // Handle time series data (arrays)
        if (Array.isArray(percentileData)) {
            switch (metricKey) {
                case 'minDSCR':
                    // Find minimum from operational years (year > 0)
                    const operationalDSCR = percentileData.filter(d => d && d.year > 0 && typeof d.value === 'number');
                    return operationalDSCR.length > 0 ? Math.min(...operationalDSCR.map(d => d.value)) : null;

                case 'icr':
                    // Find minimum from operational years (year > 0)
                    const operationalICR = percentileData.filter(d => d && d.year > 0 && typeof d.value === 'number');
                    return operationalICR.length > 0 ? Math.min(...operationalICR.map(d => d.value)) : null;

                case 'llcr':
                    // LLCR is constant across years, take first valid value
                    const firstValid = percentileData.find(d => d && typeof d.value === 'number');
                    return firstValid ? firstValid.value : null;

                default:
                    // For other time series, return first value or handle differently
                    return percentileData[0]?.value || null;
            }
        }

        // Handle scalar values
        return typeof percentileData === 'number' ? percentileData : null;
    }

    // Handle direct values
    return typeof rawData === 'number' ? rawData : null;
};

/**
 * Transform raw data into table format - simplified and optimized
 * @param {Object} rawData - Raw data object (e.g., financial metrics)
 * @param {Array} rowDefinitions - Row configuration definitions
 * @param {Array} columns - Column definitions
 * @returns {Array} Formatted table data
 */
export const transformToTableData = (rawData, rowDefinitions, columns) => {
    if (!rawData || !rowDefinitions || !columns) {
        return [];
    }

    return rowDefinitions.map(rowDef => {
        const row = {
            key: rowDef.key,
            label: rowDef.label,
            tooltip: rowDef.tooltip,
            tags: rowDef.tags || [],
            thresholds: rowDef.thresholds || []
        };

        // Extract data for each column (percentile)
        columns.forEach(column => {
            const rawMetricData = rawData[rowDef.key];
            const extractedValue = extractMetricValue(rowDef.key, rawMetricData, column.value);
            row[column.key] = extractedValue;
        });

        return row;
    });
};

/**
 * Extract available columns from data automatically
 * @param {Array} data - Table data
 * @param {Array} excludeFields - Fields to exclude from column detection
 * @returns {Array} Detected column keys
 */
export const detectColumns = (data, excludeFields = ['key', 'label', 'tooltip', 'tags', 'thresholds']) => {
    if (!Array.isArray(data) || data.length === 0) {
        return [];
    }

    const allKeys = new Set();
    data.forEach(row => {
        Object.keys(row).forEach(key => {
            if (!excludeFields.includes(key)) {
                allKeys.add(key);
            }
        });
    });

    return Array.from(allKeys).sort();
};

/**
 * Create financial metrics table data from cashflow data
 * @param {Object} financingData - Financial metrics data (Maps)
 * @param {Array} availablePercentiles - Available percentile values
 * @param {number} primaryPercentile - Primary percentile
 * @param {string} currency - Currency code
 * @returns {Object} { data, config } for MetricsDataTable
 */
/**
 * Create financial metrics table data from cashflow data
 * @param {Object} financingData - Financial metrics data (Maps)
 * @param {Array} availablePercentiles - Available percentile values
 * @param {number} primaryPercentile - Primary percentile
 * @param {string} currency - Currency code
 * @returns {Object} { data, config } for MetricsDataTable
 */
export const createFinancialMetricsTableData = (financingData, availablePercentiles, primaryPercentile, currency = 'USD') => {
    // Row definitions for financial metrics
    const rowDefinitions = [
        {
            key: 'irr',
            label: 'Project IRR (%)',
            tooltip: {
                title: 'Project Internal Rate of Return',
                content: 'Return on total project investment before debt service. Higher IRR indicates better project returns.',
                icon: 'DollarOutlined'
            },
            tags: [
                { text: 'Primary', color: 'blue' },
                { text: 'Returns', color: 'green' }
            ],
            thresholds: [
                {
                    field: 'target_irr',
                    comparison: 'above',
                    colorRule: (value, threshold) => value > threshold ? { color: '#52c41a' } : null,
                    priority: 5
                }
            ]
        },
        {
            key: 'equityIRR',
            label: 'Equity IRR (%)',
            tooltip: {
                title: 'Equity Internal Rate of Return',
                content: 'Return to equity investors after debt service. Shows sponsor-level returns.',
                icon: 'DollarOutlined'
            },
            tags: [
                { text: 'Equity', color: 'purple' },
                { text: 'Returns', color: 'green' }
            ]
        },
        {
            key: 'npv',
            label: `NPV (${currency}M)`,
            tooltip: {
                title: 'Net Present Value',
                content: 'Present value of all future cash flows discounted at cost of equity. Positive NPV indicates value creation.',
                icon: 'DollarOutlined'
            },
            tags: [
                { text: 'Valuation', color: 'orange' }
            ],
            thresholds: [
                {
                    field: 'npv_positive',
                    comparison: 'above',
                    colorRule: (value) => value > 0 ? { color: '#52c41a' } : { color: '#ff4d4f' },
                    priority: 10
                }
            ]
        },
        {
            key: 'dscr',
            label: 'Min DSCR',
            tooltip: {
                title: 'Minimum Debt Service Coverage Ratio',
                content: 'Lowest DSCR during operational period. Values below covenant threshold indicate financing risk.',
                icon: 'SafetyOutlined'
            },
            tags: [
                { text: 'Covenant', color: 'red' },
                { text: 'Risk', color: 'orange' }
            ],
            thresholds: [
                {
                    field: 'covenantThreshold',
                    comparison: 'below',
                    colorRule: (value, threshold) => value < threshold ? { color: '#ff4d4f' } : null,
                    priority: 10
                }
            ]
        },
        {
            key: 'llcr',
            label: 'LLCR',
            tooltip: {
                title: 'Loan Life Coverage Ratio',
                content: 'Total debt coverage over the loan life. Higher values indicate stronger debt coverage.',
                icon: 'SafetyOutlined'
            },
            tags: [
                { text: 'Coverage', color: 'blue' }
            ]
        },
        {
            key: 'icr',
            label: 'Min ICR',
            tooltip: {
                title: 'Minimum Interest Coverage Ratio',
                content: 'Lowest ICR during operational period. Measures ability to pay interest obligations from operating cash flow.',
                icon: 'SafetyOutlined'
            },
            tags: [
                { text: 'Coverage', color: 'orange' },
                { text: 'Interest', color: 'blue' }
            ]
        }
    ];

    // FIXED: Sort percentiles in ascending order, then create columns
    const sortedPercentiles = [...availablePercentiles].sort((a, b) => a - b);

    const columns = sortedPercentiles.map(p => ({
        key: `P${p}`,
        label: `P${p}`,
        valueField: 'percentile',
        value: p,
        primary: p === primaryPercentile,
        selectable: true,
        formatter: (value, rowData) => {
            if (value === null || value === undefined || isNaN(value)) return '-';

            // Format based on metric type
            if (rowData.key === 'npv') {
                return (value / 1000000).toFixed(1); // Convert to millions
            } else if (rowData.key === 'irr' || rowData.key === 'equityIRR') {
                return value.toFixed(1);
            } else {
                return value.toFixed(2);
            }
        },
        align: 'center',
        width: 80
    }));

    // Transform data using the cleaner logic
    const data = transformToTableData(financingData, rowDefinitions, columns);

    // Add threshold reference values (separate step, no overwrites)
    data.forEach(row => {
        switch (row.key) {
            case 'dscr':
                row.covenantThreshold = financingData.covenantThreshold || 1.3;
                break;
            case 'irr':
                row.target_irr = 10.0;
                break;
            case 'npv':
                row.npv_positive = 0;
                break;
        }
    });

    const config = {
        columns,
        size: 'small'
    };

    return { data, config };
};