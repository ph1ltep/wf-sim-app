// backend/utils/responseFormatter.js
const {
  SuccessResponseSchema,
  ErrorResponseSchema,
  ValidationResponseSchema,
  CrudResponseSchema,
  ListResponseSchema,
  SimulationResponseSchema
} = require('../../schemas/yup/response');

/**
 * Format success responses in a consistent way
 * @param {Object} data - The data to include in the response
 * @param {string} message - Optional success message
 * @param {string} type - Response type (default, crud, list, simulation)
 * @returns {Object} Formatted response object
 */
const formatSuccess = (data, message = 'Operation successful', type = 'default') => {
  const baseResponse = {
    success: true,
    message,
    data,
    timestamp: new Date()
  };

  try {
    // Use the appropriate schema based on response type
    let schema;
    switch (type) {
      case 'crud':
        schema = CrudResponseSchema;
        break;
      case 'list':
        schema = ListResponseSchema;
        break;
      case 'simulation':
        schema = SimulationResponseSchema;
        break;
      default:
        schema = SuccessResponseSchema;
    }

    // Validate and cast the response
    return schema.validateSync(baseResponse);
  } catch (error) {
    // If schema validation fails, return the base response
    console.warn('Response schema validation failed:', error.message);
    return baseResponse;
  }
};

/**
 * Format error responses in a consistent way
 * @param {string|Object} error - Error message or error object
 * @param {number} statusCode - HTTP status code
 * @param {Array} errors - Array of detailed error messages
 * @returns {Object} Formatted error object
 */
const formatError = (error, statusCode = 500, errors = []) => {
  // Development logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Error Details:', {
      error,
      statusCode,
      errors,
      stack: error.stack || 'No stack trace available'
    });
  }

  // Handle different error input types
  const errorMessage = typeof error === 'string'
    ? error
    : (error.message || 'An unexpected error occurred');

  // If errors array is not provided but error has details, use them
  const errorDetails = errors.length === 0 && error.errors ? error.errors : errors;

  const baseResponse = {
    success: false,
    error: errorMessage,
    statusCode,
    errors: errorDetails,
    timestamp: new Date()
  };

  try {
    // Validate and cast the error response
    return ErrorResponseSchema.validateSync(baseResponse);
  } catch (validationError) {
    // If schema validation fails, return the base error response
    console.warn('Error response schema validation failed:', validationError.message);
    return baseResponse;
  }
};

/**
 * Format validation responses in a consistent way
 * @param {boolean} isValid - Whether validation passed
 * @param {Array} errors - Array of error messages
 * @param {Object} details - Detailed validation results
 * @returns {Object} Formatted validation response
 */
const formatValidation = (isValid, errors = [], details = null) => {
  const baseResponse = {
    isValid,
    errors: Array.isArray(errors) ? errors : [errors].filter(Boolean),
    details
  };

  try {
    // Validate and cast the validation response
    return ValidationResponseSchema.validateSync(baseResponse);
  } catch (error) {
    // If schema validation fails, return the base validation response
    console.warn('Validation response schema validation failed:', error.message);
    return baseResponse;
  }
};

module.exports = {
  formatSuccess,
  formatError,
  formatValidation
};