// schemas/yup/distribution.js
const Yup = require('yup');

// Schema for a data point with year and value
const DataPointSchema = Yup.object().shape({
    year: Yup.number().min(0).required('Year is required'),
    value: Yup.number().required('Value is required'),
});

// Schema for percentile configuration
const PercentileSchema = Yup.object().shape({
    value: Yup.number().min(1).max(99).default(50).required('Value is required'),
    description: Yup.string().default('primary'),
    // Note: 'label' getter isn’t replicated in Yup; it’s a Mongoose-specific feature
});

// SimResultsSchema (from Scenario.js)
const SimResultsSchema = Yup.object().shape({
    name: Yup.string().required('Name is required'),
    percentile: PercentileSchema.required(),
    data: Yup.array().of(DataPointSchema).required(),
});

// Schema for distribution parameters with mixed types
const DistributionParametersSchema = Yup.object().shape({
    value: Yup.mixed(), // Mixed type
    scale: Yup.mixed(),
    mean: Yup.mixed(),
    min: Yup.mixed(),
    max: Yup.mixed(),
    meanWindSpeed: Yup.mixed(),
    stdDev: Yup.mixed(),
    mode: Yup.number(),
    mu: Yup.number(),
    sigma: Yup.number(),
    shape: Yup.number(),
    lambda: Yup.number(),
    turbulenceIntensity: Yup.number(),
    roughnessLength: Yup.number(),
    hubHeight: Yup.number(),
    drift: Yup.number(),
    volatility: Yup.number(),
    timeStep: Yup.number(),
});

// Main DistributionTypeSchema
const DistributionTypeSchema = Yup.object().shape({
    type: Yup.string()
        .oneOf([
            'normal', 'lognormal', 'triangular', 'uniform', 'weibull',
            'exponential', 'poisson', 'fixed', 'kaimal', 'gbm', 'gamma'
        ]),
    timeSeriesMode: Yup.boolean().default(false),
    parameters: DistributionParametersSchema.required('Parameters are required'),
});

const FitDistributionSchema = Yup.object().shape({
    distribution: DistributionTypeSchema.required('Distribution is required'),
    dataPoints: Yup.array()
        .of(DataPointSchema)
        .min(1, 'At least one data point is required')
        .required('Data points are required'),
});

// Schema for simulation settings
const SimSettingsSchema = Yup.object().shape({
    iterations: Yup.number().min(100).default(10000).required('Iterations are required'),
    seed: Yup.number().default(() => Math.floor(Math.random() * 1000000)),
    years: Yup.number().min(1).default(20),
    percentiles: Yup.array()
        .of(PercentileSchema)
        .default(() => [
            { value: 50, description: 'primary' },
            { value: 75, description: 'upper_bound' },
            { value: 25, description: 'lower_bound' },
            { value: 10, description: 'extreme_lower' },
            { value: 90, description: 'extreme_upper' },
        ]),
    fitToData: Yup.array().of(DataPointSchema),
});

// Schema for SimRequest
const SimRequestSchema = Yup.object().shape({
    distributions: Yup.array()
        .of(DistributionTypeSchema)
        .min(1, 'At least one distribution is required')
        .required('Distributions are required'),
    simulationSettings: SimSettingsSchema.required('Simulation settings are required').default(() => ({})),
});

// Schema for individual simulation info
const SimulationInfoSchema = Yup.object().shape({
    distribution: DistributionTypeSchema.required('Distribution is required'),
    iterations: Yup.number().required('Iterations are required'),
    seed: Yup.number().required('Seed is required'),
    years: Yup.number().required('Years are required'),
    timeElapsed: Yup.number().required('Time elapsed is required'),
    results: Yup.array().of(SimResultsSchema).required('Results are required').default([]),
    errors: Yup.array().of(Yup.string()).required('Errors are required').default([]),
    statistics: Yup.object().shape({
        mean: Yup.array().of(DataPointSchema),
        stdDev: Yup.array().of(DataPointSchema),
        min: Yup.array().of(DataPointSchema),
        max: Yup.array().of(DataPointSchema),
        skewness: Yup.array().of(DataPointSchema),
        kurtosis: Yup.array().of(DataPointSchema),
    }).required('Statistics are required').default({}),
});

// Schema for SimResponse
const SimResponseSchema = Yup.object().shape({
    success: Yup.boolean().required('Success is required'),
    simulationInfo: Yup.array().of(SimulationInfoSchema).required('Simulation info is required').default([]),
});

module.exports = {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
    SimulationInfoSchema,
    SimRequestSchema,
    SimResponseSchema,
    FitDistributionSchema
};