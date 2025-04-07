// src/utils/distributions/triangular.js
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Triangular Distribution
 */
export const Triangular = {
    /**
     * Validate parameters for triangular distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.min === undefined || parameters.min === null) {
            issues.push("Minimum value is required");
        }

        if (parameters.mode === undefined || parameters.mode === null) {
            issues.push("Mode value is required");
        }

        if (parameters.max === undefined || parameters.max === null) {
            issues.push("Maximum value is required");
        }

        // Only check relationships if all parameters are present
        if (issues.length === 0) {
            if (parameters.min > parameters.mode) {
                issues.push("Minimum must be less than or equal to mode");
            }

            if (parameters.mode > parameters.max) {
                issues.push("Mode must be less than or equal to maximum");
            }

            if (parameters.min > parameters.max) {
                issues.push("Minimum must be less than maximum");
            }
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The triangular distribution requires minimum, mode, and maximum values that satisfy: min ≤ mode ≤ max."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for triangular distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        // Calculate mean for this distribution
        const distMean = (min + mode + max) / 3;

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', distMean);

        // Generate x values
        const xValues = PlotUtils.generateXValues(min - 0.1, max + 0.1);

        // Calculate PDF values
        const yValues = xValues.map(x => {
            if (x < min || x > max) return 0;
            if (x < mode) {
                return 2 * (x - min) / ((max - min) * (mode - min));
            } else {
                return 2 * (max - x) / ((max - min) * (max - mode));
            }
        });

        // Calculate peak height
        const peakY = 2 / (max - min);

        // Calculate mean and standard deviation
        const mean = distMean;
        const stdDev = Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);

        // Find y value at the value point
        const valueY = (value >= min && value <= max)
            ? (value < mode
                ? 2 * (value - min) / ((max - min) * (mode - min))
                : 2 * (max - value) / ((max - min) * (max - mode)))
            : 0;

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: valueY, label: 'Value' }
            ];

            if (value !== min) {
                markers.push({ x: min, y: 0, label: 'Min', yanchor: 'bottom', yshift: 10 });
            }

            if (value !== mode) {
                markers.push({ x: mode, y: peakY, label: 'Mode', xanchor: 'center', yanchor: 'bottom' });
            }

            if (value !== max) {
                markers.push({ x: max, y: 0, label: 'Max', xanchor: 'right', yanchor: 'bottom', yshift: 10 });
            }

            // Find y value at the mean
            const meanY = (mean >= min && mean <= max)
                ? (mean < mode
                    ? 2 * (mean - min) / ((max - min) * (mode - min))
                    : 2 * (max - mean) / ((max - min) * (max - mode)))
                : 0;

            if (value !== mean && options.showMean) {
                markers.push({ x: mean, y: meanY, label: 'Mean' });
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add mean and std dev lines
        if (options.showMean) {
            // Find y value at the mean
            const meanY = (mean >= min && mean <= max)
                ? (mean < mode
                    ? 2 * (mean - min) / ((max - min) * (mode - min))
                    : 2 * (max - mean) / ((max - min) * (max - mode)))
                : 0;

            shapes.push(
                PlotUtils.createVerticalLine(mean, meanY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' })
            );
        }

        if (options.showStdDev) {
            // Find y values at mean +/- std dev
            const stdDevPlusY = (mean + stdDev >= min && mean + stdDev <= max)
                ? ((mean + stdDev) < mode
                    ? 2 * ((mean + stdDev) - min) / ((max - min) * (mode - min))
                    : 2 * (max - (mean + stdDev)) / ((max - min) * (max - mode)))
                : 0;

            const stdDevMinusY = (mean - stdDev >= min && mean - stdDev <= max)
                ? ((mean - stdDev) < mode
                    ? 2 * ((mean - stdDev) - min) / ((max - min) * (mode - min))
                    : 2 * (max - (mean - stdDev)) / ((max - min) * (max - mode)))
                : 0;

            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, stdDevPlusY),
                PlotUtils.createVerticalLine(mean - stdDev, stdDevMinusY)
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    (min + max) / 2,
                    peakY / 2,
                    `Min: ${min}, Mode: ${mode}, Max: ${max}, Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Triangular Distribution',
            xaxisTitle: options.addonAfter ? `Value (${options.addonAfter})` : 'Value',
            yaxisTitle: 'Probability Density',
            showLegend: false
        };
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const mode = DistributionBase.helpers.getParam(parameters, 'mode', 5);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        return Math.sqrt((min * min + mode * mode + max * max - min * mode - min * max - mode * max) / 18);
    },

    /**
     * Get metadata for triangular distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Triangular Distribution",
            description: "Simple distribution defined by minimum, maximum, and most likely values.",
            applications: "Useful when data is limited but min, max, and most likely values are known from expert judgment.",
            examples: "Construction costs, project timelines, capacity factors, seasonal energy output variations.",
            parameters: [
                {
                    name: "min",
                    description: "Absolute minimum (e.g., 30% for capacity factor)",
                    required: true
                },
                {
                    name: "mode",
                    description: "Most likely value (e.g., 40% for capacity factor)",
                    required: true
                },
                {
                    name: "max",
                    description: "Maximum reasonable value (e.g., 50% for capacity factor)",
                    required: true
                }
            ]
        };
    }
};