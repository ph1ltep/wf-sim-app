// backend/utils/validate.js
const { formatValidation, formatError } = require('./responseFormatter');

/**
 * Validate an object against a Yup schema
 * @param {Object} schema - Yup schema
 * @param {Object} object - Object to validate
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validate = async (schema, object) => {
    try {
        await schema.validate(object, { abortEarly: false });
        return formatValidation(true, []);
    } catch (error) {
        return formatValidation(false, error.errors);
    }
};

/**
 * Validate a specific path in an object
 * @param {Object} schema - Yup schema
 * @param {string} path - Object path to validate
 * @param {any} value - Value to validate
 * @returns {Object} Validation result
 */
const validatePath = async (schema, path, value) => {
    try {
        await schema.validateAt(path, { [path]: value });
        return formatValidation(true, []);
    } catch (error) {
        return formatValidation(false, [error.message]);
    }
};

/**
 * Middleware for Express routes
 * @param {Object} schema - Yup schema to validate request.body against
 * @returns {Function} Express middleware function
 */
const validateMiddleware = (schema) => {
    return async (req, res, next) => {
        try {
            const result = await validate(schema, req.body);
            if (!result.isValid) {
                return res.status(400).json(formatError('Validation error', 400, result.errors));
            }

            // If validation passes, optionally cast the data to match schema
            try {
                req.body = await schema.validate(req.body, { stripUnknown: true });
            } catch (castError) {
                // If casting fails, continue with original data
                console.warn('Schema casting warning:', castError.message);
            }

            next();
        } catch (error) {
            return res.status(500).json(formatError(error, 500));
        }
    };
};

module.exports = {
    validate,
    validatePath,
    validateMiddleware
};