
const Yup = require('yup');
const { DataPointSchema, SimResultsSchema, PercentileSchema } = require('./distribution');


//note: sources with no multipliers are independent variables/sources. Need to process independents first so they can be referenced by others.


//PHASE 1 - computeSourceData(sourceRegistry as CubeSourceRegistrySchema, availablePercentiles, getValueByPath)
//1: load CubeSourceRegistrySchema with CASHFLOW_SOURCE_REGISTRY
// 1a: for each .references (type CubeReferenceRegistryItemSchema), use getValueByPath and store in CubeReferenceDataSchema key/value array into globalReferences.
//2: create empty array of CubeSourceDataSchema called processedData
//3: for each .sources (CubeSourceRegistryItemSchema), getValueByPath on path into sourceData. Need to do this in stages based on .metadata.type and ordered by priority. 1st direct, 2nd indirect, 3rd virtual. 
// 3a: validate item based on .metadata.type. If direct, must have .path and cannot have multipliers. if indirect, must have .path and multipliers. If virtual, cannot have path, must have transformer.
// 3b: get .references like in step 1a into localReferences.   
// 3c: combine globalReferences and localReferences into allReferences
// 3d: apply transformer. pass sourceData, hasPercentiles, availablePercentiles, allReferences, processedData. Return into transformedData (type array of SimResultSchema). if sourceData is not SimResultsSchema array and no transformer, convert sourceData into SimResultSchema array (with help of availablePercentiles) and store as transformedData
//   : note: transformer function may receive sourceData as a single value or SimResultSchema array, but must always output a SimResultsSchema array (if scalar, the same value needs to be applied to every year. (might need a function to expand single value into compliant array with all availablePercentiles. we use same function in cases where single value sourceData and no transformer)
//   : note: if return of apply transformer function is still not an array of SimResultSchema, then we need to transform it into one before setting transformedData.
// 3e: apply multipliers. pass transformedData (which is an array of SimResultsSchema), .multipliers array, allReferences, and processedData.
//   : note: must support multiplier=["multiply: value × multiplier"], ["compound: value × (1 + rate)^years"], ["simple: value × (1 + rate × years)"]
//   : note: multiplier id may be in processedData or allReferences. In case 
//   : note: returns a CubeSourceDataSchema with percentileSource and audit objects, into multipliedData. if no multipliers, we build multipliedData as CubeSourceDataSchema
// 3f: add .metadata to multipliedData object. set id = .id
// 3g: add completed multipliedData object to processedData array, then next loop.
//4: store processedData in CashflowContext as cashflowData

//PHASE 2 - cashflowData optimized query functions (ideally one customizable function that the others wrap to simplify calling)
//1: getDataByPercentile(percentileKey) returns single item from cashflowData in CubeSourceDataSchema format
//2: getDataBySourceId(sourceId) returns a single CubeSourceDataSchema for a matching .id item in cashflowData
//3: getDataByCategory(category)
//4: getDataByCashflowGroup
//4: getData(percentileKey, sourceId) returns a single SimResultsSchema from cashflowData by filtering based on .id and .percentileData.percentile.value

//transformer should get processedData so it can do summations. 

// need to pass selectedPercentiles to computeSourceData

// adds data references that can be used in multipliers, transformers, formatters. takes path string array.

// SOURCE DATA SCHEMAS

const CubeReferenceRegistryItemSchema = Yup.object().shape({ // global references. available to all item's transformers/multipliers
    id: Yup.string().required('reference id is required'),
    path: Yup.array().of(Yup.string()).required('reference path is required')
});

const CubeSourceMetadataSchema = Yup.object().shape({
    name: Yup.string().optional(),
    type: Yup.string().oneOf(['direct', 'indirect', 'virtual']).default('direct'),
    visualGroup: Yup.string().default('other').required('Visual group is required'),
    cashflowType: Yup.string()
        .oneOf(['inflow', 'outflow', 'none'])
        .default('none')
        .required('Cash flow type is required'),
    accountingClass: Yup.string()
        .oneOf(['devex', 'capex', 'opex', 'financing_cost', 'decommissioning', 'revenue', 'tax', 'liability', 'none'])
        .default('none')
        .required('Accounting class is required'),
    projectPhase: Yup.string()
        .oneOf(['pre_development', 'development', 'construction', 'operations', 'decommissioning', 'other'])
        .default('construction')
        .required('Project phase is required'),
    description: Yup.string().required('Description is required'),
    formatter: Yup.mixed().optional(),
    customPercentile: Yup.string().default('50'),
});

