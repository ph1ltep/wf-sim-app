/**
 * Validate simulation settings object
 * @param {Object} settings - Simulation settings following SimSettingsSchema
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateSimulationSettings(settings) {
    const errors = [];

    if (!settings) {
        return { isValid: false, errors: ['Simulation settings are required'] };
    }

    // Validate iterations
    if (!isPositiveNumber(settings.iterations)) {
        errors.push('Iterations must be a positive number');
    } else if (settings.iterations < 100) {
        errors.push('At least 100 iterations are recommended for reliable results');
    }

    // Validate seed
    if (!isValidNumber(settings.seed, true)) {
        errors.push('Seed must be a valid number if provided');
    }

    // Validate years
    if (!isPositiveNumber(settings.years)) {
        errors.push('Years must be a positive number');
    }

    // Validate percentiles
    if (settings.percentiles) {
        if (!isValidArray(settings.percentiles, false)) {
            errors.push('Percentiles must be a non-empty array');
        } else {
            // Check each percentile configuration based on PercentileSchema
            settings.percentiles.forEach((percentile, index) => {
                if (!percentile || typeof percentile !== 'object') {
                    errors.push(`Percentile at index ${index} must be an object`);
                } else if (!isValidPercentile(percentile.value)) {
                    errors.push(`Percentile value at index ${index} must be between 0 and 100`);
                }
            });
        }
    } else {
        errors.push('Percentiles configuration is required');
    }

    // Validate fit data if provided
    if (settings.fitToData !== undefined) {
        if (!isValidTimeSeries(settings.fitToData, false, true)) {
            errors.push('fitToData must be a valid array of data points (with year and value properties)');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate distribution configuration object
 * @param {Object} distribution - Distribution configuration following DistributionTypeSchema
 * @returns {Object} Validation result with isValid flag and errors array
 */
