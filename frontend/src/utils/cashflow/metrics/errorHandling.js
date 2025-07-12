// frontend/src/utils/cashflow/metrics/errorHandling.js
import { CASHFLOW_METRICS_REGISTRY } from './registry.js';

/**
 * Error codes for metric calculation failures
 */
export const METRIC_ERROR_CODES = {
    MISSING_DATA: 'MISSING_DATA',
    INVALID_DATA: 'INVALID_DATA',
    CALCULATION_FAILED: 'CALCULATION_FAILED',
    UNKNOWN_METRIC: 'UNKNOWN_METRIC',
    DEPENDENCY_ERROR: 'DEPENDENCY_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR'
};

/**
 * Create standardized error result
 * @param {string} errorCode - Error code from METRIC_ERROR_CODES
 * @param {string} message - Human-readable error message
 * @param {string} metricKey - Metric key that failed
 * @param {Object} metadata - Additional error metadata
 * @returns {Object} Standardized error result
 */
export const createErrorResult = (errorCode, message, metricKey, metadata = {}) => {
    return {
        value: null,
        error: message,
        metadata: {
            errorCode,
            calculationMethod: metricKey,
            timestamp: new Date().toISOString(),
            ...metadata
        }
    };
};

/**
 * Create fallback/default metric result
 * @param {string} metricKey - Metric key
 * @param {*} fallbackValue - Default value to use
 * @param {string} reason - Reason for using fallback
 * @returns {Object} Fallback metric result
 */
export const createFallbackResult = (metricKey, fallbackValue, reason) => {
    const config = CASHFLOW_METRICS_REGISTRY[metricKey];

    return {
        value: fallbackValue,
        error: null,
        metadata: {
            calculationMethod: metricKey,
            fallbackUsed: true,
            fallbackReason: reason,
            displayNote: `Using default value: ${reason}`,
            aggregationMethod: config?.cubeConfig?.aggregation?.method || 'unknown'
        }
    };
};

/**
 * Validate metric input data
 * @param {Object} input - Metric input object
 * @param {string} metricKey - Metric key for context
 * @returns {Object} Validation result { isValid, errors }
 */