// each source item in CASHFLOW_SOURCE_REGISTRY.
const CubeSourceRegistryItemSchema = Yup.object().shape({
    id: Yup.string().required('Source ID is required'),
    priority: Yup.number().default(100),
    path: Yup.array().of(Yup.string()),
    hasPercentiles: Yup.boolean().required('Has percentiles flag is required'),
    references: Yup.array().of(CubeReferenceRegistryItemSchema).default([]), // local references. will be added to global references and available to this object only.
    transformer: Yup.mixed().optional(), // function to transform data. Takes the path object, availablePerentiles, and references as input. Must output a SimResultsSchema array
    multipliers: Yup.array().of(Yup.object().shape({
        id: Yup.string().required('operation ID is required'),
        operation: Yup.string().oneOf(['multiply', 'compound', 'simple', 'summation']).required('Operation is required'),
        baseYear: Yup.number().default(1),
        filter: Yup.mixed().optional(), //function to filter processedData and return results in same format ()
    })).default([]),
    metadata: CubeSourceMetadataSchema.required('Metadata is required'),
});

// the structure of CASHFLOW_SOURCE_REGISTRY
const CubeSourceRegistrySchema = Yup.object().shape({
    references: Yup.array().of(CubeReferenceRegistryItemSchema).default([]),
    sources: Yup.array().of(CubeSourceRegistryItemSchema).default([]), //all the sources from CASHFLOW_SOURCE_REGISTRY.
});

// Add after existing schemas, before CubeSourceDataSchema
const AuditTrailEntrySchema = Yup.object().shape({
    timestamp: Yup.number().required('Timestamp is required'),
    step: Yup.string().required('Step name is required'),
    type: Yup.string().oneOf(['aggregate', 'transform', 'multiply', 'reduce', 'normalize', 'none']).default('info'),
    typeOperation: Yup.string().oneOf(['sum', 'subtract', 'multiply', 'compound', 'simple', 'adjust', 'summation', 'complex', 'none']).optional(),
    details: Yup.mixed().optional(),
    dependencies: Yup.array().of(Yup.string()).default([]),
    dataSample: Yup.object().shape({
        percentile: Yup.number(),
        data: Yup.mixed()
    }).optional(),
    duration: Yup.number().optional()
});

// represents each line item of data. One per processed CubeSourceRegistryItemSchema
const CubeSourceDataSchema = Yup.object().shape({
    id: Yup.string().required('sourceID is required'),
    percentileSource: Yup.array().of(SimResultsSchema).default([]),
    metadata: CubeSourceMetadataSchema.required('Metadata is required'), //can be copied from CubeSourceRegistryItemSchema.metadata and applies equally to all percentiles.
    audit: Yup.object().shape({
        trail: Yup.array().of(AuditTrailEntrySchema).default([]), //audit object's getTrail
        references: Yup.object().default([]) // audit object's getReferences
    }).required('Audit trail is required')
});

const CubeReferenceDataSchema = Yup.array().of(Yup.object().shape({ // global references. available to all item's transformers/multipliers
    key: Yup.string().required('reference key is required'),
    value: Yup.mixed().required('reference value is required')
})).default([]);

const CubeSourceDataResponseSchema = Yup.object().shape({
    // Dynamic keys with data and metadata
    // Mode 1: key = percentile (10, 25, 50, etc.)
    // Mode 2: key = sourceId ("energyRevenue", "escalationRate", etc.)
    // Mode 3: key = sourceId (single entry)
}).test('dynamic-keys', 'Invalid response structure', function (value) {
    // Simple validation - each key should have data array and metadata object
    return Object.values(value).every(item =>
        Array.isArray(item.data) && typeof item.metadata === 'object'
    );
});

// THRESHOLD SCHEMAS

