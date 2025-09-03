// src/utils/PathTranslator.js - Utility for managing path translation between context and form modes
import { get, set, cloneDeep } from 'lodash';

/**
 * PathTranslator utility class for managing nested field paths in form mode
 * Provides seamless translation between Ant Design form field names and context paths
 */
export class PathTranslator {
  /**
   * Convert a context path array to a form field name
   * @param {Array} contextPath - Array representing context path (e.g., ['settings', 'financial', 'discountRate'])
   * @param {string} baseName - Base name for the form field (e.g., 'marketFactor')
   * @returns {string} Form field name (e.g., 'marketFactor.settings.financial.discountRate')
   */
  static contextPathToFieldName(contextPath, baseName = null) {
    if (!Array.isArray(contextPath)) {
      throw new Error('contextPath must be an array');
    }
    
    const pathString = contextPath.join('.');
    return baseName ? `${baseName}.${pathString}` : pathString;
  }

  /**
   * Convert a form field name to a context path array
   * @param {string} fieldName - Form field name (e.g., 'marketFactor.settings.financial.discountRate')
   * @param {string} baseName - Base name to remove from the field name (e.g., 'marketFactor')
   * @returns {Array} Context path array (e.g., ['settings', 'financial', 'discountRate'])
   */
  static fieldNameToContextPath(fieldName, baseName = null) {
    if (typeof fieldName !== 'string') {
      throw new Error('fieldName must be a string');
    }

    if (baseName && fieldName.startsWith(`${baseName}.`)) {
      const pathString = fieldName.substring(baseName.length + 1);
      return pathString.split('.');
    }

    return fieldName.split('.');
  }

  /**
   * Generate form field names for a distribution object
   * @param {string} baseName - Base name for the distribution (e.g., 'electricityPrice')
   * @returns {Object} Object with form field names for distribution properties
   */
  static generateDistributionFieldNames(baseName) {
    if (!baseName) {
      throw new Error('baseName is required');
    }

    return {
      type: `${baseName}.type`,
      'parameters.value': `${baseName}.parameters.value`,
      'timeSeriesMode': `${baseName}.timeSeriesMode`,
      'timeSeriesParameters.value': `${baseName}.timeSeriesParameters.value`,
      'metadata.percentileDirection': `${baseName}.metadata.percentileDirection`
    };
  }

  /**
   * Get value from form data using context path
   * @param {Object} formData - Form data object from Ant Design form
   * @param {Array} contextPath - Context path array
   * @param {string} baseName - Base name for the form field
   * @param {*} defaultValue - Default value if path doesn't exist
   * @returns {*} Value at the specified path
   */
  static getFormValue(formData, contextPath, baseName = null, defaultValue = undefined) {
    if (!formData || !Array.isArray(contextPath)) {
      return defaultValue;
    }

    const fieldName = this.contextPathToFieldName(contextPath, baseName);
    return get(formData, fieldName, defaultValue);
  }

  /**
   * Set value in form data using context path
   * @param {Object} formData - Form data object to modify
   * @param {Array} contextPath - Context path array
   * @param {*} value - Value to set
   * @param {string} baseName - Base name for the form field
   * @returns {Object} Modified form data object
   */
  static setFormValue(formData, contextPath, value, baseName = null) {
    if (!Array.isArray(contextPath)) {
      throw new Error('contextPath must be an array');
    }

    const fieldName = this.contextPathToFieldName(contextPath, baseName);
    const clonedData = cloneDeep(formData);
    set(clonedData, fieldName, value);
    return clonedData;
  }

  /**
   * Transform form data to context data structure
   * @param {Object} formData - Form data from Ant Design form
   * @param {string} baseName - Base name to extract from form field names
   * @returns {Object} Context data structure
   */
  static formDataToContextData(formData, baseName = null) {
    if (!formData || typeof formData !== 'object') {
      return {};
    }

    const contextData = {};

    Object.keys(formData).forEach(fieldName => {
      const contextPath = this.fieldNameToContextPath(fieldName, baseName);
      set(contextData, contextPath.join('.'), formData[fieldName]);
    });

    return contextData;
  }

  /**
   * Transform context data to form data structure
   * @param {Object} contextData - Context data structure
   * @param {string} baseName - Base name to prefix form field names
   * @returns {Object} Form data structure
   */
  static contextDataToFormData(contextData, baseName = null) {
    if (!contextData || typeof contextData !== 'object') {
      return {};
    }

    const formData = {};

    const flattenObject = (obj, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newPrefix = prefix ? `${prefix}.${key}` : key;
        
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, newPrefix);
        } else {
          const fieldName = baseName ? `${baseName}.${newPrefix}` : newPrefix;
          formData[fieldName] = value;
        }
      });
    };

    flattenObject(contextData);
    return formData;
  }

  /**
   * Create getValueOverride function for form mode
   * @param {Object} formData - Current form data
   * @param {Function} setFormData - Function to update form data
   * @param {string} baseName - Base name for form fields
   * @returns {Function} getValueOverride function
   */
  static createGetValueOverride(formData, setFormData, baseName = null) {
    return (contextPath, defaultValue = undefined) => {
      return this.getFormValue(formData, contextPath, baseName, defaultValue);
    };
  }

  /**
   * Create updateValueOverride function for form mode
   * @param {Object} formData - Current form data
   * @param {Function} setFormData - Function to update form data
   * @param {string} baseName - Base name for form fields
   * @returns {Function} updateValueOverride function
   */
  static createUpdateValueOverride(formData, setFormData, baseName = null) {
    return (contextPath, value) => {
      const newFormData = this.setFormValue(formData, contextPath, value, baseName);
      setFormData(newFormData);
    };
  }

  /**
   * Create form field props for DistributionFieldV3
   * @param {Object} formData - Current form data
   * @param {Function} setFormData - Function to update form data
   * @param {string} baseName - Base name for form fields
   * @returns {Object} Props object for DistributionFieldV3
   */
  static createDistributionFormProps(formData, setFormData, baseName) {
    if (!baseName) {
      throw new Error('baseName is required for distribution form props');
    }

    return {
      formMode: true,
      name: baseName,
      getValueOverride: this.createGetValueOverride(formData, setFormData, baseName),
      updateValueOverride: this.createUpdateValueOverride(formData, setFormData, baseName)
    };
  }
}

export default PathTranslator;