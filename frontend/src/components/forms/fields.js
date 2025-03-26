// src/components/forms/fields.js
import React from 'react';
import { Controller } from 'react-hook-form';
import { Form, Input, InputNumber, Select, Switch, Radio, Checkbox, DatePicker } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

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
      label: tooltip ? (
        <span>
          {label}
          <InfoCircleOutlined 
            style={{ marginLeft: 8 }} 
            className="form-tooltip-icon"
          />
        </span>
      ) : label,
      tooltip,
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
    {...rest}
  />
);

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
  style = { width: '100%' },
  ...rest 
}) => (
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
    style={style}
    dependencies={dependencies}
    {...rest}
  />
);

/**
 * Currency Input field component
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
  ...rest 
}) => (
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
    dependencies={dependencies}
    {...rest}
  />
);

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
  ...rest 
}) => (
  <NumberField
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    error={error}
    min={min}
    max={max}
    step={step}
    formatter={value => `${value}%`}
    parser={value => value.replace('%', '')}
    dependencies={dependencies}
    {...rest}
  />
);

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
  ...rest 
}) => (
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
    {...rest}
  >
    {options.map((option) => (
      <Select.Option key={option.value} value={option.value}>
        {option.label}
      </Select.Option>
    ))}
  </Field>
);

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
  style = { width: '100%' },
  ...rest 
}) => (
  <Field
    name={name}
    label={label}
    tooltip={tooltip}
    control={control}
    component={DatePicker}
    error={error}
    style={style}
    dependencies={dependencies}
    {...rest}
  />
);