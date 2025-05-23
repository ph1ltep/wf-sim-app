// src/components/contextFields/ContextField.jsx - Enhanced with automatic path mapping and context isolation
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Form } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

// Enhanced ContextField with better Ant Design integration and context isolation
export const ContextField = ({
  // Context-specific props (not passed to Form.Item)
  path,
  component: Component,
  transform,
  defaultValue,
  formMode = false,
  getValueOverride = null,
  updateValueOverride = null,
  validators = [],
  name, // Form.Item name for Ant Design integration

  // Form.Item props that we handle specially
  label,
  tooltip,
  required,
  disabled,

  // All other props are forwarded to Form.Item
  ...formItemProps
}) => {
  const [validationState, setValidationState] = useState({
    status: undefined,
    message: null,
    isValidating: false
  });
  
  const [isInitialized, setIsInitialized] = useState(false);
  const initializationRef = useRef(false);
  const { getValueByPath, updateByPath } = useScenario();

  // Determine the effective path for this field
  const effectivePath = path;

  // Use form overrides when in form mode, or context functions otherwise
  const getValue = useCallback((fieldPath, fallback = null) => {
    if (formMode && getValueOverride) {
      return getValueOverride(fieldPath, fallback);
    }
    return getValueByPath(fieldPath, fallback);
  }, [formMode, getValueOverride, getValueByPath]);

  const updateValue = useCallback(async (fieldPath, value) => {
    if (formMode && updateValueOverride) {
      // In form mode, prevent any context updates
      return updateValueOverride(fieldPath, value);
    }
    // Only update context when not in form mode
    return updateByPath(fieldPath, value);
  }, [formMode, updateValueOverride, updateByPath]);

  // Get current value - handle initialization state
  const currentValue = getValue(effectivePath, null);
  
  // Determine effective value considering initialization
  const effectiveValue = isInitialized ? currentValue : (currentValue ?? defaultValue);

  // Handle change with validation
  const handleChange = useCallback(async (newValue) => {
    // Apply transform function if provided
    const actualValue = transform ? transform(newValue) : (newValue && newValue.target ? newValue.target.value : newValue);

    // In form mode, validation is handled by the form, so we can skip async validation
    if (formMode && updateValueOverride) {
      try {
        // Update form value directly - this will not touch the context
        const result = updateValueOverride(effectivePath, actualValue);
        
        // Clear any existing validation errors since form handles validation
        setValidationState({
          status: undefined,
          message: null,
          isValidating: false
        });
        
        return result;
      } catch (error) {
        console.error('Form field update error:', error);
        return {
          isValid: false,
          applied: 0,
          errors: ['Form update failed'],
          error: 'Form update failed'
        };
      }
    }

    // Non-form mode: handle with full async validation and context updates
    setValidationState(prev => ({
      ...prev,
      isValidating: true
    }));

    try {
      // Use the appropriate update method (this will update context)
      const result = await updateValue(effectivePath, actualValue);

      // Update validation state based on result
      if (!result.isValid) {
        setValidationState({
          status: 'error',
          message: result.error || 'Validation failed',
          isValidating: false
        });
      } else {
        // Clear validation state on success
        setValidationState({
          status: 'success',
          message: null,
          isValidating: false
        });
        
        // Clear success status after a short delay for better UX
        setTimeout(() => {
          setValidationState(prev => ({
            ...prev,
            status: undefined
          }));
        }, 1000);
      }

      return result;
    } catch (error) {
      // Handle unexpected errors
      setValidationState({
        status: 'error',
        message: 'An unexpected error occurred',
        isValidating: false
      });
      
      console.error('ContextField validation error:', error);
      return {
        isValid: false,
        applied: 0,
        errors: ['An unexpected error occurred'],
        error: 'An unexpected error occurred'
      };
    }
  }, [effectivePath, updateValue, updateValueOverride, transform, formMode]);

  // Enhanced default value initialization
  useEffect(() => {
    const initializeDefaultValue = async () => {
      // Prevent multiple initializations
      if (initializationRef.current) {
        return;
      }

      const needsInitialization = 
        defaultValue !== undefined &&
        defaultValue !== null &&
        (currentValue === undefined || currentValue === null);

      if (needsInitialization && !formMode) {
        // Only initialize in non-form mode
        initializationRef.current = true;
        
        try {
          // Initialize the path with default value
          const result = await updateValue(effectivePath, defaultValue);
          
          if (result.isValid) {
            setIsInitialized(true);
          } else {
            // If initialization fails, still mark as initialized to prevent loops
            setIsInitialized(true);
            console.warn(`Failed to initialize default value for path ${Array.isArray(effectivePath) ? effectivePath.join('.') : effectivePath}:`, result.error);
          }
        } catch (error) {
          setIsInitialized(true);
          console.error(`Error initializing default value for path ${Array.isArray(effectivePath) ? effectivePath.join('.') : effectivePath}:`, error);
        }
      } else {
        // No initialization needed or in form mode
        setIsInitialized(true);
      }
    };

    // In form mode, skip default value initialization as the form handles initial values
    if (formMode) {
      setIsInitialized(true);
      return;
    }

    // Use requestAnimationFrame to ensure this runs after initial render
    const rafId = requestAnimationFrame(() => {
      initializeDefaultValue();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [effectivePath, defaultValue, currentValue, updateValue, formMode]);

  // Reset initialization state when path changes
  useEffect(() => {
    initializationRef.current = false;
    setIsInitialized(formMode); // In form mode, consider initialized immediately
  }, [effectivePath, formMode]);

  // Clear validation state when value changes externally (not through this field)
  useEffect(() => {
    if (validationState.status === 'error' && !validationState.isValidating && isInitialized && !formMode) {
      // If we have an error but the value has changed externally, clear the error
      // This happens when the context is updated from elsewhere
      // Skip this in form mode as the form handles validation
      const timeoutId = setTimeout(() => {
        setValidationState(prev => ({
          ...prev,
          status: undefined,
          message: null
        }));
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [currentValue, validationState.status, validationState.isValidating, isInitialized, formMode]);

  // Debug border support
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed red',
    padding: '2px',
    margin: '1px'
  } : {};

  // Map context validation to Ant Design validation props (skip in form mode)
  const validationProps = formMode ? {} : {
    validateStatus: validationState.status,
    help: validationState.message,
    hasFeedback: validationState.isValidating || validationState.status === 'success'
  };

  // Handle required field validation display
  const effectiveRequired = required || (formItemProps.rules && formItemProps.rules.some(rule => rule.required));

  // Combine all Form.Item props
  const finalFormItemProps = {
    label,
    tooltip,
    required: effectiveRequired,
    name: formMode ? name : undefined, // Only set name in form mode
    style: debugBorders ? { ...formItemProps.style, ...debugStyle } : formItemProps.style,
    ...validationProps,
    ...formItemProps // This allows override of our defaults, but validation props take precedence
  };

  // Determine component status for visual feedback (skip in form mode)
  const componentStatus = formMode ? undefined : 
                         (validationState.status === 'error' ? 'error' : 
                          validationState.status === 'validating' ? 'validating' : 
                          undefined);

  // Don't render until initialization is complete to avoid flicker (except in form mode)
  if (!isInitialized && !formMode) {
    return (
      <Form.Item {...finalFormItemProps}>
        <Component 
          disabled={true}
          value={effectiveValue}
          onChange={() => {}} // No-op during initialization
          status="validating"
          placeholder="Initializing..."
          {...(formItemProps.componentProps || {})}
        />
      </Form.Item>
    );
  }

  return (
    <Form.Item {...finalFormItemProps}>
      <Component 
        disabled={disabled}
        value={effectiveValue}
        onChange={handleChange}
        status={componentStatus}
        {...(formItemProps.componentProps || {})} // Allow passing props specifically to the component
      />
    </Form.Item>
  );
};