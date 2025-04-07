// src/utils/plotUtils.js
/**
 * General plotting utilities for reuse across different visualization types
 */
export const PlotUtils = {
    /**
     * Generate evenly spaced x values in a range
     * @param {number} min - Minimum value
     * @param {number} max - Maximum value
     * @param {number} count - Number of points to generate
     * @returns {Array} Array of x values
     */
    generateXValues(min, max, count = 100) {
        const step = (max - min) / count;
        const values = [];
        for (let i = 0; i <= count; i++) {
            values.push(min + step * i);
        }
        return values;
    },

    /**
     * Get parameter with default value
     * @param {Object} params - Parameter object
     * @param {string} key - Parameter key
     * @param {*} defaultVal - Default value
     * @returns {*} Parameter value or default
     */
    getParam(params, key, defaultVal = 0) {
        return params && params[key] !== undefined ? params[key] : defaultVal;
    },

    /**
     * Create the main curve for the plot
     * @param {Array} xValues - X values
     * @param {Array} yValues - Y values
     * @param {string} type - Plot type ('scatter' or 'bar')
     * @returns {Object} Plotly data object
     */
    createMainCurve(xValues, yValues, type = 'scatter') {
        if (type === 'bar') {
            return {
                x: xValues,
                y: yValues,
                type: 'bar',
                marker: {
                    color: 'rgba(49, 130, 189, 0.7)',
                    line: {
                        color: 'rgb(49, 130, 189)',
                        width: 1
                    }
                }
            };
        }

        return {
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: 'rgb(49, 130, 189)',
                width: 2
            },
            fill: 'tozeroy',
            fillcolor: 'rgba(49, 130, 189, 0.2)'
        };
    },

    /**
     * Create markers for key points
     * @param {Array} markers - Array of marker objects
     * @returns {Object} Plotly markers object
     */
    createMarkers(markers) {
        return {
            x: markers.map(m => m.x),
            y: markers.map(m => m.y),
            type: 'scatter',
            mode: 'markers',
            marker: {
                color: 'red',
                size: 8,
                symbol: 'circle'
            },
            showlegend: false
        };
    },

    /**
     * Create annotations for markers
     * @param {Array} markers - Array of marker objects
     * @returns {Array} Array of Plotly annotation objects
     */
    createMarkerAnnotations(markers) {
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
    },

    /**
     * Create a parameter label annotation
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} text - Label text
     * @param {string} position - Anchor position
     * @returns {Object} Plotly annotation object
     */
    createParameterLabel(x, y, text, position = 'center') {
        return {
            x: x,
            y: y,
            xanchor: position,
            text: text,
            showarrow: false,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            bordercolor: 'rgba(0, 0, 0, 0.1)',
            borderwidth: 1,
            borderpad: 4,
            font: { size: 10 }
        };
    },

    /**
     * Create a vertical line shape
     * @param {number} x - X position
     * @param {number} y - Maximum Y value
     * @param {Object} lineStyle - Line style properties
     * @returns {Object} Plotly shape object
     */
    createVerticalLine(x, y, lineStyle = { color: 'rgba(0, 0, 0, 0.5)', width: 1, dash: 'dot' }) {
        return {
            type: 'line',
            x0: x,
            y0: 0,
            x1: x,
            y1: y,
            line: lineStyle
        };
    }
};