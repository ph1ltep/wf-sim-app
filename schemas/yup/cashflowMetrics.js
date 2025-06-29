// schemas/yup/cashflowMetrics.js
const Yup = require('yup');

/**
 * Individual metric calculation result
 * Used by: All metric calculate() functions, final metric values
 * Contains: Single computed value with formatting and calculation metadata
 */
const MetricResultSchema = Yup.object().shape({
    value: Yup.mixed().nullable(),
    formatted: Yup.string().required(),
    error: Yup.string().nullable(),
    metadata: Yup.object().shape({
        calculationMethod: Yup.string().required(),
        percentile: Yup.number().optional(),
        inputSources: Yup.array().of(Yup.string()).optional(),
        computationTime: Yup.number().optional(),
        lineItems: Yup.array().optional()
    }).required()
});

/**
 * Single entry in metric's percentile collection: [percentileKey, MetricResult]
 * Used by: MetricPercentileCollectionSchema entries
 * Contains: One percentile result for one metric (e.g., ['p50', dscrResult] or ['perSource', dscrResult])
 * Structure: [string, MetricResult] where string can be 'p25', 'p67', 'perSource', etc.
 */
const MetricPercentileEntrySchema = Yup.array().of(Yup.mixed()).length(2).test(
    'valid-percentile-entry',
    'Must be [percentileKey, MetricResult] format',
    function (value) {
        if (!Array.isArray(value) || value.length !== 2) return false;
        const [key, result] = value;
        return typeof key === 'string' && MetricResultSchema.isValidSync(result);
    }
);

/**
 * All percentile results for a single metric (dynamic percentiles + perSource)
 * Used by: Single metric storage in AllMetricsDataSchema
 * Contains: Collection of all computed percentiles for one metric
 * Structure: [['p10', result], ['p25', result], ['p50', result], ['perSource', result], ...]
 */
const MetricPercentileCollectionSchema = Yup.array().of(MetricPercentileEntrySchema);

/**
 * Complete metrics data - all metrics with all their percentile collections
 * Used by: CashflowContext storage, main computed metrics state
 * Contains: Map structure as array of [metricKey, MetricPercentileCollectionSchema] pairs
 * Structure: [['dscr', [[percentiles]]], ['npv', [[percentiles]]], ['netCashflow', [[percentiles]]], ...]
 */
const AllMetricsDataSchema = Yup.array().of(
    Yup.array().of(Yup.mixed()).length(2).test(
        'valid-metric-entry',
        'Must be [metricKey, MetricPercentileCollectionSchema] format',
        function (value) {
            if (!Array.isArray(value) || value.length !== 2) return false;
            const [key, collection] = value;
            return typeof key === 'string' && MetricPercentileCollectionSchema.isValidSync(collection);
        }
    )
);

/**
 * Single percentile slice across all metrics
 * Used by: getSelectedPercentileData() output, percentile-specific views
 * Contains: One percentile's results across all available metrics
 * Structure: [['dscr', MetricResult], ['npv', MetricResult], ['netCashflow', MetricResult], ...]
 */
const PercentileSliceDataSchema = Yup.array().of(
    Yup.array().of(Yup.mixed()).length(2).test(
        'valid-metric-result-pair',
        'Must be [metricKey, MetricResult] format',
        function (value) {
            if (!Array.isArray(value) || value.length !== 2) return false;
            const [key, result] = value;
            return typeof key === 'string' && MetricResultSchema.isValidSync(result);
        }
    )
);

/**
 * Threshold definition for metric evaluation
 * Used by: MetricConfigSchema, threshold evaluation functions
 * Contains: Dynamic threshold rules with priority and styling
 */
const ThresholdDefinitionSchema = Yup.object().shape({
    field: Yup.string().optional(),
    comparison: Yup.string().required(),
    value: Yup.number().optional(),
    colorRule: Yup.mixed().required(), // Function
    priority: Yup.number().required(),
    description: Yup.string().required()
});

/**
 * Aggregation strategy configuration for metrics
 * Used by: MetricConfigSchema, cubeConfig definitions
 * Contains: Method and flexible options for time-series aggregation
 */
const AggregationStrategySchema = Yup.object().shape({
    method: Yup.string().required(),
    options: Yup.object().optional()
});

/**
 * Complete metric configuration in registry
 * Used by: Registry validation, metric discovery functions
 * Contains: All metric definition including functions, metadata, dependencies
 */
const MetricConfigSchema = Yup.object().shape({
    // Functions - validated at runtime, not by Yup
    calculate: Yup.mixed().required(),
    format: Yup.mixed().required(),
    formatImpact: Yup.mixed().required(),

    // Arrays and objects
    thresholds: Yup.array().of(ThresholdDefinitionSchema).default([]),
    dependsOn: Yup.array().of(Yup.string()).default([]),

    // Metadata
    metadata: Yup.object().shape({
        name: Yup.string().required(),
        shortName: Yup.string().required(),
        description: Yup.string().required(),
        units: Yup.string().required(),
        displayUnits: Yup.string().required(),
        windIndustryStandard: Yup.boolean().default(true),
        calculationComplexity: Yup.string().default('medium')
    }).required(),

    // Categorization
    category: Yup.string().required(),
    usage: Yup.array().of(Yup.string()).min(1).required(),
    priority: Yup.number().required(),

    // Strategy configuration
    inputStrategy: Yup.string().optional(),
    cubeConfig: Yup.object().shape({
        aggregation: AggregationStrategySchema.optional(),
        timeSeriesRequired: Yup.boolean().optional(),
        percentileDependent: Yup.boolean().optional(),
        aggregatesTo: Yup.string().optional()
    }).optional()
});

