// schemas/yup/cashflow.js - Fixed Map validation without .nullable()
const Yup = require('yup');
const { DataPointSchema } = require('./distribution');

// Helper function to validate Map objects
const mapValidator = (fieldName) => Yup.mixed().test(
    `${fieldName}-map`,
    `${fieldName} must be a Map or null`,
    (value) => value instanceof Map || value === null || value === undefined
);

// Enhanced existing AppliedMultiplierSchema (unchanged)
const AppliedMultiplierSchema = Yup.object().shape({
    id: Yup.string().required('Multiplier ID is required'),
    operation: Yup.string().oneOf(['multiply', 'compound', 'simple']).required('Operation is required'),
    values: Yup.array().of(DataPointSchema).required('Multiplier values are required'),
    baseYear: Yup.number().default(1),
    cumulative: Yup.boolean().default(false)
});

// Enhanced SimplifiedLineItemSchema with multi-percentile support
const SimplifiedLineItemSchema = Yup.object().shape({
    id: Yup.string().required('Line item ID is required'),
    category: Yup.string().oneOf(['cost', 'revenue']).required('Category is required'),
    subcategory: Yup.string().required('Subcategory is required'),
    name: Yup.string().required('Display name is required'),

    // Primary percentile data (for detail cards) - existing
    data: Yup.array().of(DataPointSchema).required('Data is required').default([]),

    // NEW: All percentile data (for summary/explorer cards)
    percentileData: mapValidator('percentileData'),

    // Enhanced metadata
    metadata: Yup.object().shape({
        selectedPercentile: Yup.number().required('Selected percentile is required'),
        hasPercentileVariation: Yup.boolean().required('Percentile variation flag is required'),
        hasAllPercentiles: Yup.boolean().default(false), // NEW
        appliedMultipliers: Yup.array().of(AppliedMultiplierSchema).default([])
    }).required('Metadata is required')
});

// Enhanced SimplifiedAggregationSchema with multi-percentile support
const SimplifiedAggregationSchema = Yup.object().shape({
    // Primary percentile data (for detail cards) - existing
    data: Yup.array().of(DataPointSchema).required('Data is required').default([]),

    // NEW: All percentile data (for summary/explorer cards)
    percentileData: mapValidator('percentileData'),

    // Enhanced metadata
    metadata: Yup.object().shape({
        selectedPercentile: Yup.number().required('Selected percentile is required'),
        sourceCount: Yup.number().default(0),
        hasPercentileVariation: Yup.boolean().default(false),
        hasAllPercentiles: Yup.boolean().default(false) // NEW
    }).required('Metadata is required')
});

// Enhanced SimplifiedFinanceMetricsSchema (already used Maps, minimal change)
const SimplifiedFinanceMetricsSchema = Yup.object().shape({
    dscr: mapValidator('dscr'),
    irr: mapValidator('irr'),
    npv: mapValidator('npv'),
    llcr: mapValidator('llcr'),
    covenantBreaches: mapValidator('covenantBreaches')
});

// Enhanced SimplifiedCashflowMetadataSchema
const SimplifiedCashflowMetadataSchema = Yup.object().shape({
    projectLife: Yup.number().required('Project life is required'),
    currency: Yup.string().required('Currency is required'),
    numWTGs: Yup.number().required('Number of WTGs is required'),
    availablePercentiles: Yup.array().of(Yup.number()).required('Available percentiles are required'),
    primaryPercentile: Yup.number().required('Primary percentile is required'), // NEW
    lastUpdated: Yup.date().required('Last updated timestamp is required'),
    percentileStrategy: Yup.object().shape({
        strategy: Yup.string().oneOf(['unified', 'perSource']).required('Strategy is required'),
        selections: Yup.object().required('Selections are required')
    }).required('Percentile strategy is required')
});

