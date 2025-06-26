// frontend/src/utils/charts/sensitivity/tornado.js
// Tornado chart implementation for sensitivity analysis

import { generateSmartColors, generateHighlightOpacity } from './colors';

/**
 * Prepare tornado chart data for sensitivity analysis
 * @param {Object} params - Chart parameters
 * @param {Array} params.sensitivityResults - Results from sensitivity analysis
 * @param {string} params.targetMetric - Target metric (npv, irr, etc.)
 * @param {string} params.highlightedDriver - Driver ID to highlight
 * @param {Object} params.metricConfig - Metric configuration from SUPPORTED_METRICS
 * @param {Object} params.options - Additional chart options
 * @returns {Object} Plotly chart data and layout
 */
export const prepareTornadoChartData = ({
    sensitivityResults,
    targetMetric,
    highlightedDriver,
    metricConfig,
    options = {}
}) => {
    if (!sensitivityResults || !sensitivityResults.length) {
        return null;
    }

    if (!metricConfig) {
        console.error(`Unknown target metric: ${targetMetric}`);
        return null;
    }

    const {
        showVariableCount = true,
        includeConfidenceInTitle = true,
        customHeight = null
    } = options;

    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);

    // Generate smart colors and opacity
    const colors = generateSmartColors(sortedResults, highlightedDriver);
    const opacity = generateHighlightOpacity(sortedResults, highlightedDriver);

    const data = [{
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.impact),
        y: sortedResults.map(r => r.variable),
        text: sortedResults.map(r => metricConfig.impactFormat(r.impact)),
        textposition: 'auto',
        marker: {
            color: colors,
            line: { color: '#fff', width: 1 },
            opacity: opacity
        },
        customdata: sortedResults,
        hovertemplate:
            '<b>%{y}</b><br>' +
            `${metricConfig.label} Impact: <b>%{text}</b><br>` +
            '<br>' +
            'Base Case (P%{customdata.percentileRange.base}): %{customdata.baseValue}<br>' +
            'Low Scenario (P%{customdata.percentileRange.lower}): %{customdata.lowValue}<br>' +
            'High Scenario (P%{customdata.percentileRange.upper}): %{customdata.highValue}<br>' +
            '<br>' +
            'Variable Range: %{customdata.variableValues.low} → %{customdata.variableValues.high}<br>' +
            'Confidence Level: %{customdata.percentileRange.confidenceInterval}%<br>' +
            'Category: %{customdata.displayCategory}<br>' +
            'Source: %{customdata.source}' +
            '<extra></extra>'
    }];

    // Calculate dynamic height
    const calculatedHeight = customHeight || Math.max(400, sortedResults.length * 45 + 120);

    // Build axis titles
    const yAxisTitle = showVariableCount
        ? `Variables (${sortedResults.length} analyzed, ranked by impact)`
        : 'Variables (Ranked by Impact)';

    const layout = {
        title: '',  // Title handled by card header
        xaxis: {
            title: `${metricConfig.label} Impact`,
            tickformat: metricConfig.units === 'currency' ? '$,.0s' :
                metricConfig.units === 'percentage' ? '.1%' : '.2f',
            showgrid: true,
            gridcolor: '#f0f0f0',
            zeroline: true,
            zerolinecolor: '#666',
            zerolinewidth: 2
        },
        yaxis: {
            title: yAxisTitle,
            showgrid: false,
            automargin: true,
            tickfont: { size: 12 }
        },
        margin: { t: 20, b: 80, l: 140, r: 80 },
        height: calculatedHeight,
        plot_bgcolor: '#fafafa',
        paper_bgcolor: '#ffffff',
        showlegend: false,
        font: { family: 'Inter, -apple-system, sans-serif', size: 12 },
        hoverlabel: {
            bgcolor: '#ffffff',
            bordercolor: '#d9d9d9',
            font: { size: 13 }
        }
    };

    const config = {
        responsive: true,
        displayModeBar: true,
        modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d'],
        displaylogo: false,
        toImageButtonOptions: {
            format: 'png',
            filename: `sensitivity_analysis_${targetMetric}`,
            height: calculatedHeight,
            width: 800,
            scale: 2
        }
    };

    return { data, layout, config };
};

/**
 * Create tornado chart click handler for variable highlighting
 * @param {Function} onVariableSelect - Callback function for variable selection
 * @param {Object} options - Handler options
 * @returns {Function} Plotly click event handler
 */
export const createTornadoClickHandler = (onVariableSelect, options = {}) => {
    const { preventDefault = false, enableToggle = true } = options;

    return (eventData) => {
        if (preventDefault) {
            eventData.event?.preventDefault?.();
        }

        if (eventData.points && eventData.points.length > 0) {
            const point = eventData.points[0];
            const variableData = point.customdata;

            if (variableData && onVariableSelect) {
                const variableId = enableToggle ? variableData.variableId : variableData.variableId;
                onVariableSelect(variableId, variableData, eventData);
            }
        }
    };
};

/**
 * Update tornado chart colors based on highlighted variable
 * @param {Object} plotlyDiv - Plotly chart div element
 * @param {Array} sensitivityResults - Sensitivity results
 * @param {string} highlightedDriver - Driver ID to highlight
 * @param {Object} options - Update options
 * @returns {void}
 */
export const updateTornadoHighlight = (plotlyDiv, sensitivityResults, highlightedDriver, options = {}) => {
    if (!plotlyDiv || !sensitivityResults) return;

    const { animationDuration = 300 } = options;

    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);

    // Generate new colors and opacity
    const newColors = generateSmartColors(sortedResults, highlightedDriver);
    const newOpacity = generateHighlightOpacity(sortedResults, highlightedDriver);

    const update = {
        'marker.color': [newColors],
        'marker.opacity': [newOpacity]
    };

    const animationOptions = {
        transition: { duration: animationDuration },
        frame: { duration: animationDuration }
    };

    if (window.Plotly) {
        window.Plotly.restyle(plotlyDiv, update, [0]).then(() => {
            // Optional: trigger any post-update callbacks
            if (options.onUpdateComplete) {
                options.onUpdateComplete(highlightedDriver);
            }
        });
    }
};

/**
 * Get tornado chart layout options for different display modes
 * @param {string} mode - Display mode ('compact', 'detailed', 'presentation')
 * @param {number} variableCount - Number of variables
 * @returns {Object} Layout options
 */
export const getTornadoLayoutOptions = (mode = 'detailed', variableCount = 5) => {
    const modes = {
        compact: {
            height: Math.max(300, variableCount * 35 + 80),
            margin: { t: 10, b: 60, l: 120, r: 60 },
            font: { size: 11 },
            showVariableCount: false
        },
        detailed: {
            height: Math.max(400, variableCount * 45 + 120),
            margin: { t: 20, b: 80, l: 140, r: 80 },
            font: { size: 12 },
            showVariableCount: true
        },
        presentation: {
            height: Math.max(500, variableCount * 50 + 150),
            margin: { t: 30, b: 100, l: 160, r: 100 },
            font: { size: 14 },
            showVariableCount: true,
            includeConfidenceInTitle: true
        }
    };

    return modes[mode] || modes.detailed;
};