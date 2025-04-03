// src/components/contextFields/index.js
import React from 'react';
import { Input, InputNumber, Select, Switch, Radio, Checkbox, DatePicker, Slider } from 'antd';
import { ContextField } from './ContextField';
import { useScenario } from '../../contexts/ScenarioContext';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// Import layout components
import { FormSection, FormRow, FormCol, FormDivider } from './layouts';

// Import special components
import EditableTable from '../tables/EditableTable';
import DistributionField from './DistributionField';

/**
 * Get appropriate width for number field based on its parameters
 */
const getNumberFieldWidth = (min, max, step, precision, addonBefore, addonAfter) => {
  // Base width for basic numeric input
  let width = 120;

  // Add width for larger numbers
  if (max !== undefined && max > 9999) {
    width += 40; // Add more space for larger numbers
  }

  // Add width for decimal precision
  if (precision !== undefined && precision > 0) {
    width += precision * 8; // Roughly 8px per decimal place
  }

  // Add width for addons
  if (addonBefore) width += 30;
  if (addonAfter) width += 50;

  return width;
};

// Text Field
export const TextField = ({
  path,
  label,
  tooltip,
  placeholder,
  style,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Input}
    placeholder={placeholder}
    style={{ ...style }}
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
  style,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Input.TextArea}
    placeholder={placeholder}
    rows={rows}
    style={{ ...style }}
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
  style,
  ...rest
}) => {
  // Calculate appropriate width if not explicitly provided
  const calculatedWidth = getNumberFieldWidth(min, max, step, precision, addonBefore, addonAfter);

  // Default style with calculated width if no style provided
  const defaultStyle = { width: calculatedWidth };

  return (
    <ContextField
      path={path}
      label={label}
      tooltip={tooltip}
      component={InputNumber}
      min={min}
      max={max}
      step={step}
      precision={precision}
      addonBefore={addonBefore}
      addonAfter={addonAfter}
      prefix={prefix}
      formatter={formatter}
      parser={parser}
      style={{ ...defaultStyle, ...style }}
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
  style,
  currencyOverride,
  ...rest
}) => {
  // Get currency code from scenario context
  const { getValueByPath } = useScenario();
  const localCurrency = getValueByPath(['settings', 'project', 'currency', 'local']) || 'USD';

  // Use provided currency override or fallback to context currency
  const currency = currencyOverride || localCurrency;

  // Currency fields need more space due to formatting
  const defaultStyle = { width: 180 }; // Increased to accommodate currency code addon

  return (
    <NumberField
      path={path}
      label={label}
      tooltip={tooltip}
      min={min}
      step={step}
      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={value => value.replace(/\$\s?|(,*)/g, '')}
      addonAfter={currency} // Display currency code
      style={{ ...defaultStyle, ...style }}
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
  style,
  ...rest
}) => {
  // Percentile fields don't need much width
  const defaultStyle = { width: 90 };

  return (
    <ContextField
      path={path}
      label={label}
      tooltip={tooltip}
      component={InputNumber}
      min={min}
      max={max}
      step={step}
      formatter={value => `P${value}`}
      parser={value => value?.replace('P', '')}
      style={{ ...defaultStyle, ...style }}
      {...rest}
    />
  );
};

// Percentage Field
export const PercentageField = ({
  path,
  label,
  tooltip,
  min = 0,
  max = 100,
  step = 1,
  style,
  ...rest
}) => {
  // Percentage fields can be relatively narrow
  const defaultStyle = { width: 110 };

  return (
    <NumberField
      path={path}
      label={label}
      tooltip={tooltip}
      min={min}
      max={max}
      step={step}
      addonAfter="%" // Display % as addon
      style={{ ...defaultStyle, ...style }}
      {...rest}
    />
  );
};

// Select Field
export const SelectField = ({
  path,
  label,
  tooltip,
  options = [],
  placeholder,
  mode,
  style,
  ...rest
}) => {
  // Calculate appropriate width based on options
  const getSelectWidth = () => {
    if (mode === 'multiple' || mode === 'tags') {
      return 250; // Multiple selections need more space
    }

    // Calculate based on longest option
    const maxLength = options.reduce((max, option) => {
      const length = option.label ? option.label.toString().length : 0;
      return Math.max(max, length);
    }, 0);

    return Math.max(120, maxLength * 10); // At least 120px, or 10px per character
  };

  const defaultStyle = { width: getSelectWidth() };

  return (
    <ContextField
      path={path}
      label={label}
      tooltip={tooltip}
      component={Select}
      placeholder={placeholder}
      mode={mode}
      style={{ ...defaultStyle, ...style }}
      {...rest}
    >
      {options.map((option) => (
        <Select.Option key={option.value} value={option.value}>
          {option.label}
        </Select.Option>
      ))}
    </ContextField>
  );
};

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
          {option.label}
        </Radio.Button>
      ) : (
        <Radio key={option.value} value={option.value}>
          {option.label}
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
  style,
  ...rest
}) => {
  // Date pickers need reasonable width for the calendar display
  const defaultStyle = { width: 180 };

  return (
    <ContextField
      path={path}
      label={label}
      tooltip={tooltip}
      component={DatePicker}
      style={{ ...defaultStyle, ...style }}
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
  style,
  ...rest
}) => (
  <ContextField
    path={path}
    label={label}
    tooltip={tooltip}
    component={Slider}
    min={min}
    max={max}
    step={step}
    marks={marks}
    style={{ ...style }}
    {...rest}
  />
);

// Export both individual components and the special components
export {
  FormSection,
  FormRow,
  FormCol,
  FormDivider,
  EditableTable,
  DistributionField
};