// schemas/yup/response.js
const Yup = require('yup');
const { SimulationInfoSchema, } = require('./distribution');

/**
 * Base API Response Schema
 * Common foundation for all API responses
 */
const BaseResponseSchema = Yup.object().shape({
    success: Yup.boolean().required(),
    message: Yup.string(),
    timestamp: Yup.date().default(() => new Date()),
});

/**
 * Success Response Schema
 * Used for all successful API responses
 */
const SuccessResponseSchema = BaseResponseSchema.concat(
    Yup.object().shape({
        success: Yup.boolean().default(true).required(),
        data: Yup.mixed().required(),
    })
);

/**
 * Error Response Schema
 * Used for all error API responses
 */
const ErrorResponseSchema = BaseResponseSchema.concat(
    Yup.object().shape({
        success: Yup.boolean().default(false).required(),
        error: Yup.string().required(),
        statusCode: Yup.number().default(500),
        errors: Yup.array().of(Yup.string()).default([]),
        details: Yup.mixed(), // For detailed error information
    })
);

/**
 * Pagination Response Schema
 * Used for paginated list endpoints
 */
const PaginationSchema = Yup.object().shape({
    total: Yup.number().required(),
    page: Yup.number().required(),
    limit: Yup.number().required(),
    pages: Yup.number().required(),
});

/**
 * Validation Response Schema
 * Common format for all validation responses
 */
const ValidationResponseSchema = Yup.object().shape({
    isValid: Yup.boolean().required(),
    errors: Yup.array().of(Yup.string()).default([]),
    error: Yup.string(),
    details: Yup.mixed(), // For detailed field-specific errors
});

/**
 * Field Validation Response Schema
 * For validating individual fields
 */
const FieldValidationResponseSchema = ValidationResponseSchema.concat(
    Yup.object().shape({
        applied: Yup.number().required().default(0), // Indicates if the value was applied to the field
        error: Yup.string().when('isValid', { is: false, then: Yup.string().required(), otherwise: Yup.string() }), // Primary error message if validation failed (optional)
        path: Yup.array().of(Yup.string()),
    })
);

/**
 * CRUD Response Schema
 * Used for CRUD operation responses with IDs
 */
const CrudResponseSchema = SuccessResponseSchema.concat(
    Yup.object().shape({
        data: Yup.object().shape({
            _id: Yup.string(), // Document ID
            createdAt: Yup.date(),
            updatedAt: Yup.date(),
        }),
    })
);

/**
 * List Response Schema
 * Used for list/collection endpoints
 */
const ListResponseSchema = SuccessResponseSchema.concat(
    Yup.object().shape({
        data: Yup.object().shape({
            pagination: PaginationSchema,
            items: Yup.array().required(),
            count: Yup.number(),
        }),
    })
);

/**
 * Simulation Response Schema
 * Used for simulation endpoints
 */
const SimulationResponseSchema = SuccessResponseSchema.concat(
    Yup.object().shape({
        data: Yup.object().shape({
            success: Yup.boolean().required(),
            simulationInfo: SimulationInfoSchema.required(),
            timeElapsed: Yup.number(),
        }),
    })
);

module.exports = {
    BaseResponseSchema,
    SuccessResponseSchema,
    ErrorResponseSchema,
    ValidationResponseSchema,
    FieldValidationResponseSchema,
    PaginationSchema,
    CrudResponseSchema,
    ListResponseSchema,
    SimulationResponseSchema,
};