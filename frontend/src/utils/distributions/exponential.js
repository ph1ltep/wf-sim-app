// src/utils/distributions/exponential.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Exponential Distribution
 */
export const Exponential = {
    /**
     * Validate parameters for exponential distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        if (parameters.lambda === undefined || parameters.lambda === null) {
            return {
                isValid: false,
                message: ["Lambda parameter is required"],
                details: "The exponential distribution requires a lambda (rate) parameter."
            };
        } else if (parameters.lambda <= 0) {
            return {
                isValid: false,
                message: ["Lambda parameter must be positive"],
                details: "The exponential distribution's lambda parameter must be greater than zero."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for exponential distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);

        // Calculate mean for this distribution
        const distMean = 1 / lambda;

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', distMean);

        // Generate x values
        const max = -Math.log(0.01) / lambda;
        const xValues = PlotUtils.generateXValues(0, max);

        // Calculate PDF values
        const yValues = xValues.map(x => {
            if (x < 0) return 0;
            return lambda * Math.exp(-lambda * x);
        });

        const peakY = lambda;
        const valueY = lambda * Math.exp(-lambda * value);

        // For exponential, mean and std dev are both 1/lambda
        const mean = distMean;
        const stdDev = distMean;

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: valueY, label: 'Value' }
            ];

            // Show peak at x=0 if value isn't at 0
            if (value > 0.001) {
                markers.push({ x: 0, y: peakY, label: 'Peak' });
            }

            if (options.showMean && Math.abs(value - mean) > 0.001) {
                markers.push({ x: mean, y: lambda * Math.exp(-1), label: 'Mean (1σ)' });
            }

            if (options.showStdDev && Math.abs(value - (mean + stdDev)) > 0.001) {
                markers.push({ x: mean + stdDev, y: lambda * Math.exp(-2), label: '+1σ' });
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add standard deviation lines
        if (options.showMean) {
            shapes.push(
                PlotUtils.createVerticalLine(mean, lambda * Math.exp(-1), { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' })
            );
        }

        if (options.showStdDev) {
            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, lambda * Math.exp(-2))
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    mean * 2,
                    peakY / 2,
                    `λ: ${lambda.toFixed(2)}, Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Exponential Distribution',
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
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 1);
        return 1 / lambda;
    },

    /**
     * Get metadata for exponential distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Exponential Distribution",
            description: "Models the time between independent events occurring at a constant average rate.",
            applications: "Used for modeling waiting times and the lifetime of components with constant failure rate.",
            examples: "Time between failures for simple components, inter-arrival times for random events.",
            parameters: [
                {
                    name: "value",
                    description: "Mean value",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Value",
                        tooltip: "Mean value of the distribution (1/lambda)",
                        min: 0
                    }
                },
                {
                    name: "lambda",
                    description: "Rate parameter",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Lambda",
                        tooltip: "Rate parameter of the exponential distribution",
                        min: 0,
                        step: 0.01
                    }
                }
            ]
        };
    }
};