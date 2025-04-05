// src/utils/validation.js
import * as yup from 'yup';

/**
 * Factory functions to create common validation schemas
 */
export const Validation = {
  /**
   * Required field validation
   * @param {string} message - Custom error message
   * @returns {Object} Yup validation schema
   */
  required: (message = 'This field is required') => 
    yup.mixed().required(message),
  
  /**
   * Text field validation
   * @param {Object} options - Validation options
   * @param {boolean} options.required - Whether field is required
   * @param {number} options.min - Minimum length
   * @param {number} options.max - Maximum length
   * @param {string} options.matches - Regex pattern to match
   * @param {string} options.customMessage - Custom error message
   * @returns {Object} Yup validation schema
   */
  text: ({ 
    required = false, 
    min, 
    max, 
    matches, 
    customMessage 
  } = {}) => {
    let schema = yup.string();
    
    if (required) {
      schema = schema.required(customMessage || 'This field is required');
    }
    
    if (min !== undefined) {
      schema = schema.min(min, customMessage || `Must be at least ${min} characters`);
    }
    
    if (max !== undefined) {
      schema = schema.max(max, customMessage || `Must be at most ${max} characters`);
    }
    
    if (matches) {
      schema = schema.matches(matches, customMessage || 'Invalid format');
    }
    
    return schema;
  },
  
  /**
   * Number field validation
   * @param {Object} options - Validation options
   * @param {boolean} options.required - Whether field is required
   * @param {number} options.min - Minimum value
   * @param {number} options.max - Maximum value
   * @param {boolean} options.integer - Whether value must be an integer
   * @param {boolean} options.positive - Whether value must be positive
   * @param {string} options.customMessage - Custom error message
   * @returns {Object} Yup validation schema
   */
  number: ({ 
    required = false, 
    min, 
    max, 
    integer = false, 
    positive = false,
    customMessage 
  } = {}) => {
    let schema = yup.number();
    
    if (required) {
      schema = schema.required(customMessage || 'This field is required');
    }
    
    if (min !== undefined) {
      schema = schema.min(min, customMessage || `Must be at least ${min}`);
    }
    
    if (max !== undefined) {
      schema = schema.max(max, customMessage || `Must be at most ${max}`);
    }
    
    if (integer) {
      schema = schema.integer(customMessage || 'Must be an integer');
    }
    
    if (positive) {
      schema = schema.positive(customMessage || 'Must be positive');
    }
    
    return schema;
  },
  
  /**
   * Currency field validation
   * @param {Object} options - Validation options
   * @returns {Object} Yup validation schema
   */
  currency: (options = {}) => 
    Validation.number({
      min: 0,
      ...options,
      customMessage: options.customMessage || 'Please enter a valid amount'
    }),
  
  /**
   * Percentage field validation
   * @param {Object} options - Validation options
   * @returns {Object} Yup validation schema
   */
  percentage: (options = {}) => 
    Validation.number({
      min: 0,
      max: 100,
      ...options,
      customMessage: options.customMessage || 'Please enter a valid percentage'
    }),
  
  /**
   * Email field validation
   * @param {Object} options - Validation options
   * @returns {Object} Yup validation schema
   */
  email: ({ required = false, customMessage } = {}) => {
    let schema = yup.string().email(customMessage || 'Please enter a valid email');
    
    if (required) {
      schema = schema.required(customMessage || 'Email is required');
    }
    
    return schema;
  },
  
  /**
   * Conditional validation based on when another field has a certain value
   * @param {string} fieldName - Name of the field to check
   * @param {any} equals - Value to compare with
   * @param {Object} then - Validation to apply when condition is true
   * @param {Object} otherwise - Validation to apply when condition is false
   * @returns {Object} Yup validation schema
   */
  when: (fieldName, { equals, then, otherwise }) => 
    yup.mixed().when(fieldName, {
      is: equals,
      then: then,
      otherwise: otherwise
    }),
  
  /**
   * Validate that a field is one of a set of values
   * @param {Array} values - Array of valid values
   * @param {string} message - Custom error message
   * @returns {Object} Yup validation schema
   */
  oneOf: (values, message) => 
    yup.mixed().oneOf(values, message || `Must be one of: ${values.join(', ')}`),
  
  /**
   * Object validation schema builder
   * @param {Object} shape - Object with field validation schemas
   * @returns {Object} Yup validation schema
   */
  object: (shape) => 
    yup.object(shape).required(),
  
  /**
   * Array validation schema builder
   * @param {Object} schema - Validation schema for array items
   * @param {Object} options - Validation options
   * @returns {Object} Yup validation schema
   */
  array: (schema, { 
    required = false, 
    min, 
    max, 
    customMessage 
  } = {}) => {
    let arraySchema = yup.array().of(schema);
    
    if (required) {
      arraySchema = arraySchema.required(customMessage || 'This field is required');
    }
    
    if (min !== undefined) {
      arraySchema = arraySchema.min(min, customMessage || `Must have at least ${min} items`);
    }
    
    if (max !== undefined) {
      arraySchema = arraySchema.max(max, customMessage || `Must have at most ${max} items`);
    }
    
    return arraySchema;
  },
  
  /**
   * Boolean field validation
   * @param {boolean} required - Whether field is required
   * @param {string} message - Custom error message
   * @returns {Object} Yup validation schema
   */
  boolean: (required = false, message) => {
    let schema = yup.boolean();
    
    if (required) {
      schema = schema.required(message || 'This field is required');
    }
    
    return schema;
  },
  
  /**
   * Date field validation
   * @param {Object} options - Validation options
   * @returns {Object} Yup validation schema
   */
  date: ({ 
    required = false, 
    min, 
    max, 
    customMessage 
  } = {}) => {
    let schema = yup.date();
    
    if (required) {
      schema = schema.required(customMessage || 'This field is required');
    }
    
    if (min !== undefined) {
      schema = schema.min(min, customMessage || `Date must be after ${min}`);
    }
    
    if (max !== undefined) {
      schema = schema.max(max, customMessage || `Date must be before ${max}`);
    }
    
    return schema;
  }
};