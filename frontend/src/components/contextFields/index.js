// src/components/contextFields/index.js
import React from 'react';
import { Input, InputNumber, Select, Switch, Radio, Checkbox, DatePicker, Slider } from 'antd';
import { ContextField } from './ContextField';
import { useScenario } from '../../contexts/ScenarioContext';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

// Import layout components
import { FormSection, FormRow, FormCol, FormDivider } from './layouts';
import CompactFieldGroup from './CompactFieldGroup';

// Import special components
import EditableTable from '../tables/EditableTable';
// import DistributionFieldV2 from './DistributionFieldV2';
// import DistributionPlot from './DistributionPlot';
import PrimaryPercentileSelectField from './PrimaryPercentileSelectField';

/**
 * Get appropriate width for an Ant Design number field based on its parameters.
 * Estimates width by converting parameters to strings and calculating character lengths.
 *
 * @param {number} [min] - Minimum value
 * @param {number} [max] - Maximum value
 * @param {number} [step] - Step value
 * @param {number} [precision] - Decimal precision
 * @param {string|ReactNode} [addonBefore] - Content before the input
 * @param {string|ReactNode} [addonAfter] - Content after the input
 * @param {Object} [options] - Optional configuration
 * @param {number} [options.baseWidth=100] - Base width for the input (px)
 * @param {number} [options.pixelsPerChar=9] - Pixels per character
 * @param {number} [options.addonPadding=20] - Padding for addons (px)
 * @returns {number} Estimated width in pixels
 */
const getNumberFieldWidth = (min, max, step, precision, addonBefore, addonAfter,
  {
    baseWidth = 100,
    pixelsPerChar = 9, // Approx 9px per char for 14px font
    addonPadding = 20, // Padding for addon elements
  } = {}) => {
  // Initialize width with base value
  let width = baseWidth;

  // Determine the longest number string (min or max)
  let maxLength = 0;
  if (max !== undefined || min !== undefined) {
    const maxStr = max !== undefined ? Math.abs(max).toString() : '';
    const minStr = min !== undefined ? Math.abs(min).toString() : '';
    maxLength = Math.max(maxStr.length, minStr.length);
  }

  // Add space for negative sign if min is negative
  if (min !== undefined && min < 0) {
    maxLength += 1; // For the minus sign
  }

  // Add space for decimal point and precision
  if (precision !== undefined && precision > 0) {
    maxLength += 1 + precision; // Decimal point + precision digits
  }

  // Calculate width for the number content
  width += maxLength * pixelsPerChar;

  // Handle addonBefore
  if (addonBefore) {
    const addonBeforeLength =
      typeof addonBefore === 'string' ? addonBefore.length : 1; // Fallback for ReactNode
    width += addonBeforeLength * pixelsPerChar + addonPadding;
  }

  // Handle addonAfter
  if (addonAfter) {
    const addonAfterLength =
      typeof addonAfter === 'string' ? addonAfter.length : 1; // Fallback for ReactNode
    width += addonAfterLength * pixelsPerChar + addonPadding;
  }

  // Ensure a minimum width
  return Math.max(width, 80); // Prevent overly narrow fields
};

/**
* Get appropriate width for text field based on its parameters
* @param {number} minLength - Minimum expected text length
* @param {number} maxLength - Maximum expected text length
* @param {string} placeholder - Placeholder text
* @param {boolean} hasAddon - Whether field has addon before/after
* @returns {number} Calculated width in pixels
*/
const getTextFieldWidth = (minLength = 10, maxLength = 50, placeholder = '', hasAddon = false) => {
  // Calculate based on expected content length
  const contentLength = Math.max(
    minLength,
    Math.min(maxLength, placeholder ? placeholder.length : 0)
  );

  // Base calculation: ~8px per character + padding
  let width = 24 + (contentLength * 8);

  // Add width for addons
  if (hasAddon) width += 40;

  // Ensure reasonable bounds
  return Math.max(120, Math.min(width, 400));
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

  // Default formatter: adds commas as thousand separators
  const defaultFormatter = (value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Default parser: removes commas to convert back to a number
  const defaultParser = (value) => value.replace(/,/g, '');

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
      formatter={formatter || defaultFormatter} // Use provided formatter or default
      parser={parser || defaultParser}         // Use provided parser or default
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
  addonAfter,
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
      addonAfter={`${currency}${addonAfter || ''}`} // Display currency code
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

// Add Time Series support for distribution parameters
export const createTimeSeriesDataPoint = (year, value) => ({
  year,
  value
});

// Export both individual components and the special components
export {
  FormSection,
  FormRow,
  FormCol,
  FormDivider,
  CompactFieldGroup,
  EditableTable,
  PrimaryPercentileSelectField,
  getTextFieldWidth
};