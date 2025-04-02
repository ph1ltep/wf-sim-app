// src/components/contextFields/ContextField.jsx
import React from 'react';
import { Form } from 'antd';
import { useFormField } from '../../hooks/useFormField';

export const ContextField = ({
  path,
  label,
  component: Component,
  error,
  tooltip,
  defaultValue,
  transform,
  validate,
  onChange,
  ...rest
}) => {
  const { value, onChange: handleChange } = useFormField(path, {
    defaultValue,
    transform,
    validate,
    onChange
  });
  
  return (
    <Form.Item
      label={label}
      tooltip={tooltip}
      validateStatus={error ? 'error' : undefined}
      help={error}
    >
      <Component
        value={value}
        onChange={handleChange}
        {...rest}
      />
    </Form.Item>
  );
};