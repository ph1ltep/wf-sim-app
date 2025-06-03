// schemas/yup/cashflow.js - Simplified cashflow data schemas
const Yup = require('yup');
const { DataPointSchema } = require('./distribution');

// Simplified multiplier metadata
const AppliedMultiplierSchema = Yup.object().shape({
    id: Yup.string().required('Multiplier ID is required'),
    operation: Yup.string().oneOf(['multiply', 'compound', 'simple']).required('Operation is required'),
    values: Yup.array().of(DataPointSchema).required('Multiplier values are required'),
    baseYear: Yup.number().default(1),
    cumulative: Yup.boolean().default(false)
});

// Simplified line item - just data and metadata
const SimplifiedLineItemSchema = Yup.object().shape({
    id: Yup.string().required('Line item ID is required'),
    category: Yup.string().oneOf(['cost', 'revenue']).required('Category is required'),
    subcategory: Yup.string().required('Subcategory is required'),
    name: Yup.string().required('Display name is required'),

    // Single data array (for the selected percentile)
    data: Yup.array().of(DataPointSchema).required('Data is required').default([]),

    // Metadata about what was used
    metadata: Yup.object().shape({
        selectedPercentile: Yup.number().required('Selected percentile is required'),
        hasPercentileVariation: Yup.boolean().required('Percentile variation flag is required'),
        appliedMultipliers: Yup.array().of(AppliedMultiplierSchema).default([])
    }).required('Metadata is required')
});

// Simplified aggregation - just data and metadata
const SimplifiedAggregationSchema = Yup.object().shape({
    data: Yup.array().of(DataPointSchema).required('Data is required').default([]),
    metadata: Yup.object().shape({
        selectedPercentile: Yup.number().required('Selected percentile is required'),
        sourceCount: Yup.number().default(0),
        hasPercentileVariation: Yup.boolean().default(false)
    }).required('Metadata is required')
});

// Simplified finance metrics
const SimplifiedFinanceMetricsSchema = Yup.object().shape({
    dscr: Yup.object().shape({
        data: Yup.array().of(DataPointSchema).default([]),
        metadata: Yup.object().shape({
            selectedPercentile: Yup.number().required('Selected percentile is required'),
            covenantThreshold: Yup.number().default(1.3)
        }).required('Metadata is required')
    }),
    irr: Yup.object().shape({
        value: Yup.number(),
        metadata: Yup.object().shape({
            selectedPercentile: Yup.number().required('Selected percentile is required')
        }).required('Metadata is required')
    }),
    npv: Yup.object().shape({
        value: Yup.number(),
        metadata: Yup.object().shape({
            selectedPercentile: Yup.number().required('Selected percentile is required')
        }).required('Metadata is required')
    }),
    covenantBreaches: Yup.object().shape({
        data: Yup.array().of(Yup.object().shape({
            year: Yup.number().required('Year is required'),
            dscr: Yup.number().required('DSCR value is required'),
            threshold: Yup.number().required('Threshold is required'),
            margin: Yup.number().required('Margin is required')
        })).default([]),
        metadata: Yup.object().shape({
            selectedPercentile: Yup.number().required('Selected percentile is required')
        }).required('Metadata is required')
    })
});

// Simplified cashflow metadata
const SimplifiedCashflowMetadataSchema = Yup.object().shape({
    projectLife: Yup.number().required('Project life is required'),
    currency: Yup.string().required('Currency is required'),
    numWTGs: Yup.number().required('Number of WTGs is required'),
    availablePercentiles: Yup.array().of(Yup.number()).required('Available percentiles are required'),
    lastUpdated: Yup.date().required('Last updated timestamp is required'),
    percentileStrategy: Yup.object().shape({
        strategy: Yup.string().oneOf(['unified', 'perSource']).required('Strategy is required'),
        selections: Yup.object().required('Selections are required') // sourceId -> percentile
    }).required('Percentile strategy is required')
});

// Main simplified cashflow data source
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

// Registry validation schemas
const RegistryDataSchema = Yup.object().shape({
    projectLife: Yup.array().of(Yup.string()).required('Project life path is required'),
    numWTGs: Yup.array().of(Yup.string()).required('Number of WTGs path is required'),
    currency: Yup.array().of(Yup.string()).required('Currency path is required')
});

const RegistrySourceSchema = Yup.object().shape({
    id: Yup.string().required('Source ID is required'),
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
    displayNote: Yup.string().optional()
});

const CashflowSourceRegistrySchema = Yup.object().shape({
    data: RegistryDataSchema.required('Global data paths are required'),
    multipliers: Yup.array().of(RegistrySourceSchema).default([]),
    costs: Yup.array().of(RegistrySourceSchema).default([]),
    revenues: Yup.array().of(RegistrySourceSchema).default([])
});

module.exports = {
    SimplifiedCashflowDataSourceSchema,
    SimplifiedLineItemSchema,
    SimplifiedAggregationSchema,
    SimplifiedFinanceMetricsSchema,
    SimplifiedCashflowMetadataSchema,
    AppliedMultiplierSchema,
    CashflowSourceRegistrySchema,
    RegistrySourceSchema,
    RegistryDataSchema
};