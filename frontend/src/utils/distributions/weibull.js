// src/utils/distributions/weibull.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Weibull Distribution
 */
export const Weibull = {
    /**
     * Validate parameters for Weibull distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.scale === undefined || parameters.scale === null) {
            issues.push("Scale parameter is required");
        } else if (parameters.scale <= 0) {
            issues.push("Scale parameter must be positive");
        }

        if (parameters.shape === undefined || parameters.shape === null) {
            issues.push("Shape parameter is required");
        } else if (parameters.shape <= 0) {
            issues.push("Shape parameter must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The Weibull distribution requires positive scale and shape parameters."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for Weibull distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);

        // Calculate mean for this distribution
        const distMean = scale * jStat.gammafn(1 + 1 / shape);

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', distMean);

        // Generate x values
        const max = scale * Math.pow(-Math.log(0.01), 1 / shape);
        const xValues = PlotUtils.generateXValues(0, max);

        // Calculate PDF values
        const yValues = xValues.map(x => {
            if (x <= 0) return 0;
            return (shape / scale) * Math.pow(x / scale, shape - 1) *
                Math.exp(-Math.pow(x / scale, shape));
        });

        // Calculate mode
        let mode = 0;
        if (shape > 1) {
            mode = scale * Math.pow((shape - 1) / shape, 1 / shape);
        }

        // Calculate peak height
        const peakY = shape > 1 ?
            (shape / scale) * Math.pow(mode / scale, shape - 1) * Math.exp(-Math.pow(mode / scale, shape)) :
            yValues[1];

        // Calculate mean and standard deviation
        const mean = distMean;
        const variance = scale * scale * (jStat.gammafn(1 + 2 / shape) - Math.pow(jStat.gammafn(1 + 1 / shape), 2));
        const stdDev = Math.sqrt(variance);

        // Calculate PDF at value point
        let valueY = 0;
        if (value > 0) {
            valueY = (shape / scale) * Math.pow(value / scale, shape - 1) *
                Math.exp(-Math.pow(value / scale, shape));
        }

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: valueY, label: 'Value' }
            ];

            if (shape > 1 && value !== mode) {
                markers.push({ x: mode, y: peakY, label: 'Mode' });
            }

            if (value !== mean && options.showMean) {
                // Calculate PDF at mean
                const meanY = (shape / scale) * Math.pow(mean / scale, shape - 1) *
                    Math.exp(-Math.pow(mean / scale, shape));
                markers.push({ x: mean, y: meanY, label: 'Mean' });
            }

            if (options.showStdDev) {
                // Calculate PDF at mean +/- std dev
                const stdDevPlusY = value > 0 ?
                    (shape / scale) * Math.pow((mean + stdDev) / scale, shape - 1) *
                    Math.exp(-Math.pow((mean + stdDev) / scale, shape)) : 0;

                const stdDevMinusY = mean - stdDev > 0 ?
                    (shape / scale) * Math.pow(Math.max(0.001, mean - stdDev) / scale, shape - 1) *
                    Math.exp(-Math.pow(Math.max(0.001, mean - stdDev) / scale, shape)) : 0;

                markers.push(
                    { x: mean + stdDev, y: stdDevPlusY, label: '+1σ' },
                    { x: Math.max(0.001, mean - stdDev), y: stdDevMinusY, label: '-1σ' }
                );
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add standard deviation lines
        if (options.showMean) {
            // Calculate PDF at mean
            const meanY = (shape / scale) * Math.pow(mean / scale, shape - 1) *
                Math.exp(-Math.pow(mean / scale, shape));

            shapes.push(
                PlotUtils.createVerticalLine(mean, meanY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' })
            );
        }

        if (options.showStdDev) {
            // Calculate PDF at mean +/- std dev
            const stdDevPlusY = (shape / scale) * Math.pow((mean + stdDev) / scale, shape - 1) *
                Math.exp(-Math.pow((mean + stdDev) / scale, shape));

            const stdDevMinusY = mean - stdDev > 0 ?
                (shape / scale) * Math.pow(Math.max(0.001, mean - stdDev) / scale, shape - 1) *
                Math.exp(-Math.pow(Math.max(0.001, mean - stdDev) / scale, shape)) : 0;

            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, stdDevPlusY),
                PlotUtils.createVerticalLine(Math.max(0.001, mean - stdDev), stdDevMinusY)
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    scale,
                    peakY / 2,
                    `Scale: ${scale.toFixed(2)}, Shape: ${shape.toFixed(2)}, Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Weibull Distribution',
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
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);

        const variance = scale * scale * (jStat.gammafn(1 + 2 / shape) - Math.pow(jStat.gammafn(1 + 1 / shape), 2));
        return Math.sqrt(variance);
    },

    /**
     * Get metadata for Weibull distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Weibull Distribution",
            description: "Versatile distribution commonly used in reliability and wind speed modeling.",
            applications: "The standard for modeling wind speed distributions and component reliability.",
            examples: "Wind speed distributions, component failure rates, turbine lifetime modeling.",
            parameters: [
                {
                    name: "scale",
                    description: "6-12 for wind speeds (m/s)",
                    required: true
                },
                {
                    name: "shape",
                    description: "1.5-2.5 for wind speeds (higher for less variability), 1.5-3.0 for component failures",
                    required: true
                }
            ]
        };
    }
};