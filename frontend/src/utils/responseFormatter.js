// src/utils/responseFormatter.js
/**
 * Format a validation result to ensure it matches ValidationResponseSchema
 * with optional details for component consumption
 * 
 * @param {Boolean} isValid - Whether validation passed
 * @param {Array} errors - Array of error messages (optional)
 * @param {Object} details - Additional details for component consumption (optional)
 * @returns {Object} Formatted validation response matching ValidationResponseSchema
 */
const formatValidation = (isValid, errors = [], details = null) => {
    const response = {
        isValid: !!isValid,
        errors: Array.isArray(errors) ? errors : []
    };

    // Set error property to first error if validation failed
    if (!response.isValid && response.errors.length > 0) {
        response.error = response.errors[0];
    }

    // Include details if provided
    if (details) {
        response.details = details;
    }

    // Log debugging info in development mode
    const NODE_ENV = process.env.NODE_ENV || 'development';
    if (process.env.NODE_ENV === 'development' && !response.isValid) {
        console.warn(`Validation failed${details?.path ? ` for path: ${details.path}` : ''}`, {
            ...details,
            error: response.error
        });
    }

    return response;
};

module.exports = { formatValidation };