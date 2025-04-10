// schemas/mongoose/scenario.js
const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const {
    ScenarioSchema: ScenarioSchemaYup,
    SettingsSchema: SettingsSchemaYup,
    InputSimSchema: InputSimSchemaYup,
    OutputSimSchema: OutputSimSchemaYup,
    SimResultsSchema: SimResultsSchemaYup,
    ComponentAllocationSchema: ComponentAllocationSchemaYup,
    CraneCoverageSchema: CraneCoverageSchemaYup,
    MajorComponentCoverageSchema: MajorComponentCoverageSchemaYup,
    ScopeAllocationsSchema: ScopeAllocationsSchemaYup,
    YearlyResponsibilitySchema: YearlyResponsibilitySchemaYup,
    AdjustmentSchema: AdjustmentSchemaYup,
    FailureModelSchema: FailureModelSchemaYup,
} = require('../yup/scenario');
const { MajorComponentSchema } = require('./majorComponent');
const {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
} = require('./distribution');

// Generate sub-schemas
const ComponentAllocationSchema = yupToMongoose(ComponentAllocationSchemaYup);
const CraneCoverageSchema = yupToMongoose(CraneCoverageSchemaYup);
const MajorComponentCoverageSchema = yupToMongoose(MajorComponentCoverageSchemaYup);
const ScopeAllocationsSchema = yupToMongoose(ScopeAllocationsSchemaYup);
const YearlyResponsibilitySchema = yupToMongoose(YearlyResponsibilitySchemaYup);
const SimResultsSchema = yupToMongoose(SimResultsSchemaYup);
const AdjustmentSchema = yupToMongoose(AdjustmentSchemaYup);

// Custom handling for FailureModelSchema to properly reference MajorComponentSchema
const FailureModelSchema = new mongoose.Schema({
    designLife: { type: Number, default: 20 },
    componentCount: { type: Number, default: 100 },
    assumedFailureRate: { type: Number, default: 0.01 },
    majorComponent: {
        type: new mongoose.Schema(
            Object.assign({}, MajorComponentSchema.obj, {
                name: { type: String, required: true, trim: true } // Remove unique constraint
            })
        ),
        required: true
    },
    historicalData: {
        type: {
            type: String,
            enum: ['separate', 'analysis', 'none'],
            default: 'none'
        },
        data: [{
            year: { type: Number, required: true },
            failureRate: { type: Number, required: true }
        }]
    }
});

// Custom schema for distribution-based fields
const DistributionSchema = new mongoose.Schema({
    distribution: { type: DistributionTypeSchema },
    data: { type: [SimResultsSchema], default: [] }
});

// Custom overrides for SettingsSchema to match the new distribution structures
const settingsOverrides = {
    'modules.cost.escalationRate': {
        type: DistributionSchema,
        default: function () {
            return {
                distribution: {
                    type: 'Fixed',
                    timeSeriesMode: false,
                    parameters: { value: 0.025 }
                },
                data: []
            };
        }
    },
    'modules.revenue.energyProduction': {
        type: DistributionSchema,
        default: function () {
            return {
                distribution: {
                    type: 'Normal',
                    timeSeriesMode: false,
                    parameters: { mean: 1000, stdDev: 10 }
                },
                data: []
            };
        }
    },
    'modules.revenue.electricityPrice': {
        type: DistributionSchema,
        default: function () {
            return {
                distribution: {
                    type: 'Fixed',
                    timeSeriesMode: false,
                    parameters: { value: 50 }
                },
                data: []
            };
        }
    },
    'modules.revenue.downtimePerEvent': {
        type: DistributionSchema,
        default: function () {
            return {
                distribution: {
                    type: 'Lognormal',
                    timeSeriesMode: false,
                    parameters: {
                        sigma: 0.3,
                        mu: Math.log(90)
                    }
                },
                data: []
            };
        }
    },
    'modules.revenue.windVariability': {
        type: DistributionSchema,
        default: function () {
            return {
                distribution: {
                    type: 'GBM',
                    timeSeriesMode: false,
                    parameters: {
                        value: 7.5,
                        drift: 0.02,
                        volatility: 0.1,
                        timeStep: 1
                    }
                },
                data: []
            };
        }
    }
};

const SettingsSchema = yupToMongoose(SettingsSchemaYup, settingsOverrides);
const InputSimSchema = yupToMongoose(InputSimSchemaYup);
const OutputSimSchema = yupToMongoose(OutputSimSchemaYup);

// Main Scenario Schema
const ScenarioSchema = yupToMongoose(ScenarioSchemaYup);

// Pre-save hook
ScenarioSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

const Scenario = mongoose.model('Scenario', ScenarioSchema);

module.exports = {
    Scenario,
    SettingsSchema,
    InputSimSchema,
    OutputSimSchema,
    SimResultsSchema,
    ComponentAllocationSchema,
    CraneCoverageSchema,
    MajorComponentCoverageSchema,
    ScopeAllocationsSchema,
    YearlyResponsibilitySchema,
    AdjustmentSchema,
    FailureModelSchema,
};