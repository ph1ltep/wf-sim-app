// src/components/contextFields/ContextField.jsx - Modified version
import React, { useState, useCallback } from 'react';
import { Form } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

// Enhanced ContextField with formMode support
export const ContextField = ({
  path,
  label,
  component: Component,
  tooltip,
  required,
  disabled,
  validators = [], // Custom validators
  transform, // Optional transform function for the input value

  // New props for form mode
  formMode = false,
  getValueOverride = null,
  updateValueOverride = null,

  ...rest
}) => {
  const [error, setError] = useState(null);
  const { getValueByPath, updateByPath } = useScenario();

  // Use provided overrides when in form mode, or context functions otherwise
  const getValue = formMode && getValueOverride ? getValueOverride : getValueByPath;
  const updateValue = formMode && updateValueOverride ? updateValueOverride : updateByPath;

  // Get current value
  const value = getValue(path, null);

  // Handle change with validation
  const handleChange = useCallback(async (newValue) => {
    // Apply transform function if provided (e.g., for checkbox which returns event)
    const actualValue = transform ? transform(newValue) : (newValue && newValue.target ? newValue.target.value : newValue);

    // Use the appropriate update method
    const result = await updateValue(path, actualValue);

    if (!result.isValid) {
      setError(result.error);
    } else {
      setError(null);
    }
  }, [path, updateValue, transform]);

  return (
    <Form.Item
      label={label}
      tooltip={tooltip}
      validateStatus={error ? 'error' : undefined}
      help={error}
      required={required}
    >
      <Component disabled={disabled}
        value={value}
        onChange={handleChange}
        status={error ? 'error' : undefined}
        {...rest}
      />
    </Form.Item>
  );
};