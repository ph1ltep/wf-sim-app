// schemas/mongoose/distributionSchemas.js
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

// Mock SimResultsSchema (from Scenario.js) for consistency
const SimResultsSchema = yupToMongoose(require('../yup/scenario').SimResultsSchema);

// Generate Mongoose schemas with overrides
const DataPointSchema = yupToMongoose(DataPointSchemaYup);
const PercentileSchema = yupToMongoose(PercentileSchemaYup, {
    label: { type: String, get: function () { return `P${this.value}`; } }, // Add getter
});
const DistributionParametersSchema = yupToMongoose(DistributionParametersSchemaYup);
const DistributionTypeSchema = yupToMongoose(DistributionTypeSchemaYup);
const SimSettingsSchema = yupToMongoose(SimSettingsSchemaYup);
const SimulationInfoSchema = yupToMongoose(SimulationInfoSchemaYup, {
    results: { type: [SimResultsSchema], required: true, default: [] }, // Reference mock
});
const SimRequestSchema = yupToMongoose(SimRequestSchemaYup, {
    distributions: {
        type: [DistributionTypeSchema],
        required: true,
        validate: {
            validator: function (distributions) {
                return distributions && distributions.length > 0;
            },
            message: 'At least one distribution is required',
        },
    },
});
const SimResponseSchema = yupToMongoose(SimResponseSchemaYup);

// Export models and schemas
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
    SimResponseSchema,
};