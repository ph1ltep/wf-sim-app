

export const prepareCubeDataSources = async (
    sourceRegistry,
    unifiedPercentiles,
    perSourcePercentiles,
    getValueByPath
) => {
    //Step 1: take CASHFLOW_SOURCE_REGISTRY as sourceRegistry
    //NOTE: sources with no multipliers are independent variables/sources. Need to process independents first so they can be referenced by others.
}


// adds data references that can be used in multipliers, transformers, formatters. takes path string array.
const CubeReferenceDataSchema = Yup.array().of(Yup.object().shape({ // global references. available to all item's transformers/multipliers
    id: Yup.string().required('reference id is required'),
    path: Yup.array().of(Yup.string()).required('reference path is required')
}));

// the structure of CASHFLOW_SOURCE_REGISTRY
const CubeSourceRegistrySchema = Yup.object().shape({
    references: CubeReferenceDataSchema.default([]),
    sources: Yup.array().of(CubeSourceDataSchema).default([]), //all the sources from CASHFLOW_SOURCE_REGISTRY.
});

// each source item in CASHFLOW_SOURCE_REGISTRY.
const CubeSourceRegistryItemSchema = Yup.object().shape({
    id: Yup.string().required('Source ID is required'),
    priority: Yup.number().default(100),
    path: Yup.array().of(Yup.string()).required('Primary path is required'),
    hasPercentiles: Yup.boolean().required('Has percentiles flag is required'),
    references: CubeReferenceDataSchema.default([]), // local references. will be added to global references and available to this object only.
    transformer: Yup.string().nullable().optional(),
    multipliers: Yup.array().of(Yup.object().shape({
        id: Yup.string().required('Multiplier ID is required'),
        operation: Yup.string().oneOf(['multiply', 'compound', 'simple']).required('Operation is required'),
        baseYear: Yup.number().default(1)
    })).default([]),
    metadata: Yup.object().shape({
        name: Yup.string().optional(),
        cashflowGroup: Yup.string().oneOf(['cost', 'revenue', 'asset', 'liability', 'risk', 'opportunity', 'none']).default('none'), //will be used to group how variables affect cashflow table.
        category: Yup.string().required('Category is required'),
        description: Yup.string().required('Description is required'),
        formatter: Yup.mixed()
    }),
});

// represents each line item of data. One per processed CubeSourceRegistryItemSchema
// cube stores metrics, maybe not data sources.
const CubeSourceDataSchema = Yup.object().shape({
    percentileData: Yup.array().of(Yup.object().shape({ //one item per percentile
        percentileKey: Yup.string().required('PercentileKey is required'),
        data: Yup.array().of(DataPointSchema).required('Data is required').default([]),
    })).default([]),
    metadata: BaseResponseSchema.concat(
        Yup.object().shape({
           // new props
        })),//can be copied from CubeSourceRegistryItemSchema.metadata and applies equally to all percentiles.
})

//original is just one percentile of data. new one must support all percentiles.
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