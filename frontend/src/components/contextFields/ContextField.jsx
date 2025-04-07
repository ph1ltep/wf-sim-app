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

  // Validate the value
  const validate = useCallback((value) => {
    // Required check
    if (required && (value === undefined || value === null || value === '')) {
      return { valid: false, message: `${label} is required` };
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return { valid: true };
    }

    // Run through all validators
    for (const validator of validators) {
      const result = validator(value);
      if (!result.valid) {
        return result;
      }
    }

    return { valid: true };
  }, [required, validators, label]);

  // Handle change with validation
  const handleChange = useCallback((newValue) => {
    const actualValue = newValue && newValue.target ? newValue.target.value : newValue;

    const validationResult = validate(actualValue);

    if (!validationResult.valid) {
      setError(validationResult.message);
      return; // Don't update context
    }

    setError(null); // Clear error on valid input

    // Update context only with valid data
    if (hasValidScenario()) {
      updateByPath(path, actualValue);
    }
  }, [validate, path, updateByPath, hasValidScenario]);

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