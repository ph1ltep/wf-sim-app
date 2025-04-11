// src/contextFields/ContextField.jsx
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
  ...rest
}) => {
  const [error, setError] = useState(null);
  const { getValueByPath, updateByPath, hasValidScenario } = useScenario();

  // Get current value
  const value = getValueByPath(path, null);

  // Handle change with validation
  const handleChange = useCallback(async (newValue) => {
    const actualValue = newValue && newValue.target ? newValue.target.value : newValue;

    if (hasValidScenario()) {
      // Use the v2 method which handles validation
      const result = await updateByPathV2(path, actualValue);

      if (!result.isValid) {
        setError(result.error);
      } else {
        setError(null);
      }
    }
  }, [path, updateByPathV2, hasValidScenario]);

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