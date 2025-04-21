// src/utils/plotUtils.js

/**
 * Generate evenly spaced X values
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} count - Number of points (default: 100)
 * @returns {Array} Array of x values
 */
export function generateXValues(min, max, count = 100) {
    const step = (max - min) / (count - 1);
    return Array.from({ length: count }, (_, i) => min + i * step);
}

/**
 * Get parameter value with fallback
 * @param {Object} params - Parameters object
 * @param {string} name - Parameter name
 * @param {*} defaultValue - Default value if parameter is not found
 * @returns {*} Parameter value or default
 */
export function getParam(params, name, defaultValue) {
    if (!params || params[name] === undefined || params[name] === null) {
        return defaultValue;
    }
    return params[name];
}

/**
 * Create main curve for plot
 * @param {Array} xValues - X values
 * @param {Array} yValues - Y values
 * @param {Object} options - Curve options
 * @returns {Object} Plotly trace object
 */
export function createMainCurve(xValues, yValues, options = {}) {
    const { name = 'Distribution', color = 'rgb(31, 119, 180)' } = options;
    
    return {
        x: xValues,
        y: yValues,
        type: 'scatter',
        mode: 'lines',
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
        xanchor,
        yanchor,
        xshift,
        yshift,
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
 * @param {Array} xValues - Full array of x values for distribution
 * @param {Array} yValues - Full array of y values for distribution
 * @param {number} lowerX - Lower x boundary of band
 * @param {number} upperX - Upper x boundary of band
 * @param {Object} options - Band options
 * @returns {Object} Plotly trace for the band
 */
export function createPercentileBand(xValues, yValues, lowerX, upperX, options = {}) {
    const {
        opacity = 0.33,
        bandColor = 'rgba(173, 216, 230, {{opacity}})',
        name = '',
        hoverinfo = 'name',
        showLegend = false
    } = options;
    
    // Create filled area between the percentiles
    const bandXValues = xValues.filter(x => x >= lowerX && x <= upperX);
    
    // Get corresponding y values
    const bandYValues = bandXValues.map(x => {
        const index = xValues.indexOf(x);
        return index >= 0 ? yValues[index] : 0;
    });
    
    // If band is empty, return null
    if (bandXValues.length === 0) return null;
    
    // Fill in bandColor with opacity
    const fillColor = bandColor.replace('{{opacity}}', opacity);
    
    return {
        x: bandXValues,
        y: bandYValues,
        type: 'scatter',
        mode: 'none',
        fill: 'tozeroy',
        fillcolor: fillColor,
        line: { width: 0 },
        name,
        hoverinfo,
        showlegend: showLegend
    };
}

/**
 * Convert hex color to rgb
 * @param {string} hex - Hex color code
 * @returns {Object} RGB color object
 */
export function hexToRgb(hex) {
    // Remove hash if it exists
    hex = hex.replace(/^#/, '');
    
    // Parse hex values
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    
    return { r, g, b };
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
        baseColor = 'rgb(31, 119, 180)'
    } = options;

    // Get metadata
    const metadata = distribution.getMetadata();
    
    // Calculate x-range based on distribution parameters
    let minX, maxX;
    
    // Use value and standard deviation to determine range
    const value = getParam(parameters, 'value', 0);
    const stdDev = distribution.calculateStdDev(parameters);
    
    // Default range covers ±3 standard deviations or min/max for bounded distributions
    if (metadata.parameters.find(p => p.name === 'min') && metadata.parameters.find(p => p.name === 'max')) {
        // For bounded distributions like uniform
        minX = getParam(parameters, 'min', 0);
        maxX = getParam(parameters, 'max', 1);
        // Add a small margin
        const range = maxX - minX;
        minX -= range * 0.05;
        maxX += range * 0.05;
    } else {
        // For unbounded distributions, use standard deviations
        minX = value - 4 * stdDev;
        maxX = value + 4 * stdDev;
        
        // Ensure min is not negative for distributions that don't support negative values
        if (metadata.nonNegativeSupport && minX < 0) {
            minX = 0;
        }
    }
    
    // Generate x values
    const xValues = generateXValues(minX, maxX);
    
    // Generate PDF curve data using the distribution's generatePDF method
    const pdfData = distribution.generatePDF(parameters, xValues, percentiles);
    
    // Create main curve
    const data = [createMainCurve(pdfData.xValues, pdfData.pdfValues, { color: baseColor })];
    
    const shapes = [];
    const annotations = [];
    
    // Add percentile bands if requested
    if (showPercentiles && percentiles && percentiles.length > 0) {
        // Use updated organizePercentiles to get band structure
        const { primary, percentilePairs, singles } = organizePercentiles(pdfData.percentilePoints, options.primaryPercentile || 50);
        
        // Add band for each percentile pair
        if (percentilePairs && percentilePairs.length > 0) {
            percentilePairs.forEach(band => {
                // Only create band if we have both lower and upper points
                if (!band.lower || !band.upper) return;
                
                // Create band with proper opacity from the band object
                const bandOpacity = band.opacity || 0.33;
                
                const bandPlot = createPercentileBand(
                    pdfData.xValues,
                    pdfData.pdfValues,
                    band.lower.x,
                    band.upper.x,
                    {
                        opacity: bandOpacity,
                        name: band.name || `P${band.lower.percentile.value}-P${band.upper.percentile.value}`
                    }
                );
                
                if (bandPlot) {
                    data.push(bandPlot);
                }
                
                // Add percentile markers
                const percentileMarkers = [
                    { x: band.lower.x, y: band.lower.y, label: `P${band.lower.percentile.value}` },
                    { x: band.upper.x, y: band.upper.y, label: `P${band.upper.percentile.value}` }
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
    if (showMean && metadata.getMean) {
        const mean = metadata.getMean(parameters);
        const meanPoint = pdfData.keyPoints.find(p => p.label === 'Mean');
        
        if (meanPoint) {
            shapes.push(createVerticalLine(
                meanPoint.x,
                meanPoint.y,
                { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }
            ));
        }
    }
    
    // No std dev vertical lines as requested
    
    // Add parameter summary
    if (showSummary && pdfData.stats) {
        let summary = '';
        
        // Add each parameter to the summary
        metadata.parameters.forEach(param => {
            if (parameters[param.name] !== undefined) {
                const label = param.fieldProps.label || param.name;
                summary += `${label}: ${parameters[param.name].toFixed(2)}, `;
            }
        });
        
        // Add standard deviation
        if (pdfData.stats.stdDev) {
            summary += `StdDev: ${pdfData.stats.stdDev.toFixed(2)}`;
        }
        
        annotations.push(createParameterLabel(
            value,
            pdfData.keyPoints[0]?.y / 2 || 0,
            summary,
            'center'
        ));
    }
    
    return {
        data,
        shapes,
        annotations,
        title: metadata.name,
        xaxisTitle: addonAfter ? `Value (${addonAfter})` : 'Value',
        yaxisTitle: 'Probability Density',
        showLegend: false // Always hide legend
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
        baseColor = 'rgb(31, 119, 180)'
    } = options;

    // Get metadata
    const metadata = distribution.getMetadata();
    
    // Calculate x-range based on distribution parameters
    let minX, maxX;
    
    // Use value and standard deviation to determine range
    const value = getParam(parameters, 'value', 0);
    const stdDev = distribution.calculateStdDev(parameters);
    
    // Default range covers ±3 standard deviations or min/max for bounded distributions
    if (metadata.parameters.find(p => p.name === 'min') && metadata.parameters.find(p => p.name === 'max')) {
        // For bounded distributions like uniform
        minX = getParam(parameters, 'min', 0);
        maxX = getParam(parameters, 'max', 1);
        // Add a small margin
        const range = maxX - minX;
        minX -= range * 0.05;
        maxX += range * 0.05;
    } else {
        // For unbounded distributions, use standard deviations
        minX = value - 4 * stdDev;
        maxX = value + 4 * stdDev;
        
        // Ensure min is not negative for distributions that don't support negative values
        if (metadata.nonNegativeSupport && minX < 0) {
            minX = 0;
        }
    }
    
    // Generate x values
    const xValues = generateXValues(minX, maxX);
    
    // Generate CDF curve data using the distribution's generateCDF method
    const cdfData = distribution.generateCDF(parameters, xValues, percentiles);
    
    // Create main curve
    const data = [{
        x: cdfData.xValues,
        y: cdfData.cdfValues,
        type: 'scatter',
        mode: 'lines',
        name: 'CDF',
        line: {
            color: baseColor,
            width: 2
        },
        hoverinfo: 'x+y'
    }];
    
    const shapes = [];
    const annotations = [];
    
    // Add percentile markers if requested
    if (showPercentiles && percentiles && percentiles.length > 0) {
        // Add markers for all percentiles
        const percentileMarkers = cdfData.percentilePoints.map(point => ({
            x: point.x,
            y: point.y,
            label: `P${point.percentile.value}`
        }));
        
        // Add percentile markers
        data.push(createMarkers(percentileMarkers, {
            size: 6,
            color: 'rgba(100, 100, 100, 0.8)',
            name: 'Percentiles'
        }));
        
        // Add annotations for percentiles
        annotations.push(...createMarkerAnnotations(percentileMarkers, {
            fontSize: 9,
            fontColor: 'rgba(100, 100, 100, 0.9)'
        }));
        
        // Add horizontal lines for percentiles
        percentileMarkers.forEach(marker => {
            shapes.push({
                type: 'line',
                x0: minX,
                y0: marker.y,
                x1: marker.x,
                y1: marker.y,
                line: {
                    color: 'rgba(100, 100, 100, 0.3)',
                    width: 1,
                    dash: 'dot'
                }
            });
        });
    }
    
    // Add key point markers
    if (showMarkers && cdfData.keyPoints.length > 0) {
        // Add markers
        data.push(createMarkers(cdfData.keyPoints));
        
        // Add annotations next to markers
        annotations.push(...createMarkerAnnotations(cdfData.keyPoints));
    }
    
    // Add mean vertical line if needed
    if (showMean && metadata.getMean) {
        const mean = metadata.getMean(parameters);
        const meanPoint = cdfData.keyPoints.find(p => p.label === 'Mean');
        
        if (meanPoint) {
            shapes.push(createVerticalLine(
                meanPoint.x,
                meanPoint.y,
                { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }
            ));
            
            // Add horizontal line at CDF(mean) = 0.5 for normal distribution
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
    
    return {
        data,
        shapes,
        annotations,
        title: metadata.name + ' (CDF)',
        xaxisTitle: addonAfter ? `Value (${addonAfter})` : 'Value',
        yaxisTitle: 'Cumulative Probability',
        showLegend: false, // Always hide legend
        // Set y-axis range for CDF (0 to 1)
        yaxisRange: [0, 1.05]
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



