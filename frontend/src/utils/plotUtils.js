// src/utils/plotUtils.js - Updated to use distributionBase helpers
import { DistributionBase } from './distributions/distributionBase';
import { hexToRgb } from './charts';

/**
 * Generate evenly spaced X values
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} count - Number of points (default: 100)
 * @returns {Array} Array of x values
 */
export function generateXValues(min, max, count = 100) {
    return DistributionBase.helpers.generateRange(min, max, count);
}

/**
 * Get parameter value with fallback
 * @param {Object} params - Parameters object
 * @param {string} name - Parameter name
 * @param {*} defaultValue - Default value if parameter is not found
 * @returns {*} Parameter value or default
 */
export function getParam(params, name, defaultValue) {
    return DistributionBase.helpers.getParam(params, name, defaultValue);
}

/**
 * Create main curve for plot
 * @param {Array} xValues - X values
 * @param {Array} yValues - Y values
 * @param {Object} options - Curve options
 * @returns {Object} Plotly trace object
 */
export function createMainCurve(xValues, yValues, options = {}) {
    const {
        name = 'Distribution',
        color = 'rgb(31, 119, 180)',
        type = 'scatter',
        mode = 'lines'
    } = options;

    return {
        x: xValues,
        y: yValues,
        type: type,
        mode: mode,
        name: name,
        line: {
            color: color,
            width: 2
        },
        hoverinfo: 'x+y'
    };
}

/**
 * Create markers for key points
 * @param {Array} points - Points array with x, y, and label properties
 * @param {Object} options - Marker options
 * @returns {Object} Plotly trace object for markers
 */
export function createMarkers(points, options = {}) {
    const {
        size = 8,
        color = 'rgba(255, 0, 0, 0.8)',
        showLegend = false,
        name = 'Key Points',
        hoverinfo = 'text'
    } = options;

    return {
        x: points.map(p => p.x),
        y: points.map(p => p.y),
        type: 'scatter',
        mode: 'markers',
        marker: {
            size,
            color
        },
        name,
        text: points.map(p => {
            // Format x value with appropriate precision
            const xFormatted = typeof p.x === 'number' ? p.x.toFixed(2) : p.x;
            return `${p.label}: ${xFormatted}`;
        }),
        hoverinfo,
        showlegend: showLegend
    };
}

/**
 * Create annotations for markers
 * @param {Array} points - Points array with x, y, and label properties
 * @param {Object} options - Annotation options
 * @returns {Array} Array of Plotly annotation objects
 */
export function createMarkerAnnotations(points, options = {}) {
    const {
        xanchor = 'left',
        yanchor = 'middle',
        xshift = 8,
        yshift = 0,
        fontSize = 10,
        fontColor = 'rgba(0, 0, 0, 0.9)',
        showarrow = false,
        arrowhead = 2,
        arrowsize = 1,
        arrowwidth = 1,
        ax = 20,
        ay = 0
    } = options;

    return points.map(point => ({
        x: point.x,
        y: point.y,
        xref: 'x',
        yref: 'y',
        text: point.label,
        showarrow,
        arrowhead,
        arrowsize,
        arrowwidth,
        ax,
        ay,
        xanchor: point.xanchor || xanchor,
        yanchor: point.yanchor || yanchor,
        xshift: point.xshift !== undefined ? point.xshift : xshift,
        yshift: point.yshift !== undefined ? point.yshift : yshift,
        font: {
            size: fontSize,
            color: fontColor
        }
    }));
}

/**
 * Create vertical line
 * @param {number} x - X position
 * @param {number} y - Y height
 * @param {Object} options - Line options
 * @returns {Object} Plotly shape object
 */
export function createVerticalLine(x, y, options = {}) {
    const { color = 'rgba(150, 150, 150, 0.5)', width = 1, dash = 'solid' } = options;

    return {
        type: 'line',
        x0: x,
        y0: 0,
        x1: x,
        y1: y,
        line: {
            color: color,
            width: width,
            dash: dash
        }
    };
}

