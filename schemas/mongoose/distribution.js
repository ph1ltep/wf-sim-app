const mongoose = require('mongoose');
const yupToMongoose = require('./generator');
const {
    DataPointSchema: DataPointSchemaYup,
    PercentileSchema: PercentileSchemaYup,
    DistributionParametersSchema: DistributionParametersSchemaYup,
    DistributionTypeSchema: DistributionTypeSchemaYup,
    SimSettingsSchema: SimSettingsSchemaYup,
    SimulationInfoSchema: SimulationInfoSchemaYup,
    SimRequestSchema: SimRequestSchemaYup,
    SimResponseSchema: SimResponseSchemaYup,
} = require('../yup/distribution');
const { SimResultsSchema: SimResultsSchemaYup } = require('../yup/scenario');

// Generate Mongoose schemas from Yup schemas
const DataPointSchema = yupToMongoose(DataPointSchemaYup);
const PercentileSchema = yupToMongoose(PercentileSchemaYup);
const DistributionParametersSchema = yupToMongoose(DistributionParametersSchemaYup);
const DistributionTypeSchema = yupToMongoose(DistributionTypeSchemaYup);
const SimSettingsSchema = yupToMongoose(SimSettingsSchemaYup);
const SimResultsSchema = yupToMongoose(SimResultsSchemaYup);
const SimulationInfoSchema = yupToMongoose(SimulationInfoSchemaYup);
const SimRequestSchema = yupToMongoose(SimRequestSchemaYup);
const SimResponseSchema = yupToMongoose(SimResponseSchemaYup);

// Create Mongoose models
const SimRequest = mongoose.model('SimRequest', SimRequestSchema);
const SimResponse = mongoose.model('SimResponse', SimResponseSchema);

// Export schemas and models
module.exports = {
    DataPointSchema,
    PercentileSchema,
    DistributionParametersSchema,
    DistributionTypeSchema,
    SimSettingsSchema,
    SimulationInfoSchema,
    SimRequest,
    SimResponse,
    SimRequestSchema,
    SimResponseSchema,
    SimResultsSchema, // Added for consistency
};