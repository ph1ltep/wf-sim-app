// backend/models/DistributionSchemas.js
const mongoose = require('mongoose');
const { SimResultsSchema } = require('./Scenario');

// Schema for a data point with year and value
const DataPointSchema = new mongoose.Schema({
    year: { type: Number, required: true, min: 0 },
    value: { type: Number, required: true }
});

// Schema for percentile configuration
const PercentileSchema = new mongoose.Schema({
    value: { type: Number, required: true, min: 1, max: 99, default: 50 },
    description: { type: String, default: 'primary' },
    label: { type: String, get: function () { return `P${this.value}`; } }
});

// Schema for distribution parameters with mixed types
const DistributionParametersSchema = new mongoose.Schema({
    // Parameters that can be either number or time series
    value: { type: mongoose.Schema.Types.Mixed },
    scale: { type: mongoose.Schema.Types.Mixed },
    mean: { type: mongoose.Schema.Types.Mixed },
    min: { type: mongoose.Schema.Types.Mixed },
    max: { type: mongoose.Schema.Types.Mixed },
    meanWindSpeed: { type: mongoose.Schema.Types.Mixed },
    stdDev: { type: mongoose.Schema.Types.Mixed },

    // Parameters that remain as simple numbers
    mode: { type: Number },
    sigma: { type: Number },
    shape: { type: Number },
    lambda: { type: Number },
    turbulenceIntensity: { type: Number },
    roughnessLength: { type: Number },
    hubHeight: { type: Number },
    drift: { type: Number },
    volatility: { type: Number },
    timeStep: { type: Number }
});

// Main DistributionTypeSchema 
const DistributionTypeSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [
            'Normal',
            'Lognormal',
            'Triangular',
            'Uniform',
            'Weibull',
            'Exponential',
            'Poisson',
            'Fixed',
            'Kaimal',
            'GBM'
        ],
        required: true
    },
    timeSeriesMode: { type: Boolean, default: false },
    parameters: { type: DistributionParametersSchema, required: true }
});

// Schema for simulation settings
const SimSettingsSchema = new mongoose.Schema({
    iterations: { type: Number, required: true, min: 100, default: 10000 },
    seed: { type: Number, default: () => Math.floor(Math.random() * 1000000) },
    years: { type: Number, min: 1, default: 20 },
    percentiles: {
        type: [PercentileSchema],
        default: [
            { value: 50, description: 'primary' },
            { value: 75, description: 'upper_bound' },
            { value: 25, description: 'lower_bound' },
            { value: 10, description: 'extreme_lower' },
            { value: 90, description: 'extreme_upper' }
        ]
    },
    fitToData: { type: [DataPointSchema], required: false }
});

// Schema for SimRequest
const SimRequestSchema = new mongoose.Schema({
    distributions: {
        type: [DistributionTypeSchema], required: true,
        validate: {
            validator: function (distributions) {
                return distributions && distributions.length > 0;
            },
            message: 'At least one distribution is required'
        }
    },
    simulationSettings: { type: SimSettingsSchema, required: true, default: () => ({}) }
});

// Schema for individual simulation info
const SimulationInfoSchema = new mongoose.Schema({
    distribution: { type: DistributionTypeSchema, required: true },
    iterations: { type: Number, required: true },
    seed: { type: Number, required: true },
    years: { type: Number, required: true },
    timeElapsed: { type: Number, required: true },
    results: { type: [SimResultsSchema], required: true, default: [] },
    errors: { type: [String], required: true, default: [] }
});

// Schema for SimResponse
const SimResponseSchema = new mongoose.Schema({
    success: { type: Boolean, required: true },
    simulationInfo: { type: [SimulationInfoSchema], required: true, default: [] }
});


// Export the schemas
module.exports = {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
    SimulationInfoSchema,
    SimRequest: mongoose.model('SimRequest', SimRequestSchema),
    SimResponse: mongoose.model('SimResponse', SimResponseSchema),
    SimRequestSchema,
    SimResponseSchema
};