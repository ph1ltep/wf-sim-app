// backend/services/monte-carlo-v2/distributions/kaimal.js
const DistributionGenerator = require('./distributionBase');
const validation = require('../utils/validation');

/**
 * Kaimal distribution implementation
 * Models wind turbulence according to the Kaimal spectrum model
 * following IEC 61400 standards for wind turbine design
 */
class KaimalDistribution extends DistributionGenerator {
    /**
     * Initialize the Kaimal distribution
     * @param {Object} parameters - Distribution parameters
     * @returns {Object} Initial state
     */
    initialize(parameters) {
        return {}; // No special state needed for Kaimal distribution
    }

    /**
     * Generate a random value from the Kaimal distribution
     * Uses a normal approximation with the mean wind speed and turbulence intensity
     * 
     * @param {number} year - Current year
     * @param {function} random - Random generator function
     * @returns {number} Random wind speed value from Kaimal model
     */
    generate(year, random) {
        // Get primary parameters
        const meanWindSpeed = this.getParameterValue('value', year, 10);
        const turbulenceIntensity = this.getParameterValue('turbulenceIntensity', year, 15) / 100; // Convert from percentage
        const roughnessLength = this.getParameterValue('roughnessLength', year, 0.03);
        const kaimalScale = this.getParameterValue('scale', year, 8.1);

        // Calculate standard deviation from turbulence intensity
        const standardDeviation = meanWindSpeed * turbulenceIntensity;

        // Generate normal random value using Box-Muller transform
        const u1 = random();
        const u2 = random();
        const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

        // Apply turbulence to mean wind speed, ensuring non-negative values
        return Math.max(0, meanWindSpeed + standardDeviation * z);
    }

    /**
     * Calculate the Kaimal spectral density for a given frequency
     * This is used for spectral analysis of wind turbulence
     * 
     * @param {number} frequency - Frequency in Hz
     * @param {number} frictionVelocity - Friction velocity
     * @param {number} height - Height above ground
     * @param {number} kaimalScale - Kaimal scale parameter
     * @returns {number} Spectral density
     */
    calculateSpectralDensity(frequency, frictionVelocity, height, kaimalScale) {
        // Calculate normalized frequency
        const normalizedFreq = frequency * height / frictionVelocity;

        // Kaimal spectrum formula
        return (4 * normalizedFreq * kaimalScale) /
            Math.pow(1 + 6 * normalizedFreq * kaimalScale, 5 / 3);
    }