// Enhanced SimplifiedCashflowDataSourceSchema
const SimplifiedCashflowDataSourceSchema = Yup.object().shape({
    metadata: SimplifiedCashflowMetadataSchema.required('Metadata is required'),
    lineItems: Yup.array().of(SimplifiedLineItemSchema).required('Line items are required').default([]),
    aggregations: Yup.object().shape({
        totalCosts: SimplifiedAggregationSchema.required('Total costs aggregation is required'),
        totalRevenue: SimplifiedAggregationSchema.required('Total revenue aggregation is required'),
        netCashflow: SimplifiedAggregationSchema.required('Net cashflow aggregation is required')
    }).required('Aggregations are required'),
    financeMetrics: SimplifiedFinanceMetricsSchema.required('Finance metrics are required')
});

// Registry validation schemas (unchanged)
const RegistryDataSchema = Yup.object().shape({
    projectLife: Yup.array().of(Yup.string()).required('Project life path is required'),
    numWTGs: Yup.array().of(Yup.string()).required('Number of WTGs path is required'),
    currency: Yup.array().of(Yup.string()).required('Currency path is required')
});

const RegistrySourceSchema = Yup.object().shape({
    id: Yup.string().required('Source ID is required'),
    displayName: Yup.string().optional(),
    path: Yup.array().of(Yup.string()).required('Primary path is required'),
    references: Yup.array().of(
        Yup.array().of(Yup.string())
    ).optional(),
    category: Yup.string().required('Category is required'),
    hasPercentiles: Yup.boolean().required('Has percentiles flag is required'),
    transformer: Yup.string().nullable().optional(),
    multipliers: Yup.array().of(Yup.object().shape({
        id: Yup.string().required('Multiplier ID is required'),
        operation: Yup.string().oneOf(['multiply', 'compound', 'simple']).required('Operation is required'),
        baseYear: Yup.number().default(1)
    })).default([]),
    description: Yup.string().required('Description is required'),
    displayNote: Yup.string().optional(),
    displayUnit: Yup.string().optional()
});

const CashflowSourceRegistrySchema = Yup.object().shape({
    data: RegistryDataSchema.required('Global data paths are required'),
    multipliers: Yup.array().of(RegistrySourceSchema).default([]),
    costs: Yup.array().of(RegistrySourceSchema).default([]),
    revenues: Yup.array().of(RegistrySourceSchema).default([])
});

/**
 * Schema for sensitivity dependency relationships
 */
const SensitivityDependencySchema = Yup.object().shape({
    sourceId: Yup.string().required('Affected source ID is required'),
    impactType: Yup.string()
        .oneOf(['multiplicative', 'additive', 'recalculation', 'time_series_modifier'])
        .default('multiplicative')
});

/**
 * Enhanced sensitivity source schema - extends RegistrySourceSchema
 * Adds dependencies for indirect variable relationships
 */
const SensitivitySourceSchema = RegistrySourceSchema.clone().shape({
    dependencies: Yup.object().shape({
        affects: Yup.array().of(SensitivityDependencySchema).optional()
    }).optional()
});

/**
 * Updated sensitivity registry schema
 */
const SensitivityRegistrySchema = Yup.object().shape({
    data: RegistryDataSchema.optional(),
    technical: Yup.array().of(SensitivitySourceSchema).optional(),
    financial: Yup.array().of(SensitivitySourceSchema).optional(),
    operational: Yup.array().of(SensitivitySourceSchema).optional()
});

/**
 * Validate SENSITIVITY_SOURCE_REGISTRY structure
 * @param {Object} registry - Registry to validate
 * @returns {Promise<Object>} Validated registry
 */
const validateSensitivityRegistry = async (registry) => {
    try {
        return await SensitivityRegistrySchema.validate(registry);
    } catch (error) {
        console.error('SENSITIVITY_SOURCE_REGISTRY validation failed:', error);
        throw error;
    }
};



module.exports = {
    SimplifiedCashflowDataSourceSchema,
    SimplifiedLineItemSchema,
    SimplifiedAggregationSchema,
    SimplifiedFinanceMetricsSchema,
    SimplifiedCashflowMetadataSchema,
    AppliedMultiplierSchema,
    CashflowSourceRegistrySchema,
    RegistrySourceSchema,
    RegistryDataSchema,
    SensitivityDependencySchema,        // ✅ NEW
    SensitivitySourceSchema,            // ✅ NEW
    SensitivityRegistrySchema,          // ✅ UPDATED
    validateSensitivityRegistry
};