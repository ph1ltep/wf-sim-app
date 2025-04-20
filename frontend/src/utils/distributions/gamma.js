// src/utils/distributions/gamma.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Gamma Distribution
 * Optimized for wind power industry, particularly for modeling maintenance downtime
 */
export const Gamma = {
    /**
     * Validate parameters for gamma distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.shape === undefined || parameters.shape === null) {
            issues.push("Shape parameter (k) is required");
        } else if (parameters.shape <= 0) {
            issues.push("Shape parameter (k) must be positive");
        }

        if (parameters.scale === undefined || parameters.scale === null) {
            issues.push("Scale parameter (θ) is required");
        } else if (parameters.scale <= 0) {
            issues.push("Scale parameter (θ) must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues,
                details: "The gamma distribution requires positive shape (k) and scale (θ) parameters."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for gamma distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);

        // Calculate mean for this distribution
        const distMean = shape * scale;

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', distMean);

        // Generate x values - gamma distribution has a long tail
        const max = shape < 1 ? 15 * scale : shape * scale * 3;
        const xValues = PlotUtils.generateXValues(0, max);

        // Calculate PDF values
        const yValues = xValues.map(x => {
            if (x <= 0) return 0;
            return jStat.gamma.pdf(x, shape, scale);
        });

        // Calculate mode
        const mode = shape >= 1 ? (shape - 1) * scale : 0;

        // Calculate peak height (needed for vertical lines)
        const peakY = mode > 0 ? jStat.gamma.pdf(mode, shape, scale) : yValues[1];

        // Calculate mean and standard deviation
        const mean = distMean;
        const stdDev = Math.sqrt(shape * scale * scale);

        // Calculate PDF at value point
        const valueY = value > 0 ? jStat.gamma.pdf(value, shape, scale) : 0;

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: valueY, label: 'Value' }
            ];

            if (shape >= 1 && Math.abs(value - mode) > 0.001) {
                markers.push({ x: mode, y: peakY, label: 'Mode' });
            }

            if (Math.abs(value - mean) > 0.001 && options.showMean) {
                // Calculate PDF at mean
                const meanY = jStat.gamma.pdf(mean, shape, scale);
                markers.push({ x: mean, y: meanY, label: 'Mean' });
            }

            if (options.showStdDev) {
                // Calculate PDF at mean +/- std dev
                const stdDevPlusY = jStat.gamma.pdf(mean + stdDev, shape, scale);
                const stdDevMinusY = mean - stdDev > 0
                    ? jStat.gamma.pdf(Math.max(0.001, mean - stdDev), shape, scale)
                    : 0;

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
            const meanY = jStat.gamma.pdf(mean, shape, scale);
            shapes.push(
                PlotUtils.createVerticalLine(mean, meanY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' })
            );
        }

        if (options.showStdDev) {
            const stdDevPlusY = jStat.gamma.pdf(mean + stdDev, shape, scale);
            const stdDevMinusY = mean - stdDev > 0
                ? jStat.gamma.pdf(Math.max(0.001, mean - stdDev), shape, scale)
                : 0;

            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, stdDevPlusY),
                PlotUtils.createVerticalLine(Math.max(0.001, mean - stdDev), stdDevMinusY)
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    mean,
                    peakY / 2,
                    `Shape (k): ${shape.toFixed(2)}, Scale (θ): ${scale.toFixed(2)}, Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Gamma Distribution',
            xaxisTitle: options.addonAfter ? `Duration (${options.addonAfter})` : 'Duration (hours)',
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
        const shape = DistributionBase.helpers.getParam(parameters, 'shape', 2);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 1);
        return Math.sqrt(shape * scale * scale);
    },

    /**
     * Get metadata for gamma distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Gamma Distribution",
            description: "Flexible two-parameter distribution for positive-valued random variables.",
            applications: "Used for modeling waiting times, rainfall amounts, and other quantities that are always positive and may be skewed.",
            examples: "Repair times, component lifetime, precipitation levels.",
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Default value"
                    }
                },
                {
                    name: "scale",
                    description: "Scale Parameter (β)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Scale (β)",
                        tooltip: "Scale parameter of the Gamma distribution",
                        min: 0,
                        step: 0.1,
                        defaultValue: 1
                    }
                },
                {
                    name: "shape",
                    description: "Shape Parameter (α)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Shape (α)",
                        tooltip: "Shape parameter of the Gamma distribution",
                        min: 0,
                        step: 0.1,
                        defaultValue: 2
                    }
                }
            ]
        };
    }
};