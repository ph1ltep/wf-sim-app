// schemas/yup/cashflowMetrics.js
const Yup = require('yup');

/**
 * Individual metric calculation result
 * Used by: All metric calculate() functions, foundational and analytical results
 * Contains: Single computed value with pre-computed display value and metadata
 */
const MetricResultSchema = Yup.object().shape({
    value: Yup.mixed().nullable(),
    displayValue: Yup.string().required(), // Pre-computed formatted display value
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
 * Contains: One percentile result for one metric
 */
const MetricPercentileEntrySchema = Yup.array().of(Yup.mixed()).length(2);

/**
 * All percentile results for a single metric
 * Used by: Single metric storage in AllMetricsDataSchema
 * Contains: Collection of all computed percentiles for one metric
 */
const MetricPercentileCollectionSchema = Yup.array().of(MetricPercentileEntrySchema);

/**
 * Complete metrics data - all percentiles with all metrics within each
 * Used by: CashflowContext storage, main computed metrics state
 * Contains: Object with percentile keys, each containing all metric results
 */
const AllMetricsDataSchema = Yup.object();

/**
 * Single percentile slice across all metrics
 * Used by: getSelectedPercentileData() output, percentile-specific views
 * Contains: One percentile's results across all available metrics
 */
const PercentileSliceDataSchema = Yup.array().of(
    Yup.array().of(Yup.mixed()).length(2)
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
 * Contains: Method and options for time-series aggregation
 * Options format: { filter?: 'all'|'operational'|'construction', precision?: number, discountRate?: number }
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
    // Functions - no validation needed
    calculate: Yup.mixed().required(),
    format: Yup.mixed().required(), // Same as formatter - will be unified later

    // Configuration
    thresholds: Yup.array().of(ThresholdDefinitionSchema).default([]),
    dependsOn: Yup.array().of(Yup.string()).default([]),
    
    // Metadata
    metadata: Yup.object().required(),
    category: Yup.string().required(), // UI grouping: revenue, cost, financing, financial, risk, etc.
    usage: Yup.array().of(Yup.string()).default([]),
    priority: Yup.number().required(),
    type: Yup.string().oneOf(['foundational', 'analytical']).required(),
    
    // Cube configuration
    cubeConfig: Yup.object().optional(),
    
    // Aggregation strategy for time-series processing
    aggregation: AggregationStrategySchema.optional()
});

/**
 * Single entry in metrics registry: [metricKey, MetricConfig]
 * Used by: Building registry schemas, metric discovery
 * Contains: Registry entry for either foundational or analytical metric
 */
const MetricConfigEntrySchema = Yup.array().of(Yup.mixed()).length(2);

/**
 * Metrics registry
 * Used by: Complete metric system, unified registry access
 * Contains: All foundational and analytical metrics in single registry
 */
const MetricsRegistrySchema = Yup.array().of(MetricConfigEntrySchema);

/**
 * Percentile selection configuration
 * Used by: CashflowContext, percentile switching logic
 * Contains: Current percentile strategy and selections
 */
const PercentileSelectionSchema = Yup.object().shape({
    strategy: Yup.string().oneOf(['unified', 'perSource']).required(),
    unified: Yup.number().required(),
    perSource: Yup.object().default({})
});

/**
 * Input structure for metric calculate() functions
 * Used by: All metric calculate() functions, metric computation pipeline
 * Contains: Data and context needed for metric calculations
 */
const MetricInputSchema = Yup.object().shape({
    rawData: Yup.object().optional(),
    foundationalMetrics: Yup.object().optional(),
    scenarioData: Yup.object().optional(),
    percentile: Yup.number().optional(),
    options: Yup.object().optional()
});

// === CUBE SCHEMAS ===

/**
 * Sensitivity cube metadata
 * Used by: Cube initialization and diagnostics
 * Contains: Complete cube dimensions, metrics, and computation statistics
 */
const CubeMetadataSchema = Yup.object().shape({
    dimensions: Yup.object().shape({
        percentiles: Yup.array().of(Yup.number()).required(),
        metrics: Yup.array().of(Yup.string()).required(),
        yearRange: Yup.object().shape({
            first: Yup.number().required(),
            last: Yup.number().required(),
            count: Yup.number().required()
        }).required()
    }).required(),
    computationTime: Yup.number().optional(),
    memoryUsage: Yup.number().optional(),
    lastUpdated: Yup.date().optional()
});

/**
 * Sensitivity analysis result for single metric
 * Used by: calculateSingleMetricSensitivity() output, DriverExplorerCard tornado charts
 * Contains: Complete sensitivity impact calculation for one metric
 */
const CubeSensitivityResultSchema = Yup.object().shape({
    metricKey: Yup.string().required(),
    impact: Yup.object().shape({
        absolute: Yup.number().required(),      // Absolute difference (upper - lower)
        percentage: Yup.number().required(),    // Percentage change ((upper - lower) / lower * 100)
        normalized: Yup.number().required()     // Normalized impact for comparison across metrics
    }).required(),
    values: Yup.object().shape({
        lower: Yup.number().required(),         // Value at lower percentile
        upper: Yup.number().required(),         // Value at upper percentile
        baseline: Yup.number().required()       // Baseline value (typically p50)
    }).required(),
    percentileRange: Yup.object().shape({
        lower: Yup.number().required(),         // Lower percentile used (e.g., 25)
        upper: Yup.number().required()          // Upper percentile used (e.g., 75)
    }).required(),
    displayValues: Yup.object().shape({
        lower: Yup.string().required(),         // Formatted lower value
        upper: Yup.string().required(),         // Formatted upper value
        impact: Yup.string().required()         // Formatted impact value
    }).required()
});

/**
 * Sensitivity cube structure
 * Used by: Cube storage and sensitivity analysis functions
 * Contains: Multi-dimensional data structure for time-series analysis
 */
const MetricsCubeSchema = Yup.object().shape({
    data: Yup.object().required(), // Internal cube data structure
    metadata: CubeMetadataSchema.required()
});

module.exports = {
    // Core metric data structures
    MetricResultSchema,
    MetricPercentileEntrySchema,
    MetricPercentileCollectionSchema,
    AllMetricsDataSchema,
    PercentileSliceDataSchema,

    // Registry structures
    MetricConfigSchema,
    MetricConfigEntrySchema,
    MetricsRegistrySchema,

    // Supporting schemas
    ThresholdDefinitionSchema,
    AggregationStrategySchema,
    PercentileSelectionSchema,
    MetricInputSchema,
    
    // Cube schemas
    CubeMetadataSchema,
    CubeSensitivityResultSchema,
    MetricsCubeSchema
};