    /**
     * Validate Kaimal distribution parameters
     * @param {Object} parameters - Parameters to validate
     * @returns {Object} Validation result {isValid, errors}
     */
    static validate(parameters) {
        const errors = [];

        // Check mean wind speed parameter (must be positive)
        if (!validation.isValidParameter(parameters.value)) {
            errors.push("Mean wind speed parameter must be a number or a valid time series");
        } else if (typeof parameters.value === 'number' && parameters.value <= 0) {
            errors.push("Mean wind speed must be positive");
        } else if (Array.isArray(parameters.value)) {
            parameters.value.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Mean wind speed at index ${index} (year ${point.year}) must be positive`);
                }
            });
        }

        // Check turbulence intensity parameter (must be positive, reasonable percentage)
        if (!validation.isValidParameter(parameters.turbulenceIntensity)) {
            errors.push("Turbulence intensity parameter must be a number or a valid time series");
        } else if (typeof parameters.turbulenceIntensity === 'number') {
            if (parameters.turbulenceIntensity <= 0) {
                errors.push("Turbulence intensity must be positive");
            } else if (parameters.turbulenceIntensity > 100) {
                errors.push("Turbulence intensity is unreasonably high (> 100%)");
            }
        } else if (Array.isArray(parameters.turbulenceIntensity)) {
            parameters.turbulenceIntensity.forEach((point, index) => {
                if (point.value <= 0) {
                    errors.push(`Turbulence intensity at index ${index} (year ${point.year}) must be positive`);
                } else if (point.value > 100) {
                    errors.push(`Turbulence intensity at index ${index} (year ${point.year}) is unreasonably high (> 100%)`);
                }
            });
        }

        // Check roughness length parameter (must be positive)
        if (parameters.roughnessLength !== undefined) {
            if (!validation.isValidParameter(parameters.roughnessLength)) {
                errors.push("Roughness length parameter must be a number or a valid time series");
            } else if (typeof parameters.roughnessLength === 'number' && parameters.roughnessLength < 0) {
                errors.push("Roughness length must be non-negative");
            } else if (Array.isArray(parameters.roughnessLength)) {
                parameters.roughnessLength.forEach((point, index) => {
                    if (point.value < 0) {
                        errors.push(`Roughness length at index ${index} (year ${point.year}) must be non-negative`);
                    }
                });
            }
        }

        // Check Kaimal scale parameter (must be positive)
        if (parameters.scale !== undefined) {
            if (!validation.isValidParameter(parameters.scale)) {
                errors.push("Kaimal scale parameter must be a number or a valid time series");
            } else if (typeof parameters.scale === 'number' && parameters.scale <= 0) {
                errors.push("Kaimal scale must be positive");
            } else if (Array.isArray(parameters.scale)) {
                parameters.scale.forEach((point, index) => {
                    if (point.value <= 0) {
                        errors.push(`Kaimal scale at index ${index} (year ${point.year}) must be positive`);
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Get Kaimal distribution metadata
     * @returns {Object} Metadata about the distribution
     */
    static getMetadata() {
        return {
            name: "Kaimal Spectrum",
            description: "Specialized model for wind turbulence following IEC 61400 standards.",
            applications: "Industry standard for modeling wind turbulence and its effect on turbine loads.",
            examples: "Wind turbulence modeling, load calculations, site-specific design adaptations.",
            parameters: [
                {
                    name: "value",
                    description: "Mean wind speed (m/s)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive, typical range 5-25 m/s",
                    default: 10
                },
                {
                    name: "turbulenceIntensity",
                    description: "Turbulence intensity (%)",
                    required: true,
                    type: "number or time series",
                    constraints: "must be positive, typical range 10-20%",
                    default: 15
                },
                {
                    name: "roughnessLength",
                    description: "Surface roughness length (m)",
                    required: false,
                    type: "number or time series",
                    constraints: "must be non-negative",
                    default: 0.03
                },
                {
                    name: "scale",
                    description: "Kaimal scale parameter",
                    required: false,
                    type: "number or time series",
                    constraints: "must be positive",
                    default: 8.1
                }
            ],
            examples: [
                {
                    description: "Class A site (high turbulence)",
                    parameters: { value: 10, turbulenceIntensity: 16, roughnessLength: 0.05, scale: 8.1 }
                },
                {
                    description: "Class B site (medium turbulence)",
                    parameters: { value: 10, turbulenceIntensity: 14, roughnessLength: 0.03, scale: 8.1 }
                },
                {
                    description: "Class C site (low turbulence)",
                    parameters: { value: 10, turbulenceIntensity: 12, roughnessLength: 0.01, scale: 8.1 }
                }
            ]
        };
    }

    /**
     * Fit Kaimal distribution to data points
     * Estimates wind speed and turbulence intensity from data
     * 
     * @param {Array} dataPoints - Data points to fit to
     * @returns {Object} Fitted parameters
     */
    static fitCurve(dataPoints) {
        if (!dataPoints || dataPoints.length === 0) {
            throw new Error("Data points are required for curve fitting");
        }

        // Extract values from data points
        const values = dataPoints.map(dp => dp.value);

        // Filter out non-positive values (wind speeds must be positive)
        const positiveValues = values.filter(v => v > 0);

        if (positiveValues.length === 0) {
            throw new Error("No positive values found in data points (required for Kaimal fitting)");
        }

        // Calculate mean wind speed
        const sum = positiveValues.reduce((acc, val) => acc + val, 0);
        const meanWindSpeed = sum / positiveValues.length;

        // Calculate standard deviation for turbulence intensity
        const sumSquaredDiffs = positiveValues.reduce((acc, val) =>
            acc + Math.pow(val - meanWindSpeed, 2), 0);
        const stdDev = Math.sqrt(sumSquaredDiffs / positiveValues.length);

        // Calculate turbulence intensity as percentage
        const turbulenceIntensity = (stdDev / meanWindSpeed) * 100;

        // Default values for optional parameters
        const roughnessLength = 0.03; // Default roughness length
        const scale = 8.1; // Default Kaimal scale

        return {
            value: meanWindSpeed,
            turbulenceIntensity: Math.min(Math.max(turbulenceIntensity, 1), 30), // Keep between 1% and 30%
            roughnessLength,
            scale
        };
    }
}

module.exports = KaimalDistribution;