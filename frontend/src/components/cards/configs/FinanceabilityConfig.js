// src/components/cards/configs/FinanceabilityConfig.js - FinanceabilityCard configuration factory

import { createPercentileColumns } from '../../tables/shared/ColumnGenerators';

/**
 * Create financial metrics table configuration for FinanceabilityCard
 * @param {Object} context - Configuration context
 * @returns {Object} { data, config } for MetricsTable
 */
export const createFinancialMetricsConfig = (context) => {
    const {
        financingData,
        availablePercentiles,
        primaryPercentile,
        currency = 'USD',
        onColumnSelect = null
    } = context;

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

    // Create columns using shared utility - NOW WORKS
    const sortedPercentiles = [...availablePercentiles].sort((a, b) => a - b);
    const columns = createPercentileColumns(sortedPercentiles, {
        primaryPercentile,
        selectable: true,
        onColumnSelect,
        valueType: 'number',
        precision: 2,
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
        }
    });

    // Transform data using the utility pattern from shared
    const data = transformFinancialData(financingData, rowDefinitions, columns);

    // Add threshold reference values
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
        size: 'small',
        onColumnSelect
    };

    return { data, config };
};

/**
 * Transform financial data to table format (extracted from existing logic)
 * @param {Object} financingData - Raw financial data with Maps
 * @param {Array} rowDefinitions - Row configuration definitions  
 * @param {Array} columns - Column definitions
 * @returns {Array} Formatted table data
 */
const transformFinancialData = (financingData, rowDefinitions, columns) => {
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
            const rawMetricData = financingData[rowDef.key];
            const extractedValue = extractMetricValue(rowDef.key, rawMetricData, column.value);
            row[column.key] = extractedValue;
        });

        return row;
    });
};

/**
 * Extract single value from financial data (moved from DataOperations)
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
                case 'dscr':
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
                    // For other time series, return first value
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
 * Create chart configuration for DSCR timeline with multiple metrics
 * @param {Object} context - Chart context
 * @returns {Object} Chart configuration for prepareFinancialTimelineData
 */
export const createDSCRChartConfig = (context) => {
    const {
        financingData,
        availablePercentiles,
        primaryPercentile,
        selectedPercentile = null,
        projectLife = 20
    } = context;

    return {
        financingData,
        availablePercentiles,
        primaryPercentile,
        options: {
            metrics: ['dscr', 'llcr', 'icr'],
            selectedPercentile,
            showAllPercentiles: !selectedPercentile,
            covenantThreshold: financingData.covenantThreshold,
            projectLife
        }
    };
};

/**
 * Create covenant analysis configuration
 * @param {Object} context - Analysis context
 * @returns {Object} Covenant analysis configuration
 */
export const createCovenantAnalysisConfig = (context) => {
    const {
        financingData,
        availablePercentiles
    } = context;

    return {
        financingData,
        confidenceIntervals: { minDSCR: financingData.avgDSCR },
        availablePercentiles
    };
};