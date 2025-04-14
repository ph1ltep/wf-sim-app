// frontend/src/utils/validate.js
const Yup = require('yup');
const { formatValidation } = require('./responseFormatter');

/**
 * Validate a single field against a schema
 * @param {Object} schema - Yup schema
 * @param {string} fieldName - Field name to validate
 * @param {any} value - Field value to validate
 * @returns {string} Error message or empty string if valid
 */
const validateField = async (schema, fieldName, value) => {
    try {
        await schema.validateAt(fieldName, { [fieldName]: value });
        return '';
    } catch (error) {
        return error.message;
    }
};

/**
 * Validate a complete object against a schema
 * @param {Object} schema - Yup schema
 * @param {Object} object - Object to validate
 * @returns {Object} ValidationResponseSchema object
 */
const validate = async (schema, object) => {
    try {
        await schema.validate(object, { abortEarly: false });
        return formatValidation(true);
    } catch (error) {
        return formatValidation(false, error.errors);
    }
};

/**
 * Validate a specific path within a schema
 * Uses a two-tier approach:
 * 1. First tries direct field validation using Yup.reach
 * 2. Falls back to full object validation if needed
 * 
 * @param {Object} schema - Yup schema
 * @param {Array|string} path - Path as array or dot notation string
 * @param {any} value - Value to validate
 * @param {Object} context - Optional parent object for context
 * @returns {Object} FieldValidationResponse
 */
const validatePath = async (schema, path, value, context = {}) => {
    // Convert path to array if it's a string
    const pathArray = Array.isArray(path) ? path : path.split('.');
    const pathString = pathArray.join('.');

    try {
        // First try to reach the field schema directly
        const fieldSchema = Yup.reach(schema, pathString);

        try {
            // Validate directly against the field schema
            const validatedValue = await fieldSchema.validate(value);

            // Get default value if possible
            let defaultValue;
            try {
                defaultValue = fieldSchema.default();
            } catch (e) {
                defaultValue = undefined;
            }

            return formatValidation(true, [], {
                path: pathString,
                value: validatedValue,
                defaultValue,
                applied: true,
                method: 'direct'
            });
        } catch (validationError) {
            return formatValidation(false, [validationError.message], {
                path: pathString,
                value,
                applied: false,
                method: 'direct'
            });
        }
    } catch (reachError) {
        // Fall back to full object validation when direct access fails
        return await validateWithFullObject(schema, pathArray, value, context);
    }
};

/**
 * Helper function to validate using the full object approach
 * Used when direct field validation is not possible
 */
const validateWithFullObject = async (schema, pathArray, value, context = {}) => {
    const pathString = pathArray.join('.');

    // Create a nested object with the value at the specified path
    const testObj = {};
    let current = testObj;

    // Build the nested structure
    for (let i = 0; i < pathArray.length - 1; i++) {
        current[pathArray[i]] = {};
        current = current[pathArray[i]];
    }

    // Set the value at the leaf
    current[pathArray[pathArray.length - 1]] = value;

    // Merge with context if provided
    const objToValidate = context ? mergeDeep({ ...context }, testObj) : testObj;

    try {
        // Validate the path in the context of the full object
        await schema.validateAt(pathString, objToValidate);

        // Try to get default value from schema
        let defaultValue;
        try {
            const defaultObj = schema.getDefault() || {};
            defaultValue = pathArray.reduce(
                (obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined,
                defaultObj
            );
        } catch (e) {
            defaultValue = undefined;
        }

        return formatValidation(true, [], {
            path: pathString,
            value,
            defaultValue,
            applied: true,
            method: 'full-object'
        });
    } catch (error) {
        return formatValidation(false, [error.message], {
            path: pathString,
            value,
            applied: false,
            method: 'full-object'
        });
    }
};

/**
 * Deep merge utility function
 */
function mergeDeep(target, source) {
    const output = Object.assign({}, target);

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
}

function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

module.exports = {
    validateField,
    validate,
    validatePath,
    mergeDeep
};