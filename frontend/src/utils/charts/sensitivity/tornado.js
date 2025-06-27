// frontend/src/utils/charts/sensitivity/tornado.js
// Tornado chart implementation for sensitivity analysis - TARGET METRIC VALUES

import { generateSmartColors, generateHighlightOpacity } from './colors';
import { formatLargeNumber } from '../../../utils/tables/formatting';

/**
 * Prepare tornado chart data for sensitivity analysis - TRUE TORNADO FORMAT
 * @param {Object} params - Chart parameters
 * @param {Array} params.sensitivityResults - Results from sensitivity analysis with target metric values
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

    // Sort by total target metric spread (absolute impact)
    const sortedResults = [...sensitivityResults].sort((a, b) => b.totalTargetSpread - a.totalTargetSpread);

    // Generate smart colors and opacity
    const colors = generateSmartColors(sortedResults, highlightedDriver);
    const opacity = generateHighlightOpacity(sortedResults, highlightedDriver);

    // Calculate chart scale based on target metric values
    const allTargetValues = sortedResults.flatMap(r => [
        r.lowTargetValue,
        r.baseTargetValue,
        r.highTargetValue
    ]);
    const minTargetValue = Math.min(...allTargetValues);
    const maxTargetValue = Math.max(...allTargetValues);
    const baseTargetValue = sortedResults[0]?.baseTargetValue || 0;

    // Add padding to the range (10% on each side)
    const valueRange = maxTargetValue - minTargetValue;
    const paddedMin = minTargetValue - (valueRange * 0.1);
    const paddedMax = maxTargetValue + (valueRange * 0.1);

    // Create two traces - left (negative impact) and right (positive impact) bars
    const leftData = {
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.lowTargetValue - baseTargetValue), // Offset from base
        y: sortedResults.map(r => r.displayName),
        name: 'Downside Impact',
        marker: {
            color: colors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.8)')),
            line: { color: '#fff', width: 1 }
        },
        opacity: opacity,
        customdata: sortedResults,
        hovertemplate:
            '<b>%{customdata.displayName}</b><br>' +
            `<b>${metricConfig.label}:</b> %{customdata.lowTargetValue:.2f}${metricConfig.units || ''}<br>` +
            `<b>Δ from base:</b> %{customdata.lowTargetDelta:+.2f}${metricConfig.units || ''}<br>` +
            '<br>' +
            '<b>Variable:</b> %{customdata.lowVariableValue:.1f}<br>' +
            '<b>Δ Variable:</b> %{customdata.lowVariableDelta:+.1f}<br>' +
            '<b>Percentile:</b> P%{customdata.percentileRange.lower}<br>' +
            '<extra></extra>'
    };

    const rightData = {
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.highTargetValue - baseTargetValue), // Offset from base
        y: sortedResults.map(r => r.displayName),
        name: 'Upside Impact',
        marker: {
            color: colors.map(color => color.replace('rgb', 'rgba').replace(')', ', 0.8)')),
            line: { color: '#fff', width: 1 }
        },
        opacity: opacity,
        customdata: sortedResults,
        hovertemplate:
            '<b>%{customdata.displayName}</b><br>' +
            `<b>${metricConfig.label}:</b> %{customdata.highTargetValue:.2f}${metricConfig.units || ''}<br>` +
            `<b>Δ from base:</b> %{customdata.highTargetDelta:+.2f}${metricConfig.units || ''}<br>` +
            '<br>' +
            '<b>Variable:</b> %{customdata.highVariableValue:.1f}<br>' +
            '<b>Δ Variable:</b> %{customdata.highVariableDelta:+.1f}<br>' +
            '<b>Percentile:</b> P%{customdata.percentileRange.upper}<br>' +
            '<extra></extra>'
    };

    // Calculate the target metric range for the x-axis
    const maxDelta = Math.max(
        ...sortedResults.map(r => Math.abs(r.lowTargetDelta)),
        ...sortedResults.map(r => Math.abs(r.highTargetDelta))
    );

    // Layout with TARGET METRIC scale
    const layout = {
        title: {
            text: `${metricConfig.label} Sensitivity Analysis${showVariableCount ? ` (${sortedResults.length} variables)` : ''}`,
            font: { size: 16, weight: 'bold' }
        },
        xaxis: {
            title: `Δ ${metricConfig.label} from Base Case (${metricConfig.units || ''})`,
            zeroline: true,
            zerolinecolor: '#333',
            zerolinewidth: 2,
            range: [-maxDelta * 1.1, maxDelta * 1.1], // Symmetric around zero
            tickformat: metricConfig.units === '%' ? '.1f' : '.2f',
            gridcolor: '#e8e8e8',
            gridwidth: 1
        },
        yaxis: {
            title: 'Input Variables',
            automargin: true,
            tickfont: { size: 11 }
        },
        showlegend: true,
        legend: {
            orientation: 'h',
            x: 0.5,
            xanchor: 'center',
            y: -0.1
        },
        barmode: 'relative', // This creates the tornado effect
        bargap: 0.15,
        height: customHeight || Math.max(400, sortedResults.length * 35 + 150),
        margin: { l: 150, r: 50, t: 80, b: 100 },
        plot_bgcolor: '#fafafa',
        paper_bgcolor: '#ffffff'
    };

    // Add base case annotation
    const annotations = [{
        x: 0,
        y: -0.15,
        xref: 'x',
        yref: 'paper',
        text: `Base Case: ${baseTargetValue.toFixed(2)}${metricConfig.units || ''}`,
        showarrow: false,
        font: { size: 12, color: '#666' },
        xanchor: 'center'
    }];

    return {
        data: [leftData, rightData],
        layout: { ...layout, annotations },
        config: {
            displayModeBar: true,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
            displaylogo: false
        }
    };
};

/**
 * Create click handler for tornado chart interactions
 */
export const createTornadoClickHandler = (onDriverSelect) => {
    return (event) => {
        if (event.points && event.points.length > 0) {
            const point = event.points[0];
            const customData = point.customdata;

            if (customData && onDriverSelect) {
                onDriverSelect(customData.variableId);
            }
        }
    };
};

/**
 * Validate tornado chart data
 */
export const validateTornadoData = (sensitivityResults, metricConfig) => {
    if (!sensitivityResults || !Array.isArray(sensitivityResults)) {
        return { valid: false, error: 'Invalid sensitivity results' };
    }

    if (!metricConfig) {
        return { valid: false, error: 'Missing metric configuration' };
    }

    // Check that results have required target metric fields
    const requiredFields = ['lowTargetValue', 'baseTargetValue', 'highTargetValue'];
    const missingFields = sensitivityResults.some(result =>
        requiredFields.some(field => result[field] === undefined || result[field] === null)
    );

    if (missingFields) {
        return { valid: false, error: 'Missing target metric values in sensitivity results' };
    }

    return { valid: true };
};