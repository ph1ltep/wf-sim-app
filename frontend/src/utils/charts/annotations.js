// src/utils/charts/annotations.js - Generic chart annotation utilities

import { hexToRgb, getFinancialColorScheme } from './colors';

/**
 * Add refinancing window annotations to chart layout
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
 * Prepare finance-specific chart annotations
 * @param {Object} layout - Chart layout
 * @param {Object} annotations - Finance-specific annotations
 * @returns {Object} Updated layout with finance annotations
 */
export const addFinanceAnnotations = (layout, annotations = {}) => {
    const {
        covenantThresholds = [],
        refinancingWindows = [],
        milestones = []
    } = annotations;

    // Add covenant thresholds
    if (covenantThresholds.length > 0) {
        addCovenantAnnotations(layout, covenantThresholds);
    }

    // Add refinancing windows
    if (refinancingWindows.length > 0) {
        addRefinancingAnnotations(layout, refinancingWindows);
    }

    // Add financial milestones (break-even, payback, etc.)
    if (milestones.length > 0) {
        milestones.forEach(milestone => {
            const { year, type, label } = milestone;
            const color = getFinancialColorScheme(type);

            if (!layout.annotations) layout.annotations = [];

            layout.annotations.push({
                x: year,
                y: 1.05,
                yref: 'paper',
                text: label,
                showarrow: true,
                arrowhead: 2,
                arrowcolor: color,
                font: { size: 9, color: color },
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: color,
                borderwidth: 1
            });
        });
    }

    return layout;
};

/**
 * Add covenant threshold annotations to chart layout
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
 * Add timeline milestone annotations
 * @param {Object} layout - Existing Plotly layout object
 * @param {Array} milestones - Array of milestone objects
 * @returns {Object} Updated layout with milestone annotations
 */
export const addTimelineMilestones = (layout, milestones = []) => {
    if (!layout.shapes) layout.shapes = [];
    if (!layout.annotations) layout.annotations = [];

    milestones.forEach(milestone => {
        const { year, label, color = '#1890ff', showLine = true } = milestone;

        if (showLine) {
            // Add vertical line for milestone
            layout.shapes.push({
                type: 'line',
                x0: year,
                x1: year,
                y0: 0,
                y1: 1,
                yref: 'paper',
                line: {
                    color: color,
                    width: 2,
                    dash: 'dot'
                }
            });
        }

        // Add label
        layout.annotations.push({
            x: year,
            y: 1.02,
            yref: 'paper',
            text: label,
            showarrow: true,
            arrowhead: 2,
            arrowsize: 1,
            arrowwidth: 2,
            arrowcolor: color,
            font: { size: 9, color: color },
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: color,
            borderwidth: 1
        });
    });

    return layout;
};

/**
 * Create data range highlight annotation
 * @param {Object} layout - Existing Plotly layout object
 * @param {Object} range - Range object with start, end, label, color
 * @param {string} axis - 'x' or 'y' axis
 * @returns {Object} Updated layout with range highlight
 */
export const addRangeHighlight = (layout, range, axis = 'x') => {
    const { start, end, label, color = '#faad14', opacity = 0.2 } = range;

    if (!layout.shapes) layout.shapes = [];
    if (!layout.annotations) layout.annotations = [];

    // Create highlight shape
    const shape = {
        type: 'rect',
        fillcolor: `rgba(${hexToRgb(color)}, ${opacity})`,
        line: { width: 0 }
    };

    if (axis === 'x') {
        shape.x0 = start;
        shape.x1 = end;
        shape.y0 = 0;
        shape.y1 = 1;
        shape.yref = 'paper';
    } else {
        shape.y0 = start;
        shape.y1 = end;
        shape.x0 = 0;
        shape.x1 = 1;
        shape.xref = 'paper';
    }

    layout.shapes.push(shape);

    // Add label if provided
    if (label) {
        const annotation = {
            text: label,
            showarrow: false,
            font: { size: 10, color: color },
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: color,
            borderwidth: 1
        };

        if (axis === 'x') {
            annotation.x = (start + end) / 2;
            annotation.y = 0.95;
            annotation.yref = 'paper';
        } else {
            annotation.y = (start + end) / 2;
            annotation.x = 0.95;
            annotation.xref = 'paper';
        }

        layout.annotations.push(annotation);
    }

    return layout;
};

/**
 * Create break-even point annotation
 * @param {Object} layout - Existing Plotly layout object
 * @param {number} breakEvenYear - Year when break-even occurs
 * @param {Object} options - Annotation options
 * @returns {Object} Updated layout with break-even annotation
 */
