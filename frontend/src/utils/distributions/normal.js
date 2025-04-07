// src/utils/distributions/normal.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Normal Distribution
 */
export const Normal = {
    /**
     * Validate parameters for normal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.mean === undefined || parameters.mean === null) {
            issues.push("Mean value is required");
        }

        if (parameters.stdDev === undefined || parameters.stdDev === null) {
            issues.push("Standard deviation is required");
        } else if (parameters.stdDev <= 0) {
            issues.push("Standard deviation must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The normal distribution requires a mean and a positive standard deviation."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for normal distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const mean = DistributionBase.helpers.getParam(parameters, 'mean', 0);
        const stdDev = DistributionBase.helpers.getParam(parameters, 'stdDev', 1);
        const value = DistributionBase.helpers.getParam(parameters, 'value', mean);

        // Generate x values
        const min = mean - 4 * stdDev;
        const max = mean + 4 * stdDev;
        const xValues = PlotUtils.generateXValues(min, max);

        // Calculate PDF values
        const yValues = xValues.map(x => jStat.normal.pdf(x, mean, stdDev));
        const peakY = jStat.normal.pdf(mean, mean, stdDev);
        const valueY = jStat.normal.pdf(value, mean, stdDev);

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for mean and standard deviation
        if (options.showMarkers) {
            const markers = [];

            // Add value marker
            markers.push({ x: value, y: valueY, label: 'Value' });

            if (options.showMean && value !== mean) {
                markers.push({ x: mean, y: peakY, label: 'μ' });
            }

            if (options.showStdDev) {
                markers.push(
                    { x: mean + stdDev, y: jStat.normal.pdf(mean + stdDev, mean, stdDev), label: '+1σ' },
                    { x: mean - stdDev, y: jStat.normal.pdf(mean - stdDev, mean, stdDev), label: '-1σ' },
                    { x: mean + 2 * stdDev, y: jStat.normal.pdf(mean + 2 * stdDev, mean, stdDev), label: '+2σ' },
                    { x: mean - 2 * stdDev, y: jStat.normal.pdf(mean - 2 * stdDev, mean, stdDev), label: '-2σ' }
                );
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add vertical lines
        if (options.showMean) {
            shapes.push(PlotUtils.createVerticalLine(mean, peakY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }));
        }

        if (options.showStdDev) {
            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, jStat.normal.pdf(mean + stdDev, mean, stdDev)),
                PlotUtils.createVerticalLine(mean - stdDev, jStat.normal.pdf(mean - stdDev, mean, stdDev)),
                PlotUtils.createVerticalLine(mean + 2 * stdDev, jStat.normal.pdf(mean + 2 * stdDev, mean, stdDev)),
                PlotUtils.createVerticalLine(mean - 2 * stdDev, jStat.normal.pdf(mean - 2 * stdDev, mean, stdDev))
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    mean + 2 * stdDev,
                    peakY / 2,
                    `μ: ${mean.toFixed(2)}, σ: ${stdDev.toFixed(2)}`,
                    'right'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Normal Distribution',
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
        return DistributionBase.helpers.getParam(parameters, 'stdDev', 1);
    },

    /**
     * Get metadata for normal distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: 'Normal Distribution',
            description: 'Symmetric bell-shaped distribution defined by mean and standard deviation',
            parameters: [
                {
                    name: 'mean',
                    description: 'The average or expected value',
                    required: true
                },
                {
                    name: 'stdDev',
                    description: 'Standard deviation (measure of spread)',
                    required: true,
                    min: 0
                },
                {
                    name: 'value',
                    description: 'Custom value to highlight (defaults to mean)',
                    required: false
                }
            ]
        };
    }
};