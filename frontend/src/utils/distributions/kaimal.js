// src/utils/distributions/kaimal.js
import * as jStat from 'jstat';
import { DistributionBase } from './distributionBase';

/**
 * Kaimal Distribution (Wind Turbulence Model)
 * Extends distributionBase with Kaimal distribution implementation
 * 
 * The Kaimal spectrum is used in wind engineering to model turbulence
 * according to the IEC 61400-1 standard.
 */
export const Kaimal = {
    // Extend the base distribution template
    ...DistributionBase.template,

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
                message: issues,
                details: "The Kaimal distribution requires positive mean wind speed and turbulence intensity parameters."
            };
        }

        return { isValid: true };
    },

    /**
     * Calculate mean value for Kaimal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Mean value (mean wind speed)
     */
    calculateMean(parameters) {
        // For Kaimal, the mean is the mean wind speed parameter
        return DistributionBase.helpers.getParam(parameters, 'value', 10);
    },

    /**
     * Calculate standard deviation for Kaimal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Standard deviation
     */
    calculateStdDev(parameters) {
        // For Kaimal, std dev = mean wind speed * turbulence intensity
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100; // Convert percentage to decimal
        return meanWindSpeed * turbulenceIntensity;
    },

    /**
     * Calculate Kaimal spectral density for a given frequency
     * @param {Object} parameters - Distribution parameters
     * @param {number} frequency - Frequency to calculate density at (Hz)
     * @returns {number} Spectral density
     */
    calculateSpectralDensity(parameters, frequency) {
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100;
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 8.1);

        // Calculate friction velocity
        const roughnessLength = DistributionBase.helpers.getParam(parameters, 'roughnessLength', 0.03);
        const hubHeight = DistributionBase.helpers.getParam(parameters, 'hubHeight', 100);
        const karmanConstant = 0.4;

        const frictionVelocity = meanWindSpeed * karmanConstant / Math.log(hubHeight / roughnessLength);

        // Calculate normalized frequency
        const normalizedFreq = frequency * scale / frictionVelocity;

        // Kaimal spectral density formula
        return 4 * normalizedFreq / Math.pow(1 + 6 * normalizedFreq, 5 / 3);
    },

    /**
     * Calculate PDF at a specific point (approximation for visualization)
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} PDF value
     */
    calculatePDF(x, parameters) {
        // For Kaimal, we'll use a normal approximation for visualization
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const stdDev = this.calculateStdDev(parameters);

        // Use normal PDF as approximation
        return jStat.normal.pdf(x, meanWindSpeed, stdDev);
    },

    /**
     * Calculate CDF at a specific point (approximation for visualization)
     * @param {number} x - Point to evaluate
     * @param {Object} parameters - Distribution parameters
     * @returns {number} CDF value
     */
    calculateCDF(x, parameters) {
        // For Kaimal, we'll use a normal approximation for visualization
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const stdDev = this.calculateStdDev(parameters);

        // Use normal CDF as approximation
        return jStat.normal.cdf(x, meanWindSpeed, stdDev);
    },

    /**
     * Calculate quantile (inverse CDF) for probability p
     * @param {number} p - Probability (0-1)
     * @param {Object} parameters - Distribution parameters
     * @returns {number} Quantile value
     */
    calculateQuantile(p, parameters) {
        // For Kaimal, we'll use a normal approximation for visualization
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const stdDev = this.calculateStdDev(parameters);

        // Use normal inverse CDF as approximation
        return jStat.normal.inv(p, meanWindSpeed, stdDev);
    },

    /**
     * Generate PDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} PDF curve data and statistics
     */
    generatePDF(parameters, xValues, percentiles = []) {
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100;
        const roughnessLength = DistributionBase.helpers.getParam(parameters, 'roughnessLength', 0.03);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 8.1);

        // Use normal approximation for visualization
        const stdDev = meanWindSpeed * turbulenceIntensity;

        // Filter for non-negative values
        const filteredXValues = xValues.filter(x => x >= 0);

        // Calculate PDF values using normal approximation
        const pdfValues = filteredXValues.map(x => jStat.normal.pdf(x, meanWindSpeed, stdDev));

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;

                // Calculate using normal approximation
                const x = jStat.normal.inv(p, meanWindSpeed, stdDev);
                const y = jStat.normal.pdf(x, meanWindSpeed, stdDev);

                percentilePoints.push({
                    percentile: percentile,
                    x: x > 0 ? x : 0, // Ensure non-negative
                    y: y
                });
            });
        }

        // Create key points for markers
        const keyPoints = [
            { x: meanWindSpeed, y: jStat.normal.pdf(meanWindSpeed, meanWindSpeed, stdDev), label: 'Mean Wind Speed' }
        ];

        // Add std dev points
        const stdDevPlus = meanWindSpeed + stdDev;
        const stdDevMinus = Math.max(0, meanWindSpeed - stdDev);

        keyPoints.push(
            { x: stdDevPlus, y: jStat.normal.pdf(stdDevPlus, meanWindSpeed, stdDev), label: '+1σ' },
            { x: stdDevMinus, y: jStat.normal.pdf(stdDevMinus, meanWindSpeed, stdDev), label: '-1σ' }
        );

        return {
            xValues: filteredXValues,
            pdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                meanWindSpeed,
                turbulenceIntensity: turbulenceIntensity * 100, // Convert back to percentage
                roughnessLength,
                scale,
                mean: meanWindSpeed,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Generate CDF curve and key statistics for plotting
     * @param {Object} parameters - Distribution parameters
     * @param {Array} xValues - X values to calculate for
     * @param {Array} percentiles - Array of percentile objects (optional)
     * @returns {Object} CDF curve data and statistics
     */
    generateCDF(parameters, xValues, percentiles = []) {
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const turbulenceIntensity = DistributionBase.helpers.getParam(parameters, 'turbulenceIntensity', 10) / 100;
        const roughnessLength = DistributionBase.helpers.getParam(parameters, 'roughnessLength', 0.03);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 8.1);

        // Use normal approximation for visualization
        const stdDev = meanWindSpeed * turbulenceIntensity;

        // Filter for non-negative values
        const filteredXValues = xValues.filter(x => x >= 0);

        // Calculate CDF values using normal approximation
        const cdfValues = filteredXValues.map(x => jStat.normal.cdf(x, meanWindSpeed, stdDev));

        // Calculate percentile x-values
        const percentilePoints = [];
        if (percentiles && percentiles.length > 0) {
            percentiles.forEach(percentile => {
                const p = percentile.value / 100;

                // Calculate using normal approximation
                const x = jStat.normal.inv(p, meanWindSpeed, stdDev);

                percentilePoints.push({
                    percentile: percentile,
                    x: x > 0 ? x : 0, // Ensure non-negative
                    y: p
                });
            });
        }

        // Create key points for markers
        const keyPoints = [
            { x: meanWindSpeed, y: 0.5, label: 'Mean Wind Speed' } // CDF = 0.5 at mean for normal
        ];

        // Add std dev points
        const stdDevPlus = meanWindSpeed + stdDev;
        const stdDevMinus = Math.max(0, meanWindSpeed - stdDev);

        keyPoints.push(
            { x: stdDevPlus, y: jStat.normal.cdf(stdDevPlus, meanWindSpeed, stdDev), label: '+1σ' },
            { x: stdDevMinus, y: jStat.normal.cdf(stdDevMinus, meanWindSpeed, stdDev), label: '-1σ' }
        );

        return {
            xValues: filteredXValues,
            cdfValues,
            percentilePoints,
            keyPoints,
            stats: {
                meanWindSpeed,
                turbulenceIntensity: turbulenceIntensity * 100, // Convert back to percentage
                roughnessLength,
                scale,
                mean: meanWindSpeed,
                stdDev,
                variance: stdDev * stdDev
            }
        };
    },

    /**
     * Generate spectral density plot data
     * @param {Object} parameters - Distribution parameters
     * @param {Array} frequencies - Frequency values for x-axis (Hz)
     * @returns {Object} Plot data for spectral density
     */
    generateSpectralDensity(parameters, frequencies = null) {
        const meanWindSpeed = DistributionBase.helpers.getParam(parameters, 'value', 10);
        const roughnessLength = DistributionBase.helpers.getParam(parameters, 'roughnessLength', 0.03);
        const scale = DistributionBase.helpers.getParam(parameters, 'scale', 8.1);
        const hubHeight = DistributionBase.helpers.getParam(parameters, 'hubHeight', 100);

        // Generate reasonable frequency range if not provided
        const freqValues = frequencies || Array.from(
            { length: 100 },
            (_, i) => 0.001 + i * 0.05
        );

        // Calculate spectral density values
        const spectralValues = freqValues.map(freq =>
            this.calculateSpectralDensity(parameters, freq)
        );

        // Key frequencies to mark
        const karmanConstant = 0.4;
        const frictionVelocity = meanWindSpeed * karmanConstant / Math.log(hubHeight / roughnessLength);

        // Characteristic frequency where spectrum peaks
        const peakFreq = frictionVelocity / (scale * 6);

        return {
            xValues: freqValues,
            yValues: spectralValues,
            keyPoints: [
                {
                    x: peakFreq,
                    y: this.calculateSpectralDensity(parameters, peakFreq),
                    label: 'Peak'
                }
            ],
            stats: {
                meanWindSpeed,
                roughnessLength,
                scale,
                hubHeight,
                peakFrequency: peakFreq
            }
        };
    },

    /**
     * Get metadata for Kaimal distribution
     * @param {Object|number|null} currentValue - Optional current value to influence defaults
     * @returns {Object} Metadata
     */
    getMetadata(currentValue = null) {
        // Convert current value to number if it's an object
        let value = null;
        if (currentValue !== null) {
            value = typeof currentValue === 'object'
                ? DistributionBase.helpers.getParam(currentValue, 'value', 0)
                : currentValue;
        }

        const defaultWindSpeed = value !== null && value > 0 ? value : 10;

        return {
            name: "Kaimal Distribution",
            description: "Models wind turbulence using the Kaimal spectrum (IEC 61400-1 standard).",
            applications: "Used in wind engineering for modeling turbulence intensity and load calculations.",
            examples: "Wind turbulence modeling, load calculations for turbine components.",
            defaultCurve: "pdf", // For visualization, use PDF mode
            nonNegativeSupport: true, // Wind speed is non-negative
            minPointsRequired: 5, // Minimum points needed for fitting
            parameters: [
                {
                    name: "value",
                    description: "Mean wind speed",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Mean",
                        tooltip: "Mean wind speed at hub height",
                        min: 0,
                        step: 0.1,
                        defaultValue: defaultWindSpeed,
                        addonAfter: "m/s"
                    }
                },
                {
                    name: "turbulenceIntensity",
                    description: "Turbulence Intensity",
                    required: true,
                    fieldType: "percentage",
                    fieldProps: {
                        label: "Turbulence Intensity",
                        tooltip: "Turbulence intensity as percentage of mean wind speed",
                        min: 0,
                        max: 30,
                        step: 0.1,
                        defaultValue: 10,
                        span: { xs: 24, sm: 8 }
                    }
                },
                {
                    name: "roughnessLength",
                    description: "Roughness Length",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Roughness Length",
                        tooltip: "Surface roughness length in meters",
                        min: 0,
                        step: 0.01,
                        defaultValue: 0.03,
                        addonAfter: "m"
                    }
                },
                {
                    name: "scale",
                    description: "Kaimal Scale",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Kaimal Scale",
                        tooltip: "Scale parameter for the Kaimal spectrum",
                        step: 0.1,
                        min: 0,
                        defaultValue: 8.1
                    }
                },
                {
                    name: "hubHeight",
                    description: "Hub Height",
                    required: true,
                    fieldType: "number",
                    fieldProps: {
                        label: "Hub Height",
                        tooltip: "Hub height in meters",
                        min: 70,
                        defaultValue: 105,
                        step: 0.5,
                        addonAfter: "m"
                    }
                }
            ]
        };
    }
};