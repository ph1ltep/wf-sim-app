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
const MajorComponentSchema = require('./majorComponent').MajorComponentSchema;
const {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
} = require('./distributionSchemas');

// Generate sub-schemas
const ComponentAllocationSchema = yupToMongoose(ComponentAllocationSchemaYup);
const CraneCoverageSchema = yupToMongoose(CraneCoverageSchemaYup);
const MajorComponentCoverageSchema = yupToMongoose(MajorComponentCoverageSchemaYup);
const ScopeAllocationsSchema = yupToMongoose(ScopeAllocationsSchemaYup);
const YearlyResponsibilitySchema = yupToMongoose(YearlyResponsibilitySchemaYup);
const SimResultsSchema = yupToMongoose(SimResultsSchemaYup);
const AdjustmentSchema = yupToMongoose(AdjustmentSchemaYup);
const FailureModelSchema = yupToMongoose(FailureModelSchemaYup, {
    majorComponent: { type: MajorComponentSchema, required: true }, // Link to external schema
});
const SettingsSchema = yupToMongoose(SettingsSchemaYup);
const InputSimSchema = yupToMongoose(InputSimSchemaYup);
const OutputSimSchema = yupToMongoose(OutputSimSchemaYup);

// Main Scenario Schema
const ScenarioSchema = yupToMongoose(ScenarioSchemaYup, {
    // No major overrides needed; all types are explicit
});

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