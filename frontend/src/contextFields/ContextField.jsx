// src/components/contextFields/ContextField.jsx
import React from 'react';
import { Form } from 'antd';
import { useFormField } from '../../hooks/useFormField';

// Enhanced ContextField with validation
export const ContextField = ({
  path,
  label,
  component: Component,
  tooltip,
  required,
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
    const validationResult = validate(newValue);

    if (!validationResult.valid) {
      setError(validationResult.message);
      return; // Don't update context
    }

    setError(null); // Clear error on valid input

    // Update context only with valid data
    if (hasValidScenario()) {
      updateByPath(path, newValue);
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
      <Component
        value={value}
        onChange={handleChange}
        status={error ? 'error' : undefined}
        {...rest}
      />
    </Form.Item>
  );
};
