// src/utils/financialChartsUtils.js - Finance-specific chart utilities
import { hexToRgb } from './plotUtils';

/**
 * Prepare financial timeline chart data with multiple metrics on same axis
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
        dscr: '#1890ff',
        llcr: '#52c41a',
        icr: '#faad14'
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
        const percentilesToShow = showAllPercentiles ? availablePercentiles : [selectedPercentile || primaryPercentile];

        percentilesToShow.forEach((percentile, index) => {
            const data = metricData.get(percentile);
            if (!Array.isArray(data)) {
                console.warn(`No data found for ${metricType} P${percentile}`);
                return;
            }

            const isPrimary = percentile === primaryPercentile;
            const isSelected = percentile === selectedPercentile;
            const shouldEmphasize = isSelected || (isPrimary && !selectedPercentile);

            // Create complete dataset with nulls for missing years
            const dataMap = new Map(data.map(d => [d.year, d.value]));
            const completeData = allYears.map(year => ({
                year,
                value: dataMap.get(year) || null
            }));

            const opacity = shouldEmphasize ? 1.0 : 0.3 + (index % 3) * 0.2;
            const lineWidth = shouldEmphasize ? 4 : 2;
            const markerSize = shouldEmphasize ? 8 : 5;

            // Special handling for LLCR - it's typically a single value per percentile, not time series
            let plotData;
            if (metricType === 'llcr' && data.length === 1) {
                // LLCR is typically a single value - plot as horizontal line
                plotData = allYears.map(year => ({
                    year,
                    value: data[0].value || data[0] // Handle both {year, value} and raw value
                }));
            } else {
                plotData = completeData;
            }

            traces.push({
                x: plotData.map(d => d.year),
                y: plotData.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `${metricType.toUpperCase()} P${percentile}${shouldEmphasize ? ' (Primary)' : ''}`,
                line: {
                    color: baseColor,
                    width: lineWidth,
                    dash: metricType === 'llcr' ? 'dot' : 'solid' // Distinguish LLCR with dotted line
                },
                marker: {
                    size: markerSize,
                    color: baseColor,
                    symbol: markerSymbol,
                    line: { width: 1, color: 'white' }
                },
                opacity: opacity,
                connectgaps: metricType === 'llcr', // Connect LLCR gaps since it's a flat line
                hovertemplate: `Year: %{x}<br>${metricType.toUpperCase()}: %{y:.2f}<br>Percentile: P${percentile}<extra></extra>`
            });
        });
    });

    return { data: traces, layout: createFinancialTimelineLayout(covenantThreshold, allYears) };
};

/**
 * Prepare dual-axis chart data for cash flows and ratios
 * @param {Object} cashflowData - Cash flow data (revenue, costs, net)
 * @param {Object} ratioData - Ratio data (DSCR, coverage ratios)
 * @param {Object} options - Chart configuration options
 * @returns {Object} Plotly chart data and layout with dual y-axes
 */
export const prepareDualAxisChartData = (cashflowData, ratioData, options = {}) => {
    const {
        primaryAxis = 'cashflow', // 'cashflow' or 'ratios'
        selectedPercentile = 50,
        showDebtService = true,
        showEquityCashflow = true
    } = options;

    const traces = [];

    // Primary axis traces (cash flows)
    if (cashflowData) {
        // Net operating cash flow
        if (cashflowData.netCashflow?.data) {
            traces.push({
                x: cashflowData.netCashflow.data.map(d => d.year),
                y: cashflowData.netCashflow.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Net Cash Flow',
                line: { color: '#1890ff', width: 3 },
                marker: { size: 6 },
                yaxis: 'y',
                hovertemplate: 'Year: %{x}<br>Net Cash Flow: $%{y:,.0f}<extra></extra>'
            });
        }

        // Debt service payments (if available and requested)
        if (showDebtService && cashflowData.debtService?.data) {
            traces.push({
                x: cashflowData.debtService.data.map(d => d.year),
                y: cashflowData.debtService.data.map(d => -d.value), // Negative for cash outflow
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Debt Service',
                line: { color: '#ff4d4f', width: 2 },
                marker: { size: 5 },
                yaxis: 'y',
                hovertemplate: 'Year: %{x}<br>Debt Service: $%{y:,.0f}<extra></extra>'
            });
        }

        // Free cash flow to equity (if available and requested)
        if (showEquityCashflow && cashflowData.equityCashflow?.data) {
            traces.push({
                x: cashflowData.equityCashflow.data.map(d => d.year),
                y: cashflowData.equityCashflow.data.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: 'Free Cash Flow to Equity',
                line: { color: '#52c41a', width: 2 },
                marker: { size: 5 },
                yaxis: 'y',
                hovertemplate: 'Year: %{x}<br>Equity Cash Flow: $%{y:,.0f}<extra></extra>'
            });
        }
    }

    // Secondary axis traces (ratios)
    if (ratioData?.dscr) {
        const dscrData = ratioData.dscr.get(selectedPercentile);
        if (Array.isArray(dscrData)) {
            traces.push({
                x: dscrData.map(d => d.year),
                y: dscrData.map(d => d.value),
                type: 'scatter',
                mode: 'lines+markers',
                name: `DSCR P${selectedPercentile}`,
                line: { color: '#722ed1', width: 2 },
                marker: { size: 5 },
                yaxis: 'y2',
                hovertemplate: `Year: %{x}<br>DSCR: %{y:.2f}<extra></extra>`
            });
        }
    }

    const layout = createDualAxisLayout(primaryAxis);
    return { data: traces, layout };
};

