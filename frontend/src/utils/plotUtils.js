// src/utils/plotUtils.js

/**
 * Generate a range of X values for plot visualization
 * @param {number} min - Minimum x value
 * @param {number} max - Maximum x value
 * @param {number} points - Number of points to generate
 * @returns {Array} Array of x values
 */
export const generateXValues = (min, max, points = 100) => {
    const step = (max - min) / (points - 1);
    return Array.from({ length: points }, (_, i) => min + i * step);
};

/**
 * Get parameter with default value
 * @param {Object} parameters - Parameter object
 * @param {string} name - Parameter name
 * @param {any} defaultValue - Default value if parameter doesn't exist
 * @returns {any} Parameter value or default
 */
export const getParam = (parameters, name, defaultValue) => {
    if (!parameters || parameters[name] === undefined || parameters[name] === null) {
        return defaultValue;
    }
    return parameters[name];
};

/**
 * Create a main curve for plot visualization
 * @param {Array} x - X values
 * @param {Array} y - Y values
 * @param {string} type - Plot type ('scatter' or 'bar')
 * @returns {Object} Plotly trace object
 */
export const createMainCurve = (x, y, type = 'scatter') => {
    return {
        x,
        y,
        type,
        mode: type === 'scatter' ? 'lines' : undefined,
        line: type === 'scatter' ? { shape: 'spline', smoothing: 1.3 } : undefined,
        marker: {
            color: 'rgba(55, 128, 191, 0.7)',
            line: type === 'bar' ? { width: 1, color: 'rgba(55, 128, 191, 1.0)' } : undefined
        },
        name: 'Distribution',
        fill: 'tozeroy',
        fillcolor: 'rgba(49, 130, 189, 0.2)'
    };
};

/**
 * Create markers for key points
 * @param {Array} markers - Array of marker objects with x, y, and label properties
 * @returns {Object} Plotly trace object for markers
 */
export const createMarkers = (markers) => {
    return {
        x: markers.map(m => m.x),
        y: markers.map(m => m.y),
        mode: 'markers',
        type: 'scatter',
        marker: {
            size: 8,
            color: 'rgba(255, 0, 0, 0.7)',
            line: { width: 1, color: 'rgba(255, 0, 0, 1.0)' }
        },
        showlegend: false
    };
};

/**
 * Create annotations for markers
 * @param {Array} markers - Array of marker objects with x, y, and label properties
 * @returns {Array} Array of Plotly annotation objects
 */
export const createMarkerAnnotations = (markers) => {
    return markers.map(marker => ({
        x: marker.x,
        y: marker.y,
        xanchor: marker.xanchor || 'left',
        yanchor: marker.yanchor || 'middle',
        text: marker.label,
        showarrow: false,
        font: {
            size: marker.fontSize || 10
        },
        xshift: marker.xshift || 10,
        yshift: marker.yshift || 0
    }));
};

/**
 * Create a vertical line for plot visualization
 * @param {number} x - X position of the line
 * @param {number} y - Y height of the line
 * @param {Object} style - Line style options
 * @returns {Object} Plotly shape object
 */
export const createVerticalLine = (x, y, style = {}) => {
    return {
        type: 'line',
        x0: x,
        y0: 0,
        x1: x,
        y1: y,
        line: {
            color: style.color || 'rgba(55, 128, 191, 0.5)',
            width: style.width || 1,
            dash: style.dash || 'solid'
        }
    };
};

/**
 * Create a parameter label annotation
 * @param {number} x - X position of the label
 * @param {number} y - Y position of the label
 * @param {string} text - Label text
 * @param {string} xanchor - Horizontal anchor position
 * @returns {Object} Plotly annotation object
 */
export const createParameterLabel = (x, y, text, xanchor = 'left') => {
    return {
        x,
        y,
        xref: 'x',
        yref: 'y',
        text,
        showarrow: false,
        font: { size: 11 },
        bgcolor: 'rgba(255, 255, 255, 0.8)',
        bordercolor: 'rgba(0, 0, 0, 0.2)',
        borderwidth: 1,
        borderpad: 4,
        xanchor
    };
};


/**
 * Convert hex color to rgb format for rgba
 * @param {string} hex - Hex color code
 * @returns {string} RGB components as comma-separated string
 */
export const hexToRgb = (hex) => {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse hex
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    return `${r}, ${g}, ${b}`;
};

/**
 * Determine appropriate decimal precision based on data
 * @param {Array<SimResultsSchema>} results - Array of simulation results conforming to SimResultsSchema
 * @returns {number} Suggested decimal precision
 */
export const determineDecimalPrecision = (results) => {
    if (!results || !results.length || !results[0].data || !results[0].data.length) {
        return 2; // Default precision
    }

    // Get the first value from the first result
    const firstValue = results[0].data[0].value;

    // If it's an integer or a very large number, use 0 decimals
    if (Number.isInteger(firstValue) || Math.abs(firstValue) >= 1000) {
        return 0;
    }

    // If it's a small decimal, determine appropriate precision
    if (Math.abs(firstValue) < 0.01) return 4;
    if (Math.abs(firstValue) < 0.1) return 3;
    if (Math.abs(firstValue) < 100) return 2;

    return 1; // Default for medium-sized numbers
};

/**
 * Calculate mean value for a percentile's data points
 * @param {Array<DataPointSchema>} data - Array of data points with year and value properties
 * @returns {number} Mean value or null if no data
 */
export const calculateMean = (data) => {
    if (!data || !data.length) return null;

    const sum = data.reduce((acc, point) => acc + point.value, 0);
    return sum / data.length;
};


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

// Export the PlotUtils as a utility object
export const PlotUtils = {
    generateXValues,
    getParam,
    createMainCurve,
    createMarkers,
    createMarkerAnnotations,
    createVerticalLine,
    createParameterLabel,
    organizePercentiles,
    hexToRgb,
    determineDecimalPrecision,
    calculateMean
};