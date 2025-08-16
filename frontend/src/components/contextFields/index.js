// src/components/contextFields/index.js - Updated with new layout components
import React from 'react';
import { Input, InputNumber, Select, Switch, Radio, Checkbox, DatePicker, Slider, Space } from 'antd';
import { ContextField } from './ContextField';
import { useScenario } from '../../contexts/ScenarioContext';
import dayjs from 'dayjs';


// Import layout components
import {
  FormSection,
  FormRow,
  FormCol,
  FormDivider,
  CompactFieldGroup,
  FieldGroup,
  ResponsiveFieldRow,
  InlineFieldGroup,
  FieldCard
} from './layouts/index';

// Import special components
import EditableTable from '../tables/EditableTable';
import PrimaryPercentileSelectField from './PrimaryPercentileSelectField';

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

// Text Area field
export const TextAreaField = ({
  path,
  label,
  tooltip,
  placeholder,
  rows = 4,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Input.TextArea}
    placeholder={placeholder}
    rows={rows}
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
  addonBefore,
  addonAfter,
  prefix,
  formatter,
  parser,
  ...rest
}) => {
  // Default formatter: adds commas as thousand separators
  const defaultFormatter = (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Default parser: removes commas to convert back to a number
  const defaultParser = (value) => value?.replace(/,/g, '');

  return (
    <ContextField
      path={path}
      label={label}
      tooltip={tooltip}
      component={InputNumber}
      componentProps={{
        min,
        max,
        step,
        precision,
        addonBefore,
        addonAfter,
        prefix,
        formatter: formatter || defaultFormatter,
        parser: parser || defaultParser,
      }}
      {...rest}
    />
  );
};

// Currency Field
export const CurrencyField = ({
  path,
  label,
  tooltip,
  min = 0,
  step = 1000,
  currencyOverride,
  addonAfter,
  ...rest
}) => {
  // Get currency code from scenario context
  const { getValueByPath } = useScenario();
  const localCurrency = getValueByPath(['settings', 'project', 'currency', 'local']) || 'USD';

  // Use provided currency override or fallback to context currency
  const currency = currencyOverride || localCurrency;

  return (
    <NumberField
      path={path}
      label={label}
      tooltip={tooltip}
      min={min}
      step={step}
      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={value => value?.replace(/\$\s?|(,*)/g, '')}
      addonAfter={`${currency}${addonAfter || ''}`}
      {...rest}
    />
  );
};

// Percentile field
export const PercentileField = ({
  path,
  label,
  tooltip,
  min = 1,
  max = 99,
  step = 1,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={InputNumber}
    componentProps={{
      min,
      max,
      step,
      formatter: value => `P${value}`,
      parser: value => value?.replace('P', '')
    }}
    {...rest}
  />
);

// Percentage Field
export const PercentageField = ({
  path,
  label,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  ...rest
}) => (
  <NumberField
    path={path}
    label={label}
    tooltip={tooltip}
    min={min}
    max={max}
    step={step}
    addonAfter="%" // Display % as addon
    {...rest}
  />
);

// Select Field
export const SelectField = ({
  path,
  label,
  tooltip,
  options = [],
  placeholder,
  mode,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Select}
    componentProps={{
      placeholder,
      mode
    }}
    {...rest}
  >
    {options.map((option) => (
      <Select.Option key={option.value} value={option.value}>
        {option.label}
      </Select.Option>
    ))}
  </ContextField>
);

// Switch Field
export const SwitchField = ({
  path,
  label,
  tooltip,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Switch}
    transform={(checked) => checked}
    {...rest}
  />
);

// Checkbox Field
export const CheckboxField = ({
  path,
  label,
  tooltip,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Checkbox}
    transform={(e) => e?.target?.checked}
    valuePropName="checked"
    {...rest}
  />
);

// Radio Group Field
export const RadioGroupField = ({
  path,
  label,
  tooltip,
  options = [],
  optionType = 'default', // 'default' or 'button'
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Radio.Group}
    {...rest}
  >
    {options.map((option) => (
      optionType === 'button' ? (
        <Radio.Button key={option.value} value={option.value}>
          {option.icon ? (
            <Space size={4}>
              {option.icon}
              {option.label}
            </Space>
          ) : (
            option.label
          )}
        </Radio.Button>
      ) : (
        <Radio key={option.value} value={option.value}>
          {option.icon ? (
            <Space size={4}>
              {option.icon}
              {option.label}
            </Space>
          ) : (
            option.label
          )}
        </Radio>
      )
    ))}
  </ContextField>
);

// Date Field
export const DateField = ({
  path,
  label,
  tooltip,
  format = 'YYYY-MM-DD',
  ...rest
}) => {
  // Bidirectional transform object
  const dateTransform = {
    // Convert Date object FROM context TO dayjs for DatePicker
    toDisplay: (value) => {
      if (!value) return null;
      if (value instanceof Date) return dayjs(value);
      if (typeof value === 'string') return dayjs(value);
      return value; // Already dayjs
    },

    // Convert dayjs FROM DatePicker TO Date object for context storage
    toStorage: (value) => {
      if (!value) return null;
      if (value && typeof value === 'object' && value.toDate) {
        return value.toDate(); // dayjs to Date
      }
      return value;
    }
  };

  return (
    <ContextField
      path={path}
      label={label}
      tooltip={tooltip}
      component={DatePicker}
      transform={dateTransform}
      componentProps={{
        format,
        style: { width: '100%' }
      }}
      {...rest}
    />
  );
};

// Slider Field
export const SliderField = ({
  path,
  label,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  marks,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Slider}
    componentProps={{
      min,
      max,
      step,
      marks
    }}
    {...rest}
  />
);

// Add Time Series support for distribution parameters
export const createTimeSeriesDataPoint = (year, value) => ({
  year,
  value
});

// Export all field components and layout components
export {
  // Core components
  ContextField,

  // Layout components
  FormSection,
  FormRow,
  FormCol,
  FormDivider,
  CompactFieldGroup,
  FieldGroup,
  ResponsiveFieldRow,
  InlineFieldGroup,
  FieldCard,

  // Special components
  EditableTable,
  PrimaryPercentileSelectField
};