/**
 * Add covenant annotations to chart layout
 * @param {Object} layout - Existing Plotly layout object
 * @param {Array} covenantThresholds - Array of covenant threshold objects
 * @param {Array} years - Array of years for the chart
 * @returns {Object} Updated layout with covenant annotations
 */
export const addCovenantAnnotations = (layout, covenantThresholds = [], years = []) => {
    if (!layout.shapes) layout.shapes = [];
    if (!layout.annotations) layout.annotations = [];

    covenantThresholds.forEach(covenant => {
        const { value, label, color = '#ff4d4f', startYear, endYear } = covenant;

        const xStart = startYear || Math.min(...years);
        const xEnd = endYear || Math.max(...years);

        // Add horizontal line for covenant threshold
        layout.shapes.push({
            type: 'line',
            x0: xStart,
            x1: xEnd,
            y0: value,
            y1: value,
            line: {
                color: color,
                width: 3,
                dash: 'dash'
            }
        });

        // Add label annotation
        layout.annotations.push({
            x: xEnd * 0.9,
            y: value,
            text: label || `Covenant: ${value}`,
            showarrow: false,
            font: { size: 10, color: color },
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: color,
            borderwidth: 1
        });
    });

    return layout;
};

/**
 * Add refinancing window annotations
 * @param {Object} layout - Existing Plotly layout object
 * @param {Array} refinancingWindows - Array of refinancing window objects
 * @returns {Object} Updated layout with refinancing annotations
 */
export const addRefinancingAnnotations = (layout, refinancingWindows = []) => {
    if (!layout.shapes) layout.shapes = [];
    if (!layout.annotations) layout.annotations = [];

    refinancingWindows.forEach(window => {
        const { startYear, endYear, label, color = '#faad14' } = window;

        // Add vertical shaded region for refinancing window
        layout.shapes.push({
            type: 'rect',
            x0: startYear,
            x1: endYear,
            y0: 0,
            y1: 1,
            yref: 'paper',
            fillcolor: `rgba(${hexToRgb(color)}, 0.1)`,
            line: { width: 0 }
        });

        // Add label
        layout.annotations.push({
            x: (startYear + endYear) / 2,
            y: 0.95,
            yref: 'paper',
            text: label || 'Refinancing Window',
            showarrow: false,
            font: { size: 10, color: color },
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: color,
            borderwidth: 1
        });
    });

    return layout;
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
            title: 'Coverage Ratio',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickformat: '.2f'
        },
        legend: {
            orientation: 'h',
            y: -0.3,
            font: { size: 10 }
        },
        margin: { t: 20, b: 100, l: 80, r: 20 },
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
 * Create layout for dual-axis charts
 * @param {string} primaryAxis - Which axis is primary ('cashflow' or 'ratios')
 * @returns {Object} Plotly layout object
 */
const createDualAxisLayout = (primaryAxis = 'cashflow') => {
    return {
        title: '',
        xaxis: {
            title: 'Project Year',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tick0: 0,
            dtick: 1
        },
        yaxis: {
            title: primaryAxis === 'cashflow' ? 'Cash Flow ($)' : 'Coverage Ratio',
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickformat: primaryAxis === 'cashflow' ? '$,.0s' : '.2f',
            side: 'left'
        },
        yaxis2: {
            title: primaryAxis === 'cashflow' ? 'Coverage Ratio' : 'Cash Flow ($)',
            showgrid: false,
            tickformat: primaryAxis === 'cashflow' ? '.2f' : '$,.0s',
            side: 'right',
            overlaying: 'y'
        },
        legend: {
            orientation: 'h',
            y: -0.2,
            font: { size: 10 }
        },
        margin: { t: 20, b: 80, l: 80, r: 80 },
        height: 400,
        plot_bgcolor: '#fafafa'
    };
};

/**
 * Get financial color scheme for different metric types
 * @param {string} metricType - Type of financial metric
 * @returns {string} Hex color code
 */
export const getFinancialColorScheme = (metricType) => {
    const colors = {
        dscr: '#1890ff',      // Blue - primary coverage ratio
        llcr: '#52c41a',      // Green - loan life coverage
        icr: '#faad14',       // Orange - interest coverage
        irr: '#722ed1',       // Purple - returns
        npv: '#eb2f96',       // Pink - valuation
        cashflow: '#13c2c2',  // Cyan - cash flows
        debt: '#ff4d4f',      // Red - debt service
        equity: '#52c41a',    // Green - equity returns
        revenue: '#52c41a',   // Green - positive cash
        costs: '#ff4d4f'      // Red - negative cash
    };

    return colors[metricType] || '#666666';
};