function validateDistributionConfig(distribution) {
    const errors = [];

    if (!distribution) {
        // backend/services/monte-carlo-v2/utils/validation.js
        /**
         * Utilities for validating distribution parameters and configurations
         */

        /**
         * Validate if a value is a number
         * @param {*} value - Value to check
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidNumber(value, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }
            return typeof value === 'number' && !isNaN(value) && isFinite(value);
        }

        /**
         * Validate if a value is a positive number
         * @param {*} value - Value to check
         * @param {boolean} allowZero - Whether zero is considered valid
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isPositiveNumber(value, allowZero = false, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }
            return isValidNumber(value) && (allowZero ? value >= 0 : value > 0);
        }

        /**
         * Validate if a value is within a specific range
         * @param {*} value - Value to check
         * @param {number} min - Minimum value (inclusive)
         * @param {number} max - Maximum value (inclusive)
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isInRange(value, min, max, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }
            return isValidNumber(value) && value >= min && value <= max;
        }

        /**
         * Validate if a value is an array
         * @param {*} value - Value to check
         * @param {boolean} allowEmpty - Whether empty arrays are valid
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidArray(value, allowEmpty = true, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }
            return Array.isArray(value) && (allowEmpty || value.length > 0);
        }

        /**
         * Validate if a value is a data point object with year and value properties
         * @param {*} dataPoint - Object to check
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidDataPoint(dataPoint) {
            return (
                dataPoint !== null &&
                typeof dataPoint === 'object' &&
                isValidNumber(dataPoint.year) &&
                isValidNumber(dataPoint.value)
            );
        }

        /**
         * Validate if a value is a time series (array of data points)
         * @param {*} value - Value to check
         * @param {boolean} allowEmpty - Whether empty arrays are valid
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidTimeSeries(value, allowEmpty = true, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }

            return (
                isValidArray(value, allowEmpty) &&
                value.every(dataPoint => isValidDataPoint(dataPoint))
            );
        }

        /**
         * Validate if a value is a valid parameter (either a number or a time series)
         * @param {*} value - Value to check
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidParameter(value, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }

            return isValidNumber(value) || isValidTimeSeries(value);
        }

        /**
         * Validate if a value is a valid probability (number between 0 and 1)
         * @param {*} value - Value to check
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidProbability(value, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }

            return isInRange(value, 0, 1);
        }

        /**
         * Validate if a value is a valid percentile (number between 0 and 100)
         * @param {*} value - Value to check
         * @param {boolean} allowUndefined - Whether undefined values are allowed
         * @returns {boolean} True if valid, false otherwise
         */
        function isValidPercentile(value, allowUndefined = false) {
            if (value === undefined && allowUndefined) {
                return true;
            }

            return isInRange(value, 0, 100);
        }

        /**
         * Validate simulation settings object
         * @param {Object} settings - Simulation settings following SimSettingsSchema
         * @returns {Object} Validation result with isValid flag and errors array
         */
        function validateSimulationSettings(settings) {
            const errors = [];

            if (!settings) {
                return { isValid: false, errors: ['Simulation settings are required'] };
            }

            // Validate iterations
            if (!isPositiveNumber(settings.iterations)) {
                errors.push('Iterations must be a positive number');
            } else if (settings.iterations < 100) {
                errors.push('At least 100 iterations are recommended for reliable results');
            }

            // Validate seed
            if (!isValidNumber(settings.seed, true)) {
                errors.push('Seed must be a valid number if provided');
            }

            // Validate years
            if (!isPositiveNumber(settings.years)) {
                errors.push('Years must be a positive number');
            }

            // Validate percentiles
            if (settings.percentiles) {
                if (!isValidArray(settings.percentiles, false)) {
                    errors.push('Percentiles must be a non-empty array');
                } else {
                    // Check each percentile configuration based on PercentileSchema
                    settings.percentiles.forEach((percentile, index) => {
                        if (!percentile || typeof percentile !== 'object') {
                            errors.push(`Percentile at index ${index} must be an object`);
                        } else if (!isValidPercentile(percentile.value)) {
                            errors.push(`Percentile value at index ${index} must be between 0 and 100`);
                        }
                    });
                }
            } else {
                errors.push('Percentiles configuration is required');
            }

            // Validate fit data if provided
            if (settings.fitToData !== undefined) {
                if (!isValidTimeSeries(settings.fitToData, false, true)) {
                    errors.push('fitToData must be a valid array of data points (with year and value properties)');
                }
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        }

        /**
         * Validate distribution configuration object
         * @param {Object} distribution - Distribution configuration following DistributionTypeSchema
         * @returns {Object} Validation result with isValid flag and errors array
         */
        function validateDistributionConfig(distribution) {
            const errors = [];

            if (!distribution) {
                return { isValid: false, errors: ['Distribution configuration is required'] };
            }

            // Validate type
            if (!distribution.type || typeof distribution.type !== 'string') {
                errors.push('Distribution type is required and must be a string');
            }

            // Validate parameters
            if (!distribution.parameters || typeof distribution.parameters !== 'object') {
                errors.push('Distribution parameters are required and must be an object');
            }

            // Validate timeSeriesMode flag if present
            if (distribution.timeSeriesMode !== undefined && typeof distribution.timeSeriesMode !== 'boolean') {
                errors.push('timeSeriesMode must be a boolean value');
            }

            return {
                isValid: errors.length === 0,
                errors
            };
        }
        return { isValid: false, errors: ['Distribution configuration is required'] };
    }

    // Validate type
    if (!distribution.type || typeof distribution.type !== 'string') {
        errors.push('Distribution type is required and must be a string');
    }

    // Validate parameters
    if (!distribution.parameters || typeof distribution.parameters !== 'object') {
        errors.push('Distribution parameters are required and must be an object');
    }

    // Validate timeSeriesMode flag if present
    if (distribution.timeSeriesMode !== undefined && typeof distribution.timeSeriesMode !== 'boolean') {
        errors.push('timeSeriesMode must be a boolean value');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    isValidNumber,
    isPositiveNumber,
    isInRange,
    isValidArray,
    isValidDataPoint,
    isValidTimeSeries,
    isValidParameter,
    isValidProbability,
    isValidPercentile,
    validateSimulationSettings,
    validateDistributionConfig
};