export const addBreakEvenAnnotation = (layout, breakEvenYear, options = {}) => {
    const {
        color = '#52c41a',
        label = 'Break-Even',
        showLine = true,
        arrowPosition = 0.8
    } = options;

    if (!layout.shapes) layout.shapes = [];
    if (!layout.annotations) layout.annotations = [];

    if (showLine) {
        // Add vertical line at break-even point
        layout.shapes.push({
            type: 'line',
            x0: breakEvenYear,
            x1: breakEvenYear,
            y0: 0,
            y1: 1,
            yref: 'paper',
            line: {
                color: color,
                width: 2,
                dash: 'dashdot'
            }
        });
    }

    // Add annotation
    layout.annotations.push({
        x: breakEvenYear,
        y: arrowPosition,
        yref: 'paper',
        text: `${label}<br>Year ${breakEvenYear}`,
        showarrow: true,
        arrowhead: 2,
        arrowsize: 1,
        arrowwidth: 2,
        arrowcolor: color,
        font: { size: 9, color: color },
        bgcolor: 'rgba(255,255,255,0.9)',
        bordercolor: color,
        borderwidth: 1
    });

    return layout;
};

/**
 * Add performance benchmark bands to chart
 * @param {Object} layout - Existing Plotly layout object
 * @param {Array} benchmarks - Array of benchmark objects
 * @returns {Object} Updated layout with benchmark bands
 */
export const addBenchmarkBands = (layout, benchmarks = []) => {
    if (!layout.shapes) layout.shapes = [];

    benchmarks.forEach(benchmark => {
        const {
            min,
            max,
            label,
            color = '#1890ff',
            opacity = 0.1,
            xRange = null
        } = benchmark;

        // Create benchmark band
        layout.shapes.push({
            type: 'rect',
            x0: xRange ? xRange[0] : 0,
            x1: xRange ? xRange[1] : 1,
            xref: xRange ? 'x' : 'paper',
            y0: min,
            y1: max,
            fillcolor: `rgba(${hexToRgb(color)}, ${opacity})`,
            line: { width: 0 }
        });

        // Add benchmark label
        if (label) {
            if (!layout.annotations) layout.annotations = [];

            layout.annotations.push({
                x: xRange ? (xRange[0] + xRange[1]) / 2 : 0.5,
                xref: xRange ? 'x' : 'paper',
                y: (min + max) / 2,
                text: label,
                showarrow: false,
                font: { size: 8, color: color },
                bgcolor: `rgba(${hexToRgb(color)}, 0.2)`,
                bordercolor: color,
                borderwidth: 1
            });
        }
    });

    return layout;
};

/**
 * Add financial milestone markers (break-even, payback period, etc.)
 * @param {Object} layout - Existing Plotly layout object
 * @param {Array} milestones - Array of financial milestone objects
 * @returns {Object} Updated layout with milestone annotations
 */
export const addFinancialMilestones = (layout, milestones = []) => {
    if (!layout.annotations) layout.annotations = [];

    milestones.forEach(milestone => {
        const {
            year,
            type,
            label,
            value = null,
            color = '#52c41a',
            showValue = false
        } = milestone;

        // Create milestone annotation
        const annotation = {
            x: year,
            y: 1.05,
            yref: 'paper',
            text: showValue && value ? `${label}: ${value}` : label,
            showarrow: true,
            arrowhead: 2,
            arrowcolor: color,
            font: { size: 9, color: color },
            bgcolor: 'rgba(255,255,255,0.9)',
            bordercolor: color,
            borderwidth: 1
        };

        layout.annotations.push(annotation);
    });

    return layout;
};

/**
 * Create financial performance benchmark data
 * @param {Object} metrics - Financial metrics
 * @param {Object} industry - Industry benchmarks
 * @returns {Object} Benchmark comparison data
 */
export const createFinancialBenchmarks = (metrics, industry = {}) => {
    const benchmarks = {
        dscr: {
            value: metrics.minDSCR,
            industry: industry.minDSCR || 1.3,
            rating: metrics.minDSCR >= 1.5 ? 'excellent' : metrics.minDSCR >= 1.3 ? 'good' : 'poor'
        },
        irr: {
            value: metrics.projectIRR,
            industry: industry.projectIRR || 10,
            rating: metrics.projectIRR >= 12 ? 'excellent' : metrics.projectIRR >= 8 ? 'good' : 'poor'
        },
        llcr: {
            value: metrics.llcr,
            industry: industry.llcr || 1.4,
            rating: metrics.llcr >= 1.6 ? 'excellent' : metrics.llcr >= 1.4 ? 'good' : 'poor'
        }
    };

    return benchmarks;
};