/**
 * Single metric entry in foundational registry: [metricKey, MetricConfig]
 * Used by: FoundationalMetricsRegistrySchema entries
 * Contains: One foundational metric configuration pair
 * Structure: [string, MetricConfig] where MetricConfig.category === 'foundational'
 */
const FoundationalMetricEntrySchema = Yup.array().of(Yup.mixed()).length(2).test(
    'valid-foundational-entry',
    'Must be [metricKey, foundational MetricConfig] format',
    function (value) {
        if (!Array.isArray(value) || value.length !== 2) return false;
        const [key, config] = value;
        return typeof key === 'string' &&
            MetricConfigSchema.isValidSync(config) &&
            config.category === 'foundational';
    }
);

/**
 * Single metric entry in analytical registry: [metricKey, MetricConfig]  
 * Used by: AnalyticalMetricsRegistrySchema entries
 * Contains: One analytical metric configuration pair
 * Structure: [string, MetricConfig] where MetricConfig.category !== 'foundational'
 */
const AnalyticalMetricEntrySchema = Yup.array().of(Yup.mixed()).length(2).test(
    'valid-analytical-entry',
    'Must be [metricKey, analytical MetricConfig] format',
    function (value) {
        if (!Array.isArray(value) || value.length !== 2) return false;
        const [key, config] = value;
        return typeof key === 'string' &&
            MetricConfigSchema.isValidSync(config) &&
            config.category !== 'foundational';
    }
);

/**
 * Foundational metrics registry - Tier 1 cashflow table components
 * Used by: Registry loading, foundational metrics computation (Phase 1)
 * Contains: All foundational metrics that produce reusable data sources
 * Structure: Array of FoundationalMetricEntrySchema pairs
 */
const FoundationalMetricsRegistrySchema = Yup.array().of(FoundationalMetricEntrySchema);

/**
 * Analytical metrics registry - Tier 2 any transformations
 * Used by: Registry loading, analytical metrics computation (Phase 2)
 * Contains: All analytical metrics that consume foundational metrics or raw data
 * Structure: Array of AnalyticalMetricEntrySchema pairs
 */
const AnalyticalMetricsRegistrySchema = Yup.array().of(AnalyticalMetricEntrySchema);

/**
 * Complete unified metrics registry - both tiers combined
 * Used by: getMetricsByUsage(), metric discovery, complete system access
 * Contains: All metrics from both foundational and analytical registries
 * Structure: Array of [metricKey, MetricConfig] pairs from both tiers
 */
const UnifiedMetricsRegistrySchema = Yup.array().of(
    Yup.array().of(Yup.mixed()).length(2).test(
        'valid-unified-entry',
        'Must be [metricKey, MetricConfig] format',
        function (value) {
            if (!Array.isArray(value) || value.length !== 2) return false;
            const [key, config] = value;
            return typeof key === 'string' && MetricConfigSchema.isValidSync(config);
        }
    )
);

/**
 * Percentile selection from PercentileSelector component
 * Used by: CashflowContext, percentile processing functions
 * Contains: Current percentile selection strategy and values
 */
const PercentileSelectionSchema = Yup.object().shape({
    strategy: Yup.string().required(),
    unified: Yup.number().required(),
    perSource: Yup.object().default({})
});

/**
 * Backward-compatible cashflow data structure for cards
 * Used by: Card components input, legacy compatibility layer
 * Contains: Transformed percentile data in structure existing cards expect
 */
const CashflowDataSchema = Yup.object().shape({
    sources: Yup.object().optional(),
    totals: Yup.array().of(
        Yup.array().of(Yup.mixed()).length(2)
    ).optional(),
    metadata: Yup.object().shape({
        selectedPercentiles: PercentileSelectionSchema.optional(),
        percentileKey: Yup.string().required(), // e.g., 'p50' or 'perSource'
        availablePercentiles: Yup.array().of(Yup.number()).default([10, 25, 50, 75, 90]),
        isPerSource: Yup.boolean().default(false)
    }).required()
});

/**
 * Input structure for metric calculate() functions
 * Used by: All metric calculate() functions, metric computation pipeline
 * Contains: Data and context needed for metric calculations
 */
const MetricInputSchema = Yup.object().shape({
    rawData: Yup.object().shape({
        sources: Yup.object().optional(),
        totals: Yup.object().optional()
    }).optional(),
    foundationalMetrics: Yup.object().optional(),
    scenarioData: Yup.object().optional(),
    percentile: Yup.number().optional(),
    options: Yup.object().optional()
});

module.exports = {
    // Core metric data structures
    MetricResultSchema,
    MetricPercentileEntrySchema,
    MetricPercentileCollectionSchema,
    AllMetricsDataSchema,
    PercentileSliceDataSchema,

    // Registry structures (2-tier system)
    MetricConfigSchema,
    FoundationalMetricEntrySchema,
    AnalyticalMetricEntrySchema,
    FoundationalMetricsRegistrySchema,
    AnalyticalMetricsRegistrySchema,
    UnifiedMetricsRegistrySchema,

    // Supporting schemas
    ThresholdDefinitionSchema,
    AggregationStrategySchema,
    PercentileSelectionSchema,
    CashflowDataSchema,
    MetricInputSchema
};