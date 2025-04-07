// src/utils/distributions/kaimal.js
import * as jStat from 'jstat';
import { PlotUtils } from '../plotUtils';
import { DistributionBase } from './distributionBase';

/**
 * Kaimal Distribution (Wind Turbulence Model)
 */
export const Kaimal = {
    /**
     * Validate parameters for Kaimal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Validation result
     */
    validate(parameters) {
        const issues = [];

        if (parameters.meanWindSpeed === undefined || parameters.meanWindSpeed === null) {
            issues.push("Mean wind speed is required");
        } else if (parameters.meanWindSpeed <= 0) {
            issues.push("Mean wind speed must be positive");
        }

        if (parameters.turbulenceIntensity === undefined || parameters.turbulenceIntensity === null) {
            issues.push("Turbulence intensity is required");
        } else if (parameters.turbulenceIntensity <= 0) {
            issues.push("Turbulence intensity must be positive");
        }

        if (issues.length > 0) {
            return {
                isValid: false,
                message: issues[0],
                details: "The Kaimal distribution requires positive mean wind speed and turbulence intensity parameters."
            };
        }

        return { isValid: true };
    },

    /**
     * Generate plot data for Kaimal distribution
     * @param {Object} parameters - Distribution parameters
     * @param {Object} options - Plot options
     * @returns {Object} Plot data
     */
    generatePlot(parameters, options) {
        // For Kaimal, we'll use normal approximation for visualization
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'meanWindSpeed', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100;
        const roughnessLength = DistributionBase.helpers.getParam(parameters, 'roughnessLength', 0.03);
        const kaimalScale = DistributionBase.helpers.getParam(parameters, 'scale', 8.1);

        // Use provided value or default to mean
        const value = DistributionBase.helpers.getParam(parameters, 'value', meanWindSpeed);

        // Generate wind speeds around the mean
        const stdDev = meanWindSpeed * turbulenceIntensity;
        const min = Math.max(0, meanWindSpeed - 3 * stdDev);
        const max = meanWindSpeed + 3 * stdDev;
        const xValues = PlotUtils.generateXValues(min, max);

        // Use normal approximation for visualization
        const yValues = xValues.map(x => jStat.normal.pdf(x, meanWindSpeed, stdDev));
        const peakY = jStat.normal.pdf(meanWindSpeed, meanWindSpeed, stdDev);
        const valueY = jStat.normal.pdf(value, meanWindSpeed, stdDev);

        const data = [PlotUtils.createMainCurve(xValues, yValues)];
        const shapes = [];
        const annotations = [];

        // Add markers for key points
        if (options.showMarkers) {
            const markers = [
                { x: value, y: valueY, label: 'Value' }
            ];

            if (Math.abs(value - meanWindSpeed) > 0.001 && options.showMean) {
                markers.push({ x: meanWindSpeed, y: peakY, label: 'Mean Wind Speed' });
            }

            if (options.showStdDev) {
                markers.push(
                    { x: meanWindSpeed + stdDev, y: jStat.normal.pdf(meanWindSpeed + stdDev, meanWindSpeed, stdDev), label: '+1σ' },
                    { x: meanWindSpeed - stdDev, y: jStat.normal.pdf(meanWindSpeed - stdDev, meanWindSpeed, stdDev), label: '-1σ' }
                );
            }

            data.push(PlotUtils.createMarkers(markers));
            annotations.push(...PlotUtils.createMarkerAnnotations(markers));
        }

        // Add standard deviation lines
        if (options.showMean) {
            shapes.push(
                PlotUtils.createVerticalLine(meanWindSpeed, peakY, { color: 'rgba(0, 0, 0, 0.5)', width: 2, dash: 'dot' })
            );
        }

        if (options.showStdDev) {
            shapes.push(
                PlotUtils.createVerticalLine(meanWindSpeed + stdDev, jStat.normal.pdf(meanWindSpeed + stdDev, meanWindSpeed, stdDev)),
                PlotUtils.createVerticalLine(meanWindSpeed - stdDev, jStat.normal.pdf(meanWindSpeed - stdDev, meanWindSpeed, stdDev))
            );
        }

        // Add parameter summary
        if (options.showSummary) {
            annotations.push(
                PlotUtils.createParameterLabel(
                    meanWindSpeed,
                    peakY / 2,
                    `Mean: ${meanWindSpeed.toFixed(1)} m/s, TI: ${(turbulenceIntensity * 100).toFixed(1)}%, StdDev: ${stdDev.toFixed(2)} m/s`,
                    'center'
                )
            );
        }

        // Add Kaimal-specific information
        annotations.push(
            PlotUtils.createParameterLabel(
                meanWindSpeed,
                peakY * 0.8,
                `Kaimal Scale: ${kaimalScale.toFixed(1)}, Roughness: ${roughnessLength.toFixed(3)} m`,
                'center'
            )
        );

        return {
            data,
            shapes,
            annotations,
            title: 'Kaimal Spectrum (Simplified View)',
            xaxisTitle: options.addonAfter ? `Wind Speed (${options.addonAfter})` : 'Wind Speed (m/s)',
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
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'meanWindSpeed', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100;
        return meanWindSpeed * turbulenceIntensity;
    },

    /**
     * Calculate Kaimal spectral density for a given frequency
     * @param {Object} parameters - Distribution parameters
     * @param {number} frequency - Frequency to calculate density at (Hz)
     * @returns {number} Spectral density
     */
    calculateSpectralDensity(parameters, frequency) {
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'meanWindSpeed', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100;
        const kaimalScale = DistributionBase.helpers.getParam(parameters, 'scale', 8.1);

        // Calculate friction velocity
        const roughnessLength = DistributionBase.helpers.getParam(parameters, 'roughnessLength', 0.03);
        const hubHeight = DistributionBase.helpers.getParam(parameters, 'hubHeight', 100);
        const karmanConstant = 0.4;

        const frictionVelocity = meanWindSpeed * karmanConstant / Math.log(hubHeight / roughnessLength);

        // Calculate normalized frequency
        const normalizedFreq = frequency * kaimalScale / frictionVelocity;

        // Kaimal spectral density formula
        return 4 * normalizedFreq / Math.pow(1 + 6 * normalizedFreq, 5 / 3);
    },

    /**
     * Get metadata for Kaimal distribution
     * @returns {Object} Metadata
     */
    getMetadata() {
        return {
            name: 'Kaimal Spectrum',
            description: 'Wind turbulence model following IEC 61400 standards for wind turbine design',
            parameters: [
                {
                    name: 'meanWindSpeed',
                    description: 'Mean wind speed at hub height',
                    required: true,
                    min: 0,
                    units: 'm/s'
                },
                {
                    name: 'turbulenceIntensity',
                    description: 'Turbulence intensity (percentage)',
                    required: true,
                    min: 0,
                    units: '%'
                },
                {
                    name: 'roughnessLength',
                    description: 'Surface roughness length',
                    required: false,
                    min: 0,
                    default: 0.03,
                    units: 'm'
                },
                {
                    name: 'scale',
                    description: 'Kaimal scale parameter',
                    required: false,
                    min: 0,
                    default: 8.1
                },
                {
                    name: 'hubHeight',
                    description: 'Hub height above ground',
                    required: false,
                    min: 0,
                    default: 100,
                    units: 'm'
                },
                {
                    name: 'value',
                    description: 'Custom value to highlight (defaults to mean wind speed)',
                    required: false
                }
            ]
        };
    }
};