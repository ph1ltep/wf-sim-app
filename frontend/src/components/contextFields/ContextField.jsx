// src/components/contextFields/ContextField.jsx - Enhanced version with improved default value handling
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Form } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

// Enhanced ContextField with better Ant Design integration
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

  // Use provided overrides when in form mode, or context functions otherwise
  const getValue = formMode && getValueOverride ? getValueOverride : getValueByPath;
  const updateValue = formMode && updateValueOverride ? updateValueOverride : updateByPath;

  // Get current value - handle initialization state
  const currentValue = getValue(path, null);
  
  // Determine effective value considering initialization
  const effectiveValue = isInitialized ? currentValue : (currentValue ?? defaultValue);

  // Handle change with validation
  const handleChange = useCallback(async (newValue) => {
    // Set validating state
    setValidationState(prev => ({
      ...prev,
      isValidating: true
    }));

    try {
      // Apply transform function if provided (e.g., for checkbox which returns event)
      const actualValue = transform ? transform(newValue) : (newValue && newValue.target ? newValue.target.value : newValue);

      // Use the appropriate update method
      const result = await updateValue(path, actualValue);

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
  }, [path, updateValue, transform]);

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

      if (needsInitialization) {
        initializationRef.current = true;
        
        try {
          // Initialize the path with default value (even for disabled fields)
          const result = await updateValue(path, defaultValue);
          
          if (result.isValid) {
            setIsInitialized(true);
          } else {
            // If initialization fails, still mark as initialized to prevent loops
            setIsInitialized(true);
            console.warn(`Failed to initialize default value for path ${Array.isArray(path) ? path.join('.') : path}:`, result.error);
          }
        } catch (error) {
          setIsInitialized(true);
          console.error(`Error initializing default value for path ${Array.isArray(path) ? path.join('.') : path}:`, error);
        }
      } else {
        // No initialization needed
        setIsInitialized(true);
      }
    };

    // Use requestAnimationFrame to ensure this runs after initial render
    const rafId = requestAnimationFrame(() => {
      initializeDefaultValue();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [path, defaultValue, currentValue, updateValue]); // Removed 'disabled' dependency


  // Reset initialization state when path changes
  useEffect(() => {
    initializationRef.current = false;
    setIsInitialized(false);
  }, [path]);

  // Clear validation state when value changes externally (not through this field)
  useEffect(() => {
    if (validationState.status === 'error' && !validationState.isValidating && isInitialized) {
      // If we have an error but the value has changed externally, clear the error
      // This happens when the context is updated from elsewhere
      const timeoutId = setTimeout(() => {
        setValidationState(prev => ({
          ...prev,
          status: undefined,
          message: null
        }));
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [currentValue, validationState.status, validationState.isValidating, isInitialized]);

  // Debug border support
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed red',
    padding: '2px',
    margin: '1px'
  } : {};

  // Map context validation to Ant Design validation props
  const validationProps = {
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
    style: debugBorders ? { ...formItemProps.style, ...debugStyle } : formItemProps.style,
    ...validationProps,
    ...formItemProps // This allows override of our defaults, but validation props take precedence
  };

  // Determine component status for visual feedback
  const componentStatus = validationState.status === 'error' ? 'error' : 
                         validationState.status === 'validating' ? 'validating' : 
                         undefined;

  // Don't render until initialization is complete to avoid flicker
  if (!isInitialized) {
    return (
      <Form.Item {...finalFormItemProps}>
        <Component 
          disabled={true} // Always disabled during initialization
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