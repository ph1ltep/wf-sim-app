/**
 * Mongoose schema for Component Failure Rates
 * Auto-generated from Yup schema using existing pattern
 */

const yupToMongoose = require('../utils/yupToMongoose');
const {
    ComponentFailureRateSchema,
    ComponentFailureModelingSchema,
    DEFAULT_COMPONENTS,
    COMPONENT_METADATA
} = require('../yup/componentFailureRates');

// Convert Yup schemas to Mongoose schemas
const ComponentFailureRateMongoose = yupToMongoose(ComponentFailureRateSchema);
const ComponentFailureModelingMongoose = yupToMongoose(ComponentFailureModelingSchema);

module.exports = {
    ComponentFailureRateSchema: ComponentFailureRateMongoose,
    ComponentFailureModelingSchema: ComponentFailureModelingMongoose,
    DEFAULT_COMPONENTS,
    COMPONENT_METADATA
};