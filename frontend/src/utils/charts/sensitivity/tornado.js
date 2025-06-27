// frontend/src/utils/charts/sensitivity/tornado.js
// Tornado chart implementation for sensitivity analysis

import { generateSmartColors, generateHighlightOpacity } from './colors';
import { formatLargeNumber } from '../../../utils/tables/formatting';

/**
 * Prepare tornado chart data for sensitivity analysis - TRUE TORNADO FORMAT
 * @param {Object} params - Chart parameters
 * @param {Array} params.sensitivityResults - Results from sensitivity analysis with leftPercent/rightPercent
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
        customHeight = null
    } = options;

    // Sort by total spread (sum of absolute left and right percentages)
    const sortedResults = [...sensitivityResults].sort((a, b) => b.totalSpread - a.totalSpread);

    // Generate smart colors and opacity
    const colors = generateSmartColors(sortedResults, highlightedDriver);
    const opacity = generateHighlightOpacity(sortedResults, highlightedDriver);

    // Create two traces - left (negative) and right (positive) bars
    const leftData = {
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.leftPercent / 100),
        y: sortedResults.map(r => r.displayName), // ✅ FIXED: Use displayName
        name: 'Downside',
        marker: {
            color: colors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.7)')),
            line: { color: '#fff', width: 1 }
        },
        opacity: opacity,
        customdata: sortedResults,
        hovertemplate:
            '<b>%{customdata.displayName}</b><br>' + // ✅ FIXED: Use displayName
            'Δ%: <b>%{customdata.leftPercent:.1f}%</b><br>' +
            'Δ: <b>%{customdata.leftDelta:.1f}</b><br>' +
            'Absolute: <b>%{customdata.lowValueFormatted}</b><br>' +
            'Range: %{customdata.variableRange}<br>' +
            '<extra></extra>'
    };

    const rightData = {
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.rightPercent / 100),
        y: sortedResults.map(r => r.displayName), // ✅ FIXED: Use displayName
        name: 'Upside',
        marker: {
            color: colors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.7)')),
            line: { color: '#fff', width: 1 }
        },
        opacity: opacity,
        customdata: sortedResults,
        hovertemplate:
            '<b>%{customdata.displayName}</b><br>' + // ✅ FIXED: Use displayName
            'Δ%: <b>+%{customdata.rightPercent:.1f}%</b><br>' +
            'Δ: <b>+%{customdata.rightDelta:.1f}</b><br>' +
            'Absolute: <b>%{customdata.highValueFormatted}</b><br>' +
            'Range: %{customdata.variableRange}<br>' +
            '<extra></extra>'
    };

    // Rest of the function remains the same...
    const calculatedHeight = customHeight || Math.max(300, sortedResults.length * 30 + 100);
    const maxPercent = Math.max(
        ...sortedResults.map(r => Math.max(Math.abs(r.leftPercent), Math.abs(r.rightPercent)))
    );
    const axisRange = (maxPercent * 1.1) / 100;
    const yAxisTitle = showVariableCount ?
        `Variables (${sortedResults.length})` : 'Variables';

    const layout = {
        title: '',
        xaxis: {
            title: `${metricConfig.label} Impact (% from baseline)`,
            range: [-axisRange, axisRange],
            zeroline: true,
            zerolinecolor: '#333',
            zerolinewidth: 2,
            tickformat: '.1%',
            showgrid: true,
            gridcolor: '#f0f0f0'
        },
        yaxis: {
            title: yAxisTitle,
            autorange: 'reversed',
            showgrid: false,
            tickfont: { size: 10 }
        },
        height: calculatedHeight,
        margin: { t: 10, b: 40, l: 140, r: 60 }, // ✅ REDUCED: bottom margin from 60 to 40
        font: { size: 11 },
        barmode: 'overlay',
        showlegend: false, // ✅ REMOVED: Hide legend
        hovermode: 'closest',
        plot_bgcolor: 'white',
        paper_bgcolor: 'white',
        bargap: 0.2
    };

    const config = {
        displayModeBar: false,
        responsive: true
    };

    return {
        data: [leftData, rightData],
        layout,
        config
    };
};

/**
 * Create tornado chart click handler for variable highlighting
 * @param {Function} onVariableSelect - Callback function for variable selection
 * @param {Object} options - Handler options
 * @returns {Function} Plotly click event handler
 */
export const createTornadoClickHandler = (onVariableSelect, options = {}) => {
    const { enableToggle = true } = options;

    return (eventData) => {
        if (!onVariableSelect) {
            console.warn('No onVariableSelect handler provided to createTornadoClickHandler');
            return;
        }

        if (eventData.points && eventData.points.length > 0) {
            const point = eventData.points[0];
            const variableData = point.customdata;

            if (variableData && onVariableSelect) {
                const variableId = variableData.id; // ✅ FIXED: Use id instead of variableId
                onVariableSelect(enableToggle ? variableId : variableId, variableData, eventData);
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