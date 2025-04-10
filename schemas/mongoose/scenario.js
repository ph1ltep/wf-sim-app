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
const {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
} = require('../yup/distribution'); // Correct import path

// Generate Mongoose schemas from Yup schemas
const ComponentAllocationSchema = yupToMongoose(ComponentAllocationSchemaYup);
const CraneCoverageSchema = yupToMongoose(CraneCoverageSchemaYup);
const MajorComponentCoverageSchema = yupToMongoose(MajorComponentCoverageSchemaYup);
const ScopeAllocationsSchema = yupToMongoose(ScopeAllocationsSchemaYup);
const YearlyResponsibilitySchema = yupToMongoose(YearlyResponsibilitySchemaYup);
const SimResultsSchema = yupToMongoose(SimResultsSchemaYup);
const AdjustmentSchema = yupToMongoose(AdjustmentSchemaYup);
const FailureModelSchema = yupToMongoose(FailureModelSchemaYup);
const SettingsSchema = yupToMongoose(SettingsSchemaYup);
const InputSimSchema = yupToMongoose(InputSimSchemaYup);
const OutputSimSchema = yupToMongoose(OutputSimSchemaYup);

// Main Scenario Schema
const ScenarioSchema = yupToMongoose(ScenarioSchemaYup);

// Pre-save hook to update `updatedAt`
ScenarioSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

// Create Mongoose model
const Scenario = mongoose.model('Scenario', ScenarioSchema);

// Export all schemas and the model
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
    SimSettingsSchema,
};