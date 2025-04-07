// src/utils/distributions/uniform.js
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Uniform Distribution
 */
export const Uniform = {
    /**
     * Validate parameters for uniform distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.min === undefined || parameters.min === null) {
            issues.push("Minimum value is required");
        }

        if (parameters.max === undefined || parameters.max === null) {
            issues.push("Maximum value is required");
        }

        // Check relationship if both are present
        if (issues.length === 0 && parameters.min >= parameters.max) {
            issues.push("Maximum must be greater than minimum");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The uniform distribution requires minimum and maximum values, where maximum is greater than minimum."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for uniform distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const min = DistributionBase.helpers.getParam(parameters, 'min', 0);
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        // Calculate mean for this distribution
        const distMean = (min + max) / 2;

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', distMean);

        // Generate x values
        const xValues = PlotUtils.generateXValues(min - 0.5, max + 0.5);

        // Calculate PDF values
        const height = 1 / (max - min);
        const yValues = xValues.map(x => {
            return (x >= min && x <= max) ? height : 0;
        });

        // Calculate mean and standard deviation
        const mean = distMean;
        const stdDev = Math.sqrt((max - min) * (max - min) / 12);

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: height / 2, label: 'Value' }
            ];

            if (value !== min) {
                markers.push({ x: min, y: height, label: 'Min', xshift: 10 });
            }

            if (value !== max) {
                markers.push({ x: max, y: height, label: 'Max', xanchor: 'right', xshift: -10 });
            }

            if (value !== mean && options.showMean) {
                markers.push({ x: mean, y: height, label: 'Mean', xanchor: 'center' });
            }

            if (options.showStdDev) {
                markers.push(
                    { x: mean + stdDev, y: height / 2, label: '+1σ' },
                    { x: mean - stdDev, y: height / 2, label: '-1σ' }
                );
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add standard deviation lines
        if (options.showMean) {
            shapes.push(
                PlotUtils.createVerticalLine(mean, height, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' })
            );
        }

        if (options.showStdDev) {
            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, height),
                PlotUtils.createVerticalLine(mean - stdDev, height)
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    (min + max) / 2,
                    height / 2,
                    `Min: ${min}, Max: ${max}, Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Uniform Distribution',
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
        const max = DistributionBase.helpers.getParam(parameters, 'max', 10);

        return Math.sqrt((max - min) * (max - min) / 12);
    },

    /**
     * Get metadata for uniform distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Uniform Distribution",
            description: "Equal probability across all values in a defined range.",
            applications: "Used when all values in a range are equally likely or when uncertainty is high.",
            examples: "Energy price forecasts under high uncertainty, random component failures, initial bidding ranges.",
            parameters: [
                {
                    name: "min",
                    description: "Lower bound (typically -20% of expected value for pricing)",
                    required: true
                },
                {
                    name: "max",
                    description: "Upper bound (typically +20% of expected value for pricing)",
                    required: true
                }
            ]
        };
    }
};