/**
 * Create parameter label
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} text - Label text
 * @param {string} align - Text alignment
 * @returns {Object} Plotly annotation object
 */
export function createParameterLabel(x, y, text, align = 'left') {
    return {
        x: x,
        y: y,
        xref: 'x',
        yref: 'y',
        text: text,
        showarrow: false,
        font: {
            size: 10
        },
        align: align,
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: 'rgba(0, 0, 0, 0.1)',
        borderwidth: 1,
        borderpad: 4
    };
}


/**
 * Create percentile band and markers
 * @param {Object} distribution - Distribution implementation
 * @param {Object} parameters - Distribution parameters
 * @param {number} lowerPercentile - Lower percentile value (0-100)
 * @param {number} upperPercentile - Upper percentile value (0-100)
 * @param {Object} options - Band options
 * @returns {Object} Plotly trace for the band
 */
export function createPercentileBand(
    distribution,
    parameters,
    lowerPercentile,
    upperPercentile,
    options = {}
) {
    const {
        opacity = 0.33,
        bandColor = 'rgba(173, 216, 230, {{opacity}})',
        name = '',
        hoverinfo = 'name',
        showLegend = false,
        xValues = null,
        useCdf = false
    } = options;

    // Calculate x-range based on percentiles
    const lowerP = lowerPercentile / 100;
    const upperP = upperPercentile / 100;

    // Use distribution's quantile method to get x-values
    const lowerX = distribution.calculateQuantile(lowerP, parameters);
    const upperX = distribution.calculateQuantile(upperP, parameters);

    // Generate or filter x-values
    let bandXValues;
    if (xValues) {
        // Filter provided x-values to the range
        bandXValues = xValues.filter(x => x >= lowerX && x <= upperX);

        // Ensure we have the boundary points for accurate band edges
        if (bandXValues.length > 0) {
            if (bandXValues[0] > lowerX) {
                bandXValues.unshift(lowerX);
            }
            if (bandXValues[bandXValues.length - 1] < upperX) {
                bandXValues.push(upperX);
            }
        } else {
            // If no points in range, create a minimal set
            bandXValues = [lowerX, upperX];
        }
    } else {
        // Generate new x-values within the range
        bandXValues = generateXValues(lowerX, upperX, 50);
    }

    // If band is empty, return null
    if (bandXValues.length === 0) return null;

    // Sort x values to ensure proper rendering
    bandXValues.sort((a, b) => a - b);

    // Calculate y-values using the appropriate distribution method
    const calculateY = useCdf
        ? x => distribution.calculateCDF(x, parameters)
        : x => distribution.calculatePDF(x, parameters);

    const bandYValues = bandXValues.map(calculateY);

    // Fill in bandColor with opacity
    const fillColor = bandColor.replace('{{opacity}}', opacity);

    return {
        x: bandXValues,
        y: bandYValues,
        type: 'scatter',
        mode: 'none',
        fill: useCdf ? 'tozeroy' : 'toself',  // Different fill types for PDF vs CDF
        fillcolor: fillColor,
        line: { width: 0 },
        name: name || `P${lowerPercentile}-P${upperPercentile}`,
        hoverinfo,
        showlegend: showLegend
    };
}

/**
 * Organizes percentiles for visualization, determining primary, bounds, and extremes
 * 
 * @param {Array} percentileResults - Array of percentile results, each with a percentile object containing value and description
 * @param {number} primaryPercentileValue - Value of the primary percentile (e.g., 50 for P50)
 * @returns {Object} Object containing categorized percentiles for visualization
 */
