// src/components/contextFields/ContextField.jsx
import React, { useState, useCallback } from 'react';
import { Form } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

// Enhanced ContextField with validation
export const ContextField = ({
  path,
  label,
  component: Component,
  tooltip,
  required,
  disabled,
  validators = [], // Custom validators (will override built-ins if needed)
  transform, // Optional transform function for the input value
  ...rest
}) => {
  const [error, setError] = useState(null);
  const { getValueByPath, updateByPathV2 } = useScenario();

  // Get current value
  const value = getValueByPath(path, null);

  // Handle change with validation
  const handleChange = useCallback(async (newValue) => {
    // Apply transform function if provided (e.g., for checkbox which returns event)
    const actualValue = transform ? transform(newValue) : (newValue && newValue.target ? newValue.target.value : newValue);

    // Use the v2 method which handles validation
    const result = await updateByPathV2(path, actualValue);

    if (!result.isValid) {
      setError(result.error);
    } else {
      setError(null);
    }
  }, [path, updateByPathV2, transform]);

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