// Update frontend/src/utils/charts/financial.js - SIMPLIFIED VERSION

import { getFinancialColorScheme, getSemanticColor, createColorWithOpacity } from './colors';

/**
 * Prepare tornado chart data for sensitivity analysis - SIMPLIFIED
 * @param {Object} params - Chart parameters
 * @param {Array} params.sensitivityResults - Results from performRegistryBasedSensitivityAnalysis
 * @param {string} params.targetMetric - Target metric (npv, irr, etc.)
 * @param {string} params.highlightedDriver - Driver ID to highlight
 * @param {Object} params.metricConfig - Metric configuration from SUPPORTED_METRICS
 * @returns {Object} Plotly chart data and layout
 */
export const prepareTornadoChartData = ({
    sensitivityResults,
    targetMetric,
    highlightedDriver,
    metricConfig
}) => {
    if (!sensitivityResults || !sensitivityResults.length) {
        return null;
    }

    if (!metricConfig) {
        console.error(`Unknown target metric: ${targetMetric}`);
        return null;
    }

    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);

    const data = [{
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.impact),
        y: sortedResults.map(r => r.variable),
        text: sortedResults.map(r => metricConfig.impactFormat(r.impact)),
        textposition: 'auto',
        marker: {
            color: sortedResults.map(r => {
                if (r.variableId === highlightedDriver) {
                    return getSemanticColor('primary', 7); // Highlighted
                }

                // SIMPLIFIED: Direct call to getFinancialColorScheme
                if (r.variableType === 'multiplier') {
                    return getFinancialColorScheme(r.category); // 'escalation', 'pricing'
                }
                return getFinancialColorScheme(r.variableType); // 'revenue', 'cost'
            }),
            line: { color: '#fff', width: 1 }
        },
        customdata: sortedResults,
        hovertemplate:
            '<b>%{y}</b><br>' +
            `${metricConfig.label} Impact: %{text}<br>` +
            'Base (P%{customdata.percentileRange.base}): %{customdata.baseValue}<br>' +
            'Low (P%{customdata.percentileRange.lower}): %{customdata.lowValue}<br>' +
            'High (P%{customdata.percentileRange.upper}): %{customdata.highValue}<br>' +
            'Variable Range: %{customdata.variableValues.low} → %{customdata.variableValues.high}<br>' +
            'Confidence: %{customdata.percentileRange.confidenceInterval}%<br>' +
            'Type: %{customdata.displayCategory}' +
            '<extra></extra>'
    }];

    const layout = {
        title: '',  // Title handled by card header
        xaxis: {
            title: `${metricConfig.label} Impact`,
            tickformat: metricConfig.units === 'currency' ? '$,.0s' :
                metricConfig.units === 'percentage' ? '.1%' : '.2f',
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: 'Variables',
            showgrid: false,
            automargin: true
        },
        margin: { t: 20, b: 80, l: 120, r: 80 },
        height: Math.max(400, sortedResults.length * 40 + 100),
        plot_bgcolor: '#fafafa',
        showlegend: false
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
        displaylogo: false
    };

    return { data, layout, config };
};

/**
 * Create tornado chart click handler for variable highlighting
 * @param {Function} onVariableSelect - Callback function for variable selection
 * @returns {Function} Plotly click event handler
 */
export const createTornadoClickHandler = (onVariableSelect) => {
    return (eventData) => {
        if (eventData.points && eventData.points.length > 0) {
            const point = eventData.points[0];
            const variableData = point.customdata;

            if (variableData && onVariableSelect) {
                onVariableSelect(variableData.variableId, variableData);
            }
        }
    };
};

/**
 * Update tornado chart colors based on highlighted variable
 * @param {Object} plotlyDiv - Plotly chart div element
 * @param {Array} sensitivityResults - Sensitivity results
 * @param {string} highlightedDriver - Driver ID to highlight
 * @returns {void}
 */
export const updateTornadoHighlight = (plotlyDiv, sensitivityResults, highlightedDriver) => {
    if (!plotlyDiv || !sensitivityResults) return;

    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);

    const newColors = sortedResults.map(r => {
        if (r.variableId === highlightedDriver) {
            return getSemanticColor('primary', 7);
        }

        // SIMPLIFIED: Direct call
        if (r.variableType === 'multiplier') {
            return getFinancialColorScheme(r.category);
        }
        return getFinancialColorScheme(r.variableType);
    });

    const update = { 'marker.color': [newColors] };
    window.Plotly?.restyle(plotlyDiv, update, [0]);
};