export const organizePercentiles = (percentileResults, primaryPercentileValue) => {
    if (!percentileResults || percentileResults.length === 0) {
        return {
            primary: null,
            percentilePairs: [],
            singles: []
        };
    }

    // Sort percentiles by value (ascending)
    const sorted = [...percentileResults].sort((a, b) => a.percentile.value - b.percentile.value);

    // Find the primary percentile
    const primaryIndex = sorted.findIndex(p => p.percentile.value === primaryPercentileValue);
    const primary = primaryIndex >= 0 ? sorted[primaryIndex] : sorted[Math.floor(sorted.length / 2)];

    // Determine the percentile pairs for visualization
    let percentilePairs = [];
    let singles = [];

    if (sorted.length <= 1) {
        // Just the primary percentile
        if (sorted.length === 1) {
            singles = [sorted[0]];
        }
    } else if (sorted.length === 2) {
        // Two percentiles - use as a pair if one is the primary
        if (sorted[0].percentile.value === primaryPercentileValue ||
            sorted[1].percentile.value === primaryPercentileValue) {
            percentilePairs = [{
                lower: primaryPercentileValue === sorted[0].percentile.value ? null : sorted[0],
                upper: primaryPercentileValue === sorted[1].percentile.value ? null : sorted[1],
                opacity: 0.3,
                name: `P${sorted[0].percentile.value}-P${sorted[1].percentile.value}`
            }];
        } else {
            // Neither is primary, use them as individual lines
            singles = sorted;
        }
    } else {
        // More than two percentiles - create symmetric pairs around the primary
        // If a matching symmetric pair can't be found, it's added as a single line

        // Remove primary from the array for pairing
        const withoutPrimary = sorted.filter(p => p.percentile.value !== primary.percentile.value);

        // Split into percentiles below and above the primary
        const below = withoutPrimary.filter(p => p.percentile.value < primary.percentile.value);
        const above = withoutPrimary.filter(p => p.percentile.value > primary.percentile.value);

        // Create percentile pairs, starting from those closest to the primary
        const maxPairs = Math.min(below.length, above.length);

        // Create pairs starting from percentiles closest to the primary
        for (let i = 0; i < maxPairs; i++) {
            const lowerIndex = below.length - 1 - i;
            const upperIndex = i;

            percentilePairs.push({
                lower: below[lowerIndex],
                upper: above[upperIndex],
                opacity: 0.3 - (i * 0.1), // Decrease opacity for pairs further from the primary
                name: `P${below[lowerIndex].percentile.value}-P${above[upperIndex].percentile.value}`
            });
        }

        // Add any remaining percentiles as single lines
        if (below.length > maxPairs) {
            singles = singles.concat(below.slice(0, below.length - maxPairs));
        }

        if (above.length > maxPairs) {
            singles = singles.concat(above.slice(maxPairs));
        }
    }

    return {
        primary,
        percentilePairs,
        singles
    };
};


/**
 * Generate PDF plot data with percentile bands
 * @param {Object} distribution - Distribution implementation
 * @param {Object} parameters - Distribution parameters
 * @param {Object} options - Plotting options
 * @returns {Object} Plot data for the distribution
 */
