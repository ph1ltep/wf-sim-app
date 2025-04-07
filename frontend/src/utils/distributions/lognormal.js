// src/utils/distributions/lognormal.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Lognormal Distribution
 */
export const LogNormal = {
    /**
     * Validate parameters for lognormal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.mean === undefined || parameters.mean === null) {
            issues.push("Mu (log-mean) value is required");
        }

        if (parameters.sigma === undefined || parameters.sigma === null) {
            issues.push("Sigma (log-std) is required");
        } else if (parameters.sigma <= 0) {
            issues.push("Sigma (log-std) must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The lognormal distribution requires a mu (log-mean) parameter and a positive sigma (log-std) parameter."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for lognormal distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 0.5);

        // Calculate mean for this distribution
        const distMean = Math.exp(mu + sigma * sigma / 2);

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', distMean);

        // Generate x values
        const min = Math.max(0.01, Math.exp(mu - 4 * sigma));
        const max = Math.exp(mu + 4 * sigma);
        const xValues = PlotUtils.generateXValues(min, max);

        // Calculate PDF values
        const yValues = xValues.map(x => jStat.lognormal.pdf(x, mu, sigma));

        // Calculate key points
        const mode = Math.exp(mu - sigma * sigma);
        const median = Math.exp(mu);
        const mean = distMean;
        const peakY = jStat.lognormal.pdf(mode, mu, sigma);
        const valueY = jStat.lognormal.pdf(value, mu, sigma);

        // Calculate standard deviation
        const variance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
        const stdDev = Math.sqrt(variance);

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: valueY, label: 'Value' }
            ];

            if (value !== mode) {
                markers.push({ x: mode, y: peakY, label: 'Mode' });
            }

            if (value !== median && options.showMean) {
                markers.push({ x: median, y: jStat.lognormal.pdf(median, mu, sigma), label: 'Median' });
            }

            if (value !== mean && options.showMean) {
                markers.push({ x: mean, y: jStat.lognormal.pdf(mean, mu, sigma), label: 'Mean' });
            }

            if (options.showStdDev) {
                markers.push(
                    { x: mean + stdDev, y: jStat.lognormal.pdf(mean + stdDev, mu, sigma), label: '+1σ' },
                    { x: Math.max(0.001, mean - stdDev), y: jStat.lognormal.pdf(Math.max(0.001, mean - stdDev), mu, sigma), label: '-1σ' }
                );
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add standard deviation lines
        if (options.showMean) {
            shapes.push(PlotUtils.createVerticalLine(mean, jStat.lognormal.pdf(mean, mu, sigma), { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' }));
        }

        if (options.showStdDev) {
            shapes.push(
                PlotUtils.createVerticalLine(mean + stdDev, jStat.lognormal.pdf(mean + stdDev, mu, sigma)),
                PlotUtils.createVerticalLine(Math.max(0.001, mean - stdDev), jStat.lognormal.pdf(Math.max(0.001, mean - stdDev), mu, sigma))
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    mean,
                    peakY / 2,
                    `μ: ${mu.toFixed(2)}, σ: ${sigma.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}`,
                    'center'
                )
            );
        }

        return {
            data,
            shapes,
            annotations,
            title: 'Lognormal Distribution',
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
        const mu = DistributionBase.helpers.getParam(parameters, 'mu', 0);
        const sigma = DistributionBase.helpers.getParam(parameters, 'sigma', 0.5);

        const variance = (Math.exp(sigma * sigma) - 1) * Math.exp(2 * mu + sigma * sigma);
        return Math.sqrt(variance);
    },

    /**
     * Get metadata for lognormal distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: "Lognormal Distribution",
            description: "Skewed distribution where logarithm of the variable follows normal distribution.",
            applications: "Good for modeling values that cannot be negative and have occasional large positive values.",
            examples: "Repair costs, downtime duration, time between failures, component repair times.",
            parameters: [
                {
                    name: "mean",
                    description: "Natural log of the expected value",
                    required: true
                },
                {
                    name: "sigma",
                    description: "0.4-0.8 for repair costs, 0.3-0.6 for failure intervals",
                    required: true,
                    min: 0
                }
            ]
        };
    }
};