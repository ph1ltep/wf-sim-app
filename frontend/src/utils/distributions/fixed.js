// src/utils/distributions/fixed.js
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Fixed Distribution (constant value)
 */
export const Fixed = {
    /**
     * Validate parameters for fixed distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        if (parameters.value === undefined || parameters.value === null) {
            return {
                isValid: false,
                message: ["Fixed value is required"],
                details: "Please provide a fixed value for this distribution."
            };
        }
        return { isValid: true };
    },

    /**
     * Generate plot data for fixed distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const value = DistributionBase.helpers.getParam(parameters, 'value', 0);
        const xValues = [value - 1, value - 0.01, value, value + 0.01, value + 1];
        const yValues = [0, 0, 1, 0, 0];

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers
        if (options.showMarkers) {
            const markers = [{ x: value, y: 0.5, label: `Value: ${value}` }];
            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Fixed Value Distribution',
            xaxisTitle: options.addonAfter ? `Value (${options.addonAfter})` : 'Value',
            yaxisTitle: 'Probability Density',
            showLegend: false
        };
    },

    /**
     * Calculate standard deviation (always 0 for fixed distribution)
     * @returns {number} Standard deviation
     */
    calculateStdDev() {
        return 0;
    },

    /**
     * Get metadata for fixed distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Fixed Value",
            description: "A constant value with optional annual growth/decline rate.",
            applications: "Used for well-known constant values or when a single best estimate is preferred over a range of values.",
            examples: "Fixed operations and maintenance costs, known quantities, or deterministic projections.",
            parameters: [
                {
                    name: "value",
                    description: "The exact value to use",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Exact value to use (no randomness)",
                        min: undefined,
                        step: 1
                    }
                },
                {
                    name: "drift",
                    description: "Annual percentage change",
                    required: false,
                    fieldType: "percentage",
                    fieldProps: {
                        label: "Change rate",
                        tooltip: "Annual growth rate",
                        min: -20,
                        max: 100,
                        step: 0.1,
                        precision: 1,
                        defaultValue: 5
                    }
                }
            ]
        };
    }
};