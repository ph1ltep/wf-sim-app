// frontend/src/components/cards/configs/CashflowTimelineConfig.js - Updated for cube data
import { addRefinancingAnnotations, getFinancialColorScheme, getSemanticColor } from '../../../utils/charts';

/**
 * Create timeline chart configuration for CashflowTimelineCard using cube data
 * @param {Object} context - Configuration context
 * @returns {Object} Chart data and layout for Plotly
 */
export const createTimelineChartConfig = (context) => {
    const {
        totalRevenue,
        totalCost,
        netCashflow,
        debtService,
        selectedPercentile,
        showDebtService = true,
        showEquityCashflow = true,
        token
    } = context;

    // Validate required cube sources
    if (!totalRevenue?.data || !totalCost?.data || !netCashflow?.data) {
        console.error('❌ createTimelineChartConfig: Missing required cube sources');
        return { data: [], layout: {}, error: 'Missing required cube sources' };
    }

    // Get primary percentile
    const primaryPercentile = selectedPercentile?.value || 50;
    console.log(`🔄 createTimelineChartConfig: Using percentile ${primaryPercentile}`);

    // Check debt service availability
    const hasValidDebtService = debtService?.data && debtService.data.length > 0;
    const effectiveShowDebtService = showDebtService && hasValidDebtService;
    const effectiveShowEquityCashflow = showEquityCashflow && hasValidDebtService;

    if (!hasValidDebtService) {
        console.log('ℹ️ createTimelineChartConfig: Debt service not available, disabling debt service features');
    }

    // Calculate equity cash flow if debt service is available
    let equityCashflowData = null;
    if (effectiveShowEquityCashflow && debtService?.data) {
        const debtMap = new Map(debtService.data.map(d => [d.year, d.value]));
        const equityData = netCashflow.data.map(cf => ({
            year: cf.year,
            value: cf.value - (debtMap.get(cf.year) || 0)
        }));
        equityCashflowData = { data: equityData };
    }

    // Build chart traces
    const traces = buildTimelineTracesFromCube({
        totalRevenue,
        totalCost,
        netCashflow,
        debtService: effectiveShowDebtService ? debtService : null,
        equityCashflowData,
        showDebtService: effectiveShowDebtService,
        showEquityCashflow: effectiveShowEquityCashflow
    }, { token });

    // Create layout with annotations
    let layout = createTimelineLayout('USD'); // TODO: Get currency from cube references

    // Add refinancing window annotations
    const refinancingWindows = [
        { startYear: 5, endYear: 7, label: 'Typical Refinancing Window', color: getSemanticColor('warning', 5, token) }
    ];
    layout = addRefinancingAnnotations(layout, refinancingWindows);

    return { data: traces, layout };
};

/**
 * Build chart traces from cube sources
 * @param {Object} cubeData - Cube data sources
 * @param {Object} options - Chart options
 * @returns {Array} Plotly traces
 */
const buildTimelineTracesFromCube = (cubeData, options = {}) => {
    const {
        totalRevenue,
        totalCost,
        netCashflow,
        debtService,
        equityCashflowData,
        showDebtService,
        showEquityCashflow
    } = cubeData;

    const { token } = options;
    const colors = getFinancialColorScheme(token);
    const traces = [];

    // Revenue trace (positive, green)
    if (totalRevenue?.data) {
        traces.push({
            x: totalRevenue.data.map(d => d.year),
            y: totalRevenue.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Total Revenue',
            line: { color: colors.revenue, width: 3 },
            marker: { size: 6, color: colors.revenue },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Revenue: $%{y:,.0f}<extra></extra>'
        });
    }

    // Costs trace (negative, red)
    if (totalCost?.data) {
        traces.push({
            x: totalCost.data.map(d => d.year),
            y: totalCost.data.map(d => -Math.abs(d.value)), // Ensure negative
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Total Costs',
            line: { color: colors.costs, width: 3 },
            marker: { size: 6, color: colors.costs },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Costs: $%{y:,.0f}<extra></extra>'
        });
    }

    // Net cashflow trace (blue)
    if (netCashflow?.data) {
        traces.push({
            x: netCashflow.data.map(d => d.year),
            y: netCashflow.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Net Cashflow',
            line: { color: colors.netCashflow, width: 4 },
            marker: { size: 8, color: colors.netCashflow },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Net Cashflow: $%{y:,.0f}<extra></extra>'
        });
    }

    // Debt service trace (secondary axis, purple)
    if (showDebtService && debtService?.data) {
        traces.push({
            x: debtService.data.map(d => d.year),
            y: debtService.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Debt Service',
            line: { color: colors.debtService, width: 2, dash: 'dot' },
            marker: { size: 4, color: colors.debtService },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Debt Service: $%{y:,.0f}<extra></extra>'
        });
    }

    // Equity cashflow trace (orange)
    if (showEquityCashflow && equityCashflowData?.data) {
        traces.push({
            x: equityCashflowData.data.map(d => d.year),
            y: equityCashflowData.data.map(d => d.value),
            type: 'scatter',
            mode: 'lines+markers',
            name: 'Equity Cash Flow',
            line: { color: colors.equityCashflow, width: 2 },
            marker: { size: 5, color: colors.equityCashflow },
            yaxis: 'y',
            hovertemplate: 'Year: %{x}<br>Equity Cash Flow: $%{y:,.0f}<extra></extra>'
        });
    }

    // Zero line (neutral gray)
    if (netCashflow?.data) {
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
    }

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
 * Create chart controls configuration - Updated for cube data
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
 * Create metadata footer configuration - Updated for cube data
 * @param {Object} context - Metadata context
 * @returns {Object} Footer configuration
 */
export const createMetadataFooterConfig = (context) => {
    const {
        selectedPercentile,
        showDebtService,
        showEquityCashflow,
        metadata = {}
    } = context;

    const strategyText = `Unified P${selectedPercentile?.value || 50}`;
    const projectText = `${metadata.projectLife || 25} years • Cube Data`;

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
 * Validate cube data before rendering
 * @param {Object} cubeData - Cube data sources
 * @returns {Object} { isValid, error }
 */
export const validateChartData = (cubeData) => {
    if (!cubeData) {
        return { isValid: false, error: 'No cube data available' };
    }

    if (!cubeData.totalRevenue?.data || !cubeData.totalCost?.data || !cubeData.netCashflow?.data) {
        const missing = [];
        if (!cubeData.totalRevenue?.data) missing.push('totalRevenue');
        if (!cubeData.totalCost?.data) missing.push('totalCost');
        if (!cubeData.netCashflow?.data) missing.push('netCashflow');

        return { isValid: false, error: `Required cube sources missing: ${missing.join(', ')}` };
    }

    return { isValid: true };
};

/**
 * Create multiplier information summary for display - Legacy support for cube data
 * @param {Object} cubeData - Cube data sources  
 * @returns {Array} Array of multiplier information (empty for cube data)
 */
export const createMultiplierSummary = (cubeData) => {
    // Cube data doesn't expose individual multipliers like lineItems did
    // Return empty array for now - could be enhanced to extract from cube metadata
    console.log('ℹ️ createMultiplierSummary: Multiplier information not available in cube data');
    return [];
};