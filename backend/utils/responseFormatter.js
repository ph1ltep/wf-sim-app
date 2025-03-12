// backend/utils/responseFormatter.js
/**
 * Format success responses in a consistent way
 * @param {Object} data - The data to include in the response
 * @param {string} message - Optional success message
 * @returns {Object} Formatted response object
 */
const formatSuccess = (data, message = 'Operation successful') => {
    return {
      success: true,
      message,
      data
    };
  };
  
  /**
   * Format error responses in a consistent way
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Formatted error object
   */
  const formatError = (message, statusCode = 500) => {
    return {
      success: false,
      error: message,
      statusCode
    };
  };
  
  module.exports = {
    formatSuccess,
    formatError
  };