// Threshold comparison configuration for metrics
const CubeMetricThresholdComparisonSchema = Yup.object().shape({
    when: Yup.string().required('When condition is required'), // 'above', 'below', 'equal', 'notEqual', 'between', etc.
    priority: Yup.number().default(10), // Priority for this comparison rule (higher = applied first)
    styleRule: Yup.mixed().required('Style rule function is required') // Function type: (value, limits) => styleObject
});

// METRIC DATA SCHEMAS

// Metric value type union - scalar or object
const CubeMetricValueSchema = Yup.lazy(value => {
    if (typeof value === 'number') {
        return Yup.number();
    }
    return Yup.object(); // For complex metric objects
});

// Individual metric result for a specific percentile
const CubeMetricResultSchema = Yup.object().shape({
    percentile: PercentileSchema.required('Percentile is required'),
    value: Yup.number().required('Metric value is required'), // Only number
    stats: Yup.object().test('dynamic-stats', 'Stats must have number values', (value) => {
        return Object.values(value || {}).every(val => typeof val === 'number');
    }).default(() => ({})), // Dynamic keys like stats.min, stats.max
    thresholds: Yup.object().shape({
        triggers: Yup.object().test('dynamic-triggers', 'Triggers must have number priority values', (value) => {
            return Object.values(value || {}).every(val => typeof val === 'number');
        }).default(() => ({})), // Dynamic keys: { [when]: priority } e.g., { above: 5, between: 3 }
        style: Yup.object().default(() => ({})) // Concatenated CSS style object from triggered rules
    }).optional() // thresholds is optional - only exists when metric has threshold processing
});

// Metric dependency specification
const CubeMetricDependencySchema = Yup.object().shape({
    id: Yup.string().required('Dependency ID is required'),
    type: Yup.string().oneOf(['source', 'metric', 'reference']).required('Dependency type is required'),
    path: Yup.array().of(Yup.string()).optional() // Only used for type: 'reference' when not in global references
});

// Aggregation configuration for metrics
const CubeMetricAggregationSchema = Yup.object().shape({
    sourceId: Yup.string().required('Source ID is required'),
    operation: Yup.string().oneOf(['min', 'max', 'mean', 'stdev', 'mode', 'sum', 'reduce', 'npv']).required('Operation is required'),
    outputKey: Yup.string().required('Output key is required'),
    isDefault: Yup.boolean().default(false),
    filter: Yup.mixed().optional(), // Function type: (year, value, refs) => boolean
    parameters: Yup.object().optional() // Object with function parameters: { paramName: (refs, metrics) => value }
});

// Operation configuration for metrics
const CubeMetricOperationSchema = Yup.object().shape({
    id: Yup.string().required('ID is required'), // Can be metric, reference, or aggregation outputKey
    operation: Yup.mixed().required('Operation function is required') // Function type
});

// Registry item for individual metrics
const CubeMetricRegistryItemSchema = Yup.object().shape({
    id: Yup.string().required('Metric ID is required'),
    priority: Yup.number().default(100),
    dependencies: Yup.array().of(CubeMetricDependencySchema).default([]),
    aggregations: Yup.array().of(CubeMetricAggregationSchema).default([]),
    transformer: Yup.mixed().optional(), // Function type
    operations: Yup.array().of(CubeMetricOperationSchema).default([]),
    references: Yup.array().of(CubeReferenceRegistryItemSchema).default([]),
    metadata: CubeSourceMetadataSchema.required('Metadata is required'),
    thresholds: Yup.array().of(CubeMetricThresholdComparisonSchema).default([]),
    sensitivity: Yup.object().shape({
        enabled: Yup.boolean().default(true),
        excludeSources: Yup.array().of(Yup.string()).default([]),
        analyses: Yup.array().of(Yup.string()).default([]), // Which analyses to run
        customPercentileRange: Yup.array().of(Yup.number()).nullable().default(null)
    }).default(() => ({}))
});

// Main metrics registry schema
const CubeMetricsRegistrySchema = Yup.object().shape({
    references: Yup.array().of(CubeReferenceRegistryItemSchema).default([]),
    metrics: Yup.array().of(CubeMetricRegistryItemSchema).default([])
});

