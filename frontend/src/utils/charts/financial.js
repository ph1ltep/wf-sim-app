// frontend/src/utils/charts/financial.js - Financial-specific chart utilities

import { getSemanticColor, createColorWithOpacity } from './colors';

/**
 * Prepare tornado chart data for sensitivity analysis
 * @param {Object} params - Chart parameters
 * @param {Array} params.sensitivityResults - Results from calculateDynamicSensitivity
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

    // Sort by impact magnitude (descending)
    const sortedResults = [...sensitivityResults].sort((a, b) => b.impact - a.impact);
    const maxImpact = Math.max(...sortedResults.map(r => r.impact));

    const data = [{
        type: 'bar',
        orientation: 'h',
        x: sortedResults.map(r => r.impact),
        y: sortedResults.map(r => r.variable),
        text: sortedResults.map(r => metricConfig.impactFormat(r.impact)),
        textposition: 'auto',
        marker: {
            color: sortedResults.map(r => {
                if (r.variable === highlightedDriver) {
                    return getSemanticColor('primary', 7); // Highlighted
                }
                return getDriverColor(r.category, r.impact / maxImpact);
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
            'Confidence: %{customdata.percentileRange.confidenceInterval}%' +
            '<extra></extra>'
    }];

    const layout = {
        title: `${metricConfig.label} Sensitivity Analysis`,
        xaxis: {
            title: `${metricConfig.label} Impact`,
            tickformat: metricConfig.units === 'currency' ? '$,.0s' :
                metricConfig.units === 'percentage' ? '.1f' : '.2f'
        },
        yaxis: { title: 'Input Variables' },
        margin: { t: 60, b: 60, l: 150, r: 60 },
        height: Math.max(400, sortedResults.length * 40 + 120),
        plot_bgcolor: '#fafafa',
        paper_bgcolor: '#ffffff'
    };

    return { data, layout };
};

/**
 * Get color for driver based on category and impact magnitude
 * @param {string} category - Variable category
 * @param {number} relativeImpact - Impact relative to maximum (0-1)
 * @returns {string} Color code
 */
export const getDriverColor = (category, relativeImpact) => {
    const intensity = Math.max(0.4, relativeImpact); // Minimum 40% intensity

    const categoryColors = {
        'revenue': '#52c41a',     // Green
        'cost': '#ff4d4f',       // Red  
        'financing': '#1890ff',  // Blue
        'escalation': '#faad14', // Orange
        'pricing': '#52c41a',    // Green
        'energy': '#52c41a',     // Green
        'maintenance': '#ff4d4f', // Red
        'construction': '#722ed1' // Purple
    };

    const baseColor = categoryColors[category] || '#666666';
    return createColorWithOpacity(baseColor, intensity);
};

/**
 * Prepare dual-axis sensitivity chart (impact vs uncertainty)
 * @param {Array} sensitivityResults - Sensitivity analysis results
 * @param {Object} options - Chart options
 * @returns {Object} Plotly chart data and layout
 */
export const prepareSensitivityScatterPlot = (sensitivityResults, options = {}) => {
    const { targetMetric, metricConfig } = options;

    if (!sensitivityResults || !sensitivityResults.length) {
        return null;
    }

    const data = [{
        type: 'scatter',
        mode: 'markers+text',
        x: sensitivityResults.map(r => r.impact),
        y: sensitivityResults.map(r => r.percentileRange.confidenceInterval),
        text: sensitivityResults.map(r => r.variable),
        textposition: 'top center',
        marker: {
            size: 12,
            color: sensitivityResults.map(r => getDriverColor(r.category, 1.0)),
            line: { color: '#fff', width: 2 }
        },
        hovertemplate:
            '<b>%{text}</b><br>' +
            `${metricConfig.label} Impact: %{x}<br>` +
            'Confidence Range: %{y}%' +
            '<extra></extra>'
    }];

    const layout = {
        title: `Impact vs Uncertainty: ${metricConfig.label}`,
        xaxis: { title: `${metricConfig.label} Impact` },
        yaxis: { title: 'Confidence Range (%)' },
        margin: { t: 60, b: 60, l: 80, r: 60 },
        height: 500
    };

    return { data, layout };
};