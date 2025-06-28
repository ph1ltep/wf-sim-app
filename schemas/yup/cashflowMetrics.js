// schemas/yup/cashflowMetrics.js
const Yup = require('yup');

/**
 * Schema for metric calculation results
 */
const MetricResultSchema = Yup.object().shape({
    value: Yup.mixed().nullable().required('Value is required (can be null)'),
    error: Yup.string().nullable().optional(),
    metadata: Yup.object().shape({
        calculationMethod: Yup.string().required('Calculation method is required'),
        aggregationMethod: Yup.string().optional(),
        inputSources: Yup.array().of(Yup.string()).optional(),
        computationTime: Yup.number().optional(),
        hasData: Yup.boolean().optional(),
        fallbackUsed: Yup.boolean().optional(),
        fallbackReason: Yup.string().optional(),
        errorCode: Yup.string().optional(),
        timestamp: Yup.string().optional()
    }).required('Metadata is required')
});

/**
 * Schema for aggregation strategy configuration
 */
const AggregationStrategySchema = Yup.object().shape({
    method: Yup.string()
        .oneOf(['sum', 'npv', 'mean', 'min', 'max', 'first', 'last', 'weighted_mean'])
        .required('Aggregation method is required'),
    options: Yup.object().shape({
        filter: Yup.string()
            .oneOf(['all', 'operational', 'construction', 'early', 'late'])
            .optional(),
        discountRate: Yup.mixed().optional(), // Can be number, 'auto', or 'irr_solve'
        weights: Yup.array().of(Yup.number()).optional(),
        precision: Yup.number().min(0).max(6).optional()
    }).optional()
});

/**
 * Schema for cube metadata (future implementation)
 */
const CubeMetadataSchema = Yup.object().shape({
    timeSeriesRequired: Yup.boolean().required('Time series flag is required'),
    percentileDependent: Yup.boolean().required('Percentile dependent flag is required'),
    aggregatesTo: Yup.string()
        .oneOf(['single_value', 'time_series', 'complex_object'])
        .required('Aggregation target is required')
});

/**
 * Schema for threshold configuration
 */
const ThresholdSchema = Yup.object().shape({
    excellent: Yup.number().required('Excellent threshold is required'),
    good: Yup.number().required('Good threshold is required'),
    acceptable: Yup.number().required('Acceptable threshold is required'),
    poor: Yup.number().required('Poor threshold is required')
}).test(
    'threshold-order',
    'Thresholds must be in logical order',
    function (value) {
        if (!value) return false;

        // For metrics where lower is better (like LCOE, payback period)
        // we'll validate based on context in actual usage
        return true;
    }
);

/**
 * Schema for metric metadata
 */
const MetricMetadataSchema = Yup.object().shape({
    displayName: Yup.string().required('Display name is required'),
    displayUnits: Yup.string().required('Display units are required'),
    description: Yup.string().required('Description is required'),
    calculationMethod: Yup.string().required('Calculation method is required')
});

/**
 * Schema for individual metric configuration
 */
const MetricConfigSchema = Yup.object().shape({
    calculate: Yup.mixed().required('Calculate function is required'),
    format: Yup.mixed().required('Format function is required'),
    formatImpact: Yup.mixed().required('Format impact function is required'),
    thresholds: ThresholdSchema.required('Thresholds are required'),
    evaluateThreshold: Yup.mixed().required('Evaluate threshold function is required'),
    metadata: MetricMetadataSchema.required('Metadata is required'),
    category: Yup.string()
        .oneOf(['financial', 'risk', 'operational'])
        .required('Category is required'),
    usage: Yup.array()
        .of(Yup.string().oneOf(['financeability', 'sensitivity', 'comparative']))
        .min(1, 'At least one usage type is required')
        .required('Usage types are required'),
    priority: Yup.number().min(1).required('Priority is required'),
    cubeConfig: Yup.object().shape({
        aggregation: AggregationStrategySchema.optional(),
        dependsOn: Yup.array().of(Yup.string()).required('Dependencies are required'),
        preCompute: Yup.boolean().required('Pre-compute flag is required'),
        sensitivityRelevant: Yup.boolean().required('Sensitivity relevance flag is required'),
        cubeMetadata: CubeMetadataSchema.required('Cube metadata is required')
    }).required('Cube configuration is required')
});

