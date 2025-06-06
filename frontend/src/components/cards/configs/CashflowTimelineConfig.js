// src/components/cards/configs/CashflowTimelineConfig.js - CashflowTimelineCard configuration factory
import { addRefinancingAnnotations } from '../../../utils/charts';

/**
 * Create timeline chart configuration for CashflowTimelineCard
 * @param {Object} context - Configuration context
 * @returns {Object} Chart data and layout for Plotly
 */
export const createTimelineChartConfig = (context) => {
    const {
        cashflowData,
        selectedPercentiles,
        showDebtService = true,
        showEquityCashflow = true,
        lineItems = []
    } = context;

    if (!cashflowData || !cashflowData.aggregations) {
        return { data: [], layout: {} };
    }

    const { totalCosts, totalRevenue, netCashflow } = cashflowData.aggregations;
    const primaryPercentile = selectedPercentiles?.unified || 50;

    // Find debt service and equity cashflow line items
    const debtServiceLineItem = lineItems.find(item => item.id === 'operationalDebtService');

    // Get debt service data
    let debtServiceData = null;
    if (debtServiceLineItem && showDebtService) {
        if (debtServiceLineItem.percentileData?.has(primaryPercentile)) {
            debtServiceData = { data: debtServiceLineItem.percentileData.get(primaryPercentile) };
        } else if (debtServiceLineItem.data) {
            debtServiceData = { data: debtServiceLineItem.data };
        }
    }

    // Calculate equity cash flow (net cashflow - debt service)
    let equityCashflowData = null;
    if (showEquityCashflow && debtServiceData?.data) {
        const debtMap = new Map(debtServiceData.data.map(d => [d.year, d.value]));
        const equityData = netCashflow.data.map(cf => ({
            year: cf.year,
            value: cf.value - (debtMap.get(cf.year) || 0)
        }));
        equityCashflowData = { data: equityData };
    }

    // Build chart traces
    const traces = buildTimelineTraces({
        totalRevenue,
        totalCosts,
        netCashflow,
        debtServiceData,
        equityCashflowData,
        showDebtService,
        showEquityCashflow
    });

    // Create layout with annotations
    let layout = createTimelineLayout(cashflowData.metadata.currency);

    // Add refinancing window annotations
    const refinancingWindows = [
        { startYear: 5, endYear: 7, label: 'Typical Refinancing Window', color: '#faad14' }
    ];
    layout = addRefinancingAnnotations(layout, refinancingWindows);

    return { data: traces, layout };
};

/**
 * Build chart traces for timeline visualization
 * @param {Object} traceData - Data for all trace types
 * @returns {Array} Array of Plotly trace objects
 */
