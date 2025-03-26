// src/components/forms/fields.js
import React from 'react';
import { Controller } from 'react-hook-form';
import { Form, Input, InputNumber, Select, Switch, Radio, Checkbox, DatePicker } from 'antd';
import { useScenario } from '../../contexts/ScenarioContext';

/**
 * Base Field Component that wraps Ant Design Form.Item with React Hook Form Controller
 */
export const Field = ({ 
    name, 
    label, 
    tooltip, 
    control, 
    rules, 
    component: Component,
    dependencies = [], 
    transform,
    error,
    ...rest 
  }) => {
    // Create Form.Item config
    const formItemProps = {
      label,
      tooltip, // Let Ant Design handle the tooltip icon
      validateStatus: error ? 'error' : '',
      help: error
    };
    
    // Only add dependencies if there are any and name is provided
    if (dependencies && dependencies.length > 0) {
      if (name) {
        formItemProps.dependencies = dependencies;
        formItemProps.name = name;
      } else {
        // When using dependencies without a name, we need to provide a render function
        formItemProps.dependencies = dependencies;
        // We'll handle rendering children separately
      }
    }
    
    return (
      <Form.Item {...formItemProps}>
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            // Apply transformations if provided
            const transformedField = transform ? transform(field) : field;
            return <Component {...transformedField} {...rest} />;
          }}
        />
      </Form.Item>
    );
  };
/**
 * Text Input field component
 */
export const TextField = ({ 
  name, 
  label, 
  control, 
  error,
  placeholder, 
  tooltip,
  dependencies,
  style,
  ...rest 
}) => (
  <Field
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    component={Input}
    error={error}
    placeholder={placeholder}
    dependencies={dependencies}
    style={{ ...style }}
    {...rest}
  />
);

/**
 * Text Area input field component
 */
export const TextAreaField = ({ 
  name, 
  label, 
  control, 
  error,
  rows = 4,
  placeholder, 
  tooltip,
  dependencies,
  style,
  ...rest 
}) => (
  <Field
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    component={Input.TextArea}
    error={error}
    placeholder={placeholder}
    rows={rows}
    dependencies={dependencies}
    style={{ ...style }}
    {...rest}
  />
);

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

/**
 * Number Input field component with formatting options
 */
export const NumberField = ({ 
  name, 
  label, 
  control, 
  error,
  min, 
  max, 
  step = 1,
  precision,
  addonBefore,
  addonAfter,
  prefix,
  formatter,
  parser,
  tooltip,
  dependencies,
  style,
  ...rest 
}) => {
  // Calculate appropriate width if not explicitly provided
  const calculatedWidth = getNumberFieldWidth(min, max, step, precision, addonBefore, addonAfter);
  
  // Default style with calculated width if no style provided
  const defaultStyle = { width: calculatedWidth };
  
  return (
    <Field
      name={name}
      label={label}
      tooltip={tooltip}
      control={control}
      component={InputNumber}
      error={error}
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
      dependencies={dependencies}
      {...rest}
    />
  );
};

/**
 * Currency Input field component that shows the currency from scenario context
 */
export const CurrencyField = ({ 
  name, 
  label, 
  control, 
  error,
  min = 0, 
  step = 1000,
  tooltip,
  dependencies,
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
      name={name}
      label={label}
      tooltip={tooltip}
      control={control}
      error={error}
      min={min}
      step={step}
      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={value => value.replace(/\$\s?|(,*)/g, '')}
      addonAfter={currency} // Display currency code
      dependencies={dependencies}
      style={{ ...defaultStyle, ...style }}
      {...rest}
    />
  );
};

/**
 * Percentage Input field component
 */
export const PercentageField = ({ 
  name, 
  label, 
  control, 
  error,
  min = 0, 
  max = 100,
  step = 1,
  tooltip,
  dependencies,
  style,
  ...rest 
}) => {
  // Percentage fields can be relatively narrow
  const defaultStyle = { width: 110 };
  
  return (
    <NumberField
      name={name}
      label={label}
      tooltip={tooltip}
      control={control}
      error={error}
      min={min}
      max={max}
      step={step}
      addonAfter="%" // Display % as addon
      dependencies={dependencies}
      style={{ ...defaultStyle, ...style }}
      {...rest}
    />
  );
};

/**
 * Select (dropdown) field component
 */
export const SelectField = ({ 
  name, 
  label, 
  control, 
  error,
  options = [], 
  placeholder,
  mode,
  tooltip,
  dependencies,
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
    <Field
      name={name}
      label={label}
      tooltip={tooltip}
      control={control}
      component={Select}
      error={error}
      placeholder={placeholder}
      mode={mode}
      dependencies={dependencies}
      style={{ ...defaultStyle, ...style }}
      {...rest}
    >
      {options.map((option) => (
        <Select.Option key={option.value} value={option.value}>
          {option.label}
        </Select.Option>
      ))}
    </Field>
  );
};

/**
 * Switch field component
 */
export const SwitchField = ({ 
  name, 
  label, 
  control, 
  error,
  tooltip,
  dependencies,
  transform = field => ({
    ...field,
    checked: field.value,
    onChange: checked => field.onChange(checked)
  }),
  ...rest 
}) => (
  <Field
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    component={Switch}
    error={error}
    dependencies={dependencies}
    transform={transform}
    {...rest}
  />
);

/**
 * Radio Group field component
 */
export const RadioGroupField = ({ 
  name, 
  label, 
  control, 
  error,
  options = [],
  optionType = 'default', // 'default' or 'button'
  tooltip,
  dependencies,
  ...rest 
}) => (
  <Field
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    component={Radio.Group}
    error={error}
    dependencies={dependencies}
    optionType={optionType}
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
  </Field>
);

/**
 * Checkbox field component
 */
export const CheckboxField = ({ 
  name, 
  label, 
  control, 
  error,
  tooltip,
  dependencies,
  transform = field => ({
    ...field,
    checked: field.value,
    onChange: e => field.onChange(e.target.checked)
  }),
  ...rest 
}) => (
  <Field
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    component={Checkbox}
    error={error}
    dependencies={dependencies}
    transform={transform}
    {...rest}
  />
);

/**
 * Date Picker field component
 */
export const DateField = ({ 
  name, 
  label, 
  control, 
  error,
  tooltip,
  dependencies,
  style,
  ...rest 
}) => {
  // Date pickers need reasonable width for the calendar display
  const defaultStyle = { width: 180 };
  
  return (
    <Field
      name={name}
      label={label}
      tooltip={tooltip}
      control={control}
      component={DatePicker}
      error={error}
      style={{ ...defaultStyle, ...style }}
      dependencies={dependencies}
      {...rest}
    />
  );
};