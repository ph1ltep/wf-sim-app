// frontend/src/components/cards/configs/FinanceabilityConfig.js
// UPDATED: Removed duplicates, using unified metric extraction

import { addCovenantAnnotations } from '../../../utils/charts/annotations';
import { getFinancialColorScheme, getSemanticColor } from '../../../utils/charts/colors';
import { extractMetricValue } from '../../../utils/finance/sensitivityMetrics'; // ✅ UNIFIED IMPORT

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
        onColumnSelect = null,
        scenarioData = null,
        token = null
    } = context;

    // Get finance-specific thresholds with proper financing settings integration
    const financialThresholds = createFinancialThresholds(financingData, scenarioData);

    // Row definitions for financial metrics with thresholds
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
            thresholds: financialThresholds.irr
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
            ],
            thresholds: financialThresholds.equityIRR
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
            thresholds: financialThresholds.npv
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
            thresholds: financialThresholds.dscr
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
            ],
            thresholds: financialThresholds.llcr
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
            ],
            thresholds: financialThresholds.icr
        }
    ];

    // FIXED: Create columns with proper labels (P50, not PP50)
    const sortedPercentiles = [...availablePercentiles].sort((a, b) => a - b);
    const columns = sortedPercentiles.map(percentile => ({
        key: `P${percentile}`, // Use consistent P{number} format
        label: `P${percentile}`, // FIXED: Simple label without double P
        value: percentile, // This is the actual percentile number for onColumnSelect
        valueField: 'value',
        primary: percentile === primaryPercentile,
        selectable: true,
        align: 'center',
        width: 100,
        // ADD: Marker support
        marker: percentile === primaryPercentile ? {
            type: 'primary',
            color: getSemanticColor('primary', 5, token), // Use token-aware colors
            tag: 'Primary'
        } : null,
        formatter: (value, rowData) => {
            if (value === null || value === undefined || isNaN(value)) return '-';

            // FIXED: Proper formatting based on metric type
            if (rowData.key === 'npv') {
                return (value / 1000000).toFixed(1); // Convert to millions
            } else if (rowData.key === 'irr' || rowData.key === 'equityIRR') {
                return value.toFixed(1);
            } else {
                return value.toFixed(2);
            }
        }
    }));

    // ✅ USE UNIFIED TRANSFORMATION FUNCTION
    const data = transformFinancialData(financingData, rowDefinitions, columns);

    // FIXED: Add threshold reference values with proper financing integration
    data.forEach(row => {
        const financingSettings = scenarioData?.settings?.modules?.financing || {};
        const targetProjectIRR = financingSettings.targetProjectIRR || financingSettings.costOfEquity || 8;
        const targetEquityIRR = financingSettings.targetEquityIRR || financingSettings.costOfEquity || 12;

        switch (row.key) {
            case 'dscr':
                row.covenantThreshold = financingData.covenantThreshold || 1.3;
                break;
            case 'irr':
                row.target_irr = targetProjectIRR;
                row.target_irr_high = targetProjectIRR * 1.1; // 10% higher
                break;
            case 'equityIRR':
                row.target_equity_irr = targetEquityIRR;
                row.target_equity_irr_high = targetEquityIRR * 1.1; // 10% higher
                break;
            case 'npv':
                row.npv_positive = 0; // Positive NPV threshold
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
 * ✅ STREAMLINED: Transform financial data using unified extraction
 * @param {Object} financingData - Raw financial data
 * @param {Array} rowDefinitions - Row configuration definitions
 * @param {Array} columns - Column definitions
 * @returns {Array} Formatted table data
 */
const transformFinancialData = (financingData, rowDefinitions, columns) => {
    if (!financingData || !rowDefinitions || !columns) {
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

        // ✅ USE UNIFIED EXTRACTION FOR EACH COLUMN
        columns.forEach(column => {
            const extractedValue = extractMetricValue(financingData, rowDef.key, column.value);
            row[column.key] = extractedValue;
        });

        return row;
    });
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

/**
 * FIXED: Prepare financial timeline chart data with proper percentile filtering
 * @param {Object} financingData - Financial metrics data with Maps
 * @param {Array} availablePercentiles - Available percentile values
 * @param {Object} options - Chart options
 * @returns {Object} Chart data configuration for Plotly
 */
export const prepareFinancialTimelineData = (financingData, availablePercentiles, options = {}) => {
    const {
        metrics = ['dscr'],
        selectedPercentile = null,
        showAllPercentiles = true,
        covenantThreshold = 1.3,
        projectLife = 20
    } = options;

    const chartData = {
        data: [],
        layout: {
            title: 'Financial Timeline',
            xaxis: { title: 'Year' },
            yaxis: { title: 'Ratio' },
            showlegend: true,
            hovermode: 'x unified'
        }
    };

    // FIXED: Create traces for selected or all percentiles
    const percentilesForChart = selectedPercentile ? [selectedPercentile] : availablePercentiles;

    metrics.forEach(metric => {
        const metricData = financingData[metric];

        if (!metricData || typeof metricData.get !== 'function') return;

        percentilesForChart.forEach(percentile => {
            const timeSeriesData = metricData.get(percentile);

            if (!Array.isArray(timeSeriesData)) return;

            // Filter to operational years and prepare trace
            const operationalData = timeSeriesData.filter(d => d.year > 0);

            const trace = {
                x: operationalData.map(d => d.year),
                y: operationalData.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `${metric.toUpperCase()} P${percentile}`,
                line: {
                    color: getFinancialColorScheme(metric),
                    width: percentile === 50 ? 3 : 2
                },
                opacity: selectedPercentile ? 1.0 : (percentile === 50 ? 1.0 : 0.7)
            };

            chartData.data.push(trace);
        });
    });

    // Add covenant threshold line for DSCR
    if (metrics.includes('dscr') && covenantThreshold) {
        chartData.data.push({
            x: [1, projectLife],
            y: [covenantThreshold, covenantThreshold],
            type: 'scatter',
            mode: 'lines',
            name: 'Covenant Threshold',
            line: {
                color: getFinancialColorScheme('poor'),
                width: 2,
                dash: 'dash'
            },
            hovertemplate: `Covenant Threshold: ${covenantThreshold}<extra></extra>`
        });
    }

    return chartData;
};

/**
 * Create financial thresholds configuration
 * @param {Object} financingData - Financial data
 * @param {Object} scenarioData - Scenario data
 * @returns {Object} Threshold configurations
 */
const createFinancialThresholds = (financingData, scenarioData) => {
    const financingSettings = scenarioData?.settings?.modules?.financing || {};

    return {
        irr: [
            {
                field: 'target_irr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 3,
                description: 'IRR below target'
            }
        ],
        equityIRR: [
            {
                field: 'target_equity_irr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 3,
                description: 'Equity IRR below target'
            }
        ],
        npv: [
            {
                field: 'npv_positive',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 4,
                description: 'NPV below zero'
            }
        ],
        dscr: [
            {
                field: 'covenantThreshold',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 5,
                description: 'DSCR below covenant'
            }
        ],
        llcr: [
            {
                threshold: 1.2,
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 2,
                description: 'LLCR below minimum target'
            }
        ],
        icr: [
            {
                threshold: 2.0,
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ?
                    { color: getFinancialColorScheme('poor'), fontWeight: 600 } : null,
                priority: 2,
                description: 'ICR below minimum target'
            }
        ]
    };
};