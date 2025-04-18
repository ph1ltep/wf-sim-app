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
            description: "Uses a single deterministic value with no variability.",
            applications: "Used for deterministic analysis, base case scenarios, or when uncertainty is accounted for separately.",
            examples: "Fixed power purchase agreement (PPA) prices, guaranteed availability levels, or contractual performance metrics.",
            parameters: [
                {
                    name: "value",
                    description: "Set to the most likely or contractually agreed value",
                    required: true
                },
                {
                    name: "drift",
                    description: "Annual rate of change, in percentage. This is a fixed value that will be applied to the value each year.",
                    required: true
                }
            ]
        };
    }
};