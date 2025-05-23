# Context Fields Guide

## Overview

The `contextFields` components are specialized form field components that automatically connect to the application state via the ScenarioContext. They provide a declarative way to bind form fields to specific paths in the state, with automatic validation and updates.

## Core Concept

Instead of manually handling form state, validation, and updates, these components use a path-based approach to connect directly to the application state. Each component is given a path (an array of string keys or a dot-notation string) that specifies where in the state object the field value should be read from and updated to.

These components extend Ant Design's Form components, inheriting all their capabilities while adding automatic state binding and path-based addressing.

## Key Components

### Base Component

- `ContextField` - The foundation component that handles the connection to the context and validation.

### Field Type Components

- `TextField` - Text input field
- `TextAreaField` - Multi-line text input
- `NumberField` - Numeric input with formatting
- `CurrencyField` - Numeric input with currency formatting
- `PercentageField` - Numeric input with percentage formatting
- `PercentileField` - Specialized field for percentile values (P-values)
- `SelectField` - Dropdown selection field
- `SwitchField` - Toggle switch
- `CheckboxField` - Checkbox
- `RadioGroupField` - Radio button group
- `DateField` - Date picker
- `SliderField` - Slider control

### Layout Components

- `FormSection` - Section container with title
- `FormRow` - Layout row (wraps Ant Design Row)
- `FormCol` - Layout column (wraps Ant Design Col)
- `FormDivider` - Divider with margin control
- `CompactFieldGroup` - Compact layout using Space.Compact
- `FieldGroup` - Grouped fields with consistent spacing
- `ResponsiveFieldRow` - Preset responsive layouts
- `InlineFieldGroup` - Flexible inline layouts
- `FieldCard` - Card-based field organization

### Specialized Components

- `PrimaryPercentileSelectField` - Selection field for primary percentile from existing percentiles
- `EditableTable` - Tabular data editor

## Common Props

All context field components accept all Ant Design Form.Item props, plus these additional props:

| Prop | Type | Description |
|------|------|-------------|
| `path` | `string[]` or `string` | Path to the value in the context state |
| `label` | `string` | Form label text |
| `tooltip` | `string` | Optional help tooltip |
| `required` | `boolean` | Whether the field is required |
| `disabled` | `boolean` | Whether the field is disabled |
| `formMode` | `boolean` | Whether the field is used within a ContextForm |
| `defaultValue` | `any` | Default value to use if the context path doesn't exist |

## Field-Specific Examples

### NumberField
```jsx
<NumberField
  path={['settings', 'simulation', 'iterations']}
  label="Number of Monte Carlo Iterations"
  min={100}
  max={100000}
  step={1000}
  precision={0}
  addonAfter="runs"
/>
```

### SelectField
```jsx
<SelectField
  path={['settings', 'project', 'currency', 'local']}
  label="Local Currency"
  options={[
    { value: 'USD', label: 'US Dollar (USD)' },
    { value: 'EUR', label: 'Euro (EUR)' },
  ]}
  placeholder="Select currency"
/>
```

### CurrencyField
```jsx
<CurrencyField
  path={['project', 'budget']}
  label="Project Budget"
  min={0}
  step={1000}
/>
```

## Layout Examples

### ResponsiveFieldRow
```jsx
<ResponsiveFieldRow layout="twoColumn">
  <TextField path="firstName" label="First Name" />
  <TextField path="lastName" label="Last Name" />
</ResponsiveFieldRow>
```

### FormSection with Fields
```jsx
<FormSection title="Project Settings">
  <FormRow gutter={[16, 16]}>
    <FormCol span={12}>
      <TextField path="name" label="Project Name" required />
    </FormCol>
    <FormCol span={12}>
      <NumberField path="capacity" label="Capacity (MW)" />
    </FormCol>
  </FormRow>
</FormSection>
```

### CompactFieldGroup
```jsx
<CompactFieldGroup>
  <SelectField path="countryCode" options={countryCodes} />
  <TextField path="phoneNumber" label="Phone Number" />
</CompactFieldGroup>
```

## Integration Modes

Context fields can be used in two ways:

### 1. Direct Context Connection
Fields directly read/write to the context state:

```jsx
<TextField
  path={['settings', 'project', 'name']}
  label="Project Name"
  required
/>
```

### 2. Form Mode (with ContextForm)
Fields work within a ContextForm which batches updates:

```jsx
<ContextForm path={['settings', 'project']}>
  <TextField path="name" label="Project Name" required />
  <NumberField path="capacity" label="Capacity (MW)" />
</ContextForm>
```

## Validation

- **Direct Mode**: Validation occurs immediately when values change via context validation
- **Form Mode**: Validation occurs on form submission via `updateByPath`
- Uses existing Yup schemas and validation infrastructure
- Validation errors are displayed using Ant Design's built-in error display

## Default Value Handling

When a field's path doesn't exist in the context or is undefined, the component will:
1. Use the `defaultValue` prop if provided
2. Initialize the context path with this default value
3. Display this value in the field

This creates a seamless experience when dealing with optional or new data.

## Debug Mode

Set `REACT_APP_DEBUG_FORM_BORDERS=true` in your environment to see layout boundaries:

```bash
REACT_APP_DEBUG_FORM_BORDERS=true npm start
```

This will show colored borders around all layout components to help with debugging.

## Best Practices

1. **Use array notation for paths** - `['settings', 'general', 'name']` for better type safety
2. **Group related fields in sections** - Use `FormSection` for organization
3. **Use ContextForm for multi-field edits** - Batches updates for better performance
4. **Leverage Ant Design layout props** - Use `wrapperCol`, `labelCol`, etc. for layout control
5. **Provide tooltips for complex fields** - Improve user experience
6. **Use `defaultValue` for initialization** - Handle optional or new data gracefully
7. **Use responsive layouts** - `ResponsiveFieldRow` and responsive Col props for mobile-first design