export function generatePdfPlot(distribution, parameters, options = {}) {
    const {
        showMean = true,
        showStdDev = true,
        showMarkers = true,
        showSummary = false,
        showPercentiles = false,
        percentiles = [],
        addonAfter = '',
        baseColor = 'rgb(31, 119, 180)',
        primaryPercentile = 50
    } = options;

    // Calculate x-range based on distribution parameters
    let minX, maxX;

    // Get appropriate range for this distribution
    if (distribution.calculateXRange) {
        // Use distribution's own method if available
        const range = distribution.calculateXRange(parameters);
        minX = range.min;
        maxX = range.max;
    } else {
        // Otherwise, use a reasonable approach
        const value = getParam(parameters, 'value', 0);
        const stdDev = distribution.calculateStdDev(parameters);
        const metadata = distribution.getMetadata(parameters);

        // Default range covers ±3 standard deviations
        minX = value - 3 * stdDev;
        maxX = value + 3 * stdDev;

        // If distribution doesn't support negative values, adjust the range
        if (metadata?.nonNegativeSupport && minX < 0) {
            minX = 0;
        }
    }

    // Generate x values
    const xValues = generateXValues(minX, maxX);

    // Generate PDF data using the distribution's generatePDF method
    const pdfData = distribution.generatePDF(parameters, xValues, percentiles);

    // Create main curve
    const data = [createMainCurve(pdfData.xValues, pdfData.pdfValues, { color: baseColor })];

    const shapes = [];
    const annotations = [];

    // Add percentile bands if requested
    if (showPercentiles && percentiles && percentiles.length > 0) {
        // Use updated organizePercentiles to get band structure
        const { primary, percentilePairs, singles } = organizePercentiles(
            pdfData.percentilePoints,
            primaryPercentile
        );

        // Add band for each percentile pair
        if (percentilePairs && percentilePairs.length > 0) {
            percentilePairs.forEach(band => {
                // Only create band if we have both lower and upper points
                if (!band.lower || !band.upper) return;

                // Direct use of distribution methods for percentile bands
                const lowerP = band.lower.percentile.value;
                const upperP = band.upper.percentile.value;

                const bandPlot = createPercentileBand(
                    distribution,
                    parameters,
                    lowerP,
                    upperP,
                    {
                        opacity: band.opacity || 0.33,
                        name: band.name,
                        xValues: pdfData.xValues
                    }
                );

                if (bandPlot) {
                    data.push(bandPlot);
                }

                // Add percentile markers
                const percentileMarkers = [
                    {
                        x: band.lower.x,
                        y: band.lower.y,
                        label: `P${band.lower.percentile.value}`
                    },
                    {
                        x: band.upper.x,
                        y: band.upper.y,
                        label: `P${band.upper.percentile.value}`
                    }
                ];

                // Add markers
                data.push(createMarkers(percentileMarkers, {
                    size: 5,
                    color: 'rgba(100, 100, 100, 0.7)',
                    name: 'Percentiles'
                }));

                // Add annotations
                annotations.push(...createMarkerAnnotations(percentileMarkers, {
                    fontSize: 9,
                    fontColor: 'rgba(100, 100, 100, 0.9)'
                }));
            });
        }

        // Add single percentile lines
        if (singles && singles.length > 0) {
            singles.forEach(point => {
                // Add vertical line
                shapes.push(createVerticalLine(
                    point.x,
                    point.y,
                    {
                        color: 'rgba(100, 100, 100, 0.5)',
                        width: 1,
                        dash: 'dot'
                    }
                ));

                // Add marker
                data.push(createMarkers(
                    [{ x: point.x, y: point.y, label: `P${point.percentile.value}` }],
                    {
                        size: 5,
                        color: 'rgba(100, 100, 100, 0.7)',
                        name: `P${point.percentile.value}`
                    }
                ));
            });
        }

        // Add primary percentile
        if (primary) {
            // Add vertical line
            shapes.push(createVerticalLine(
                primary.x,
                primary.y,
                {
                    color: 'rgba(0, 0, 0, 0.7)',
                    width: 2,
                    dash: 'dash'
                }
            ));

            // Add marker
            data.push(createMarkers(
                [{ x: primary.x, y: primary.y, label: `P${primary.percentile.value} (Primary)` }],
                {
                    size: 7,
                    color: 'rgba(0, 0, 0, 0.8)',
                    name: `P${primary.percentile.value} (Primary)`,
                }
            ));

            // Add annotation
            annotations.push(...createMarkerAnnotations(
                [{ x: primary.x, y: primary.y, label: `P${primary.percentile.value}` }],
                {
                    xanchor: 'center',
                    yanchor: 'bottom',
                    yshift: 10,
                    fontSize: 10,
                    fontColor: 'rgba(0, 0, 0, 0.9)'
                }
            ));
        }
    }

    // Add key point markers
    if (showMarkers && pdfData.keyPoints.length > 0) {
        // Add markers
        data.push(createMarkers(pdfData.keyPoints));

        // Add annotations next to markers
        annotations.push(...createMarkerAnnotations(pdfData.keyPoints));
    }

    // Add mean vertical line if needed
    if (showMean && pdfData.stats?.mean !== undefined) {
        const meanPoint = pdfData.keyPoints.find(p => p.label === 'Mean');

        if (meanPoint) {
            shapes.push(createVerticalLine(
                meanPoint.x,
                meanPoint.y,
                { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }
            ));
        }
    }

    // Add standard deviation lines if needed
    if (showStdDev) {
        const meanPoint = pdfData.keyPoints.find(p => p.label === 'Mean');
        const stdDevPlusPoint = pdfData.keyPoints.find(p => p.label === '+1σ');
        const stdDevMinusPoint = pdfData.keyPoints.find(p => p.label === '-1σ');

        if (stdDevPlusPoint) {
            shapes.push(createVerticalLine(
                stdDevPlusPoint.x,
                stdDevPlusPoint.y
            ));
        }

        if (stdDevMinusPoint) {
            shapes.push(createVerticalLine(
                stdDevMinusPoint.x,
                stdDevMinusPoint.y
            ));
        }
    }

    // Add parameter summary
    if (showSummary && pdfData.stats) {
        // Format the statistics as a string
        let summary = '';
        Object.entries(pdfData.stats).forEach(([key, value]) => {
            if (typeof value === 'number') {
                summary += `${key}: ${value.toFixed(2)}, `;
            }
        });

        // Remove the trailing comma and space
        summary = summary.replace(/, $/, '');

        const value = getParam(parameters, 'value', 0);
        const y = pdfData.keyPoints[0]?.y || 0;

        annotations.push(createParameterLabel(
            value,
            y / 2,
            summary,
            'center'
        ));
    }

    // Get metadata for labels
    const metadata = distribution.getMetadata();

    return {
        data,
        shapes,
        annotations,
        title: metadata?.name || 'Distribution',
        xaxisTitle: addonAfter ? `Value (${addonAfter})` : 'Value',
        yaxisTitle: 'Probability Density',
        showLegend: false
    };
}

