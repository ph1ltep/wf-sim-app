// schemas/yup/validation.js
const Yup = require('yup');

/**
 * Schema for field validation response
 * Used for returning validation results from v2 methods
 */
const FieldValidationResponseSchema = Yup.object().shape({
    isValid: Yup.boolean().required(),
    applied: Yup.boolean().required().default(false), // Indicates if the value was applied to the field
    value: Yup.mixed().required(), // The original or casted value that was validated
    defaultValue: Yup.mixed(), // Default value for this field from the schema (optional)
    errors: Yup.array().of(Yup.string()).default([]), // Array of error messages if validation failed
    error: Yup.string().when('isValid', { is: false, then: Yup.string().required(), otherwise: Yup.string() }), // Primary error message if validation failed (optional)
    path: Yup.array().of(Yup.string()),
});

module.exports = {
    FieldValidationResponseSchema
};