// Processed metric data (parallel to CubeSourceDataSchema)
const CubeMetricDataSchema = Yup.object().shape({
    id: Yup.string().required('Metric ID is required'),
    valueType: Yup.string().oneOf(['scalar', 'object']).required('Value type is required'),
    percentileMetrics: Yup.array().of(CubeMetricResultSchema).default([]),
    metadata: CubeSourceMetadataSchema.required('Metadata is required'),
    audit: Yup.object().shape({
        trail: Yup.array().of(AuditTrailEntrySchema).default([]),
        references: Yup.object().default({})
    }).required('Audit trail is required')
});

// Response schema for metric data queries (parallel to CubeSourceDataResponseSchema)
const CubeMetricDataResponseSchema = Yup.object().shape({
    // Dynamic keys with metric data and metadata
    // Mode 1: key = percentile (50, 75, 90, etc.) when querying by percentile
    // Mode 2: key = metricId ("projectIRR", "equityIRR", etc.) when querying by metric
}).test('dynamic-keys', 'Invalid metric response structure', function (value) {
    // Validate that each key has appropriate data structure
    return Object.values(value).every(item =>
        (typeof item.value === 'number' || typeof item.value === 'object') &&
        typeof item.metadata === 'object'
    );
});

// SENSITIVITY ANALYSIS SCHEMAS

// Sensitivity analysis configuration in registry
const CubeSensitivityRegistryItemSchema = Yup.object().shape({
    id: Yup.string().required('Analysis ID is required'),
    name: Yup.string().required('Analysis name is required'),
    description: Yup.string().required('Description is required'),
    transformer: Yup.mixed().required('Transformer function is required'),
    enabled: Yup.boolean().default(true),
    schema: Yup.mixed().required('Validation schema is required'), // Yup schema for this analysis type
    config: Yup.object().default(() => ({})) // Analysis-specific configuration
});

// Sensitivity analysis registry
const CubeSensitivityRegistrySchema = Yup.object().shape({
    analyses: Yup.array().of(CubeSensitivityRegistryItemSchema).default([])
});

// Base sensitivity data configuration
const CubeSensitivityConfigSchema = Yup.object().shape({
    computedMetrics: Yup.array().of(Yup.string()).required('Computed metrics list is required'),
    baselinePercentiles: Yup.array().of(Yup.number()).required('Baseline percentiles are required'),
    enabledAnalyses: Yup.array().of(Yup.string()).required('Enabled analyses list is required'),
    lastComputed: Yup.date().required('Last computed timestamp is required')
});

// Main sensitivity data schema (metric-root structure)
const CubeSensitivityDataSchema = Yup.object().shape({
    config: CubeSensitivityConfigSchema.required('Configuration is required')
    // Dynamic metric keys validated by registry schemas
    // Structure: { [metricId]: { [analysisId]: analysisResults } }
}).test('dynamic-metric-keys', 'Invalid metric-analysis structure', function (value) {
    // Validate that all non-config keys are valid metric IDs
    // and their analysis data matches registry schemas
    const { config } = value;
    if (!config) return false;

    const nonConfigKeys = Object.keys(value).filter(key => key !== 'config');
    return nonConfigKeys.every(metricId =>
        config.computedMetrics.includes(metricId) &&
        typeof value[metricId] === 'object'
    );
});



module.exports = {
    // Source schemas
    CubeReferenceRegistryItemSchema,
    CubeSourceMetadataSchema,
    CubeSourceRegistryItemSchema,
    CubeSourceRegistrySchema,
    CubeSourceDataSchema,
    CubeReferenceDataSchema,
    CubeSourceDataResponseSchema,
    AuditTrailEntrySchema,

    // Threashold schemas
    CubeMetricThresholdComparisonSchema, // New export

    // Metrics schemas
    CubeMetricValueSchema,
    CubeMetricResultSchema,
    CubeMetricDependencySchema,
    CubeMetricAggregationSchema,
    CubeMetricOperationSchema,
    CubeMetricRegistryItemSchema,
    CubeMetricsRegistrySchema,
    CubeMetricDataSchema,
    CubeMetricDataResponseSchema,

    // Sensitivity schemas
    CubeSensitivityRegistryItemSchema,
    CubeSensitivityRegistrySchema,
    CubeSensitivityConfigSchema,
    CubeSensitivityDataSchema,

    // re-export existing schemas
    SimResultsSchema,
    DataPointSchema,
};