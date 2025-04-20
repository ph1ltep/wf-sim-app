// src/utils/distributions/poisson.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Poisson Distribution
 */
export const Poisson = {
    /**
     * Validate parameters for Poisson distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        if (parameters.lambda === undefined || parameters.lambda === null) {
            return {
                isValid: false,
                message: ["Lambda parameter is required"],
                details: "The Poisson distribution requires a lambda (mean) parameter."
            };
        } else if (parameters.lambda <= 0) {
            return {
                isValid: false,
                message: ["Lambda parameter must be positive"],
                details: "The Poisson distribution's lambda parameter must be greater than zero."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for Poisson distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        const value = DistributionBase.helpers.getParam(parameters, 'value', lambda);

        // For discrete distributions like Poisson, we use bars
        const max = Math.min(20, lambda * 3);
        const xValues = Array.from({ length: max + 1 }, (_, i) => i);

        // Calculate PMF values
        const yValues = xValues.map(x => jStat.poisson.pdf(x, lambda));

        // For Poisson, mean = lambda, std dev = sqrt(lambda)
        const mean = lambda;
        const stdDev = Math.sqrt(lambda);

        const data = [PlotUtils.createMainCurve(xValues, yValues, 'bar')];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const roundedValue = Math.round(value);
            const markers = [
                { x: roundedValue, y: yValues[roundedValue] || 0, label: 'Value', yanchor: 'bottom', yshift: 5 }
            ];

            if (options.showMean && Math.round(value) !== Math.round(mean)) {
                const meanIndex = Math.round(mean);
                markers.push(
                    { x: meanIndex, y: yValues[meanIndex], label: 'Mean', yanchor: 'bottom', yshift: 5 }
                );
            }

            if (options.showStdDev) {
                const stdDevPlus = Math.round(mean + stdDev);
                const stdDevMinus = Math.max(0, Math.round(mean - stdDev));

                markers.push(
                    { x: stdDevPlus, y: yValues[stdDevPlus], label: '+1σ', yanchor: 'bottom', yshift: 5 },
                    { x: stdDevMinus, y: yValues[stdDevMinus], label: '-1σ', yanchor: 'bottom', yshift: 5 }
                );
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    lambda * 1.5,
                    Math.max(...yValues) / 2,
                    `λ: ${lambda.toFixed(2)}, Mean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Poisson Distribution',
            xaxisTitle: options.addonAfter ? `Value (${options.addonAfter})` : 'Value',
            yaxisTitle: 'Probability Mass',
            showLegend: false
        };
    },

    /**
     * Calculate standard deviation
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        const lambda = DistributionBase.helpers.getParam(parameters, 'lambda', 3);
        return Math.sqrt(lambda);
    },

    /**
     * Get metadata for Poisson distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Poisson Distribution",
            description: "Models the number of events occurring in a fixed time interval.",
            applications: "Used for modeling the number of independent events occurring at a constant rate.",
            examples: "Number of failures in a time period, number of maintenance calls per month.",
            parameters: [
                {
                    name: "value",
                    description: "Default value",
                    required: false,
                    fieldType: "number",
                    fieldProps: {
                        label: "Value",
                        tooltip: "Default value"
                    }
                },
                {
                    name: "lambda",
                    description: "Lambda (mean)",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Lambda",
                        tooltip: "Mean number of events in the specified interval",
                        min: 0
                    }
                }
            ]
        };
    }
};