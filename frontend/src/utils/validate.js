// frontend/src/utils/validate.js
const Yup = require('yup');

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
 * @returns {Object} Validation result with isValid flag and errors array
 */
const validate = async (schema, object) => {
    try {
        await schema.validate(object, { abortEarly: false });
        return { isValid: true, errors: [] };
    } catch (error) {
        return { isValid: false, errors: error.errors };
    }
};

/**
 * Validate a specific path within a schema
 * @param {Object} schema - Yup schema
 * @param {Array|string} path - Path as array (e.g., ['settings', 'general', 'projectName']) or dot notation string
 * @param {any} value - Value to validate
 * @param {Object} context - Optional parent object for context (needed for some validations)
 * @returns {Object} FieldValidationResponse
 */
const validatePath = async (schema, path, value, context = {}) => {
    // Convert path to array if it's a string
    const pathArray = Array.isArray(path) ? path : path.split('.');

    // Create a test object with this path and value
    const testObj = {};
    let current = testObj;

    // Build nested object structure
    for (let i = 0; i < pathArray.length - 1; i++) {
        current[pathArray[i]] = {};
        current = current[pathArray[i]];
    }

    // Set the value at the final path
    current[pathArray[pathArray.length - 1]] = value;

    // If context is provided, merge with test object
    const objToValidate = context ? mergeDeep({ ...context }, testObj) : testObj;

    try {
        // Convert path to Yup-compatible string
        const yupPath = pathArray.join('.');

        // Validate just this path
        await schema.validateAt(yupPath, objToValidate);

        // Try to get default value if needed
        let defaultValue;
        try {
            const defaultObj = schema.getDefault() || {};
            defaultValue = pathArray.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, defaultObj);
        } catch (e) {
            defaultValue = undefined;
        }

        return {
            isValid: true,
            value,
            defaultValue,
            errors: []
        };
    } catch (error) {
        // Try to cast the value to correct type if possible
        let castedValue = value;
        let castSuccessful = false;

        try {
            // Create a subschema just for this field if possible
            const fieldSchema = extractSubSchema(schema, pathArray);
            if (fieldSchema) {
                castedValue = fieldSchema.cast(value);

                // Validate the casted value
                await schema.validateAt(pathArray.join('.'), {
                    ...objToValidate,
                    [pathArray[0]]: {
                        ...objToValidate[pathArray[0]],
                        [pathArray[pathArray.length - 1]]: castedValue
                    }
                });
                castSuccessful = true;
            }
        } catch (castError) {
            // Casting or validation of casted value failed
            castedValue = value;
        }

        // Get default value from schema
        let defaultValue;
        try {
            const defaultObj = schema.getDefault() || {};
            defaultValue = pathArray.reduce((obj, key) => (obj && obj[key] !== undefined) ? obj[key] : undefined, defaultObj);
        } catch (e) {
            defaultValue = undefined;
        }

        return {
            isValid: false,
            value: castSuccessful ? castedValue : value,
            defaultValue,
            errors: [error.message],
            error: error.message
        };
    }
};

/**
 * Extract a subschema for a specific path
 * @param {Object} schema - Yup schema
 * @param {Array} path - Path as array
 * @returns {Object|null} Yup subschema or null if not found
 */
const extractSubSchema = (schema, path) => {
    try {
        // Try to get the schema description
        const description = schema.describe();

        // Navigate to the field in the description
        let current = description.fields;
        for (let i = 0; i < path.length; i++) {
            if (!current || !current[path[i]]) {
                return null;
            }
            if (i < path.length - 1) {
                current = current[path[i]].fields;
            } else {
                const fieldDesc = current[path[i]];

                // Reconstruct a schema based on the field type
                switch (fieldDesc.type) {
                    case 'string':
                        return Yup.string();
                    case 'number':
                        return Yup.number();
                    case 'boolean':
                        return Yup.boolean();
                    case 'date':
                        return Yup.date();
                    case 'array':
                        return Yup.array();
                    case 'object':
                        return Yup.object();
                    default:
                        return Yup.mixed();
                }
            }
        }
        return null;
    } catch (e) {
        return null;
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
    extractSubSchema,
    mergeDeep
};