/**
 * Generate CDF plot data with percentile markers
 * @param {Object} distribution - Distribution implementation
 * @param {Object} parameters - Distribution parameters
 * @param {Object} options - Plotting options
 * @returns {Object} Plot data for the distribution's CDF
 */
export function generateCdfPlot(distribution, parameters, options = {}) {
    const {
        showMean = true,
        showStdDev = true,
        showMarkers = true,
        showPercentiles = false,
        percentiles = [],
        addonAfter = '',
        baseColor = 'rgb(31, 119, 180)',
        primaryPercentile = 50
    } = options;

    // Calculate x-range based on distribution parameters
    let minX, maxX;

    // Get appropriate range for this distribution
    if (distribution.calculateXRange) {
        // Use distribution's own method if available
        const range = distribution.calculateXRange(parameters);
        minX = range.min;
        maxX = range.max;
    } else {
        // Use a reasonable approach based on distribution parameters
        const value = getParam(parameters, 'value', 0);
        const stdDev = distribution.calculateStdDev(parameters);
        const metadata = distribution.getMetadata(parameters);

        // Default range covers ±3 standard deviations
        minX = value - 3 * stdDev;
        maxX = value + 3 * stdDev;

        // If distribution doesn't support negative values, adjust the range
        if (metadata?.nonNegativeSupport && minX < 0) {
            minX = 0;
        }
    }

    // Generate x values
    const xValues = generateXValues(minX, maxX);

    // Generate CDF data using the distribution's generateCDF method
    const cdfData = distribution.generateCDF(parameters, xValues, percentiles);

    // Create main curve
    const data = [createMainCurve(cdfData.xValues, cdfData.cdfValues, { color: baseColor })];

    const shapes = [];
    const annotations = [];

    // Add percentile markers if requested
    if (showPercentiles && percentiles && percentiles.length > 0) {
        // Use updated organizePercentiles to get percentile structure
        const { primary, percentilePairs, singles } = organizePercentiles(
            cdfData.percentilePoints,
            primaryPercentile
        );

        // Add all percentile points as markers
        const allPercentilePoints = cdfData.percentilePoints.map(point => ({
            x: point.x,
            y: point.y,
            label: `P${point.percentile.value}`
        }));

        // Add percentile markers
        data.push(createMarkers(allPercentilePoints, {
            size: 6,
            color: 'rgba(100, 100, 100, 0.7)',
            name: 'Percentiles'
        }));

        // Add horizontal lines for percentiles to the axis
        allPercentilePoints.forEach(point => {
            shapes.push({
                type: 'line',
                x0: minX,
                y0: point.y,
                x1: point.x,
                y1: point.y,
                line: {
                    color: 'rgba(100, 100, 100, 0.3)',
                    width: 1,
                    dash: 'dot'
                }
            });
        });

        // Highlight primary percentile
        if (primary) {
            // Add horizontal line
            shapes.push({
                type: 'line',
                x0: minX,
                y0: primary.y,
                x1: primary.x,
                y1: primary.y,
                line: {
                    color: 'rgba(0, 0, 0, 0.5)',
                    width: 1.5,
                    dash: 'solid'
                }
            });

            // Add marker
            data.push(createMarkers(
                [{ x: primary.x, y: primary.y, label: `P${primary.percentile.value} (Primary)` }],
                {
                    size: 8,
                    color: 'rgba(0, 0, 0, 0.8)',
                    name: `P${primary.percentile.value} (Primary)`
                }
            ));
        }
    }

    // Add key point markers
    if (showMarkers && cdfData.keyPoints.length > 0) {
        // Add markers
        data.push(createMarkers(cdfData.keyPoints));

        // Add annotations next to markers
        annotations.push(...createMarkerAnnotations(cdfData.keyPoints));
    }

    // Add mean vertical line if needed
    if (showMean && cdfData.stats?.mean !== undefined) {
        const meanPoint = cdfData.keyPoints.find(p => p.label === 'Mean');

        if (meanPoint) {
            shapes.push(createVerticalLine(
                meanPoint.x,
                1, // Full height for vertical line
                { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }
            ));

            // Add horizontal line at CDF(mean)
            shapes.push({
                type: 'line',
                x0: minX,
                y0: meanPoint.y,
                x1: meanPoint.x,
                y1: meanPoint.y,
                line: {
                    color: 'rgba(0, 0, 0, 0.3)',
                    width: 1,
                    dash: 'dot'
                }
            });
        }
    }

    // Add standard deviation lines if needed
    if (showStdDev) {
        const stdDevPlusPoint = cdfData.keyPoints.find(p => p.label === '+1σ');
        const stdDevMinusPoint = cdfData.keyPoints.find(p => p.label === '-1σ');

        if (stdDevPlusPoint) {
            shapes.push(createVerticalLine(
                stdDevPlusPoint.x,
                1, // Full height for vertical line
                { color: 'rgba(150, 150, 150, 0.5)', width: 1, dash: 'solid' }
            ));
        }

        if (stdDevMinusPoint) {
            shapes.push(createVerticalLine(
                stdDevMinusPoint.x,
                1, // Full height for vertical line
                { color: 'rgba(150, 150, 150, 0.5)', width: 1, dash: 'solid' }
            ));
        }
    }

    // Get metadata for labels
    const metadata = distribution.getMetadata();

    return {
        data,
        shapes,
        annotations,
        title: metadata?.name || 'Distribution',
        xaxisTitle: addonAfter ? `Value (${addonAfter})` : 'Value',
        yaxisTitle: 'Cumulative Probability',
        showLegend: false,
        yaxisRange: [0, 1.05] // Fixed y-axis range for CDF
    };
}

// Collect all functions into PlotUtils for backwards compatibility
export const PlotUtils = {
    generateXValues,
    getParam,
    createMainCurve,
    createMarkers,
    createMarkerAnnotations,
    createVerticalLine,
    createParameterLabel,
    createPercentileBand,
    generatePdfPlot,
    generateCdfPlot,
    hexToRgb,
    organizePercentiles
};