export const validateMetricInput = (input, metricKey) => {
    const errors = [];

    // Basic input structure validation
    if (!input || typeof input !== 'object') {
        errors.push('Input must be an object');
        return { isValid: false, errors };
    }

    // Check for required cashflow data
    if (!input.cashflowData && !input.aggregations) {
        errors.push('Either cashflowData or aggregations must be provided');
    }

    // Check cashflow data structure if provided
    if (input.cashflowData) {
        if (typeof input.cashflowData !== 'object') {
            errors.push('cashflowData must be an object');
        } else {
            // Check for required aggregations
            const requiredAggregations = ['totalCosts', 'totalRevenue', 'netCashflow'];
            const hasAggregations = input.cashflowData.aggregations;

            if (!hasAggregations) {
                errors.push('cashflowData must contain aggregations');
            } else {
                requiredAggregations.forEach(key => {
                    if (!hasAggregations[key] || !hasAggregations[key].data) {
                        errors.push(`Missing required aggregation: ${key}`);
                    }
                });
            }
        }
    }

    // Metric-specific validation
    const config = CASHFLOW_METRICS_REGISTRY[metricKey];
    if (config && config.cubeConfig && config.cubeConfig.dependsOn) {
        const dependencies = config.cubeConfig.dependsOn;
        const availableData = input.aggregations ||
            (input.cashflowData && input.cashflowData.aggregations) || {};

        dependencies.forEach(dep => {
            if (!availableData[dep]) {
                errors.push(`Missing dependency data: ${dep}`);
            }
        });
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Handle metric calculation errors with graceful degradation
 * @param {Error} error - Original error
 * @param {string} metricKey - Metric key that failed
 * @param {Object} input - Original input data
 * @returns {Object} Error result with fallback handling
 */
export const handleMetricError = (error, metricKey, input) => {
    console.warn(`Metric calculation failed for ${metricKey}:`, error.message);

    // Log additional context in development
    if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Metric Error: ${metricKey}`);
        console.log('Error:', error);
        console.log('Input structure:', {
            hasCashflowData: !!input.cashflowData,
            hasAggregations: !!input.aggregations,
            hasScenarioData: !!input.scenarioData
        });
        console.groupEnd();
    }

    // Determine error type and appropriate response
    if (error.message.includes('Missing') || error.message.includes('No ')) {
        return createErrorResult(
            METRIC_ERROR_CODES.MISSING_DATA,
            error.message,
            metricKey,
            { originalError: error.message }
        );
    }

    if (error.message.includes('Invalid') || error.message.includes('not ')) {
        return createErrorResult(
            METRIC_ERROR_CODES.INVALID_DATA,
            error.message,
            metricKey,
            { originalError: error.message }
        );
    }

    // Generic calculation failure
    return createErrorResult(
        METRIC_ERROR_CODES.CALCULATION_FAILED,
        `Failed to calculate ${metricKey}: ${error.message}`,
        metricKey,
        { originalError: error.message }
    );
};

/**
 * Validate time series data format
 * @param {Array} data - Time series data to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
export const validateTimeSeriesData = (data, context = 'data') => {
    if (!Array.isArray(data)) {
        return {
            isValid: false,
            error: `${context} must be an array`
        };
    }

    if (data.length === 0) {
        return {
            isValid: false,
            error: `${context} cannot be empty`
        };
    }

    // Check each data point structure
    for (let i = 0; i < data.length; i++) {
        const point = data[i];

        if (!point || typeof point !== 'object') {
            return {
                isValid: false,
                error: `${context}[${i}] must be an object`
            };
        }

        if (typeof point.year !== 'number') {
            return {
                isValid: false,
                error: `${context}[${i}].year must be a number`
            };
        }

        if (typeof point.value !== 'number') {
            return {
                isValid: false,
                error: `${context}[${i}].value must be a number`
            };
        }
    }

    return { isValid: true };
};

/**
 * Safe metric calculation wrapper with error handling
 * @param {Function} calculationFunction - Metric calculation function
 * @param {Object} input - Metric input
 * @param {string} metricKey - Metric key for context
 * @returns {Object} Metric result with error handling
 */
export const safeCalculateMetric = (calculationFunction, input, metricKey) => {
    try {
        // Validate input first
        const validation = validateMetricInput(input, metricKey);
        if (!validation.isValid) {
            return createErrorResult(
                METRIC_ERROR_CODES.VALIDATION_ERROR,
                `Validation failed: ${validation.errors.join(', ')}`,
                metricKey,
                { validationErrors: validation.errors }
            );
        }

        // Execute calculation
        const result = calculationFunction(input);

        // Ensure result has proper structure
        if (!result || typeof result !== 'object') {
            return createErrorResult(
                METRIC_ERROR_CODES.CALCULATION_FAILED,
                'Calculation function returned invalid result',
                metricKey
            );
        }

        return result;

    } catch (error) {
        return handleMetricError(error, metricKey, input);
    }
};

/**
 * Log metric computation summary for debugging
 * @param {Map} results - Computed metrics results
 * @param {Object} options - Logging options
 */
export const logMetricsSummary = (results, options = {}) => {
    if (process.env.NODE_ENV !== 'development' && !options.force) {
        return;
    }

    const successful = [];
    const failed = [];
    const fallbacks = [];

    results.forEach((result, metricKey) => {
        if (result.error) {
            failed.push({ metricKey, error: result.error });
        } else if (result.metadata?.fallbackUsed) {
            fallbacks.push({ metricKey, reason: result.metadata.fallbackReason });
        } else {
            successful.push({ metricKey, value: result.value });
        }
    });

    console.group('📊 Metrics Computation Summary');
    console.log(`✅ Successful: ${successful.length}`);
    console.log(`⚠️ Fallbacks: ${fallbacks.length}`);
    console.log(`❌ Failed: ${failed.length}`);

    if (failed.length > 0) {
        console.group('❌ Failed Metrics');
        failed.forEach(({ metricKey, error }) => {
            console.log(`${metricKey}: ${error}`);
        });
        console.groupEnd();
    }

    if (fallbacks.length > 0) {
        console.group('⚠️ Fallback Metrics');
        fallbacks.forEach(({ metricKey, reason }) => {
            console.log(`${metricKey}: ${reason}`);
        });
        console.groupEnd();
    }

    console.groupEnd();
};