// src/components/contextFields/ContextField.jsx - Complete with customValidator support and metrics
import React, { useCallback, useState } from 'react';
import { Form } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';
import { calculateAffectedMetrics } from '../../utils/metricsUtils';

// In ContextField.jsx - Make transform bidirectional
export const ContextField = ({
  // Context-specific props
  path,
  component: Component,
  transform,
  defaultValue,
  formMode = false,
  getValueOverride = null,
  updateValueOverride = null,
  name,
  children,

  // Custom validation function prop
  customValidator,

  // Metrics prop
  affectedMetrics = null,

  // Form.Item props
  label,
  tooltip,
  required,
  disabled,
  rules = [],
  componentProps = {},

  // All other props forwarded to Form.Item
  ...formItemProps
}) => {
  const { getValueByPath, updateByPath, scenarioData } = useScenario();
  const [directModeError, setDirectModeError] = useState(null);

  // Get current value based on mode
  const getRawValue = useCallback(() => {
    if (formMode && getValueOverride) {
      const value = getValueOverride(path, defaultValue);
      return value;
    }

    const contextValue = getValueByPath(path);

    // If context value doesn't exist and we have a default, initialize it immediately
    if ((contextValue === undefined || contextValue === null) && defaultValue !== undefined) {
      // Use form mode override if available, otherwise use direct context update
      if (formMode && updateValueOverride) {
        updateValueOverride(path, defaultValue);
      } else {
        // Fire and forget - don't block rendering  
        updateByPath(path, defaultValue).catch(console.error);
      }
      return defaultValue;
    }

    return contextValue;
  }, [formMode, getValueOverride, getValueByPath, path, defaultValue, updateByPath, updateValueOverride]);

  // Transform value FOR DISPLAY (context -> component)
  const getDisplayValue = useCallback(() => {
    const rawValue = getRawValue();

    // If transform function exists and has a toDisplay method, use it
    if (transform && typeof transform === 'object' && transform.toDisplay) {
      try {
        return transform.toDisplay(rawValue);
      } catch (error) {
        console.error('Transform toDisplay error:', error);
        return rawValue;
      }
    }

    // If transform is a function, assume it's the old onChange transform
    return rawValue;
  }, [getRawValue, transform]);

  // Transform value FOR STORAGE (component -> context)
  const transformForStorage = useCallback((value) => {
    // If transform function exists and has a toStorage method, use it
    if (transform && typeof transform === 'object' && transform.toStorage) {
      try {
        return transform.toStorage(value);
      } catch (error) {
        console.error('Transform toStorage error:', error);
        return value;
      }
    }

    // If transform is a function, use it as before (backward compatibility)
    if (transform && typeof transform === 'function') {
      return transform(value);
    }

    // Handle event objects
    return value?.target ? value.target.value : value;
  }, [transform]);

  // Validation logic stays the same...
  const validateDirectMode = useCallback((value) => {
    if (required) {
      const isEmpty = value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '');

      if (isEmpty) {
        return `${label || 'This field'} is required`;
      }
    }

    if (customValidator && typeof customValidator === 'function') {
      try {
        const customError = customValidator(value);
        if (customError) {
          return customError;
        }
      } catch (error) {
        console.error('Custom validator error:', error);
        return 'Validation error';
      }
    }

    return null;
  }, [required, label, customValidator]);

  const handleChange = useCallback(async (newValue) => {
    const actualValue = transformForStorage(newValue);

    // Form mode - delegate to form handler (metrics handled at form level)
    if (formMode && updateValueOverride) {
      updateValueOverride(path, actualValue);
      return;
    }

    // Direct mode validation
    const validationError = validateDirectMode(actualValue);
    if (validationError) {
      setDirectModeError(validationError);
      return;
    }

    setDirectModeError(null);

    // Direct mode - handle metrics here
    try {
      // Convert path array to dot notation string
      const pathString = Array.isArray(path) ? path.join('.') : path;

      // Prepare base update
      let updates = { [pathString]: actualValue };

      // Calculate affected metrics if declared (direct mode only)
      if (affectedMetrics && affectedMetrics.length > 0) {
        const prospectiveChanges = { [pathString]: actualValue };
        const metricUpdates = calculateAffectedMetrics(
          affectedMetrics,
          scenarioData,
          prospectiveChanges
        );

        // Merge field update with metric updates
        updates = { ...updates, ...metricUpdates };
      }

      // Single batch updateByPath call
      await updateByPath(updates);
    } catch (error) {
      console.error('Error updating field and metrics:', error);
    }
  }, [path, transformForStorage, formMode, updateValueOverride, updateByPath, validateDirectMode, affectedMetrics, scenarioData]);

  // Get the display value
  const currentValue = getDisplayValue();

  // Debug styling
  const debugBorders = process.env.REACT_APP_DEBUG_FORM_BORDERS === 'true';
  const debugStyle = debugBorders ? {
    border: '1px dashed red',
    padding: '2px',
    margin: '1px'
  } : {};

  // Build rules array for form mode
  const finalRules = [...rules];
  if (required) {
    finalRules.push({
      required: true,
      message: `${label || 'This field'} is required`
    });
  }

  // Form.Item props
  const finalFormItemProps = {
    label,
    tooltip,
    required,
    name: formMode ? name : undefined,
    rules: formMode ? (finalRules.length > 0 ? finalRules : undefined) : undefined,
    validateStatus: !formMode && directModeError ? 'error' : undefined,
    help: !formMode && directModeError ? directModeError : undefined,
    style: debugBorders ? { ...formItemProps.style, ...debugStyle } : formItemProps.style,
    ...formItemProps
  };

  // Determine if this is a Switch component and use proper props
  const isSwitch = Component && (Component.displayName === 'Switch' || Component.name === 'Switch' || 
                                 componentProps.type === 'switch' || formItemProps.valuePropName === 'checked');
  
  const componentPropsWithValue = isSwitch ? {
    ...componentProps,
    checked: currentValue,
    onChange: handleChange
  } : {
    ...componentProps,
    value: currentValue,
    onChange: handleChange
  };

  return (
    <Form.Item {...finalFormItemProps}>
      <Component
        {...componentPropsWithValue}
        disabled={disabled}
      >
        {children}
      </Component>
    </Form.Item>
  );
};