const buildTimelineTraces = (traceData) => {
    const {
        totalRevenue,
        totalCosts,
        netCashflow,
        debtServiceData,
        equityCashflowData,
        showDebtService,
        showEquityCashflow
    } = traceData;

    const traces = [];

    // Revenue trace (positive, green)
    traces.push({
        x: totalRevenue.data.map(d => d.year),
        y: totalRevenue.data.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Revenue',
        line: { color: '#52c41a', width: 3 },
        marker: { size: 6 },
        yaxis: 'y',
        hovertemplate: 'Year: %{x}<br>Revenue: $%{y:,.0f}<extra></extra>'
    });

    // Costs trace (negative, red)
    traces.push({
        x: totalCosts.data.map(d => d.year),
        y: totalCosts.data.map(d => -d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Costs',
        line: { color: '#ff4d4f', width: 3 },
        marker: { size: 6 },
        yaxis: 'y',
        hovertemplate: 'Year: %{x}<br>Costs: $%{y:,.0f}<extra></extra>'
    });

    // Net cashflow trace (blue)
    traces.push({
        x: netCashflow.data.map(d => d.year),
        y: netCashflow.data.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Net Cash Flow',
        line: { color: '#1890ff', width: 4 },
        marker: { size: 8 },
        yaxis: 'y',
        hovertemplate: 'Year: %{x}<br>Net Cash Flow: $%{y:,.0f}<extra></extra>'
    });

    // Add debt service on secondary axis
    if (debtServiceData?.data && showDebtService) {
        traces.push({
            x: debtServiceData.data.map(d => d.year),
            y: debtServiceData.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Debt Service',
            line: { color: '#722ed1', width: 2, dash: 'dot' },
            marker: { size: 5 },
            yaxis: 'y2',
            hovertemplate: 'Year: %{x}<br>Debt Service: $%{y:,.0f}<extra></extra>'
        });
    }

    // Add equity cash flow on primary axis
    if (equityCashflowData?.data && showEquityCashflow) {
        traces.push({
            x: equityCashflowData.data.map(d => d.year),
            y: equityCashflowData.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Free Cash Flow to Equity',
            line: { color: '#13c2c2', width: 2 },
            marker: { size: 5 },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Equity Cash Flow: $%{y:,.0f}<extra></extra>'
        });
    }

    // Add zero line
    const years = netCashflow.data.map(d => d.year);
    traces.push({
        x: years,
        y: years.map(() => 0),
        type: 'scatter',
        mode: 'lines',
        name: 'Break-even',
        line: { color: '#999', width: 1, dash: 'dash' },
        yaxis: 'y',
        showlegend: false,
        hoverinfo: 'skip'
    });

    return traces;
};

/**
 * Create dual-axis layout for timeline chart
 * @param {string} currency - Currency code for axis labels
 * @returns {Object} Plotly layout object
 */
const createTimelineLayout = (currency) => {
    return {
        title: '',
        xaxis: {
            title: 'Project Year',
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: `Cash Flow (${currency})`,
            showgrid: true,
            gridcolor: '#f0f0f0',
            tickformat: '$,.0s',
            side: 'left'
        },
        yaxis2: {
            title: `Debt Service (${currency})`,
            showgrid: false,
            tickformat: '$,.0s',
            side: 'right',
            overlaying: 'y'
        },
        legend: {
            orientation: 'h',
            y: -0.2
        },
        margin: { t: 20, b: 80, l: 80, r: 80 },
        height: 400,
        plot_bgcolor: '#fafafa'
    };
};

/**
 * Create multiplier information summary for display
 * @param {Array} lineItems - Cashflow line items
 * @returns {Array} Array of unique multiplier IDs
 */
export const createMultiplierSummary = (lineItems) => {
    if (!Array.isArray(lineItems)) return [];

    const multipliers = new Set();
    lineItems.forEach(item => {
        item.metadata?.appliedMultipliers?.forEach(m => {
            multipliers.add(m.id);
        });
    });

    return Array.from(multipliers);
};

/**
 * Create chart controls configuration
 * @param {Object} context - Controls context
 * @returns {Object} Controls configuration
 */
export const createChartControlsConfig = (context) => {
    const {
        showDebtService,
        showEquityCashflow,
        onToggleDebtService,
        onToggleEquityCashflow,
        hasDebtService = false,
        hasEquityCashflow = false
    } = context;

    return {
        controls: [
            {
                key: 'debtService',
                label: 'Debt Service',
                checked: showDebtService,
                onChange: onToggleDebtService,
                disabled: !hasDebtService
            },
            {
                key: 'equityCashflow',
                label: 'Equity Cash Flow',
                checked: showEquityCashflow,
                onChange: onToggleEquityCashflow,
                disabled: !hasEquityCashflow
            }
        ]
    };
};

/**
 * Create metadata footer configuration
 * @param {Object} context - Metadata context
 * @returns {Object} Footer configuration
 */
export const createMetadataFooterConfig = (context) => {
    const {
        cashflowData,
        selectedPercentiles,
        showDebtService,
        showEquityCashflow
    } = context;

    const strategyText = cashflowData.metadata.percentileStrategy.strategy === 'unified'
        ? `Unified P${selectedPercentiles?.unified || 50}`
        : 'Per-Source';

    const projectText = `${cashflowData.metadata.projectLife} years, ${cashflowData.metadata.numWTGs} WTGs`;

    const optionsText = [
        showDebtService && 'Debt Service',
        showEquityCashflow && 'Equity Cash Flow'
    ].filter(Boolean).join(' • ');

    return {
        left: `Strategy: ${strategyText}`,
        right: `Project: ${projectText}${optionsText ? ' • ' + optionsText : ''}`
    };
};

/**
 * Validate chart data before rendering
 * @param {Object} cashflowData - Cashflow data
 * @returns {Object} { isValid, error }
 */
export const validateChartData = (cashflowData) => {
    if (!cashflowData) {
        return { isValid: false, error: 'No cashflow data available' };
    }

    if (!cashflowData.aggregations || cashflowData.lineItems.length === 0) {
        return { isValid: false, error: 'No line items available for timeline display' };
    }

    return { isValid: true };
};