/**
 * Schema for the complete cashflow metrics registry
 */
const CashflowMetricsRegistrySchema = Yup.object().test(
    'metrics-registry',
    'Must be a valid metrics registry',
    function (value) {
        if (!value || typeof value !== 'object') {
            return this.createError({
                message: 'Registry must be an object'
            });
        }

        const entries = Object.entries(value);
        if (entries.length === 0) {
            return this.createError({
                message: 'Registry cannot be empty'
            });
        }

        // Validate each metric configuration
        for (const [key, config] of entries) {
            if (typeof key !== 'string' || key.length === 0) {
                return this.createError({
                    message: `Invalid metric key: ${key}`
                });
            }

            try {
                MetricConfigSchema.validateSync(config);
            } catch (error) {
                return this.createError({
                    message: `Invalid configuration for metric '${key}': ${error.message}`
                });
            }
        }

        return true;
    }
);

/**
 * Schema for metric computation input
 */
const MetricInputSchema = Yup.object().shape({
    cashflowData: Yup.object().optional(),
    aggregations: Yup.object().optional(),
    scenarioData: Yup.object().optional(),
    options: Yup.object().shape({
        discountRate: Yup.number().optional(),
        precision: Yup.number().min(0).max(6).optional(),
        currency: Yup.string().optional()
    }).optional()
}).test(
    'has-data-source',
    'Either cashflowData or aggregations must be provided',
    function (value) {
        if (!value) return false;
        return !!(value.cashflowData || value.aggregations);
    }
);

/**
 * Schema for computed metrics map (used in CashflowContext)
 */
const ComputedMetricsSchema = Yup.mixed().test(
    'computed-metrics-map',
    'Must be a Map with metric results',
    function (value) {
        if (!(value instanceof Map)) {
            return this.createError({
                message: 'Computed metrics must be a Map'
            });
        }

        // Validate each metric result in the map
        for (const [key, result] of value.entries()) {
            if (typeof key !== 'string') {
                return this.createError({
                    message: `Metric key must be string, got: ${typeof key}`
                });
            }

            try {
                MetricResultSchema.validateSync(result);
            } catch (error) {
                return this.createError({
                    message: `Invalid result for metric '${key}': ${error.message}`
                });
            }
        }

        return true;
    }
);

/**
 * Validation helper functions
 */

/**
 * Validate metric result structure
 * @param {Object} result - Metric result to validate
 * @param {string} metricKey - Metric key for context
 * @returns {Promise<Object>} Validation result
 */
const validateMetricResult = async (result, metricKey = 'unknown') => {
    try {
        const validated = await MetricResultSchema.validate(result);
        return { isValid: true, result: validated };
    } catch (error) {
        console.warn(`Metric result validation failed for ${metricKey}:`, error.message);
        return {
            isValid: false,
            error: error.message,
            errors: error.errors || [error.message]
        };
    }
};

/**
 * Validate entire metrics registry
 * @param {Object} registry - Registry to validate
 * @returns {Promise<Object>} Validation result
 */
const validateCashflowMetricsRegistry = async (registry) => {
    try {
        const validated = await CashflowMetricsRegistrySchema.validate(registry);
        return { isValid: true, registry: validated };
    } catch (error) {
        console.error('Cashflow metrics registry validation failed:', error.message);
        return {
            isValid: false,
            error: error.message,
            errors: error.errors || [error.message]
        };
    }
};

/**
 * Validate metric input
 * @param {Object} input - Input to validate
 * @returns {Promise<Object>} Validation result
 */
const validateMetricInput = async (input) => {
    try {
        const validated = await MetricInputSchema.validate(input);
        return { isValid: true, input: validated };
    } catch (error) {
        return {
            isValid: false,
            error: error.message,
            errors: error.errors || [error.message]
        };
    }
};

module.exports = {
    // Schemas
    MetricResultSchema,
    AggregationStrategySchema,
    CubeMetadataSchema,
    ThresholdSchema,
    MetricMetadataSchema,
    MetricConfigSchema,
    CashflowMetricsRegistrySchema,
    MetricInputSchema,
    ComputedMetricsSchema,

    // Validation functions
    validateMetricResult,
    validateCashflowMetricsRegistry,
    validateMetricInput
};