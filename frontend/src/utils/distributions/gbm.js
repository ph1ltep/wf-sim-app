// src/utils/distributions/gbm.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Geometric Brownian Motion Distribution
 */
export const GBM = {
    /**
     * Validate parameters for GBM distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.value === undefined || parameters.value === null) {
            issues.push("Initial value is required");
        } else if (parameters.value <= 0) {
            issues.push("Initial value must be positive");
        }

        if (parameters.drift === undefined || parameters.drift === null) {
            issues.push("Drift parameter is required");
        }

        if (parameters.volatility === undefined || parameters.volatility === null) {
            issues.push("Volatility parameter is required");
        } else if (parameters.volatility <= 0) {
            issues.push("Volatility must be positive");
        }

        if (parameters.timeStep === undefined || parameters.timeStep === null) {
            issues.push("Time step is required");
        } else if (parameters.timeStep <= 0) {
            issues.push("Time step must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The Geometric Brownian Motion distribution requires a positive initial value, drift rate, positive volatility, and positive time step."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for GBM distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        // Get parameters, handling percentage inputs
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const driftPercent = DistributionBase.helpers.getParam(parameters, 'drift', 5);
        const volatilityPercent = DistributionBase.helpers.getParam(parameters, 'volatility', 20);

        // Convert from percentage to decimal
        const drift = driftPercent / 100;
        const volatility = volatilityPercent / 100;
        const timeStep = DistributionBase.helpers.getParam(parameters, 'timeStep', 1);

        // Time horizon for projection (years)
        const years = 10;
        const timePoints = Array.from({ length: years + 1 }, (_, i) => i);

        // Calculate expected mean path: S(t) = S0 * exp(μt)
        const meanPath = timePoints.map(t => initialValue * Math.exp(drift * t));

        // Calculate standard deviation at each time point
        // For GBM, the variance grows with: S0^2 * exp(2μt) * (exp(σ^2*t) - 1)
        const stdDevPath = timePoints.map(t => {
            if (t === 0) return 0; // No variance at t=0
            const variance = initialValue * initialValue *
                Math.exp(2 * drift * t) *
                (Math.exp(volatility * volatility * t) - 1);
            return Math.sqrt(variance);
        });

        // Calculate confidence intervals
        const upperCI_1sigma = timePoints.map((_, i) => meanPath[i] + stdDevPath[i]);
        const lowerCI_1sigma = timePoints.map((_, i) => Math.max(0, meanPath[i] - stdDevPath[i]));
        const upperCI_2sigma = timePoints.map((_, i) => meanPath[i] + 2 * stdDevPath[i]);
        const lowerCI_2sigma = timePoints.map((_, i) => Math.max(0, meanPath[i] - 2 * stdDevPath[i]));

        // Generate sample paths for illustration
        const numPaths = 5;
        const samplePaths = [];

        // Use a deterministic seed for reproducibility
        const randomGenerator = jStat.normal.sample;

        for (let p = 0; p < numPaths; p++) {
            const path = [initialValue];
            let value = initialValue;

            for (let t = 1; t <= years; t++) {
                const adjustedDrift = drift - (volatility * volatility) / 2;
                // Use a different random seed for each path
                const randomComponent = volatility * Math.sqrt(timeStep) * randomGenerator(0, 1);
                value = value * Math.exp(adjustedDrift * timeStep + randomComponent);
                path.push(value);
            }

            samplePaths.push(path);
        }

        const data = [];

        // Add confidence bands (filled area)
        data.push({
            x: [...timePoints, ...timePoints.slice().reverse()],
            y: [...upperCI_2sigma, ...lowerCI_2sigma.slice().reverse()],
            fill: 'toself',
            fillcolor: 'rgba(0, 0, 255, 0.1)',
            line: { color: 'transparent' },
            name: '95% Confidence',
            showlegend: true
        });

        data.push({
            x: [...timePoints, ...timePoints.slice().reverse()],
            y: [...upperCI_1sigma, ...lowerCI_1sigma.slice().reverse()],
            fill: 'toself',
            fillcolor: 'rgba(0, 0, 255, 0.2)',
            line: { color: 'transparent' },
            name: '68% Confidence',
            showlegend: true
        });

        // Add expected path (mean)
        data.push({
            x: timePoints,
            y: meanPath,
            type: 'scatter',
            mode: 'lines',
            line: {
                color: 'rgb(255, 0, 0)',
                width: 2
            },
            name: 'Expected Value'
        });

        // Add sample paths
        for (let p = 0; p < samplePaths.length; p++) {
            data.push({
                x: timePoints,
                y: samplePaths[p],
                type: 'scatter',
                mode: 'lines',
                line: {
                    color: 'rgba(0, 0, 0, 0.3)',
                    width: 1
                },
                showlegend: p === 0,
                name: p === 0 ? 'Sample Paths' : undefined
            });
        }

        // Add annotations for parameters
        const annotations = [];
        annotations.push({
            x: years / 2,
            y: meanPath[years] * 1.1,
            text: `Initial: ${initialValue.toFixed(2)}, Drift: ${driftPercent.toFixed(1)}%, Volatility: ${volatilityPercent.toFixed(1)}%`,
            showarrow: false,
            bgcolor: 'rgba(255, 255, 255, 0.8)',
            bordercolor: 'rgba(0, 0, 0, 0.1)',
            borderwidth: 1,
            borderpad: 4,
            font: { size: 10 }
        });

        const legend = {
            x: 0.05,
            y: 0.95,
            bgcolor: 'rgba(255, 255, 255, 0.5)'
        };

        return {
            data,
            shapes: [],
            annotations,
            title: 'Geometric Brownian Motion',
            xaxisTitle: 'Years',
            yaxisTitle: options.addonAfter ? `Value (${options.addonAfter})` : 'Value',
            showLegend: true,
            legend
        };
    },

    /**
     * Calculate standard deviation at a specific time point
     * @param {Object} parameters - Distribution parameters
     * @param {number} timePoint - Time point to calculate standard deviation at
     * @returns {number} Standard deviation
     */
    calculateStdDevAtTime(parameters, timePoint) {
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const driftPercent = DistributionBase.helpers.getParam(parameters, 'drift', 5);
        const volatilityPercent = DistributionBase.helpers.getParam(parameters, 'volatility', 20);

        // Convert from percentage to decimal
        const drift = driftPercent / 100;
        const volatility = volatilityPercent / 100;

        if (timePoint === 0) return 0;

        const variance = initialValue * initialValue *
            Math.exp(2 * drift * timePoint) *
            (Math.exp(volatility * volatility * timePoint) - 1);

        return Math.sqrt(variance);
    },

    /**
     * Calculate standard deviation at t=1 by default
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        return this.calculateStdDevAtTime(parameters, 1);
    },

    /**
     * Calculate expected value at a specific time point
     * @param {Object} parameters - Distribution parameters
     * @param {number} timePoint - Time point to calculate expected value at
     * @returns {number} Expected value
     */
    calculateExpectedValue(parameters, timePoint) {
        const initialValue = DistributionBase.helpers.getParam(parameters, 'value', 100);
        const driftPercent = DistributionBase.helpers.getParam(parameters, 'drift', 5);

        // Convert from percentage to decimal
        const drift = driftPercent / 100;

        return initialValue * Math.exp(drift * timePoint);
    },

    /**
     * Get metadata for GBM distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: 'Geometric Brownian Motion',
            description: 'A continuous-time stochastic process used to model stock prices, asset values, and prices over time',
            parameters: [
                {
                    name: 'value',
                    description: 'Initial value at t=0',
                    required: true,
                    min: 0
                },
                {
                    name: 'drift',
                    description: 'Annual growth rate (percentage)',
                    required: true
                },
                {
                    name: 'volatility',
                    description: 'Annual volatility (percentage)',
                    required: true,
                    min: 0
                },
                {
                    name: 'timeStep',
                    description: 'Time step for simulation (years)',
                    required: true,
                    min: 0,
                    default: 1
                }
            ]
        };
    }
};