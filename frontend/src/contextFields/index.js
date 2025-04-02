// src/components/contextFields/index.js
import React from 'react';
import { Input, InputNumber, Select, Switch, Checkbox, DatePicker, Radio } from 'antd';
import { ContextField } from './ContextField';

// Text Field
export const TextField = ({
  path,
  label,
  tooltip,
  placeholder,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Input}
    placeholder={placeholder}
    {...rest}
  />
);

// Number Field
export const NumberField = ({
  path,
  label,
  tooltip,
  min,
  max,
  step = 1,
  precision,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={InputNumber}
    min={min}
    max={max}
    step={step}
    precision={precision}
    style={{ width: '100%' }}
    {...rest}
  />
);

// Continue with other field types...