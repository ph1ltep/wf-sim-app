# Context Fields Guide

## Overview

The `contextFields` components are specialized form field components that automatically connect to the application state via the ScenarioContext. They provide a declarative way to bind form fields to specific paths in the state, with automatic validation and updates.

## Core Concept

Instead of manually handling form state, validation, and updates, these components use a path-based approach to connect directly to the application state. Each component is given a path (an array of string keys or a dot-notation string) that specifies where in the state object the field value should be read from and updated to.

These components extend Ant Design's Form components, inheriting all their capabilities while adding automatic state binding and path-based addressing. This means you can use any props that Ant Design's Form.Item accepts, plus the specialized props for context integration.

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
- `DistributionFieldV2` - Complex field for statistical distribution configuration

### Layout Components

- `FormSection` - Section container with title
- `FormRow` - Layout row (wraps Ant Design Row)
- `FormCol` - Layout column (wraps Ant Design Col)
- `FormDivider` - Divider with margin control

### Specialized Components

- `PrimaryPercentileSelectField` - Selection field for primary percentile from existing percentiles
- `DistributionPlot` - Visualization for statistical distributions
- `EditableTable` - Tabular data editor

## Common Props

All context field components are built on top of Ant Design's `Form.Item` component and accept all of its props, plus these additional props:

| Prop | Type | Description |
|------|------|-------------|
| `path` | `string[]` or `string` | Path to the value in the context state |
| `label` | `string` | Form label text |
| `tooltip` | `string` | Optional help tooltip |
| `required` | `boolean` | Whether the field is required |
| `disabled` | `boolean` | Whether the field is disabled |
| `formMode` | `boolean` | Whether the field is used within a ContextForm (instead of directly with context) |
| `defaultValue` | `any` | Default value to use if the context path doesn't exist or is undefined. This will be saved to the context if no value is found at the specified path. |

## Field-Specific Props

### NumberField

```jsx
<NumberField
  path={['settings', 'simulation', 'iterations']}
  label="Number of Monte Carlo Iterations"
  min={100}
  max={100000}
  step={1000}
  precision={0}
  addonBefore="Iterations:"
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
    // More options...
  ]}
  placeholder="Select currency"
/>
```

### DistributionFieldV2

```jsx
<DistributionFieldV2
  path={['settings', 'modules', 'revenue', 'electricityPrice', 'distribution']}
  label="Electricity Price Distribution"
  valueType="currency"
  showVisualization={true}
  showInfoBox={true}
/>
```

## Integration with Forms

Context fields can be used in two ways:

1. **Direct Context Connection**: Fields directly read/write to the context state
2. **Form Mode**: Fields can be used within a `ContextForm` which collects changes and only updates the context when submitted

Example with ContextForm:

```jsx
<ContextForm
  path={['settings', 'project']}
  onSubmit={(values) => console.log('Saved:', values)}
  onCancel={() => console.log('Cancelled')}
>
  <TextField
    path={'projectName'}
    label="Project Name"
    required
  />
  <NumberField
    path={'windFarm.numWTGs'}
    label="Number of Wind Turbines"
    min={1}
  />
</ContextForm>
```

## Advanced Features

- **Auto-sizing** - Fields calculate appropriate widths based on their content and constraints
- **Validation** - Integrated with Yup schemas for validation
- **Value transformation** - Support for transforming values before storing them
- **Calculated defaults** - Fields can use the context to calculate default values
- **Default Value Handling** - When a field's path doesn't exist in the context or is undefined, the component will:
  1. Use the `defaultValue` prop if provided
  2. Initialize the context path with this default value
  3. Display this value in the field
  
  This creates a seamless experience when dealing with optional or new data

## Best Practices

1. Use array notation for paths when possible (`['settings', 'general', 'name']`) for better type safety
2. Group related fields in sections using `FormSection`
3. Use `ContextForm` for multi-field edits that should be saved together
4. Provide tooltips for complex fields to improve user experience
5. Leverage Ant Design Form.Item props like `rules`, `dependencies`, and `help` for advanced form behavior
6. Use `defaultValue` for initializing new paths in the context or providing fallback values

## Future Update Prompt

If you need to update this guide with the latest features, use the following prompt:

"Please analyze the current implementation of the components in src/components/contextFields and update the Context Fields Guide markdown. Pay special attention to any new components, props, or features that have been added since the last update. Make sure the examples, prop descriptions, and best practices are still accurate and relevant."