// src/hooks/useFormField.js
import { useCallback } from 'react';
import { useScenario } from '../contexts/ScenarioContext';

export const useFormField = (path, options = {}) => {
  const { 
    getValueByPath, 
    updateByPath,
    hasValidScenario 
  } = useScenario();
  
  const {
    defaultValue = null,
    transform,
    validate,
    onChange: customOnChange
  } = options;
  
  // Get the current value from context
  const value = getValueByPath(path, defaultValue);
  
  // Handle field change
  const handleChange = useCallback((newValue) => {
    // Apply transformation if provided
    const transformedValue = transform ? transform(newValue) : newValue;
    
    // Validate if validation function is provided
    if (validate) {
      const validationResult = validate(transformedValue);
      if (!validationResult.valid) {
        console.warn(`Validation error for ${path.join('.')}: ${validationResult.message}`);
        return;
      }
    }
    
    // Update context with new value
    if (hasValidScenario()) {
      updateByPath(path, transformedValue);
    }
    
    // Call custom onChange handler if provided
    if (customOnChange) {
      customOnChange(transformedValue, value);
    }
  }, [value, path, transform, validate, customOnChange, updateByPath, hasValidScenario]);
  
  return {
    value,
    onChange: handleChange,
    path
  };
};