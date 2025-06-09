// src/components/cards/configs/CashflowTimelineConfig.js - CashflowTimelineCard configuration factory
import { addRefinancingAnnotations, getFinancialColorScheme, getSemanticColor } from '../../../utils/charts';

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
        lineItems = [],
        token
    } = context;

    if (!cashflowData || !cashflowData.aggregations) {
        return { data: [], layout: {} };
    }

    const { totalCosts, totalRevenue, netCashflow } = cashflowData.aggregations;
    const primaryPercentile = selectedPercentiles?.unified || 50;

    // FIXED: Find both interest and principal line items for debt service
    const interestLineItem = lineItems.find(item => item.id === 'operationalInterest');
    const principalLineItem = lineItems.find(item => item.id === 'operationalPrincipal');

    // FIXED: Combine interest and principal to create total debt service
    let debtServiceData = null;
    if ((interestLineItem || principalLineItem) && showDebtService) {
        debtServiceData = combineDebtServiceData(interestLineItem, principalLineItem, primaryPercentile);
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
    }, { token });

    // Create layout with annotations
    let layout = createTimelineLayout(cashflowData.metadata.currency);

    // Add refinancing window annotations
    const refinancingWindows = [
        { startYear: 5, endYear: 7, label: 'Typical Refinancing Window', color: getSemanticColor('warning', 5, token) }
    ];
    layout = addRefinancingAnnotations(layout, refinancingWindows);

    return { data: traces, layout };
};

/**
 * ADDED: Combine interest and principal line items into total debt service
 * @param {Object} interestLineItem - Interest payments line item
 * @param {Object} principalLineItem - Principal payments line item  
 * @param {number} primaryPercentile - Primary percentile to use
 * @returns {Object|null} Combined debt service data
 */
const combineDebtServiceData = (interestLineItem, principalLineItem, primaryPercentile) => {
    // Get data from both sources
    let interestData = null;
    let principalData = null;

    if (interestLineItem) {
        if (interestLineItem.percentileData?.has(primaryPercentile)) {
            interestData = interestLineItem.percentileData.get(primaryPercentile);
        } else if (interestLineItem.data) {
            interestData = interestLineItem.data;
        }
    }

    if (principalLineItem) {
        if (principalLineItem.percentileData?.has(primaryPercentile)) {
            principalData = principalLineItem.percentileData.get(primaryPercentile);
        } else if (principalLineItem.data) {
            principalData = principalLineItem.data;
        }
    }

    // If no data from either source, return null
    if (!interestData && !principalData) {
        return null;
    }

    // Create maps for easier lookup
    const interestMap = new Map((interestData || []).map(d => [d.year, d.value || 0]));
    const principalMap = new Map((principalData || []).map(d => [d.year, d.value || 0]));

    // Get all years from both datasets
    const allYears = new Set([
        ...(interestData || []).map(d => d.year),
        ...(principalData || []).map(d => d.year)
    ]);

    // Combine data for each year
    const combinedData = Array.from(allYears).map(year => ({
        year,
        value: (interestMap.get(year) || 0) + (principalMap.get(year) || 0)
    })).filter(d => d.value > 0) // Only include years with actual debt service
        .sort((a, b) => a.year - b.year);

    return { data: combinedData };
};

/**
 * Build chart traces for timeline visualization
 * @param {Object} traceData - Data for all trace types
 * @param {Object} options - Additional objects, in array form.
 * @returns {Array} Array of Plotly trace objects
 */
const buildTimelineTraces = (traceData, options = {}) => {
    const { token } = options;

    const {
        totalRevenue,
        totalCosts,
        netCashflow,
        debtServiceData,
        equityCashflowData,
        showDebtService,
        showEquityCashflow
    } = traceData;

    // Financial colors defined directly (no token support needed)
    const colors = {
        revenue: getFinancialColorScheme('revenue'),           // green[7] - deep green
        costs: getFinancialColorScheme('costs'),               // red[6] - deep red
        profit: getFinancialColorScheme('netCashflow'),        // blue[4] - light blue for net
        debt: getFinancialColorScheme('debtService'),          // volcano[5] - warm red-orange
        equity: getFinancialColorScheme('freeCashflow'),       // cyan[7] - dark cyan
        breakeven: getFinancialColorScheme('breakeven')        // grey[5] - neutral
    };

    const traces = [];

    // Revenue trace (deep green - strong positive)
    traces.push({
        x: totalRevenue.data.map(d => d.year),
        y: totalRevenue.data.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Revenue',
        line: { color: colors.revenue, width: 3 },
        marker: { size: 6 },
        yaxis: 'y',
        hovertemplate: 'Year: %{x}<br>Revenue: $%{y:,.0f}<extra></extra>'
    });

    // Costs trace (deep red - clearly negative)
    traces.push({
        x: totalCosts.data.map(d => d.year),
        y: totalCosts.data.map(d => -d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Costs',
        line: { color: colors.costs, width: 3 },
        marker: { size: 6 },
        yaxis: 'y',
        hovertemplate: 'Year: %{x}<br>Costs: $%{y:,.0f}<extra></extra>'
    });

    // Net cashflow trace (blue - analytical result)
    traces.push({
        x: netCashflow.data.map(d => d.year),
        y: netCashflow.data.map(d => d.value),
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Net Cash Flow',
        line: { color: colors.profit, width: 4 },
        marker: { size: 8 },
        yaxis: 'y',
        hovertemplate: 'Year: %{x}<br>Net Cash Flow: $%{y:,.0f}<extra></extra>'
    });

    // Debt service (red-orange - debt burden)
    if (debtServiceData?.data && showDebtService) {
        traces.push({
            x: debtServiceData.data.map(d => d.year),
            y: debtServiceData.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Debt Service',
            line: { color: colors.debt, width: 2, dash: 'dot' },
            marker: { size: 5 },
            yaxis: 'y2',
            hovertemplate: 'Year: %{x}<br>Debt Service: $%{y:,.0f}<extra></extra>'
        });
    }

    // Free cash flow to equity (dark cyan - investor focused)
    if (equityCashflowData?.data && showEquityCashflow) {
        traces.push({
            x: equityCashflowData.data.map(d => d.year),
            y: equityCashflowData.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Free Cash Flow to Equity',
            line: { color: colors.equity, width: 2 },
            marker: { size: 5 },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Equity Cash Flow: $%{y:,.0f}<extra></extra>'
        });
    }

    // Zero line (neutral gray)
    const years = netCashflow.data.map(d => d.year);
    traces.push({
        x: years,
        y: years.map(() => 0),
        type: 'scatter',
        mode: 'lines',
        name: 'Break-even',
        line: { color: colors.breakeven, width: 1, dash: 'dash' },
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
