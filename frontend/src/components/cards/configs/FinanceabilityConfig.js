// frontend/src/components/cards/configs/FinanceabilityConfig.js - Fixed column labels and chart filtering

import { addCovenantAnnotations } from '../../../utils/charts/annotations';
import { getFinancialColorScheme, getSemanticColor } from '../../../utils/charts/colors';

/**
 * Create financial metrics table configuration for FinanceabilityCard
 * @param {Object} context - Configuration context
 * @returns {Object} { data, config } for MetricsTable
 */
export const createFinancialMetricsConfig = (context) => {
    const { token } = context; // Add token to context

    const {
        financingData,
        availablePercentiles,
        primaryPercentile,
        currency = 'USD',
        onColumnSelect = null,
        scenarioData = null
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

    // Transform data using the fixed utility
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
 * Transform financial data into table format
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
 * FIXED: Extract single value from financial data (handles Maps and arrays correctly)
 * @param {string} metricKey - The metric key (irr, npv, minDSCR, etc.)
 * @param {any} rawData - The raw data for this metric
 * @param {number} percentile - The percentile to extract
 * @returns {number|null} Extracted value
 */
const extractMetricValue = (metricKey, rawData, percentile) => {
    // Handle null/undefined data
    if (!rawData) {
        console.warn(`No rawData for metric '${metricKey}'`);
        return null;
    }

    // Handle Map objects (most financial metrics)
    if (rawData && typeof rawData.get === 'function') {
        const percentileData = rawData.get(percentile);

        if (percentileData === null || percentileData === undefined) {
            console.warn(`No data found for ${metricKey} P${percentile}`);
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

/**
 * FIXED: Prepare financial timeline chart data with proper percentile filtering
 * @param {Object} financingData - Financial metrics data with Maps
 * @param {Array} availablePercentiles - Available percentile values
 * @param {number} primaryPercentile - Primary percentile to emphasize
 * @param {Object} options - Chart options and configuration
 * @returns {Object} Plotly chart data and layout
 */
export const prepareFinancialTimelineData = (financingData, availablePercentiles, primaryPercentile, options = {}) => {
    const {
        metrics = ['dscr'], // Default to DSCR only
        selectedPercentile = null,
        showAllPercentiles = true,
        covenantThreshold = null,
        projectLife = 20
    } = options;

    const traces = [];
    const colors = {
        dscr: getFinancialColorScheme('dscr'),    // blue[5] or token.colorPrimary
        llcr: getFinancialColorScheme('llcr'),    // blue[6] (deeper blue)
        icr: getFinancialColorScheme('icr')       // blue[4] (lighter blue)
    };

    // Marker symbols for different metrics
    const markerSymbols = {
        dscr: 'circle',
        llcr: 'square',
        icr: 'diamond'
    };

    // Generate all years from 0 to project life for consistent x-axis
    const allYears = Array.from({ length: projectLife + 1 }, (_, i) => i);

    metrics.forEach(metricType => {
        const metricData = financingData[metricType];
        if (!metricData) {
            console.warn(`Financial metric '${metricType}' not found in financingData`);
            return;
        }

        const baseColor = colors[metricType] || '#666666';
        const markerSymbol = markerSymbols[metricType] || 'circle';

        // FIXED: Determine which percentiles to show based on selection
        let percentilesToShow;
        if (selectedPercentile !== null) {
            percentilesToShow = [selectedPercentile];
            console.log(`Showing only selected percentile: P${selectedPercentile}`);
        } else if (showAllPercentiles) {
            percentilesToShow = availablePercentiles;
            console.log(`Showing all percentiles:`, percentilesToShow);
        } else {
            percentilesToShow = [primaryPercentile];
            console.log(`Showing only primary percentile: P${primaryPercentile}`);
        }

        percentilesToShow.forEach((percentile, index) => {
            const data = metricData.get(percentile);
            if (!Array.isArray(data)) {
                console.warn(`No data found for ${metricType} P${percentile}`);
                return;
            }

            const isPrimary = percentile === primaryPercentile;
            const isSelected = percentile === selectedPercentile;
            const shouldEmphasize = isSelected || (isPrimary && selectedPercentile === null);

            // Create complete dataset with nulls for missing years
            const dataMap = new Map(data.map(d => [d.year, d.value]));
            const completeData = allYears.map(year => ({
                year,
                value: dataMap.get(year) || null
            }));

            const opacity = shouldEmphasize ? 1.0 : 0.3 + (index % 3) * 0.2;
            const lineWidth = shouldEmphasize ? 4 : 2;
            const markerSize = shouldEmphasize ? 8 : 5;

            traces.push({
                x: completeData.map(d => d.year),
                y: completeData.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `${metricType.toUpperCase()} P${percentile}${shouldEmphasize ? ' (Primary)' : ''}`,
                line: {
                    color: baseColor,
                    width: lineWidth,
                    dash: metricType === 'llcr' ? 'dot' : 'solid'
                },
                marker: {
                    size: markerSize,
                    color: baseColor,
                    symbol: markerSymbol,
                    line: { width: 1, color: 'white' }
                },
                opacity: opacity,
                yaxis: metricType === 'icr' ? 'y2' : 'y', // ICR on secondary axis
                hovertemplate: `Year: %{x}<br>${metricType.toUpperCase()}: %{y:.2f}<br>Percentile: P${percentile}<extra></extra>`
            });
        });
    });

    console.log(`Generated ${traces.length} chart traces`);
    return { data: traces, layout: createFinancialTimelineLayout(covenantThreshold, allYears) };
};

/**
 * Create layout for financial timeline charts
 * @param {number} covenantThreshold - Covenant threshold value
 * @param {Array} years - Array of years
 * @returns {Object} Plotly layout object
 */
const createFinancialTimelineLayout = (covenantThreshold, years) => {
    const layout = {
        title: '',
        xaxis: {
            title: 'Project Year',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tick0: 0,
            dtick: 1
        },
        yaxis: {
            title: 'Coverage Ratio (DSCR, LLCR)',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickformat: '.2f',
            side: 'left'
        },
        yaxis2: {
            title: 'Interest Coverage Ratio (ICR)',
            showgrid: false,
            tickformat: '.1f',
            side: 'right',
            overlaying: 'y'
        },
        legend: {
            orientation: 'h',
            y: -0.3,
            font: { size: 10 }
        },
        margin: { t: 20, b: 100, l: 80, r: 80 },
        height: 350,
        plot_bgcolor: '#fafafa'
    };

    // Add covenant threshold line if provided
    if (covenantThreshold) {
        addCovenantAnnotations(layout, [{
            value: covenantThreshold,
            label: `Covenant: ${covenantThreshold}`,
            color: '#ff4d4f'
        }], years);
    }

    return layout;
};

/**
 * FIXED: Create finance-specific threshold configurations with proper integration
 * @param {Object} financingData - Financial data including covenant threshold
 * @param {Object} scenarioData - Full scenario data for financing settings
 * @returns {Object} Threshold configurations by metric
 */
const createFinancialThresholds = (financingData, scenarioData) => {
    // Get target values from financing settings
    const financingSettings = scenarioData?.settings?.modules?.financing || {};
    const targetProjectIRR = financingSettings.targetProjectIRR || financingSettings.costOfEquity || 8;
    const targetEquityIRR = financingSettings.targetEquityIRR || financingSettings.costOfEquity || 12;

    console.log('Creating thresholds with financing settings:', {
        targetProjectIRR,
        targetEquityIRR,
        covenantThreshold: financingData?.covenantThreshold
    });

    return {
        dscr: [
            {
                field: 'covenantThreshold',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ? { color: '#ff4d4f', fontWeight: 600 } : null,
                priority: 10,
                description: 'DSCR below covenant threshold'
            }
        ],
        irr: [
            {
                field: 'target_irr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ? { color: '#ff4d4f' } : null,
                priority: 8,
                description: 'Project IRR below target'
            },
            {
                field: 'target_irr_high',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ? { color: '#52c41a' } : null,
                priority: 5,
                description: 'Project IRR >10% above target'
            }
        ],
        equityIRR: [
            {
                field: 'target_equity_irr',
                comparison: 'below',
                colorRule: (value, threshold) => value < threshold ? { color: '#ff4d4f' } : null,
                priority: 8,
                description: 'Equity IRR below target'
            },
            {
                field: 'target_equity_irr_high',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ? { color: '#52c41a' } : null,
                priority: 5,
                description: 'Equity IRR >10% above target'
            }
        ],
        npv: [
            {
                field: 'npv_positive',
                comparison: 'above',
                colorRule: (value, threshold) => value > threshold ? { color: '#52c41a' } : { color: '#ff4d4f' },
                priority: 10,
                description: 'NPV positive/negative indicator'
            }
        ],
        llcr: [], // No specific thresholds for LLCR
        icr: []  // No specific thresholds for ICR
    };
};